import { Connection } from "@solana/web3.js";
import fs from "fs";
import path from "path";

import type {
  BlockAnalysisResult,
  BatchAnalysisResult,
  AnalysisSummary,
  ProgressState,
} from "../../common/types";
import { TransactionAnalyzer } from "../analyser";
import { SolanaArbHelper } from "../index";
import { FileUtils } from "./file";
import {
  SOLANA_GENESIS_TIME,
  SOLANA_SLOT_DURATION_MS,
} from "../../common/constants";

export interface BatchAnalysisConfig {
  startDate: Date;
  endDate: Date;
  rpcUrl: string;
  outputDir: string;
  saveInterval: number;
}

export class BatchAnalyzer {
  private connection: Connection;
  private analyzer: TransactionAnalyzer;
  private config: BatchAnalysisConfig;
  private progressFile: string;
  private summaryFile: string;

  constructor(config: BatchAnalysisConfig) {
    this.connection = new Connection(config.rpcUrl, "confirmed");
    this.analyzer = new TransactionAnalyzer();
    this.config = config;
    this.progressFile = path.join(config.outputDir, "progress.json");
    this.summaryFile = path.join(config.outputDir, "analysis_summary.json");
  }

  private saveProgress(state: ProgressState) {
    FileUtils.safeWriteJson(this.progressFile, state, "Error saving progress:");
    console.log(
      `Progress saved: slot ${state.currentSlot}/${state.totalSlots}`
    );
  }

  private loadProgress(): ProgressState | null {
    const state = FileUtils.safeReadJson<ProgressState | null>(
      this.progressFile,
      null
    );
    if (state) {
      console.log(
        `Resuming from slot ${state.currentSlot}/${state.totalSlots}`
      );
    }
    return state;
  }

  private checkExistingAnalysis(
    startSlot: number,
    endSlot: number
  ): string | null {
    const summaries = FileUtils.safeReadJson<AnalysisSummary[]>(
      this.summaryFile,
      []
    );

    const existingAnalysis = summaries.find((summary) => {
      const [summaryStart, summaryEnd] = summary.slotRange
        .split("-")
        .map(Number);
      return summaryStart === startSlot && summaryEnd === endSlot;
    });

    return existingAnalysis ? existingAnalysis.filePath : null;
  }

  private calculateStatistics(results: BlockAnalysisResult[]) {
    const protocolStats: Record<string, number> = {};
    const profitTokenStats: Record<string, number> = {};
    const arbitrageTypeStats: Record<string, number> = {};
    const arbitrageTransactionsAddress: Record<string, string> = {};
    let totalProfit = 0n;

    const totalTransactions = results.reduce(
      (sum, block) => sum + block.transactions.length,
      0
    );

    const arbitrageTxs = results.flatMap((block) =>
      block.transactions.filter((tx) => tx.arbitrageInfo)
    );

    const arbitrageTransactions = arbitrageTxs.length;

    arbitrageTxs.forEach((tx) => {
      // protocol stats
      tx.swapEvents.forEach((event) => {
        protocolStats[event.protocol] =
          (protocolStats[event.protocol] || 0) + 1;
      });

      // profit token stats
      if (tx.arbitrageInfo?.profit?.token) {
        const token = tx.arbitrageInfo.profit.token;
        profitTokenStats[token] = (profitTokenStats[token] || 0) + 1;
      }

      // arbitrage stats
      if (tx.arbitrageInfo?.type) {
        arbitrageTypeStats[tx.arbitrageInfo.type] =
          (arbitrageTypeStats[tx.arbitrageInfo.type] || 0) + 1;
      }

      // total profit and address profit mapping
      if (tx.arbitrageInfo?.profit?.amount) {
        const profitAmount = BigInt(tx.arbitrageInfo.profit.amount);
        totalProfit += profitAmount;

        // Map transaction address to profit amount
        arbitrageTransactionsAddress[tx.signature] =
          tx.arbitrageInfo.profit.amount;
      }
    });

    return {
      totalProfit: totalProfit.toString(),
      protocolStats,
      profitTokenStats,
      arbitrageTypeStats,
      arbitrageTransactionsAddress,
      totalTransactions,
      arbitrageTransactions,
    };
  }

  private saveResults(
    results: BlockAnalysisResult[],
    batchResult: BatchAnalysisResult
  ) {
    // check if the analysis already exists
    const existingFile = this.checkExistingAnalysis(
      batchResult.startSlot,
      batchResult.endSlot
    );
    if (existingFile && fs.existsSync(existingFile)) {
      console.log(
        `Analysis for slots ${batchResult.startSlot}-${batchResult.endSlot} already exists at: ${existingFile}`
      );
      return existingFile;
    }

    // generate file name
    const filename = `analysis_${batchResult.startSlot}_${batchResult.endSlot}.json`;
    const outputPath = path.join(this.config.outputDir, filename);

    const data = {
      metadata: {
        createdAt: new Date().toISOString(),
        slotRange: `${batchResult.startSlot}-${batchResult.endSlot}`,
        dateRange: `${batchResult.startDate.toISOString()}-${batchResult.endDate.toISOString()}`,
        totalBlocks: batchResult.totalBlocks,
        arbitrageTransactions: batchResult.arbitrageTransactions,
        totalTransactions: batchResult.totalTransactions,
      },
      statistics: batchResult.statistics,
      results,
    };

    // convert BigInt to string for JSON serialization
    const jsonString = JSON.stringify(
      data,
      (key, value) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      },
      2
    );

    fs.writeFileSync(outputPath, jsonString);
    console.log(`Saved analysis results to ${outputPath}`);

    // update summary file
    this.updateAnalysisSummary(batchResult, outputPath);

    return outputPath;
  }

  private updateAnalysisSummary(
    batchResult: BatchAnalysisResult,
    filePath: string
  ) {
    let summaries = FileUtils.safeReadJson<AnalysisSummary[]>(
      this.summaryFile,
      []
    );

    // remove old records with the same range
    summaries = summaries.filter((summary) => {
      const [summaryStart, summaryEnd] = summary.slotRange
        .split("-")
        .map(Number);
      return !(
        summaryStart === batchResult.startSlot &&
        summaryEnd === batchResult.endSlot
      );
    });

    // add new record
    const newSummary: AnalysisSummary = {
      slotRange: `${batchResult.startSlot}-${batchResult.endSlot}`,
      dateRange: `${batchResult.startDate.toISOString()}-${batchResult.endDate.toISOString()}`,
      totalBlocks: batchResult.totalBlocks,
      arbitrageTransactions: batchResult.arbitrageTransactions,
      totalTransactions: batchResult.totalTransactions,
      totalProfit: batchResult.statistics.totalProfit,
      arbitrageTransactionsByAddress:
        batchResult.statistics.arbitrageTransactionsAddress,
      protocols: Object.keys(batchResult.statistics.protocolStats),
      profitTokens: Object.keys(batchResult.statistics.profitTokenStats),
      createdAt: new Date().toISOString(),
      filePath,
    };

    summaries.push(newSummary);

    // sort by created time
    summaries.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    FileUtils.safeWriteJson(
      this.summaryFile,
      summaries,
      "Error updating analysis summary:"
    );
    console.log(`Updated analysis summary with ${summaries.length} entries`);
  }

  public async analyzeWithFileManagement(
    analysisMethod: "dateRange" | "slotRange",
    startParam: Date | number,
    endParam: Date | number
  ): Promise<BatchAnalysisResult> {
    FileUtils.ensureDirectoryExists(this.config.outputDir);

    let startSlot: number;
    let endSlot: number;

    if (analysisMethod === "dateRange") {
      // convert date range to slot range
      const slotRange = await this.convertDateRangeToSlotRange(
        startParam as Date,
        endParam as Date
      );
      startSlot = slotRange.startSlot;
      endSlot = slotRange.endSlot;
    } else {
      startSlot = startParam as number;
      endSlot = endParam as number;
    }

    const totalSlots = endSlot - startSlot + 1;
    console.log(
      `Total slots to analyze: ${totalSlots} (${startSlot} to ${endSlot})`
    );

    // Load saved progress
    const savedProgress = this.loadProgress();
    let currentSlot = startSlot;
    let processedSlots: number[] = [];

    if (
      savedProgress &&
      savedProgress.startSlot === startSlot &&
      savedProgress.endSlot === endSlot
    ) {
      currentSlot = savedProgress.currentSlot;
      processedSlots = savedProgress.processedSlots;
      console.log(
        `Resuming from slot ${currentSlot}, already processed ${processedSlots.length} slots`
      );
    }

    // Analyze slots using the analyzer's built-in slot range method
    const results = await this.analyzer.analyzeSolanaSlotRange(
      this.connection,
      currentSlot,
      endSlot,
      (currentSlot, totalSlots) => {
        // Progress callback
        const percentage = ((currentSlot / totalSlots) * 100).toFixed(1);
        console.log(`Progress: ${currentSlot}/${totalSlots} (${percentage}%)`);

        // Save progress periodically
        const progressState: ProgressState = {
          currentSlot: currentSlot + 1,
          processedSlots: [...processedSlots, currentSlot],
          totalSlots,
          startSlot,
          endSlot,
          lastSaveTime: new Date().toISOString(),
        };
        this.saveProgress(progressState);

        // Cache is automatically saved when new pools/tokens are encountered
        if (currentSlot % this.config.saveInterval === 0) {
          console.log(`Checkpoint reached: ${currentSlot}/${totalSlots}`);
        }
      }
    );

    // calculate statistics from all results
    const statistics = this.calculateStatistics(results);

    // Filter results to only include arbitrage transactions for return
    const arbitrageResults = results
      .map((block) => ({
        ...block,
        transactions: block.transactions.filter((tx) => tx.arbitrageInfo),
      }))
      .filter((block) => block.transactions.length > 0);

    const batchResult: BatchAnalysisResult = {
      totalBlocks: arbitrageResults.length,
      processedBlocks: results.length,
      failedBlocks: 0,
      arbitrageTransactions: statistics.arbitrageTransactions,
      totalTransactions: statistics.totalTransactions,
      startSlot: arbitrageResults[0]?.slot || 0,
      endSlot: arbitrageResults[arbitrageResults.length - 1]?.slot || 0,
      startDate: this.config.startDate,
      endDate: this.config.endDate,
      results: arbitrageResults, // Only arbitrage transactions
      statistics: {
        totalProfit: statistics.totalProfit,
        protocolStats: statistics.protocolStats,
        profitTokenStats: statistics.profitTokenStats,
        arbitrageTypeStats: statistics.arbitrageTypeStats,
        arbitrageTransactionsAddress: statistics.arbitrageTransactionsAddress,
      },
    };

    // save results (only arbitrage transactions)
    this.saveResults(arbitrageResults, batchResult);

    // Cache is automatically saved when new pools/tokens are encountered
    console.log("Analysis completed - cache automatically managed");

    // Clean up progress file
    FileUtils.safeDelete(this.progressFile, "Error cleaning up progress file:");
    console.log("Progress file cleaned up");

    return batchResult;
  }

  public async analyzeHistoricalData(): Promise<BatchAnalysisResult> {
    return this.analyzeWithFileManagement(
      "dateRange",
      this.config.startDate,
      this.config.endDate
    );
  }

  public async analyzeSlotRange(
    startSlot: number,
    endSlot: number
  ): Promise<BatchAnalysisResult> {
    return this.analyzeWithFileManagement("slotRange", startSlot, endSlot);
  }

  public getAnalysisSummary(): AnalysisSummary[] {
    const summaries = FileUtils.safeReadJson<AnalysisSummary[]>(
      this.summaryFile,
      []
    );
    return summaries;
  }

  private convertDateRangeToSlotRange(
    startDate: Date,
    endDate: Date
  ): { startSlot: number; endSlot: number } {
    const genesisTime = new Date(SOLANA_GENESIS_TIME).getTime();
    const slotDuration = SOLANA_SLOT_DURATION_MS;
    const startSlot = Math.floor(
      (startDate.getTime() - genesisTime) / slotDuration
    );
    const endSlot = Math.floor(
      (endDate.getTime() - genesisTime) / slotDuration
    );
    console.log(
      `Deterministic slot range: ${startSlot} to ${endSlot} (GENESIS: ${SOLANA_GENESIS_TIME}, SLOT_DURATION_MS: ${slotDuration})`
    );
    return { startSlot, endSlot };
  }
}
