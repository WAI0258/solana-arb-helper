import { Connection } from "@solana/web3.js";
import path from "path";
import fs from "fs";

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

export class SolanaArbHelper {
  public readonly connection: Connection;
  private poolManager: PoolManager;
  private swapParser: SwapParser;
  private arbitrageDetector: ArbitrageDetector;
  private transactionAnalyzer: TransactionAnalyzer;
  private tokenCache: { [key: string]: any } = {};
  private readonly TOKEN_CACHE_FILE = path.join(
    __dirname,
    "../../data/solana_token_cache.json"
  );

  constructor(rpcUrl: string) {
    this.connection = new Connection(rpcUrl, "confirmed");
    this.poolManager = new PoolManager();
    this.swapParser = new SwapParser();
    this.arbitrageDetector = new ArbitrageDetector();
    this.transactionAnalyzer = new TransactionAnalyzer();
    this.loadTokenCache();
  }

  private loadTokenCache() {
    try {
      if (fs.existsSync(this.TOKEN_CACHE_FILE)) {
        const data = fs.readFileSync(this.TOKEN_CACHE_FILE, "utf-8");
        this.tokenCache = JSON.parse(data);
      }
    } catch (error) {
      console.error("Error loading Solana token cache:", error);
    }
  }

  private saveTokenCache() {
    try {
      fs.writeFileSync(
        this.TOKEN_CACHE_FILE,
        JSON.stringify(this.tokenCache, null, 2)
      );
    } catch (error) {
      console.error("Error saving Solana token cache:", error);
    }
  }

  /**
   * 获取 Solana 池子信息
   */
  public async requestTxPoolInfo(
    poolAddress: string
  ): Promise<ExtendedPoolInfo | null> {
    return this.poolManager.requestTxPoolInfo(this.connection, poolAddress);
  }

  /**
   * 解析 Solana Swap 事件
   */
  public parseSolanaSwapEvent(
    instruction: any,
    poolInfo: ExtendedPoolInfo,
    instructionIndex: number
  ): StandardSwapEvent | null {
    return this.swapParser.parseSolanaSwapEvent(
      instruction,
      poolInfo,
      instructionIndex
    );
  }

  /**
   * 构建 Solana Swap 图
   */
  public buildSolanaSwapGraph(
    swapEvents: StandardSwapEvent[]
  ): Map<string, Map<string, EdgeInfo>> {
    return this.arbitrageDetector.buildSolanaSwapGraph(swapEvents);
  }

  /**
   * 计算 Solana Swap 图的代币变化
   */
  public calculateSolanaSwapGraphTokenChanges(
    graph: Map<string, Map<string, EdgeInfo>>
  ): Map<string, bigint> {
    return this.arbitrageDetector.calculateSolanaSwapGraphTokenChanges(graph);
  }

  /**
   * 查找 Solana 套利环
   */
  public findSolanaArbitrageCycles(
    swapEvents: StandardSwapEvent[]
  ): ArbitrageCycle[] {
    return this.arbitrageDetector.findSolanaArbitrageCycles(swapEvents);
  }

  /**
   * 验证 Solana Swap 图的代币变化
   */
  public validateSolanaSwapGraphTokenChanges(
    graph: Map<string, Map<string, EdgeInfo>>
  ): { isValid: boolean; profitToken?: string } {
    return this.arbitrageDetector.validateSolanaSwapGraphTokenChanges(graph);
  }

  /**
   * 格式化 Solana 代币变化
   */
  public formatSolanaTokenChanges(
    tokenChanges: Map<string, bigint> | Record<string, string>
  ): Record<string, string> {
    return this.arbitrageDetector.formatSolanaTokenChanges(tokenChanges);
  }

  /**
   * 获取 Solana 套利信息
   */
  public getSolanaArbitrageInfo(swapEvents: StandardSwapEvent[]): {
    arbitrageCycles: ArbitrageCycle[];
    isArbitrage: boolean;
  } {
    return this.arbitrageDetector.getSolanaArbitrageInfo(swapEvents);
  }

  /**
   * 分析 Solana 交易
   */
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
      this.connection,
      tx,
      slot,
      previousTransactions
    );
  }

  /**
   * 分析 Solana 区块
   */
  public async analyzeSolanaBlock(
    slot: number,
    timestamp: Date,
    transactions: any[]
  ): Promise<SolanaBlockAnalysisResult | null> {
    return this.transactionAnalyzer.analyzeSolanaBlock(
      this.connection,
      slot,
      timestamp,
      transactions
    );
  }
}

// 导出所有类型
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

// 导出内部类（如果需要）
export { PoolManager, SwapParser, ArbitrageDetector, TransactionAnalyzer };
