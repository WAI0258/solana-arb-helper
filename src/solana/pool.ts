import { Connection, PublicKey } from "@solana/web3.js";
import {
  ALL_PROGRAM_ID,
  liquidityStateV4Layout,
  PoolInfoLayout,
  CpmmPoolInfoLayout,
  struct,
  publicKey,
  PoolFetchType,
  Raydium,
  Token,
} from "@raydium-io/raydium-sdk-v2";
import path from "path";
import fs from "fs";

import type { ExtendedPoolInfo, ExtendedToken } from "../common/types";

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

  /**
   * get all pool info
   * @param connection
   * @param poolProtocol
   * @param poolAddress
   * @returns
   */
  public async requestTxPoolInfo(
    connection: Connection,
    poolProtocol: string,
    poolAddress: string
  ): Promise<ExtendedPoolInfo | null> {
    const lowerAddress = poolAddress.toLowerCase();
    if (this.poolCache[lowerAddress]) {
      return this.poolCache[lowerAddress];
    }

    try {
      const accountInfo = await this.getPoolInfo(
        connection,
        poolProtocol,
        poolAddress
      );
      if (!accountInfo) {
        return null;
      }
      return accountInfo;
    } catch (error) {
      console.error(
        `Error getting Solana pool info for ${poolAddress}:`,
        error
      );
      return null;
    }
  }

  /**
   * get pool info from pool address
   * @param connection
   * @param poolProtocol
   * @param poolAddress
   * @returns
   */
  private async getPoolInfo(
    connection: Connection,
    poolProtocol: string,
    poolAddress: string
  ) {
    try {
      switch (poolProtocol) {
        case "RAYDIUM":
          return this.extractRaydiumPoolInfo(connection, poolAddress);
        default:
          return null;
      }
    } catch (error) {
      console.error(`Error getting pool info for ${poolAddress}:`, error);
      return null;
    }
  }
  private async extractRaydiumPoolInfo(
    connection: Connection,
    poolAddress: string
  ): Promise<ExtendedPoolInfo | null> {
    const raydium = await Raydium.load({ connection });
    const poolInfo = await raydium.api.fetchPoolById({
      ids: poolAddress,
    });
    if (!poolInfo[0]) {
      return null;
    }
    const tokens: ExtendedToken[] = [
      {
        address: poolInfo[0].mintA.address,
        decimals: poolInfo[0].mintA.decimals,
        name: poolInfo[0].mintA.name,
        symbol: poolInfo[0].mintA.symbol,
      },
      {
        address: poolInfo[0].mintB.address,
        decimals: poolInfo[0].mintB.decimals,
        name: poolInfo[0].mintB.name,
        symbol: poolInfo[0].mintB.symbol,
      },
    ];
    const parsedPoolInfo: ExtendedPoolInfo = {
      poolId: poolAddress,
      tokens,
      factory: poolInfo[0].programId,
      protocol: "RAYDIUM",
      poolType: poolInfo[0].type,
    };
    return parsedPoolInfo;
  }

  /**
   * extract tokens from pool data
   * @param protocol
   * @param poolAddress
   * @returns
   */
  private async extractPoolTokens(
    connection: Connection,
    protocol: string,
    poolAddress: string
  ): Promise<string[]> {
    try {
      switch (protocol) {
        case "ORCA":
          return this.extractOrcaV2Tokens(poolAddress);
        case "SERUM":
          return this.extractSerumV3Tokens(poolAddress);
        case "SABER":
          return this.extractSaberTokens(poolAddress);
        case "ALDRIN":
          return this.extractAldrinV2Tokens(poolAddress);
        case "MERCURIAL":
          return this.extractMercurialTokens(poolAddress);
        case "JUPITER":
          return this.extractJupiterTokens(poolAddress);
        default:
          return [];
      }
    } catch (error) {
      console.error(`Error extracting tokens for ${protocol}:`, error);
      return [];
    }
  }

  private extractOrcaV2Tokens(poolAddress: string): string[] {
    try {
      return [];
    } catch (error) {
      console.error("Error extracting Orca V2 tokens:", error);
    }
    return [];
  }

  private extractSerumV3Tokens(poolAddress: string): string[] {
    try {
      return [];
    } catch (error) {
      console.error("Error extracting Serum V3 tokens:", error);
    }
    return [];
  }

  private extractSaberTokens(poolAddress: string): string[] {
    try {
      return [];
    } catch (error) {
      console.error("Error extracting Saber tokens:", error);
    }
    return [];
  }

  private extractAldrinV2Tokens(poolAddress: string): string[] {
    try {
      return [];
    } catch (error) {
      console.error("Error extracting Aldrin V2 tokens:", error);
    }
    return [];
  }

  private extractMercurialTokens(poolAddress: string): string[] {
    try {
      return [];
    } catch (error) {
      console.error("Error extracting Mercurial tokens:", error);
    }
    return [];
  }

  private extractJupiterTokens(poolAddress: string): string[] {
    try {
      return [];
    } catch (error) {
      console.error("Error extracting Jupiter tokens:", error);
    }
    return [];
  }
}
