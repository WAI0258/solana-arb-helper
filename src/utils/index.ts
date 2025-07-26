import type { AccountInfo } from "@solana/web3.js";
import { TokenListProvider } from "@solana/spl-token-registry";
import { SPL_TOKEN_PROGRAM_ID } from "../common/constants";
import { cacheManager } from "../cache";
import type { ExtendedToken } from "../common/types";

/**
 * Get account type based on account info
 * @param accountInfo
 * @returns "mint" | "tokenAccount" | "other"
 */
export function getAccountType(
  accountInfo: AccountInfo<Buffer> | null
): "mint" | "tokenAccount" | "other" {
  if (!accountInfo) return "other";
  if (
    accountInfo.owner.toBase58() === SPL_TOKEN_PROGRAM_ID.TOKEN_PROGRAM ||
    accountInfo.owner.toBase58() === SPL_TOKEN_PROGRAM_ID.TOKEN_2022_PROGRAM
  ) {
    if (accountInfo.data.length === 82) return "mint";
    if (accountInfo.data.length === 165) return "tokenAccount";
  }
  return "other";
}

/**
 * Get token info from cache or token registry
 */
export const getTokenInfo = async (
  mintAddress: string
): Promise<ExtendedToken | null> => {
  const cachedToken = cacheManager.getToken(mintAddress);
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
    cacheManager.setToken(mintAddress, tokenInfo);
  }

  return tokenInfo;
};
