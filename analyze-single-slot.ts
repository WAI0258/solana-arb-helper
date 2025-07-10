import { Connection } from "@solana/web3.js";
import { TransactionAnalyzer } from "./src/solana/analyser";

async function analyzeSingleSlot() {
  const connection = new Connection(
    "https://api.mainnet-beta.solana.com",
    "confirmed"
  );
  const analyzer = new TransactionAnalyzer();

  // 分析单个slot
  const slot = 123456789; // 替换为实际的slot

  try {
    console.log(`Analyzing slot ${slot}...`);

    const results = await analyzer.analyzeSolanaSlotRange(
      connection,
      slot,
      slot, // 只分析一个slot
      (current, total) => {
        console.log(`Progress: ${current}/${total}`);
      }
    );

    if (results.length > 0) {
      const result = results[0];
      if (result) {
        console.log(`\n=== Slot ${slot} Analysis ===`);
        console.log(`Timestamp: ${result.timestamp}`);
        console.log(`Total Transactions: ${result.transactions.length}`);

        const arbitrageTxs = result.transactions.filter(
          (tx) => tx.arbitrageInfo
        );
        console.log(`Arbitrage Transactions: ${arbitrageTxs.length}`);

        if (arbitrageTxs.length > 0) {
          console.log("\n=== Arbitrage Details ===");
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
        }
      }
    } else {
      console.log("No data found for this slot");
    }
  } catch (error) {
    console.error("Error analyzing slot:", error);
  }
}

// 运行分析
analyzeSingleSlot().catch(console.error);
