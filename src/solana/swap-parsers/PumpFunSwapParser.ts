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
    changedTokenMetas: any[],
    instructionType: string,
    dexType?: string
  ): StandardSwapEvent | null {
    switch (dexType) {
      case "AMM":
        return this.parseAMMSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType
        );
      case "PumpFun":
        return this.parsePumpFunSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType
        );
      default:
        return null;
    }
  }

  private parseAMMSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string
  ): StandardSwapEvent | null {
    try {
      const discriminator = Array.from(instructionData.slice(0, 8));
      const expectedDiscriminator = {
        buy: [102, 6, 61, 18, 1, 218, 235, 234],
        sell: [51, 230, 133, 164, 1, 127, 131, 173],
      };

      let type = "";
      let accountIndexs = [0, 5, 6, 7, 8];
      if (isValidDiscriminator(discriminator, expectedDiscriminator.buy)) {
        type = "PumpFun_AMM_BUY";
        accountIndexs = [0, 6, 5, 8, 7];
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
      console.error("Error parsing PumpFun swap:", error);
      return null;
    }
  }

  private parsePumpFunSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string
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
        intoVault,
        outofVault,
      } = extractAccountInfo(accounts, [0, 5, 6, 7, 8]);
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
      console.error("Error parsing PumpFun swap:", error);
      return null;
    }
  }
}
