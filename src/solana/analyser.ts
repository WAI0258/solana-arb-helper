import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import type {
  StandardSwapEvent,
  TokenBalanceChange,
  ArbitrageInfo,
  SolanaBlockAnalysisResult,
} from "../common/types";

import { PoolManager } from "./pool";
import { SwapParser } from "./swap";
import { ArbitrageDetector } from "./arbitrage";
import { getDexNameByProgramId, isDexProgramId } from "../common/dex";

export class TransactionAnalyzer {
  private poolManager: PoolManager;
  private swapParser: SwapParser;
  private arbitrageDetector: ArbitrageDetector;

  constructor() {
    this.poolManager = new PoolManager();
    this.swapParser = new SwapParser();
    this.arbitrageDetector = new ArbitrageDetector();
  }

  public async analyzeSolanaTransaction(
    connection: any,
    tx: ParsedTransactionWithMeta,
    slot: number,
    previousTransactions: Map<string, { signature: string; slot: number }[]>
  ): Promise<{
    signature: string;
    slot: number;
    from: string;
    fee: number;
    arbitrageInfo?: ArbitrageInfo;
    swapEvents: StandardSwapEvent[];
    tokenChanges: Record<string, string>;
    addressTokenChanges: Record<string, TokenBalanceChange[]>;
  } | null> {
    if (!tx || !tx.meta) return null;

    const swapEvents: StandardSwapEvent[] = [];
    const involvedPools = new Set<string>();
    const previousPoolTxs = new Map<
      string,
      { signature: string; slot: number }
    >();

    const signer = tx.transaction.message.accountKeys.find((key) => key.signer);

    // get all token accounts
    const tokenAccounts = this.getTokenAccountsWithBalanceChanges(tx);

    // parse all instructions
    const innerInstructions = tx.meta?.innerInstructions || [];

    for (let i = 0; i < innerInstructions.length; i++) {
      const instruction = innerInstructions[i];
      if (!instruction) continue;

      for (let j = 0; j < instruction.instructions.length; j++) {
        const subInstruction = instruction.instructions[j];
        if (!subInstruction) continue;

        const programId = subInstruction.programId;

        const swapEvent = this.swapParser.parseSolanaSwapEvent(
          innerTokenAccounts,
          poolInfo,
          j // inner instruction index
        );
        if (swapEvent) {
          swapEvents.push(swapEvent);
        }

        console.log("now instruction: ", j);
        // whether is from a dex program
        if (isDexProgramId(programId.toBase58())) {
          const accounts =
            "accounts" in subInstruction ? subInstruction.accounts : [];

          // account could be pool
          const poolCandidates = accounts.filter(
            (account) =>
              !tokenAccounts.find((t) => t.addr === account.toBase58())
          );
          // inner signer token accounts
          const innerTokenAccounts = tokenAccounts.filter((account) =>
            accounts.find(
              (t) =>
                t.toBase58() === account.addr &&
                account.owner === signer?.pubkey?.toBase58()
            )
          );
          if (poolCandidates.length > 0) {
            for (const account of poolCandidates) {
              const poolInfo = await this.poolManager.requestTxPoolInfo(
                connection,
                getDexNameByProgramId(programId.toBase58()),
                account.toBase58()
              );
              if (poolInfo) {
                involvedPools.add(account.toBase58());
                const previousTxs = previousTransactions.get(
                  account.toBase58()
                );
                if (previousTxs && previousTxs.length > 0) {
                  const lastTx = previousTxs[previousTxs.length - 1];
                  if (lastTx) {
                    previousPoolTxs.set(account.toBase58(), lastTx);
                  }
                }
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

        return {
          signature: tx.transaction.signatures[0] || "",
          slot,
          from: tx.transaction.message.accountKeys[0]?.pubkey?.toBase58() || "",
          fee: tx.meta.fee,
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

    return {
      signature: tx.transaction.signatures[0] || "",
      slot,
      from: tx.transaction.message.accountKeys[0]?.pubkey?.toBase58() || "",
      fee: tx.meta.fee,
      swapEvents,
      tokenChanges: {},
      addressTokenChanges: {},
    };
  }

  public async analyzeSolanaBlock(
    connection: any,
    slot: number,
    timestamp: Date,
    transactions: ParsedTransactionWithMeta[]
  ): Promise<SolanaBlockAnalysisResult | null> {
    try {
      const poolTransactionHistory = new Map<
        string,
        { signature: string; slot: number }[]
      >();
      const analyzedTransactions = [];

      for (let i = 0; i < transactions.length; i++) {
        const tx = transactions[i];
        if (!tx) continue;

        const analysis = await this.analyzeSolanaTransaction(
          connection,
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

      return {
        slot,
        timestamp,
        transactions: analyzedTransactions,
      };
    } catch (error) {
      console.error(`Error analyzing Solana block ${slot}:`, error);
      return null;
    }
  }

  private getTokenAccountsWithBalanceChanges(
    tx: ParsedTransactionWithMeta
  ): TokenBalanceChange[] {
    const tokenAccounts: TokenBalanceChange[] = [];
    const preMap = new Map(
      (tx.meta?.preTokenBalances || []).map((b) => [b.accountIndex, b])
    );
    const postMap = new Map(
      (tx.meta?.postTokenBalances || []).map((b) => [b.accountIndex, b])
    );

    const allAccountIndexes = new Set([...preMap.keys(), ...postMap.keys()]);

    for (const accountIndex of allAccountIndexes) {
      const preBalance = preMap.get(accountIndex);
      const postBalance = postMap.get(accountIndex);

      if (preBalance && postBalance) {
        const change =
          BigInt(postBalance.uiTokenAmount.amount) -
          BigInt(preBalance.uiTokenAmount.amount);

        const accountKey = tx.transaction.message.accountKeys[accountIndex];
        if (accountKey) {
          tokenAccounts.push({
            addr: accountKey.pubkey.toBase58(),
            owner: preBalance.owner || "",
            mint: preBalance.mint,
            programId: preBalance.programId || "",
            decimals: preBalance.uiTokenAmount.decimals,
            amount: change.toString(),
          });
        }
      } else if (preBalance && !postBalance) {
        const change = -BigInt(preBalance.uiTokenAmount.amount);

        const accountKey = tx.transaction.message.accountKeys[accountIndex];
        if (accountKey) {
          tokenAccounts.push({
            addr: accountKey.pubkey.toBase58(),
            owner: preBalance.owner || "",
            mint: preBalance.mint,
            programId: preBalance.programId || "",
            decimals: preBalance.uiTokenAmount.decimals,
            amount: change.toString(),
          });
        }
      } else if (!preBalance && postBalance) {
        const change = BigInt(postBalance.uiTokenAmount.amount);

        const accountKey = tx.transaction.message.accountKeys[accountIndex];
        if (accountKey) {
          tokenAccounts.push({
            addr: accountKey.pubkey.toBase58(),
            owner: postBalance.owner || "",
            mint: postBalance.mint,
            programId: postBalance.programId || "",
            decimals: postBalance.uiTokenAmount.decimals,
            amount: change.toString(),
          });
        }
      }
    }
    console.log("tokenAccounts: ", tokenAccounts);
    return tokenAccounts;
  }
}
