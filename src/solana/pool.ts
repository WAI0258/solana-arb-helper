import path from "path";
import fs from "fs";

import type {
  ExtendedPoolInfo,
  StandardSwapEvent,
  TokenBalanceChange,
} from "../common/types";
import { getTokenInfo } from "@/utils/tokenList";
import { type DexProgram } from "@/common/dex";

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
    dexProgramInfo: DexProgram | null,
    poolAddress: string,
    tokenIn: TokenBalanceChange,
    tokenOut: TokenBalanceChange
  ): Promise<ExtendedPoolInfo | null> {
    const lowerAddress = poolAddress.toLowerCase();
    if (this.poolCache[lowerAddress]) {
      return this.poolCache[lowerAddress];
    }
    try {
      const tokenInfoIn = await getTokenInfo(tokenIn.mint);
      const tokenInfoOut = await getTokenInfo(tokenOut.mint);
      return {
        poolId: poolAddress,
        tokens: [
          {
            address: tokenInfoIn?.address || tokenIn.mint,
            decimals: tokenInfoIn?.decimals || tokenIn.decimals,
            programId: tokenInfoIn?.programId || tokenIn.programId,
            symbol: tokenInfoIn?.symbol || "unknown",
            name: tokenInfoIn?.name || "unknown",
          },
          {
            address: tokenInfoOut?.address || tokenOut.mint,
            decimals: tokenInfoOut?.decimals || tokenOut.decimals,
            programId: tokenInfoOut?.programId || tokenOut.programId,
            symbol: tokenInfoOut?.symbol || "unknown",
            name: tokenInfoOut?.name || "unknown",
          },
        ],
        factory: dexProgramInfo?.address || "",
        protocol: dexProgramInfo?.protocol || "",
        poolType: dexProgramInfo?.type || "",
      };
    } catch (error) {
      console.error(
        `Error getting Solana pool info for ${poolAddress}:`,
        error
      );
      return null;
    }
  }
}
