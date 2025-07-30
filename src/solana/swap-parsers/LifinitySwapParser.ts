import type { StandardSwapEvent } from "../../common/types";
import {
  buildSwapEvent,
  extractAccountInfo,
  isValidDiscriminator,
} from "./utility";

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
      const expectedDiscriminator = [248, 198, 158, 145, 225, 117, 135, 200];
      if (!isValidDiscriminator(discriminator, expectedDiscriminator)) {
        return null;
      }
      let type = "Lifinity_AMM_SWAP_V2";
      if (isV1) {
        type = "Lifinity_AMM_SWAP_V1";
      }
      const {
        poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        intoVault,
        outofVault,
      } = extractAccountInfo(accounts, [1, 3, 4, 5, 6]);
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
      console.error("Error parsing Lifinity swap:", error);
      return null;
    }
  }
}
