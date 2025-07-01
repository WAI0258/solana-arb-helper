import { Connection, PublicKey } from "@solana/web3.js";
import { TransactionAnalyzer } from "./src/solana/analyser";

async function testAnalyzeSolanaTransaction() {
  const rpcUrl = "https://api.mainnet-beta.solana.com";
  const connection = new Connection(rpcUrl, "confirmed");

  const analyzer = new TransactionAnalyzer();

  try {
    const slot = await connection.getSlot();
    console.log("Current slot:", slot);

    // const block = await connection.getBlock(slot, {
    //   maxSupportedTransactionVersion: 0,
    //   transactionDetails: "full",
    //   rewards: false,
    // });

    // if (!block || !block.transactions || block.transactions.length === 0) {
    //   console.log("No transactions found in current block");
    //   return;
    // }

    // const transaction = block.transactions[0];
    // if (!transaction) {
    //   console.log("No transaction found");
    //   return;
    // }

    const transaction = await connection.getParsedTransaction(
      "dTLhNajxmKk5XxKhyMMrBhyUQh5EXe2U25iFM7HRxhtV2fdYQmNcbCsbir6FoNjFi8wiQCopGVthkN3oZFftEK7",
      {
        maxSupportedTransactionVersion: 0,
      }
    );

    // const transactionSignature = transaction.transaction.signatures[0];
    const transactionSignature =
      "dTLhNajxmKk5XxKhyMMrBhyUQh5EXe2U25iFM7HRxhtV2fdYQmNcbCsbir6FoNjFi8wiQCopGVthkN3oZFftEK7";

    console.log("Using transaction signature:", transactionSignature);

    const previousTransactions = new Map<
      string,
      { signature: string; slot: number }[]
    >();
    console.log(previousTransactions);

    const result = await analyzer.analyzeSolanaTransaction(
      connection,
      transaction as any, // Type assertion to bypass type checking
      slot,
      previousTransactions
    );

    if (result) {
      console.log("\n================================================\n");
      console.log("Transaction Analysis Result:");
      console.log("Signature:", result.signature);
      console.log("Slot:", result.slot);
      console.log("From:", result.from);
      console.log("Fee:", result.fee);
      console.log("Swap Events Count:", result.swapEvents.length);
      console.log("Token Changes:", result.tokenChanges);

      if (result.arbitrageInfo) {
        console.log("Arbitrage Info:");
        console.log("  Type:", result.arbitrageInfo.type);
        console.log("  Is Backrun:", result.arbitrageInfo.isBackrun);
        console.log("  Cycles Length:", result.arbitrageInfo.cyclesLength);
        console.log("  Profit:", result.arbitrageInfo.profit);
      }
    } else {
      console.log("No analysis result returned");
    }
  } catch (error) {
    console.error("Error analyzing transaction:", error);
  }
}

testAnalyzeSolanaTransaction().catch(console.error);
