import { TokenListProvider } from "@solana/spl-token-registry";
import { TokenCacheManager } from "../cache/token";

export const getTokenInfo = async (mintAddress: string) => {
  const cachedToken = TokenCacheManager.getToken(mintAddress);
  if (cachedToken) {
    return cachedToken;
  }

  const tokens = await new TokenListProvider().resolve();
  const tokenMap = tokens.getList().reduce((map, token) => {
    map.set(token.address, token);
    return map;
  }, new Map());

  const tokenInfo = tokenMap.get(mintAddress);

  if (tokenInfo) {
    TokenCacheManager.setToken(mintAddress, tokenInfo);
  }

  return tokenInfo;
};
