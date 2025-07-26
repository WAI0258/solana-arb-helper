import type { ExtendedPoolInfo, TokenBalanceChange } from "../common/types";
import { getTokenInfo } from "../utils";
import { type DexProgram } from "@/common/dex";
import { cacheManager } from "../cache";

export class PoolManager {
  public async requestTxPoolInfo(
    dexProgramInfo: DexProgram | null,
    poolAddress: string,
    tokenIn: TokenBalanceChange,
    tokenOut: TokenBalanceChange,
    txSignature: string
  ): Promise<ExtendedPoolInfo | null> {
    const cachedPool = cacheManager.getPool(poolAddress);
    if (cachedPool) {
      return cachedPool;
    }

    try {
      const tokenInfoIn = await getTokenInfo(tokenIn.mint);
      const tokenInfoOut = await getTokenInfo(tokenOut.mint);
      const poolInfo: ExtendedPoolInfo = {
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
