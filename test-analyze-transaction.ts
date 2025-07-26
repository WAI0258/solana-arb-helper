import { Connection, PublicKey } from "@solana/web3.js";
import { TransactionAnalyzer } from "./src/solana/analyser";
import { isDexProgramId } from "./src/common/dex";

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

    const transactionSignature =
      //orca
      //v1
      // "3o5HJFNmuVXBjtjaNacmweqsGGfMFvgJq6zqzBeds51AzY98WxUvqq5bnUCGTDckku6KAoLavfNSDnDGoDtDhM6t";
      // "Uxj6SkjrAy9mz1PECfaSb9K24ATesFyJn3SkwjyF7k4n3pVNmEs6CEe2UKzbwcycHPebfrHMUF8g53MCwQhmzB5"; //route
      //v2
      // "BgAA6JLqELmZBrecH2bBc7QjKcRu3Dnr4kzHX4dQSSBSZxBo2zKX1FfQyPESktyZR29YDyYqMmrV9fYaJGGeXcH"; // !!!未检测套利
      "2oe9zER9xx7dnYQNvop4WpCmPjsXmUjF6Q1aAFaEhvRSkEumqyRVnzEXCrBESBSZ56SrCDUEvU4VzHnt24aK2kSb"; // adn whirlpool

    //raydium
    // "dTLhNajxmKk5XxKhyMMrBhyUQh5EXe2U25iFM7HRxhtV2fdYQmNcbCsbir6FoNjFi8wiQCopGVthkN3oZFftEK7";
    //cpmm
    // "3NZt3syTpsY74Dq8Y5sMn2v9k9qsqJSchVM25eB8ULD6SrHNxQGMtAEXSV8T5FWZjP5ojo65BJPtSPgNLSZGiB7r"; //+meteora dlmm
    // const transaction = await connection.getParsedTransaction(
    //   transactionSignature,
    //   {
    //     maxSupportedTransactionVersion: 0,
    //   }
    // );
    const transaction = await connection.getTransaction(transactionSignature, {
      maxSupportedTransactionVersion: 0,
    });
    // console.log("transaction: ", JSON.stringify(transaction, null, 2));

    const previousTransactions = new Map<
      string,
      { signature: string; slot: number }[]
    >();

    const result = await analyzer.analyzeSolanaTransaction(
      transaction as any,
      slot,
      previousTransactions
    );

    if (result) {
      const replacer = (key: string, value: any) => {
        if (typeof value === "bigint") {
          return value.toString();
        }
        return value;
      };
      console.log("result: ", JSON.stringify(result, replacer, 2));
    } else {
      console.log("No analysis result returned");
    }
  } catch (error) {
    console.error("Error analyzing transaction:", error);
  }
}

testAnalyzeSolanaTransaction().catch(console.error);
