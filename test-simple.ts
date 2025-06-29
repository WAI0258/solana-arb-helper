import { PoolManager } from "./src/solana/pool";
import { Connection, PublicKey } from "@solana/web3.js";

const POOL_ADDRESS = "BF9S5Kvygv3Qf4aSnjyG98aoij11k3yiSLBHcxTa53h3";

async function test() {
  console.log("🧪 测试 Solana 池信息获取");
  console.log(`池地址: ${POOL_ADDRESS}\n`);

  try {
    const connection = new Connection(
      "https://api.mainnet-beta.solana.com",
      "confirmed"
    );

    const poolInfo = await connection.getAccountInfo(
      new PublicKey(POOL_ADDRESS)
    );
    console.log(JSON.stringify(poolInfo, null, 2));
  } catch (error) {
    console.log("❌ 错误:", error);
  }
}

test();
