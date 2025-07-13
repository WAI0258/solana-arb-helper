import { Connection } from "@solana/web3.js";

import type {
  ExtendedPoolInfo,
  StandardSwapEvent,
  TokenTransfer,
  TokenBalanceChange,
  EdgeInfo,
  CycleEdge,
  ArbitrageCycle,
  ArbitrageInfo,
  SolanaBlockAnalysisResult,
} from "../common/types";

import { PoolManager } from "./pool";
import { SwapParser } from "./swap";
import { ArbitrageDetector } from "./arbitrage";
import { TransactionAnalyzer } from "./analyser";
import { TokenCacheManager } from "../cache/token";

export class SolanaArbHelper {
  public readonly connection: Connection;
  private poolManager: PoolManager;
  private swapParser: SwapParser;
  private arbitrageDetector: ArbitrageDetector;
  private transactionAnalyzer: TransactionAnalyzer;

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, "confirmed");
    this.poolManager = new PoolManager();
    this.swapParser = new SwapParser();
    this.arbitrageDetector = new ArbitrageDetector();
    this.transactionAnalyzer = new TransactionAnalyzer();
  }

  public buildSolanaSwapGraph(
    swapEvents: StandardSwapEvent[]
  ): Map<string, Map<string, EdgeInfo>> {
    return this.arbitrageDetector.buildSolanaSwapGraph(swapEvents);
  }

  public calculateSolanaSwapGraphTokenChanges(
    graph: Map<string, Map<string, EdgeInfo>>
  ): Map<string, bigint> {
    return this.arbitrageDetector.calculateSolanaSwapGraphTokenChanges(graph);
  }

  public findSolanaArbitrageCycles(
    swapEvents: StandardSwapEvent[]
  ): ArbitrageCycle[] {
    return this.arbitrageDetector.findSolanaArbitrageCycles(swapEvents);
  }

  public validateSolanaSwapGraphTokenChanges(
    graph: Map<string, Map<string, EdgeInfo>>
  ): { isValid: boolean; profitToken?: string } {
    return this.arbitrageDetector.validateSolanaSwapGraphTokenChanges(graph);
  }

  public formatSolanaTokenChanges(
    tokenChanges: Map<string, bigint> | Record<string, string>
  ): Record<string, string> {
    return this.arbitrageDetector.formatSolanaTokenChanges(tokenChanges);
  }

  public getSolanaArbitrageInfo(swapEvents: StandardSwapEvent[]): {
    arbitrageCycles: ArbitrageCycle[];
    isArbitrage: boolean;
  } {
    return this.arbitrageDetector.getSolanaArbitrageInfo(swapEvents);
  }

  public async analyzeSolanaTransaction(
    tx: any,
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
    return this.transactionAnalyzer.analyzeSolanaTransaction(
      tx,
      slot,
      previousTransactions
    );
  }

  public async analyzeSolanaBlock(
    slot: number,
    timestamp: Date,
    transactions: any[]
  ): Promise<SolanaBlockAnalysisResult | null> {
    return this.transactionAnalyzer.analyzeSolanaBlock(
      slot,
      timestamp,
      transactions
    );
  }

  public getTokenCacheSize(): number {
    return TokenCacheManager.getCacheSize();
  }
}

export type {
  ExtendedPoolInfo,
  StandardSwapEvent,
  TokenTransfer,
  TokenBalanceChange,
  EdgeInfo,
  CycleEdge,
  ArbitrageCycle,
  ArbitrageInfo,
  SolanaBlockAnalysisResult,
};

export { PoolManager, SwapParser, ArbitrageDetector, TransactionAnalyzer };
