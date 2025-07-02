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

export interface ExtendedMarketInfo {
  marketId: string;
  tokens: string[];
  factory: string; // same as programId
  protocol: string;
  marketType: string;
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

// Block Analysis Result
export interface BlockAnalysisResult {
  blockNumber: number;
  timestamp: Date;
  transactions: Array<{
    hash: string;
    index: number;
    from: string;
    to?: string;
    gasPrice: string;
    gasUsed: string;
    input: string;
    arbitrageInfo?: ArbitrageInfo;
    swapEvents: StandardSwapEvent[];
    tokenChanges: Record<string, string>;
    addressTokenChanges: Record<string, TokenBalanceChange[]>;
  }>;
}

// Solana Block Analysis Result
export interface SolanaBlockAnalysisResult {
  slot: number;
  timestamp: Date;
  transactions: Array<{
    signature: string;
    slot: number;
    from: string;
    fee: number;
    arbitrageInfo?: ArbitrageInfo;
    swapEvents: StandardSwapEvent[];
    tokenChanges: Record<string, string>;
    addressTokenChanges: Record<string, TokenBalanceChange[]>;
  }>;
}
