import path from "path";
import fs from "fs";
import type { ExtendedPoolInfo, ExtendedToken } from "../common/types";

const CACHE_CONFIG = {
  POOL_CACHE_FILE: path.join(process.cwd(), "data/solana_pool_cache.json"),
  TOKEN_CACHE_FILE: path.join(process.cwd(), "data/solana_token_cache.json"),
} as const;

class CacheManager {
  private poolCache: Record<string, ExtendedPoolInfo> = {};
  private tokenCache: Record<string, ExtendedToken> = {};

  constructor() {
    this.loadCache();
  }

  private loadCache() {
    try {
      if (fs.existsSync(CACHE_CONFIG.POOL_CACHE_FILE)) {
        const data = fs.readFileSync(CACHE_CONFIG.POOL_CACHE_FILE, "utf-8");
        this.poolCache = JSON.parse(data);
      }
    } catch (error) {
      console.error("Error loading pool cache:", error);
    }

    try {
      if (fs.existsSync(CACHE_CONFIG.TOKEN_CACHE_FILE)) {
        const data = fs.readFileSync(CACHE_CONFIG.TOKEN_CACHE_FILE, "utf-8");
        this.tokenCache = JSON.parse(data);
      }
    } catch (error) {
      console.error("Error loading token cache:", error);
    }
  }

  private saveCache() {
    try {
      const dataDir = path.dirname(CACHE_CONFIG.POOL_CACHE_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      fs.writeFileSync(
        CACHE_CONFIG.POOL_CACHE_FILE,
        JSON.stringify(this.poolCache, null, 2)
      );

      fs.writeFileSync(
        CACHE_CONFIG.TOKEN_CACHE_FILE,
        JSON.stringify(this.tokenCache, null, 2)
      );

      // console.log(
      //   `Cache saved: ${Object.keys(this.poolCache).length} pools, ${
      //     Object.keys(this.tokenCache).length
      //   } tokens`
      // );
    } catch (error) {
      console.error("Error saving cache:", error);
    }
  }

  // Pool cache methods
  setPool(key: string, data: ExtendedPoolInfo) {
    const lowerKey = key.toLowerCase();
    if (!this.poolCache[lowerKey]) {
      this.poolCache[lowerKey] = data;
      this.saveCache();
    }
  }

  getPool(key: string): ExtendedPoolInfo | null {
    return this.poolCache[key.toLowerCase()] || null;
  }

  hasPool(key: string): boolean {
    return this.poolCache[key.toLowerCase()] !== undefined;
  }

  removePool(key: string): void {
    const lowerKey = key.toLowerCase();
    if (this.poolCache[lowerKey]) {
      delete this.poolCache[lowerKey];
      this.saveCache();
    }
  }

  clearPoolCache() {
    this.poolCache = {};
    this.saveCache();
  }

  getPoolCache(): Record<string, ExtendedPoolInfo> {
    return this.poolCache;
  }

  getPoolCacheSize(): number {
    return Object.keys(this.poolCache).length;
  }

  // Token cache methods
  setToken(key: string, data: ExtendedToken) {
    const lowerKey = key.toLowerCase();
    if (!this.tokenCache[lowerKey]) {
      this.tokenCache[lowerKey] = data;
      this.saveCache();
    }
  }

  getToken(key: string): ExtendedToken | null {
    return this.tokenCache[key.toLowerCase()] || null;
  }

  hasToken(key: string): boolean {
    return this.tokenCache[key.toLowerCase()] !== undefined;
  }

  removeToken(key: string): void {
    const lowerKey = key.toLowerCase();
    if (this.tokenCache[lowerKey]) {
      delete this.tokenCache[lowerKey];
      this.saveCache();
    }
  }

  clearTokenCache() {
    this.tokenCache = {};
    this.saveCache();
  }

  getTokenCache(): Record<string, ExtendedToken> {
    return this.tokenCache;
  }

  getTokenCacheSize(): number {
    return Object.keys(this.tokenCache).length;
  }

  // Utility methods
  findBySymbol(symbol: string): ExtendedToken | null {
    const lowerSymbol = symbol.toLowerCase();
    for (const tokenInfo of Object.values(this.tokenCache)) {
      if (tokenInfo.symbol?.toLowerCase() === lowerSymbol) {
        return tokenInfo;
      }
    }
    return null;
  }

  findByName(name: string): ExtendedToken | null {
    const lowerName = name.toLowerCase();
    for (const tokenInfo of Object.values(this.tokenCache)) {
      if (tokenInfo.name?.toLowerCase().includes(lowerName)) {
        return tokenInfo;
      }
    }
    return null;
  }
}

export const cacheManager = new CacheManager();
export { CACHE_CONFIG };
