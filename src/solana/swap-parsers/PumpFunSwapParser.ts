/**
 * decode with https://github.com/pump-fun/pump-public-docs/blob/main/idl
 */
import type { StandardSwapEvent } from "../../common/types";
import {
  isValidDiscriminator,
  extractAccountInfo,
  buildSwapEvent,
} from "./utility";

const PUMPFUN_DISCRIMINATORS = {
  buy: [102, 6, 61, 18, 1, 218, 235, 234],
  sell: [51, 230, 133, 164, 1, 127, 131, 173],
};

const ACCOUNT_INDICES = {
  buy: [0, 6, 5, 8, 7],
  sell: [0, 5, 6, 7, 8],
};

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

      let protocol: string;
      let accountIndices: number[];

      if (isValidDiscriminator(discriminator, PUMPFUN_DISCRIMINATORS.buy)) {
        protocol = "PumpFun_AMM_BUY";
        accountIndices = ACCOUNT_INDICES.buy;
      } else if (
        isValidDiscriminator(discriminator, PUMPFUN_DISCRIMINATORS.sell)
      ) {
        protocol = "PumpFun_AMM_SELL";
        accountIndices = ACCOUNT_INDICES.sell;
      } else {
        return null;
      }

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

      let protocol: string;
      let accountIndices: number[];

      if (isValidDiscriminator(discriminator, PUMPFUN_DISCRIMINATORS.buy)) {
        protocol = "PumpFun_SWAP_BUY";
        accountIndices = ACCOUNT_INDICES.buy;
      } else if (
        isValidDiscriminator(discriminator, PUMPFUN_DISCRIMINATORS.sell)
      ) {
        protocol = "PumpFun_SWAP_SELL";
        accountIndices = ACCOUNT_INDICES.sell;
      } else {
        return null;
      }

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
      console.error("Error parsing PumpFun swap:", error);
      return null;
    }
  }
}
