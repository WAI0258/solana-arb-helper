/**
 * decode with https://github.com/rckprtr/pumpdotfun-sdk
 */
import type { StandardSwapEvent } from "../../common/types";
import {
  getAbsoluteAmount,
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
    return null;
  }
}
