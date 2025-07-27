import { BatchAnalyzer } from "./src/solana/data-processor/batch";

async function analyzeHistoricalData() {
  const config = {
    startDate: new Date("2025-04-23T00:00:00Z"),
    endDate: new Date("2025-05-01T23:59:59Z"),
    rpcUrl: "https://api.mainnet-beta.solana.com",
    outputDir: "./analysis-results",
    saveInterval: 100,
  };

  console.log("Starting Solana historical data analysis...");
  console.log(
    `Date range: ${config.startDate.toISOString()} to ${config.endDate.toISOString()}`
  );

  const analyzer = new BatchAnalyzer(config);

  try {
    // console.log("Using date range analysis with file management...");
    // const result = await analyzer.analyzeHistoricalData();

    // analyze specific slot range
    console.log("Using specific slot range analysis with file management...");
    const startSlot = 335256719; // 2025-04-23T00:00:00Z
    const endSlot = 337219904; // 2025-05-01T23:59:59Z
    const result = await analyzer.analyzeSlotRange(startSlot, endSlot);

    // analyze date range--without file management
    // console.log("Using core analyzer directly...");
    // const analyzer = new TransactionAnalyzer();
    // const connection = new Connection("https://api.mainnet-beta.solana.com");
    // const results = await analyzer.convertDateRangeToSlotRange(
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

    // arbitrage
    if (result.arbitrageTransactions > 0) {
      console.log("\n=== Arbitrage Analysis ===");
      const arbitrageTxs = result.results.flatMap((block) =>
        block.transactions.filter((tx) => tx.arbitrageInfo)
      );

      // protocol
      const protocolStats = new Map<string, number>();
      arbitrageTxs.forEach((tx) => {
        tx.swapEvents.forEach((event) => {
          const protocol = event.protocol;
          protocolStats.set(protocol, (protocolStats.get(protocol) || 0) + 1);
        });
      });

      console.log("Arbitrage by Protocol:");
      for (const [protocol, count] of protocolStats) {
        console.log(`  ${protocol}: ${count} times`);
      }

      // profit
      const profitTokenStats = new Map<string, number>();
      arbitrageTxs.forEach((tx) => {
        if (tx.arbitrageInfo?.profit?.token) {
          const token = tx.arbitrageInfo.profit.token;
          profitTokenStats.set(token, (profitTokenStats.get(token) || 0) + 1);
        }
      });

      console.log("\nArbitrage by Profit Token:");
      for (const [token, count] of profitTokenStats) {
        console.log(`  ${token}: ${count} times`);
      }
    }
  } catch (error) {
    console.error("Error during analysis:", error);
  }
}

analyzeHistoricalData().catch(console.error);
