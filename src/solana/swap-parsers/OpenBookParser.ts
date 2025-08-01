// https://github.com/openbook-dex
import type { StandardSwapEvent } from "../../common/types";
import {
  isValidDiscriminator,
  extractAccountInfo,
  buildSwapEvent,
} from "./utility";

const OPENBOOK_DISCRIMINATOR = [3, 44, 71, 3, 26, 199, 203, 85];
const ACCOUNT_INDICES = {
  bid: [2, 10, 9, 7, 6], // bid -> b2a
  ask: [2, 9, 10, 6, 7], // ask -> a2b
};

export class OpenBookParser {
  parseSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string,
    dexType?: string
  ): StandardSwapEvent | null {
    try {
      const discriminator = Array.from(instructionData.slice(0, 8));
      if (!isValidDiscriminator(discriminator, OPENBOOK_DISCRIMINATOR)) {
        return null;
      }

      const a2b = instructionData.readUInt8(8); // 0：bid->b2a, 1:ask->a2b
      const protocol =
        a2b === 0
          ? "OPENBOOK_V2_PLACE_TAKE_ORDER_BID"
          : "OPENBOOK_V2_PLACE_TAKE_ORDER_ASK";
      const accountIndices =
        a2b === 1 ? ACCOUNT_INDICES.ask : ACCOUNT_INDICES.bid;

      const accountInfo = extractAccountInfo(accounts, accountIndices);

      return buildSwapEvent(
        accountInfo.poolAddress,
        protocol,
        accountInfo.intoVault,
        accountInfo.outofVault,
        accountInfo.inputTokenAccount,
        accountInfo.outputTokenAccount,
        changedTokenMetas,
        instructionType
      );
    } catch (error) {
      console.error("Error parsing OpenBook v2 swap:", error);
      return null;
    }
  }
}
