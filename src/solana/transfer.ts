import type {
  StandardTransferEvent,
  TokenBalanceChange,
} from "../common/types";

const TRANSFER_EVENT_TYPE = 3;
const TRANSFER_CHECKED_EVENT_TYPE = 12;

export class TransferParser {
  private createAccountMap(
    tokenChangedAccounts: TokenBalanceChange[]
  ): Map<string, TokenBalanceChange> {
    return new Map(
      tokenChangedAccounts.map((account) => [account.addr, account])
    );
  }
  private parseSingleTransfer(
    tokenMeta: any,
    accountMap: Map<string, TokenBalanceChange>
  ): StandardTransferEvent | null {
    try {
      const data = tokenMeta.data;
      const eventType = data.readUInt8(0);

      if (eventType === TRANSFER_CHECKED_EVENT_TYPE) {
        const amount = data.readBigUInt64LE(1);
        const decimals = data.readUInt8(data.length - 1);

        return {
          programId: tokenMeta.programId.toBase58(),
          authority: tokenMeta.accounts[3].toBase58(),
          source: tokenMeta.accounts[0].toBase58(),
          destination: tokenMeta.accounts[2].toBase58(),
          amount: amount,
          type: "transferChecked",
          decimals: decimals,
          mint: tokenMeta.accounts[1].toBase58(),
        };
      } else if (eventType === TRANSFER_EVENT_TYPE) {
        const amount = data.readBigUInt64LE(1);
        const sourceAddr = tokenMeta.accounts[0].toBase58();
        const destAddr = tokenMeta.accounts[1].toBase58();

        const sourceAccount = accountMap.get(sourceAddr);
        const destAccount = accountMap.get(destAddr);
        const account = sourceAccount || destAccount;

        return {
          programId: tokenMeta.programId.toBase58(),
          authority: tokenMeta.accounts[2].toBase58(),
          source: sourceAddr,
          destination: destAddr,
          amount: amount,
          type: "transfer",
          decimals: account?.decimals || 0,
          mint: account?.mint || "",
        };
      }

      return null;
    } catch (error) {
      console.warn("Failed to parse single transfer event:", error);
      return null;
    }
  }

  public parseTransferEvent(
    instructions: any[],
    tokenChangedAccounts: TokenBalanceChange[]
  ): StandardTransferEvent[] {
    try {
      if (instructions.length === 0) {
        return [];
      }

      const accountMap = this.createAccountMap(tokenChangedAccounts);
      const transferEvents: StandardTransferEvent[] = [];

      for (const tokenMeta of instructions) {
        const event = this.parseSingleTransfer(tokenMeta, accountMap);
        if (event) {
          transferEvents.push(event);
        }
      }

      return transferEvents;
    } catch (error) {
      console.error("Error parsing transfer event:", error);
      return [];
    }
  }
}
