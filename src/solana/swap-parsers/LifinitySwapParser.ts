import type { StandardSwapEvent } from "../../common/types";
import {
  buildSwapEvent,
  extractAccountInfo,
  isValidDiscriminator,
} from "./utility";

const LIFINITY_DISCRIMINATOR = [248, 198, 158, 145, 225, 117, 135, 200];
const ACCOUNT_INDICES = [1, 3, 4, 5, 6];

export class LifinitySwapParser {
  parseSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string,
    dexType?: string
  ): StandardSwapEvent | null {
    switch (dexType) {
      case "MMaaS":
        return this.parseAMMSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType,
          true
        );
      case "MMaaS_V2":
        return this.parseAMMSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType,
          false
        );
      default:
        return null;
    }
  }

  private parseAMMSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string,
    isV1: boolean
  ): StandardSwapEvent | null {
    try {
      const discriminator = Array.from(instructionData.slice(0, 8));
      if (!isValidDiscriminator(discriminator, LIFINITY_DISCRIMINATOR)) {
        return null;
      }

      const protocol = isV1 ? "Lifinity_AMM_SWAP_V1" : "Lifinity_AMM_SWAP_V2";
      const accountInfo = extractAccountInfo(accounts, ACCOUNT_INDICES);

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
      console.error("Error parsing Lifinity swap:", error);
      return null;
    }
  }
}
