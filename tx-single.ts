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
      // "2oe9zER9xx7dnYQNvop4WpCmPjsXmUjF6Q1aAFaEhvRSkEumqyRVnzEXCrBESBSZ56SrCDUEvU4VzHnt24aK2kSb"; // adn whirlpool

      //raydium
      // "dTLhNajxmKk5XxKhyMMrBhyUQh5EXe2U25iFM7HRxhtV2fdYQmNcbCsbir6FoNjFi8wiQCopGVthkN3oZFftEK7";
      //cpmm
      // "3NZt3syTpsY74Dq8Y5sMn2v9k9qsqJSchVM25eB8ULD6SrHNxQGMtAEXSV8T5FWZjP5ojo65BJPtSPgNLSZGiB7r"; //+meteora dlmm

      //meteora
      // "bEESzTQw7L5RaZQAKK2U71f44wjWQQ9mwdFrBE6WuLESLrdZ3UJT2Fubq7ayKoSEwWYib4NKpoeKoHVJ4hHzV9V"; // pool program+dlmm 有趣
      // "4FgSEC8WS49J7QG8u2xyC8SNWPBNrmgiZAKFR5VdTJ8ww2J6HTQs5zeotL7undCt9x1ZTYbq9avPfM854BaKUkqj"; // pool program+damm v2

      //pumpfun
      // "Ax2HVF3GAtzu1SthhSLF2AhVKJFRME7fYMcb1zQpCxu5UbzCfvjFzUgvXtQULYopLGLw5xupVbco8WdPZB12w5c"; //amm

      //solfi
      // "3nrmL1KmrsPKMZoXxbdMubReLTEWp3948Lbpo1A6SVPCiMMN193LkDTQceV22dmY1UK9LwGm2t3D5bXFVVSygVym"; // jupitet外层套利，所以未检测出来
      // "3i4HtxGHKv5bXJcmaJias6L1sA5MfrqHsYRXcQ5LZymX3hQgjWKGRwKdz5eXxMZzidNG1qAX92mtGo7LTMNcrsqh"; //dlmm+whirlpool
      // "5MSNYMM77T7aoDNhEYwjC4SyD5DyKJV5SMcDrMTVZFdjLSxkvUCzqyuMgWjQtQConSkXokzcjhmYzGvmwfwU6Ww6"; //whirlpool

      // lifinity
      // "5vt6tp4UBE64TH5bxTWcrZACcW3g9ruc8Cv2nhzFNfSBFuJs6qD2JRKnjUq7dCT8i857jMnhT25a4MaLtJ4imQWr";
      // "5KQrudiKeeLAiRP4GkLNraZn6X73y5eedg2RCMkGRLiS9kKj8g3MKmqTM6dbYURWbJKCnee6VQRkxmfoom3Yo23F";

      // loaned first, then arb,有趣！！
      "4Y59CaeQKDxTkcUQS8kDRRBXYrJZygrrrWVSiAXWWu6x3vZjT38sMmF7CjhHB6uJsinRHXZy8WHcwTPq6whidfxJ";

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
