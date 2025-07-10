import type { StandardSwapEvent } from "../../common/types";
import {
  getAbsoluteAmount,
  isValidDiscriminator,
  extractAccountInfo,
  buildSwapEvent,
} from "./utility";

export class MeteoraSwapParser {
  parseSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number,
    dexType?: string
  ): StandardSwapEvent | null {
    switch (dexType) {
      case "DLMM":
        return this.parseDLMMSwap(
          instructionData,
          accounts,
          innerTokenAccounts,
          instructionIndex
        );
      default:
        return null;
    }
  }
  private parseDLMMSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      const discriminator = Array.from(instructionData.slice(0, 8));
      const expectedDiscriminator = {
        swap: [248, 198, 158, 145, 225, 117, 135, 200],
        swapExactOut: [250, 73, 101, 33, 38, 207, 75, 184],
      };

      let type = "";
      if (
        isValidDiscriminator(discriminator, expectedDiscriminator.swapExactOut)
      ) {
        type = "SWAP_EXACT_OUT";
      } else if (
        isValidDiscriminator(discriminator, expectedDiscriminator.swap)
      ) {
        type = "SWAP";
      } else {
        return null;
      }

      const {
        poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        inputVault,
        outputVault,
      } = extractAccountInfo(accounts, [0, 4, 5, 2, 3]);

      return buildSwapEvent(
        poolAddress,
        "METEORA_DLMM_" + type,
        inputVault,
        outputVault,
        inputTokenAccount,
        outputTokenAccount,
        innerTokenAccounts,
        instructionIndex
      );
    } catch (error) {
      console.error("Error parsing Meteora DLMM swap:", error);
      return null;
    }
  }
}
