import { BatchAnalyzer } from "./src/solana/batch";

async function analyzeHistoricalData() {
  // 配置分析参数
  const config = {
    startDate: new Date("2024-04-23T00:00:00Z"),
    endDate: new Date("2024-05-01T23:59:59Z"),
    rpcUrl: "https://api.mainnet-beta.solana.com", // 建议使用私有RPC节点以获得更好的性能
    outputDir: "./analysis-results",
    maxConcurrentBlocks: 5, // 并发处理的区块数量
    saveInterval: 100, // 每处理100个区块保存一次
    retryAttempts: 3,
    delayBetweenRequests: 100, // 100ms延迟避免RPC限流
  };

  console.log("Starting Solana historical data analysis...");
  console.log(
    `Date range: ${config.startDate.toISOString()} to ${config.endDate.toISOString()}`
  );

  const analyzer = new BatchAnalyzer(config);

  try {
    // 选择分析模式：
    // 1. 日期范围分析（自动估算slot范围）
    // 2. 指定slot范围分析（更精确）
    // 3. 直接使用核心分析器（无文件管理）

    // 模式1：日期范围分析（带文件管理）
    console.log("Using date range analysis with file management...");
    const result = await analyzer.analyzeHistoricalData();

    // 模式2：指定slot范围分析（带文件管理）
    // console.log("Using specific slot range analysis with file management...");
    // const startSlot = 123456789; // 替换为实际的起始slot
    // const endSlot = 123456999;   // 替换为实际的结束slot
    // const result = await analyzer.analyzeSlotRange(startSlot, endSlot);

    // 模式3：直接使用核心分析器（无文件管理）
    // console.log("Using core analyzer directly...");
    // const analyzer = new TransactionAnalyzer();
    // const connection = new Connection("https://api.mainnet-beta.solana.com");
    // const results = await analyzer.analyzeSolanaDateRange(
    //   connection,
    //   config.startDate,
    //   config.endDate
    // );

    console.log("\n=== Analysis Summary ===");
    console.log(
      `Date Range: ${result.startDate.toISOString()} - ${result.endDate.toISOString()}`
    );
    console.log(`Slot Range: ${result.startSlot} - ${result.endSlot}`);
    console.log(`Total Blocks: ${result.totalBlocks}`);
    console.log(`Processed Blocks: ${result.processedBlocks}`);
    console.log(`Failed Blocks: ${result.failedBlocks}`);
    console.log(
      `Success Rate: ${(
        (result.processedBlocks / result.totalBlocks) *
        100
      ).toFixed(2)}%`
    );
    console.log(`Total Transactions: ${result.totalTransactions}`);
    console.log(`Arbitrage Transactions: ${result.arbitrageTransactions}`);
    console.log(
      `Arbitrage Rate: ${(
        (result.arbitrageTransactions / result.totalTransactions) *
        100
      ).toFixed(2)}%`
    );

    // 分析套利交易详情
    if (result.arbitrageTransactions > 0) {
      console.log("\n=== Arbitrage Analysis ===");
      const arbitrageTxs = result.results.flatMap((block) =>
        block.transactions.filter((tx) => tx.arbitrageInfo)
      );

      // 按协议统计
      const protocolStats = new Map<string, number>();
      arbitrageTxs.forEach((tx) => {
        tx.swapEvents.forEach((event) => {
          const protocol = event.protocol;
          protocolStats.set(protocol, (protocolStats.get(protocol) || 0) + 1);
        });
      });

      console.log("Arbitrage by Protocol:");
      for (const [protocol, count] of protocolStats) {
        console.log(`  ${protocol}: ${count}`);
      }

      // 按利润代币统计
      const profitTokenStats = new Map<string, number>();
      arbitrageTxs.forEach((tx) => {
        if (tx.arbitrageInfo?.profit?.token) {
          const token = tx.arbitrageInfo.profit.token;
          profitTokenStats.set(token, (profitTokenStats.get(token) || 0) + 1);
        }
      });

      console.log("\nArbitrage by Profit Token:");
      for (const [token, count] of profitTokenStats) {
        console.log(`  ${token}: ${count}`);
      }
    }
  } catch (error) {
    console.error("Error during analysis:", error);
  }
}

// 运行分析
analyzeHistoricalData().catch(console.error);
