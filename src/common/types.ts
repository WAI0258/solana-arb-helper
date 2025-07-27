export interface ExtendedToken {
  address: string;
  decimals: number;
  programId: string;
  name?: string;
  symbol?: string;
}

export interface ExtendedPoolInfo {
  poolId: string;
  tokens: ExtendedToken[];
  factory: string; // same as programId
  protocol: string;
  poolType: string;
}

// Cycle Edge
export interface CycleEdge {
  tokenIn: string;
  tokenOut: string;
  amountIn: string;
  amountOut: string;
  poolAddress: string;
  protocol: string;
}

// Edge Info
export interface EdgeInfo {
  amountIn: bigint;
  amountOut: bigint;
  poolAddress: string;
  protocol: string;
}

// Standard Swap Event
export interface StandardSwapEvent {
  poolAddress: string;
  protocol: string;
  tokenIn: string;
  tokenOut: string;
  amountIn: bigint;
  amountOut: bigint;
  sender: string;
  recipient: string;
  instructionIndex: number;
}

// Token Transfer
export interface TokenTransfer {
  token: string;
  from: string;
  to: string;
  amount: bigint;
  decimals: number;
  symbol?: string;
}

// Token Balance Change
export interface TokenBalanceChange {
  addr: string;
  owner: string;
  mint: string;
  programId: string;
  decimals: number;
  amount: bigint;
}

// Arbitrage Cycle
export interface ArbitrageCycle {
  edges: CycleEdge[];
  profitToken: string;
  profitAmount: string;
  tokenChanges: Record<string, string>;
}

// Arbitrage Info
export interface ArbitrageInfo {
  type: "begin" | "inter";
  isBackrun: boolean;
  arbitrageCycles: ArbitrageCycle[];
  cyclesLength: number;
  profit: {
    token: string;
    amount: string;
  };
  interInfo?: Array<{
    signature: string;
    poolAddress: string;
    slot: number;
  }>;
}

// Solana Block Analysis Result
export interface BlockAnalysisResult {
  slot: number;
  timestamp: Date;
  transactions: Array<{
    signature: string;
    slot: number;
    signer: string;
    fee: number;
    arbitrageInfo?: ArbitrageInfo;
    swapEvents: StandardSwapEvent[];
    tokenChanges: Record<string, string>;
    addressTokenChanges: Record<string, TokenBalanceChange[]>;
  }>;
  validTransactions?: number;
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
  results: BlockAnalysisResult[];
  statistics: {
    totalProfit: string;
    protocolStats: Record<string, number>;
    profitTokenStats: Record<string, number>;
    arbitrageTypeStats: Record<string, number>;
    arbitrageTransactionsAddress: Record<string, string>;
  };
}

export interface ProgressState {
  currentSlot: number;
  processedSlots: number[];
  totalSlots: number;
  startSlot: number;
  endSlot: number;
  lastSaveTime: string;
}

export interface AnalysisSummary {
  slotRange: string;
  dateRange: string;
  totalBlocks: number;
  arbitrageTransactions: number;
  arbitrageTransactionsByAddress: Record<string, string>;
  totalTransactions: number;
  totalProfit: string;
  protocols: string[];
  profitTokens: string[];
  createdAt: string;
  filePath: string;
}
