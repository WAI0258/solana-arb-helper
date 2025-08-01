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

  private parseTransferChecked(tokenMeta: any): StandardTransferEvent {
    const amount = tokenMeta.data.readBigUInt64LE(1);
    const decimals = tokenMeta.data.readUInt8(tokenMeta.data.length - 1);

    return {
      programId: tokenMeta.programId.toBase58(),
      authority: tokenMeta.accounts[3].toBase58(),
      source: tokenMeta.accounts[0].toBase58(),
      destination: tokenMeta.accounts[2].toBase58(),
      amount,
      type: "transferChecked",
      decimals,
      mint: tokenMeta.accounts[1].toBase58(),
    };
  }

  private parseTransfer(
    tokenMeta: any,
    accountMap: Map<string, TokenBalanceChange>
  ): StandardTransferEvent {
    const amount = tokenMeta.data.readBigUInt64LE(1);
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
      amount,
      type: "transfer",
      decimals: account?.decimals || 0,
      mint: account?.mint || "",
    };
  }

  private parseSingleTransfer(
    tokenMeta: any,
    accountMap: Map<string, TokenBalanceChange>
  ): StandardTransferEvent | null {
    try {
      const eventType = tokenMeta.data.readUInt8(0);

      if (eventType === TRANSFER_CHECKED_EVENT_TYPE) {
        return this.parseTransferChecked(tokenMeta);
      } else if (eventType === TRANSFER_EVENT_TYPE) {
        return this.parseTransfer(tokenMeta, accountMap);
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
