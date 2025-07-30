import type { StandardSwapEvent } from "../../common/types";
import { buildSwapEvent, extractAccountInfo } from "./utility";

export class SolFiSwapParser {
  parseSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string
  ): StandardSwapEvent | null {
    try {
      const discriminator = instructionData.readUInt8(0);
      const a2b = instructionData.readUInt8(instructionData.length - 1);
      if (discriminator !== 7) {
        return null;
      }
      let accountIndexs = [1, 2, 3, 4, 5];
      if (a2b === 1) {
        // 1: B to A
        accountIndexs = [1, 3, 2, 5, 4];
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
        inputTokenAccount,
        outputTokenAccount,
        intoVault,
        outofVault,
        changedTokenMetas,
        instructionType
      );
    } catch (error) {
      console.error("Error parsing SolFi swap:", error);
      return null;
    }
  }
}
