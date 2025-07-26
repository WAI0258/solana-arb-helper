import type { StandardSwapEvent } from "../../common/types";
import { extractAccountInfo, buildSwapEvent } from "./utility";

export class SolFiSwapParser {
  parseSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    const discriminator = instructionData.readUInt8(0);
    const aToB = instructionData.readUInt8(instructionData.length - 1);
    if (discriminator !== 7) {
      return null;
    }
    let accountIndexs = [1, 4, 5, 2, 3];
    if (aToB === 1) {
      // 1: B to A
      accountIndexs = [1, 5, 4, 3, 2];
    }
    const {
      poolAddress,
      inputTokenAccount,
      outputTokenAccount,
      inputVault,
      outputVault,
    } = extractAccountInfo(accounts, accountIndexs);
    return buildSwapEvent(
      "SOLFI_SWAP",
      poolAddress,
      inputTokenAccount,
      outputTokenAccount,
      inputVault,
      outputVault,
      innerTokenAccounts,
      instructionIndex
    );
  }
}
