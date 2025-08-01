import type {
  StandardSwapEvent,
  TokenBalanceChange,
  ArbitrageInfo,
  BlockAnalysisResult,
} from "../common/types";

import { ArbitrageDetector } from "./arbitrage";
import { TransactionAnalyzer } from "./analyser";

export { ArbitrageDetector, TransactionAnalyzer };

export type {
  StandardSwapEvent,
  TokenBalanceChange,
  ArbitrageInfo,
  BlockAnalysisResult,
};

export class SolanaArbHelper {
  private arbitrageDetector: ArbitrageDetector;
  private transactionAnalyzer: TransactionAnalyzer;

  constructor() {
    this.arbitrageDetector = new ArbitrageDetector();
    this.transactionAnalyzer = new TransactionAnalyzer();
  }

  public detectArbitrage(swapEvents: StandardSwapEvent[]): {
    isArbitrage: boolean;
    cycles: any[];
    profitToken?: string;
    profitAmount?: bigint;
  } {
    const { arbitrageCycles, isArbitrage } =
      this.arbitrageDetector.getSolanaArbitrageInfo(swapEvents);

    if (!isArbitrage || arbitrageCycles.length === 0) {
      return { isArbitrage: false, cycles: [] };
    }

    const graph = this.arbitrageDetector.buildSolanaSwapGraph(swapEvents);
    const { profitToken } =
      this.arbitrageDetector.validateSolanaSwapGraphTokenChanges(graph);
    const tokenChanges =
      this.arbitrageDetector.calculateSolanaSwapGraphTokenChanges(graph);
    const profitAmount = profitToken
      ? tokenChanges.get(profitToken)
      : undefined;

    return {
      isArbitrage: true,
      cycles: arbitrageCycles,
      profitToken,
      profitAmount,
    };
  }

  public async analyzeTransaction(
    tx: any,
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
    return this.transactionAnalyzer.analyzeSolanaTransaction(
      tx,
      slot,
      previousTransactions
    );
  }

  public get detector() {
    return this.arbitrageDetector;
  }

  public get analyzer() {
    return this.transactionAnalyzer;
  }
}
