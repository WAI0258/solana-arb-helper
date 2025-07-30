import { type ParsedTransactionWithMeta } from "@solana/web3.js";

import type {
  StandardSwapEvent,
  TokenBalanceChange,
  ArbitrageInfo,
  BlockAnalysisResult,
} from "../common/types";

import { PoolManager } from "./pool";
import { SwapParser } from "./swap";
import { ArbitrageDetector } from "./arbitrage";
import { AccountProcessor } from "./data-processor/account";
import { InstructionProcessor } from "./data-processor/instruction";
import {
  getDexNameByProgramId,
  getProgramInfo,
  isDexProgramId,
} from "../common/dex";
import { TransferParser } from "./transfer";

export class TransactionAnalyzer {
  private poolManager: PoolManager;
  private swapParser: SwapParser;
  private arbitrageDetector: ArbitrageDetector;
  private accountProcessor: AccountProcessor;
  private instructionProcessor: InstructionProcessor;
  private transferParser: TransferParser;
  constructor() {
    this.poolManager = new PoolManager();
    this.swapParser = new SwapParser();
    this.arbitrageDetector = new ArbitrageDetector();
    this.accountProcessor = new AccountProcessor();
    this.instructionProcessor = new InstructionProcessor();
    this.transferParser = new TransferParser();
  }

  public async analyzeSolanaTransaction(
    tx: ParsedTransactionWithMeta,
    slot: number,
    previousTransactions: Map<string, { signature: string; slot: number }[]>
  ): Promise<{
    signature: string;
    slot: number;
    signer: string;
    fee: number;
    arbitrageInfo?: ArbitrageInfo;
    swapEvents: StandardSwapEvent[];
    tokenChanges: Record<string, string>;
    addressTokenChanges: Record<string, TokenBalanceChange[]>;
  } | null> {
    const swapEvents: StandardSwapEvent[] = [];
    const involvedPools = new Set<string>();
    const previousPoolTxs = new Map<
      string,
      { signature: string; slot: number }
    >();

    // parse all instructions using the instruction processor
    const allInstructions = this.instructionProcessor.getAllInstructions(tx);

    for (const instruction of allInstructions) {
      const programIdString =
        this.instructionProcessor.getProgramIdString(instruction);
      // whether is from a dex program
      if (isDexProgramId(programIdString)) {
        // get all token accounts
        const tokenAccounts =
          this.accountProcessor.getTokenAccountsWithBalanceChanges(tx);
        const dexProgram = getDexNameByProgramId(programIdString);
        const dexProgramInfo = getProgramInfo(programIdString);

        let changedTokenMetas: any[] = [];
        if (instruction.type === "inner") {
          // inner token accounts
          changedTokenMetas =
            this.instructionProcessor.filterTokenAccountsForInstruction(
              instruction,
              tokenAccounts
            );
        } else {
          const getInnerInstructions = allInstructions.filter(
            (i) => i.outerInstructionIndex === instruction.instructionIndex
          );
          changedTokenMetas = this.transferParser.parseTransferEvent(
            getInnerInstructions,
            tokenAccounts
          );
        }

        const swapEvent = this.swapParser.parseSolanaSwapEvent(
          {
            dexProgram,
            dexProgramInfo,
          },
          instruction.data,
          instruction.accounts,
          changedTokenMetas,
          instruction.type // inner instruction index
        );
        if (swapEvent) {
          swapEvents.push(swapEvent);
        }

        // (deprecated) account could be pool
        // const poolCandidates = accounts.filter(
        //   (account) =>
        //     !tokenAccounts.find((t) => t.addr === account.toBase58())
        // );
        const poolAddress = swapEvent?.poolAddress;

        if (poolAddress) {
          let tokenIn;
          let tokenOut;
          if (instruction.type === "inner") {
            tokenIn = changedTokenMetas.find(
              (account) => account.mint === swapEvent.tokenIn
            );
            tokenOut = changedTokenMetas.find(
              (account) => account.mint === swapEvent.tokenOut
            );
          } else {
            tokenIn = changedTokenMetas.find(
              (transfer) => transfer.source === swapEvent.sender
            );
            tokenOut = changedTokenMetas.find(
              (transfer) => transfer.destination === swapEvent.recipient
            );
            if (!tokenIn || !tokenOut) {
              console.log("swapEvent: ", swapEvent);
              console.log("changedTokenMetas: ", changedTokenMetas);
              console.log("tokenIn: ", tokenIn);
              console.log("tokenOut: ", tokenOut);
            }
          }

          const poolInfo = await this.poolManager.requestTxPoolInfo(
            dexProgramInfo,
            poolAddress,
            tokenIn!,
            tokenOut!,
            tx.transaction.signatures[0] || ""
          );
          if (poolInfo) {
            involvedPools.add(poolAddress);
            const previousTxs = previousTransactions.get(poolAddress);
            if (previousTxs && previousTxs.length > 0) {
              const lastTx = previousTxs[previousTxs.length - 1];
              if (lastTx) {
                previousPoolTxs.set(poolAddress, lastTx);
              }
            }
          }
        }
      }
    }

    if (swapEvents.length > 0) {
      const graph = this.arbitrageDetector.buildSolanaSwapGraph(swapEvents);
      const { isValid, profitToken } =
        this.arbitrageDetector.validateSolanaSwapGraphTokenChanges(graph);
      const graphTokenChanges =
        this.arbitrageDetector.calculateSolanaSwapGraphTokenChanges(graph);

      if (isValid && profitToken) {
        const arbitrageCycles =
          this.arbitrageDetector.findSolanaArbitrageCycles(swapEvents);
        const profitAmount = graphTokenChanges.get(profitToken) || 0n;

        let arbitrageType: "begin" | "inter" = "begin";
        let isBackrun = false;
        const interInfo: Array<{
          signature: string;
          poolAddress: string;
          slot: number;
        }> = [];

        if (previousPoolTxs.size > 0) {
          arbitrageType = "inter";
          const isAllPreviousSlot = Array.from(previousPoolTxs.values()).every(
            ({ slot: prevSlot }) => prevSlot === slot - 1
          );
          isBackrun = isAllPreviousSlot;

          for (const [
            poolAddress,
            { signature, slot: prevSlot },
          ] of previousPoolTxs.entries()) {
            interInfo.push({
              signature,
              poolAddress,
              slot: prevSlot,
            });
          }
        }

        const firstAccountKey = this.accountProcessor.getAccountKeyByIndex(
          tx,
          0
        );
        return {
          signature: tx.transaction.signatures[0] || "",
          slot,
          signer: firstAccountKey
            ? this.accountProcessor.getAccountAddress(firstAccountKey)
            : "",
          fee: tx.meta?.fee || 0,
          arbitrageInfo: {
            type: arbitrageType,
            isBackrun,
            arbitrageCycles,
            cyclesLength: arbitrageCycles.length,
            profit: {
              token: profitToken,
              amount: profitAmount.toString(),
            },
            interInfo: arbitrageType === "inter" ? interInfo : undefined,
          },
          swapEvents,
          tokenChanges:
            this.arbitrageDetector.formatSolanaTokenChanges(graphTokenChanges),
          addressTokenChanges: {},
        };
      }
    }

    const firstAccountKey = this.accountProcessor.getAccountKeyByIndex(tx, 0);
    return {
      signature: tx.transaction.signatures[0] || "",
      slot,
      signer: firstAccountKey
        ? this.accountProcessor.getAccountAddress(firstAccountKey)
        : "",
      fee: tx.meta?.fee || 0,
      swapEvents,
      tokenChanges: {},
      addressTokenChanges: {},
    };
  }

  public async analyzeSolanaBlock(
    slot: number,
    timestamp: Date,
    transactions: ParsedTransactionWithMeta[]
  ): Promise<BlockAnalysisResult | null> {
    try {
      const poolTransactionHistory = new Map<
        string,
        { signature: string; slot: number }[]
      >();
      const analyzedTransactions = [];

      console.log("transactions: ", transactions.length);
      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        if (!tx) continue;

        if (tx.meta?.err) {
          continue;
        }
        const analysis = await this.analyzeSolanaTransaction(
          tx,
          slot,
          poolTransactionHistory
        );
        if (analysis) {
          analyzedTransactions.push(analysis);
          // swap event happened
          if (analysis.swapEvents) {
            for (const event of analysis.swapEvents) {
              const poolAddress = event.poolAddress.toLowerCase();
              if (!poolTransactionHistory.has(poolAddress)) {
                poolTransactionHistory.set(poolAddress, []);
              }
              poolTransactionHistory.get(poolAddress)!.push({
                signature: analysis.signature,
                slot,
              });
            }
          }
        }
      }

      // Filter to only include arbitrage transactions
      const arbitrageTransactions = analyzedTransactions.filter(
        (tx) => tx.arbitrageInfo
      );

      return {
        slot,
        timestamp,
        transactions: arbitrageTransactions,
        validTransactions: analyzedTransactions.length,
      };
    } catch (error) {
      console.error(`Error analyzing Solana block ${slot}:`, error);
      return null;
    }
  }

  public async analyzeSolanaSlotRange(
    connection: any,
    startSlot: number,
    endSlot: number,
    onProgress?: (
      currentSlot: number,
      totalSlots: number,
      successSlot?: number
    ) => void
  ): Promise<BlockAnalysisResult[]> {
    const results: BlockAnalysisResult[] = [];
    const totalSlots = endSlot - startSlot + 1;
    const maxRetries = 5;
    const baseDelay = 1000; // 1 second

    console.log(
      `Analyzing slots from ${startSlot} to ${endSlot} (${totalSlots} slots)`
    );

    for (let slot = startSlot; slot <= endSlot; slot++) {
      let retryCount = 0;
      let success = false;

      while (retryCount < maxRetries && !success) {
        try {
          const block = await connection.getBlock(slot, {
            maxSupportedTransactionVersion: 0,
            transactionDetails: "full",
            rewards: false,
          });

          if (block && block.transactions) {
            const timestamp = new Date(block.blockTime! * 1000);
            const result = await this.analyzeSolanaBlock(
              slot,
              timestamp,
              block.transactions as any[]
            );

            if (result) {
              results.push(result);
              console.log(
                `✔ Analyzed slot ${slot} (${results.length}/${totalSlots})`
              );

              // Call progress callback with successful slot
              if (onProgress) {
                onProgress(slot - startSlot + 1, totalSlots, slot);
              }
              success = true;
            } else {
              console.log(`✘ Failed to analyze slot ${slot}`);
              // Don't call progress callback for failed analysis
              success = true; // Mark as "processed" even if analysis failed
            }
          } else {
            console.log(`✘ No data for slot ${slot}`);
            // Don't call progress callback for slots with no data
            success = true; // Mark as "processed" even if no data
          }
        } catch (error) {
          retryCount++;
          const delay = baseDelay * Math.pow(2, retryCount - 1); // Exponential backoff

          if (retryCount < maxRetries) {
            console.log(
              `⚠️ Retry ${retryCount}/${maxRetries} for slot ${slot} after ${delay}ms delay`
            );
            await new Promise((resolve) => setTimeout(resolve, delay));
          } else {
            console.error(
              `❌ Failed to analyze slot ${slot} after ${maxRetries} retries:`,
              error
            );
            // Don't call progress callback for failed slots
          }
        }
      }
    }
    return results;
  }
}
