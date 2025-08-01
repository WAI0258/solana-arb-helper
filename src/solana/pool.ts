import type { ExtendedPoolInfo } from "../common/types";
import { getTokenInfo } from "../utils";
import { type DexProgram } from "@/common/dex";
import { cacheManager } from "../cache";

export class PoolManager {
  private buildTokenInfo(tokenInfo: any, fallbackToken: any) {
    return {
      address: tokenInfo?.address || fallbackToken.mint,
      decimals: tokenInfo?.decimals || fallbackToken.decimals,
      programId: tokenInfo?.programId || fallbackToken.programId,
      symbol: tokenInfo?.symbol || "unknown",
      name: tokenInfo?.name || "unknown",
    };
  }

  public async requestTxPoolInfo(
    dexProgramInfo: DexProgram | null,
    poolAddress: string,
    tokenIn: any,
    tokenOut: any,
    txSignature: string
  ): Promise<ExtendedPoolInfo | null> {
    const cachedPool = cacheManager.getPool(poolAddress);
    if (cachedPool) {
      return cachedPool;
    }

    try {
      const [tokenInfoIn, tokenInfoOut] = await Promise.all([
        getTokenInfo(tokenIn.mint),
        getTokenInfo(tokenOut.mint),
      ]);

      const poolInfo: ExtendedPoolInfo = {
        poolId: poolAddress,
        tokens: [
          this.buildTokenInfo(tokenInfoIn, tokenIn),
          this.buildTokenInfo(tokenInfoOut, tokenOut),
        ],
        factory: dexProgramInfo?.address || "",
        protocol: dexProgramInfo?.protocol || "",
        poolType: dexProgramInfo?.type || "",
      };

      cacheManager.setPool(poolAddress, poolInfo);
      return poolInfo;
    } catch (error) {
      console.error(
        `Tx ${txSignature} error getting Solana pool info for ${poolAddress}:`,
        error
      );
      return null;
    }
  }
}
