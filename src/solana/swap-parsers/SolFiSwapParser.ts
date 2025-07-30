import type { StandardSwapEvent } from "../../common/types";
import { buildSwapEvent, extractAccountInfo } from "./utility";

export class SolFiSwapParser {
  parseSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string,
    dexType?: string
  ): StandardSwapEvent | null {
    try {
      const discriminator = instructionData.readUInt8(0);
      const a2b = instructionData.readUInt8(instructionData.length - 1);
      if (discriminator !== 7) {
        return null;
      }
      let accountIndexs = [1, 4, 5, 2, 3];
      if (a2b === 1) {
        // 1: B to A
        accountIndexs = [1, 5, 4, 3, 2];
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
        "SOLFI_SWAP",
        intoVault,
        outofVault,
        inputTokenAccount,
        outputTokenAccount,
        changedTokenMetas,
        instructionType
      );
    } catch (error) {
      console.error("Error parsing SolFi swap:", error);
      return null;
    }
  }
}
