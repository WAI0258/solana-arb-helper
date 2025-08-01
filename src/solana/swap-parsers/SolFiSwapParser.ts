import type { StandardSwapEvent } from "../../common/types";
import { buildSwapEvent, extractAccountInfo } from "./utility";

const SOLFI_DISCRIMINATOR = 7;
const ACCOUNT_INDICES = {
  a2b: [1, 4, 5, 2, 3], // A to B
  b2a: [1, 5, 4, 3, 2], // B to A
};

export class SolFiSwapParser {
  parseSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string,
    dexType?: string
  ): StandardSwapEvent | null {
    try {
      if (instructionData.readUInt8(0) !== SOLFI_DISCRIMINATOR) {
        return null;
      }

      const a2b = instructionData.readUInt8(instructionData.length - 1);
      const accountIndices =
        a2b === 1 ? ACCOUNT_INDICES.b2a : ACCOUNT_INDICES.a2b;

      const accountInfo = extractAccountInfo(accounts, accountIndices);

      return buildSwapEvent(
        accountInfo.poolAddress,
        "SOLFI_SWAP",
        accountInfo.intoVault,
        accountInfo.outofVault,
        accountInfo.inputTokenAccount,
        accountInfo.outputTokenAccount,
        changedTokenMetas,
        instructionType
      );
    } catch (error) {
      console.error("Error parsing SolFi swap:", error);
      return null;
    }
  }
}
