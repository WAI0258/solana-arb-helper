/**
 * decode with https://github.com/pump-fun/pump-public-docs/blob/main/idl
 */
import type { StandardSwapEvent } from "../../common/types";
import {
  isValidDiscriminator,
  extractAccountInfo,
  buildSwapEvent,
} from "./utility";

export class PumpFunSwapParser {
  parseSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number,
    dexType?: string
  ): StandardSwapEvent | null {
    switch (dexType) {
      case "AMM":
        return this.parseAMMSwap(
          instructionData,
          accounts,
          innerTokenAccounts,
          instructionIndex
        );
      case "PumpFun":
        return this.parsePumpFunSwap(
          instructionData,
          accounts,
          innerTokenAccounts,
          instructionIndex
        );
      default:
        return null;
    }
  }

  private parseAMMSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      const discriminator = Array.from(instructionData.slice(0, 8));
      const expectedDiscriminator = {
        buy: [102, 6, 61, 18, 1, 218, 235, 234],
        sell: [51, 230, 133, 164, 1, 127, 131, 173],
      };

      let type = "";
      if (isValidDiscriminator(discriminator, expectedDiscriminator.buy)) {
        type = "PumpFun_AMM_BUY";
      } else if (
        isValidDiscriminator(discriminator, expectedDiscriminator.sell)
      ) {
        type = "PumpFun_AMM_SELL";
      } else {
        return null;
      }
      const {
        poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        inputVault,
        outputVault,
      } = extractAccountInfo(accounts, [0, 7, 8, 5, 6]);
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
      console.error("Error parsing PumpFun swap:", error);
      return null;
    }
  }

  private parsePumpFunSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      const discriminator = Array.from(instructionData.slice(0, 8));
      const expectedDiscriminator = {
        buy: [102, 6, 61, 18, 1, 218, 235, 234],
        sell: [51, 230, 133, 164, 1, 127, 131, 173],
      };

      let type = "";
      if (isValidDiscriminator(discriminator, expectedDiscriminator.buy)) {
        type = "PumpFun_BUY";
      } else if (
        isValidDiscriminator(discriminator, expectedDiscriminator.sell)
      ) {
        type = "PumpFun_SELL";
      }
      const {
        poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        inputVault,
        outputVault,
      } = extractAccountInfo(accounts, [0, 5, 6, 7, 8]);
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
      console.error("Error parsing PumpFun swap:", error);
      return null;
    }
  }
}
