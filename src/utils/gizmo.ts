import type { AccountInfo } from "@solana/web3.js";
import { SPL_TOKEN_PROGRAM_ID } from "../common/constants";

/**
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
