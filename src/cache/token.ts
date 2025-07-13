import { globalCache } from ".";
import type { ExtendedToken } from "../common/types";

export class TokenCacheManager {
  static getToken(tokenAddress: string): ExtendedToken | null {
    return globalCache.getToken(tokenAddress);
  }

  static setToken(tokenAddress: string, tokenInfo: ExtendedToken): void {
    globalCache.setToken(tokenAddress, tokenInfo);
  }

  static hasToken(tokenAddress: string): boolean {
    return globalCache.getToken(tokenAddress) !== null;
  }

  static removeToken(tokenAddress: string): void {
    globalCache.removeToken(tokenAddress);
  }

  static clearAllTokens(): void {
    globalCache.clearTokenCache();
  }

  static getCacheSize(): number {
    return globalCache.getTokenCacheSize();
  }

  static getAllTokenAddresses(): string[] {
    const tokenCache = globalCache.getTokenCache();
    return Object.keys(tokenCache);
  }

  static setTokens(tokens: Record<string, ExtendedToken>): void {
    for (const [address, tokenInfo] of Object.entries(tokens)) {
      globalCache.setToken(address, tokenInfo);
    }
  }

  static getTokens(tokenAddresses: string[]): Record<string, ExtendedToken> {
    const result: Record<string, ExtendedToken> = {};

    for (const address of tokenAddresses) {
      const tokenInfo = globalCache.getToken(address);
      if (tokenInfo) {
        result[address] = tokenInfo;
      }
    }

    return result;
  }

  static findBySymbol(symbol: string): ExtendedToken | null {
    const tokenCache = globalCache.getTokenCache();
    const lowerSymbol = symbol.toLowerCase();

    for (const tokenInfo of Object.values(tokenCache)) {
      if (tokenInfo.symbol?.toLowerCase() === lowerSymbol) {
        return tokenInfo;
      }
    }

    return null;
  }

  static findByName(name: string): ExtendedToken | null {
    const tokenCache = globalCache.getTokenCache();
    const lowerName = name.toLowerCase();

    for (const tokenInfo of Object.values(tokenCache)) {
      if (tokenInfo.name?.toLowerCase().includes(lowerName)) {
        return tokenInfo;
      }
    }

    return null;
  }
}
