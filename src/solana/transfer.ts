import type { StandardTransferEvent } from "../common/types";

const TRANSFER_EVENT_TYPE = 3;
const TRANSFER_CHECKED_EVENT_TYPE = 12;
export class TransferParser {
  public parseTransferEvent(
    instructions: any[],
    tokenChangedAccounts: any[]
  ): StandardTransferEvent[] {
    try {
      if (instructions.length === 0) {
        return [];
      }

      const transferEvents: StandardTransferEvent[] = [];

      instructions.forEach((tokenMeta) => {
        const data = tokenMeta.data;
        const eventType = data.readUInt8(0);
        if (eventType === TRANSFER_CHECKED_EVENT_TYPE) {
          const amount = data.readBigUInt64LE(1);
          const decimals = data.readUInt8(data.length - 1);
          transferEvents.push({
            programId: tokenMeta.programId.toBase58(),
            authority: tokenMeta.accounts[3].toBase58(),
            source: tokenMeta.accounts[0].toBase58(),
            destination: tokenMeta.accounts[2].toBase58(),
            amount: amount,
            type: "transferChecked",
            decimals: decimals,
            mint: tokenMeta.accounts[1].toBase58(),
          });
        } else if (eventType === TRANSFER_EVENT_TYPE) {
          const amount = data.readBigUInt64LE(1);
          transferEvents.push({
            programId: tokenMeta.programId.toBase58(),
            authority: tokenMeta.accounts[2].toBase58(),
            source: tokenMeta.accounts[0].toBase58(),
            destination: tokenMeta.accounts[1].toBase58(),
            amount: amount,
            type: "transfer",
            decimals: tokenChangedAccounts.find(
              (account) =>
                account.addr === tokenMeta.accounts[0].toBase58() ||
                account.addr === tokenMeta.accounts[1].toBase58()
            )?.decimals,
            mint: tokenChangedAccounts.find(
              (account) =>
                account.addr === tokenMeta.accounts[0].toBase58() ||
                account.addr === tokenMeta.accounts[1].toBase58()
            )?.mint,
          });
        }
      });

      return transferEvents;
    } catch (error) {
      console.error("Error parsing transfer event:", error);
      return [];
    }
  }
}
