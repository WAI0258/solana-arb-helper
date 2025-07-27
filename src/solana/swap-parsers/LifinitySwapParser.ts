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
    innerTokenAccounts: any[],
    instructionIndex: number,
    dexType?: string
  ): StandardSwapEvent | null {
    switch (dexType) {
      case "MMaaS":
        return this.parseAMMSwap(
          instructionData,
          accounts,
          innerTokenAccounts,
          instructionIndex,
          true
        );
      case "MMaaS_V2":
        return this.parseAMMSwap(
          instructionData,
          accounts,
          innerTokenAccounts,
          instructionIndex,
          false
        );
      default:
        return null;
    }
  }

  private parseAMMSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number,
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
        inputVault,
        outputVault,
      } = extractAccountInfo(accounts, [1, 5, 6, 3, 4]);
      return buildSwapEvent(
        poolAddress,
        type,
        inputTokenAccount,
        outputTokenAccount,
        inputVault,
        outputVault,
        innerTokenAccounts,
        instructionIndex
      );
    } catch (error) {
      console.error("Error parsing Lifinity swap:", error);
      return null;
    }
  }
}
