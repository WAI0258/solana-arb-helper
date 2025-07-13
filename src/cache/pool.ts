import { globalCache } from ".";
import type { ExtendedPoolInfo } from "../common/types";

export class PoolCacheManager {
  static getPool(poolAddress: string): ExtendedPoolInfo | null {
    return globalCache.getPool(poolAddress);
  }

  static setPool(poolAddress: string, poolInfo: ExtendedPoolInfo): void {
    globalCache.setPool(poolAddress, poolInfo);
  }

  static hasPool(poolAddress: string): boolean {
    return globalCache.getPool(poolAddress) !== null;
  }

  static removePool(poolAddress: string): void {
    globalCache.removePool(poolAddress);
  }

  static clearAllPools(): void {
    globalCache.clearPoolCache();
  }

  static getCacheSize(): number {
    return globalCache.getPoolCacheSize();
  }

  static getAllPoolAddresses(): string[] {
    const poolCache = globalCache.getPoolCache();
    return Object.keys(poolCache);
  }

  static setPools(pools: Record<string, ExtendedPoolInfo>): void {
    for (const [address, poolInfo] of Object.entries(pools)) {
      globalCache.setPool(address, poolInfo);
    }
  }

  static getPools(poolAddresses: string[]): Record<string, ExtendedPoolInfo> {
    const result: Record<string, ExtendedPoolInfo> = {};

    for (const address of poolAddresses) {
      const poolInfo = globalCache.getPool(address);
      if (poolInfo) {
        result[address] = poolInfo;
      }
    }

    return result;
  }
}
