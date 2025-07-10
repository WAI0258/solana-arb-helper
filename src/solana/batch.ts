import { Connection, PublicKey } from "@solana/web3.js";
import fs from "fs";
import path from "path";

import type { SolanaBlockAnalysisResult, ArbitrageInfo } from "../common/types";
import { TransactionAnalyzer } from "./analyser";

export interface BatchAnalysisConfig {
  startDate: Date;
  endDate: Date;
  rpcUrl: string;
  outputDir: string;
  maxConcurrentBlocks: number;
  saveInterval: number;
  retryAttempts: number;
  delayBetweenRequests: number;
}

export interface BatchAnalysisResult {
  totalBlocks: number;
  processedBlocks: number;
  failedBlocks: number;
  arbitrageTransactions: number;
  totalTransactions: number;
  startSlot: number;
  endSlot: number;
  startDate: Date;
  endDate: Date;
  results: SolanaBlockAnalysisResult[];
}

export class BatchAnalyzer {
  private connection: Connection;
  private analyzer: TransactionAnalyzer;
  private config: BatchAnalysisConfig;

  constructor(config: BatchAnalysisConfig) {
    this.connection = new Connection(config.rpcUrl, "confirmed");
    this.analyzer = new TransactionAnalyzer();
    this.config = config;
  }

  private saveResults(results: SolanaBlockAnalysisResult[], filename: string) {
    const outputPath = path.join(this.config.outputDir, filename);
    const data = {
      timestamp: new Date().toISOString(),
      results,
    };

    fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
    console.log(`Saved ${results.length} block results to ${outputPath}`);
  }

  public async analyzeWithFileManagement(
    analysisMethod: "dateRange" | "slotRange",
    startParam: Date | number,
    endParam: Date | number
  ): Promise<BatchAnalysisResult> {
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }

    let results: SolanaBlockAnalysisResult[];

    if (analysisMethod === "dateRange") {
      console.log(`Starting date range analysis: ${startParam} to ${endParam}`);
      results = await this.analyzer.analyzeSolanaDateRange(
        this.connection,
        startParam as Date,
        endParam as Date,
        this.createProgressCallback()
      );
    } else {
      console.log(`Starting slot range analysis: ${startParam} to ${endParam}`);
      results = await this.analyzer.analyzeSolanaSlotRange(
        this.connection,
        startParam as number,
        endParam as number,
        this.createProgressCallback()
      );
    }

    const totalTransactions = results.reduce(
      (sum, block) => sum + block.transactions.length,
      0
    );
    const arbitrageTransactions = results.reduce(
      (sum, block) =>
        sum + block.transactions.filter((tx) => tx.arbitrageInfo).length,
      0
    );

    const batchResult: BatchAnalysisResult = {
      totalBlocks: results.length,
      processedBlocks: results.length,
      failedBlocks: 0,
      arbitrageTransactions,
      totalTransactions,
      startSlot: results[0]?.slot || 0,
      endSlot: results[results.length - 1]?.slot || 0,
      startDate: this.config.startDate,
      endDate: this.config.endDate,
      results,
    };
    const timestamp = Date.now();
    const finalFilename = `analysis_${batchResult.startSlot}_${batchResult.endSlot}_${timestamp}.json`;
    this.saveResults(results, finalFilename);

    const statsFilename = `stats_${batchResult.startSlot}_${batchResult.endSlot}_${timestamp}.json`;
    fs.writeFileSync(
      path.join(this.config.outputDir, statsFilename),
      JSON.stringify(batchResult, null, 2)
    );

    console.log("Analysis completed!");
    console.log(`Total blocks: ${batchResult.totalBlocks}`);
    console.log(`Processed: ${batchResult.processedBlocks}`);
    console.log(`Arbitrage transactions: ${batchResult.arbitrageTransactions}`);
    console.log(`Total transactions: ${batchResult.totalTransactions}`);

    return batchResult;
  }

  private createProgressCallback() {
    return (current: number, total: number) => {
      const percentage = ((current / total) * 100).toFixed(1);
      console.log(`Progress: ${current}/${total} (${percentage}%)`);

      if (current % this.config.saveInterval === 0) {
        console.log(`Checkpoint reached: ${current}/${total}`);
      }
    };
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
}
