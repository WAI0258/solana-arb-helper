import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import type { TokenBalanceChange } from "../../common/types";

export interface AccountInfo {
  accountKey: any;
  source: string;
  originalIndex: number;
}

export interface AccountSourceInfo {
  source: "accountKeys" | "staticAccountKeys" | "loadedAddresses" | "unknown";
  description: string;
}

export class AccountProcessor {
  /**
   * get all account keys from a transaction
   *
   * different APIs for data retrieval have different data structures
   *
   * ParsedTx: tx.transaction.message.accountKeys + tx.meta.loadedAddresses
   * OriginalTx: tx.transaction.message.staticAccountKeys + tx.meta.loadedAddresses.writable + tx.meta.loadedAddresses.readonly
   */
  public getAllAccountKeys(tx: ParsedTransactionWithMeta): any[] {
    const allAccountKeys: any[] = [];

    if (
      tx.transaction.message.accountKeys &&
      tx.transaction.message.accountKeys.length > 0
    ) {
      allAccountKeys.push(...tx.transaction.message.accountKeys);
    } else {
      const staticAccountKeys = (tx.transaction.message as any)
        .staticAccountKeys;
      if (staticAccountKeys && staticAccountKeys.length > 0) {
        allAccountKeys.push(...staticAccountKeys);
      }
      const loadedAddresses = tx.meta?.loadedAddresses;
      if (loadedAddresses) {
        if (loadedAddresses.writable && loadedAddresses.writable.length > 0) {
          allAccountKeys.push(...loadedAddresses.writable);
        }
        if (loadedAddresses.readonly && loadedAddresses.readonly.length > 0) {
          allAccountKeys.push(...loadedAddresses.readonly);
        }
      }
    }

    return allAccountKeys;
  }

  /**
   * get account info
   */
  public getAccountInfo(
    tx: ParsedTransactionWithMeta,
    index: number
  ): AccountInfo | null {
    // check accountKeys (ParsedTx)
    if (
      tx.transaction.message.accountKeys &&
      index < tx.transaction.message.accountKeys.length
    ) {
      return {
        accountKey: tx.transaction.message.accountKeys[index],
        source: "accountKeys",
        originalIndex: index,
      };
    }

    // check staticAccountKeys (OriginalTx)
    const staticAccountKeys = (tx.transaction.message as any).staticAccountKeys;
    if (staticAccountKeys && index < staticAccountKeys.length) {
      return {
        accountKey: staticAccountKeys[index],
        source: "staticAccountKeys",
        originalIndex: index,
      };
    }

    // check loadedAddresses
    const loadedAddresses = tx.meta?.loadedAddresses;
    if (loadedAddresses) {
      const baseCount =
        tx.transaction.message.accountKeys?.length ||
        (tx.transaction.message as any).staticAccountKeys?.length ||
        0;
      const writableCount = loadedAddresses.writable
        ? loadedAddresses.writable.length
        : 0;

      if (index >= baseCount && index < baseCount + writableCount) {
        const writableIndex = index - baseCount;
        return {
          accountKey: loadedAddresses.writable[writableIndex],
          source: "loadedAddresses.writable",
          originalIndex: writableIndex,
        };
      }

      if (loadedAddresses.readonly && loadedAddresses.readonly.length > 0) {
        const readonlyCount = loadedAddresses.readonly.length;
        if (
          index >= baseCount + writableCount &&
          index < baseCount + writableCount + readonlyCount
        ) {
          const readonlyIndex = index - baseCount - writableCount;
          return {
            accountKey: loadedAddresses.readonly[readonlyIndex],
            source: "loadedAddresses.readonly",
            originalIndex: readonlyIndex,
          };
        }
      }
    }

    return null;
  }

  /**
   * get account key by index
   */
  public getAccountKeyByIndex(
    tx: ParsedTransactionWithMeta,
    index: number
  ): any | null {
    const accountInfo = this.getAccountInfo(tx, index);
    if (accountInfo) {
      return accountInfo.accountKey;
    }

    const accountKeys = this.getAllAccountKeys(tx);
    if (index >= 0 && index < accountKeys.length) {
      return accountKeys[index];
    }

    return null;
  }

  /**
   * get account address string
   */
  public getAccountAddress(accountKey: any): string {
    if (accountKey.pubkey && accountKey.pubkey.toBase58) {
      return accountKey.pubkey.toBase58();
    } else if (accountKey.toBase58) {
      return accountKey.toBase58();
    } else {
      throw new Error("Unknown accountKey format");
    }
  }

  /**
   * get token accounts with balance changes
   */
  public getTokenAccountsWithBalanceChanges(
    tx: ParsedTransactionWithMeta
  ): TokenBalanceChange[] {
    const tokenAccounts: TokenBalanceChange[] = [];
    const preMap = new Map(
      (tx.meta?.preTokenBalances || []).map((b) => [b.accountIndex, b])
    );
    const postMap = new Map(
      (tx.meta?.postTokenBalances || []).map((b) => [b.accountIndex, b])
    );

    const allAccountIndexes = new Set([...preMap.keys(), ...postMap.keys()]);

    for (const accountIndex of allAccountIndexes) {
      const preBalance = preMap.get(accountIndex);
      const postBalance = postMap.get(accountIndex);
      const accountKey = this.getAccountKeyByIndex(tx, accountIndex);

      if (!accountKey) continue;

      let change = BigInt(0);
      let balance = preBalance || postBalance;

      if (!balance) continue;

      if (preBalance && postBalance) {
        change =
          BigInt(postBalance.uiTokenAmount.amount) -
          BigInt(preBalance.uiTokenAmount.amount);
      } else if (preBalance) {
        change = -BigInt(preBalance.uiTokenAmount.amount);
      } else if (postBalance) {
        change = BigInt(postBalance.uiTokenAmount.amount);
      }

      try {
        tokenAccounts.push({
          addr: this.getAccountAddress(accountKey),
          owner: balance.owner || "",
          mint: balance.mint,
          programId: balance.programId || "",
          decimals: balance.uiTokenAmount.decimals,
          amount: change,
        });
      } catch (error) {
        console.error(
          `Error processing account at index ${accountIndex}:`,
          error
        );
      }
    }

    return tokenAccounts;
  }
}
