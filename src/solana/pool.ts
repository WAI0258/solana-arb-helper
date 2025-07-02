import { Connection, PublicKey } from "@solana/web3.js";
// import { Raydium } from "@raydium-io/raydium-sdk-v2";
import path from "path";
import fs from "fs";

import type {
  ExtendedPoolInfo,
  ExtendedToken,
  StandardSwapEvent,
} from "../common/types";
import type { DexProgram } from "../common/dex";
import { Raydium } from "@raydium-io/raydium-sdk-v2";

export class PoolManager {
  private poolCache: { [key: string]: ExtendedPoolInfo } = {};
  private readonly POOL_CACHE_FILE = path.join(
    __dirname,
    "../../data/solana_pool_cache.json"
  );

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      if (fs.existsSync(this.POOL_CACHE_FILE)) {
        const data = fs.readFileSync(this.POOL_CACHE_FILE, "utf-8");
        this.poolCache = JSON.parse(data);
      }
    } catch (error) {
      console.error("Error loading Solana pool cache:", error);
    }
  }

  private saveCache() {
    try {
      fs.writeFileSync(
        this.POOL_CACHE_FILE,
        JSON.stringify(this.poolCache, null, 2)
      );
    } catch (error) {
      console.error("Error saving Solana pool cache:", error);
    }
  }

  public async requestTxPoolInfo(
    connection: any,
    dexProgram: string,
    poolAddress: string
  ): Promise<ExtendedPoolInfo | null> {
    const lowerAddress = poolAddress.toLowerCase();
    if (this.poolCache[lowerAddress]) {
      return this.poolCache[lowerAddress];
    }
    try {
      switch (dexProgram) {
        case "RAYDIUM":
          return this.getRaydiumPoolInfo(connection, poolAddress);
      }
      return null;
    } catch (error) {
      console.error(
        `Error getting Solana pool info for ${poolAddress}:`,
        error
      );
      return null;
    }
  }

  private async getRaydiumPoolInfo(
    connection: any,
    poolAddress: string
  ): Promise<ExtendedPoolInfo | null> {
    const raydium = await Raydium.load({ connection });
    const poolInfo = await raydium.api.fetchPoolById({ ids: poolAddress });
    if (poolInfo[0] === null) {
      return null;
    }
    return {
      poolId: poolAddress,
      tokens: [
        {
          address: poolInfo[0]?.mintA?.address || "",
          decimals: 0,
          programId: poolInfo[0]?.mintA?.programId || "",
          symbol: poolInfo[0]?.mintA?.symbol || "",
          name: poolInfo[0]?.mintA?.name || "",
        },
        {
          address: poolInfo[0]?.mintB?.address || "",
          decimals: 0,
          programId: poolInfo[0]?.mintB?.programId || "",
          symbol: poolInfo[0]?.mintB?.symbol || "",
          name: poolInfo[0]?.mintB?.name || "",
        },
      ],
      factory: poolInfo[0]?.rewardDefaultPoolInfos || "",
      protocol: poolInfo[0]?.programId || "",
      poolType: poolInfo[0]?.type || "",
    };
  }
}
