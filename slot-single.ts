import { BatchAnalyzer } from "./src/solana/data-processor/batch";
import path from "path";

async function analyzeSingleSlot() {
  const config = {
    startDate: new Date("2025-01-01T00:00:00Z"),
    endDate: new Date("2025-01-01T23:59:59Z"),
    rpcUrl: "https://api.mainnet-beta.solana.com",
    outputDir: path.resolve("./analysis-results"),
    saveInterval: 1,
  };

  console.log("Starting single slot analysis using BatchAnalyzer...");
  // const slot = 335256725;
  const slot = 335256770;

  const analyzer = new BatchAnalyzer(config);

  try {
    console.log(`Analyzing slot ${slot}...`);

    const result = await analyzer.analyzeSlotRange(slot, slot);

    console.log("\n=== Analysis Summary ===");
    console.log(`Slot: ${result.startSlot}`);
    console.log(`Total Blocks: ${result.totalBlocks}`);
    console.log(`Processed Blocks: ${result.processedBlocks}`);
    console.log(`Failed Blocks: ${result.failedBlocks}`);
    console.log(`Total Transactions: ${result.totalTransactions}`);
    console.log(`Arbitrage Transactions: ${result.arbitrageTransactions}`);
    console.log(
      `Arbitrage Rate: ${(
        (result.arbitrageTransactions / result.totalTransactions) *
        100
      ).toFixed(2)}%`
    );

    if (result.arbitrageTransactions > 0) {
      console.log("\n=== Arbitrage Details ===");
      const arbitrageTxs = result.results.flatMap((block) =>
        block.transactions.filter((tx) => tx.arbitrageInfo)
      );

      arbitrageTxs.forEach((tx, index) => {
        console.log(`\nArbitrage ${index + 1}:`);
        console.log(`  Signature: ${tx.signature}`);
        console.log(`  Type: ${tx.arbitrageInfo?.type}`);
        console.log(`  Profit Token: ${tx.arbitrageInfo?.profit?.token}`);
        console.log(`  Profit Amount: ${tx.arbitrageInfo?.profit?.amount}`);
        console.log(
          `  Protocols: ${tx.swapEvents.map((e) => e.protocol).join(", ")}`
        );
      });
      const protocolStats = new Map<string, number>();
      arbitrageTxs.forEach((tx) => {
        tx.swapEvents.forEach((event) => {
          const protocol = event.protocol;
          protocolStats.set(protocol, (protocolStats.get(protocol) || 0) + 1);
        });
      });

      console.log("\nArbitrage by Protocol:");
      for (const [protocol, count] of protocolStats) {
        console.log(`  ${protocol}: ${count} times`);
      }

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

analyzeSingleSlot().catch(console.error);
