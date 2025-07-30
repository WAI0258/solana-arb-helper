// https://github.com/openbook-dex
import type { StandardSwapEvent } from "../../common/types";
import {
  isValidDiscriminator,
  extractAccountInfo,
  buildSwapEvent,
} from "./utility";

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
      const expectedDiscriminator = [3, 44, 71, 3, 26, 199, 203, 85];
      if (!isValidDiscriminator(discriminator, expectedDiscriminator)) {
        return null;
      }
      const a2b = instructionData.readUInt8(8); // 0：bid->b2a, 1:ask->a2b
      let type =
        a2b === 0
          ? "OPENBOOK_V2_PLACE_TAKE_ORDER_BID"
          : "OPENBOOK_V2_PLACE_TAKE_ORDER_ASK";
      let accountIndexs = [2, 10, 9, 7, 6]; // b to a
      if (a2b === 1) {
        // 1: a to b
        accountIndexs = [2, 9, 10, 6, 7];
      }
      const {
        poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        intoVault,
        outofVault,
      } = extractAccountInfo(accounts, accountIndexs);
      return buildSwapEvent(
        poolAddress,
        type,
        intoVault,
        outofVault,
        inputTokenAccount,
        outputTokenAccount,
        changedTokenMetas,
        instructionType
      );
    } catch (error) {
      console.error("Error parsing OpenBook v2 swap:", error);
      return null;
    }
  }
}
