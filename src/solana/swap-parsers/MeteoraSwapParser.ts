import type { StandardSwapEvent } from "../../common/types";
import {
  isValidDiscriminator,
  extractAccountInfo,
  buildSwapEvent,
} from "./utility";

export class MeteoraSwapParser {
  parseSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string,
    dexType?: string
  ): StandardSwapEvent | null {
    switch (dexType) {
      case "DLMM":
        return this.parseDLMMSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType
        );
      case "DAMM":
        return this.parseDAMMSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType,
          "DAMM"
        );
      case "DAMM_V2":
        return this.parseDAMMSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType,
          "DAMM_V2"
        );
      case "DBC":
        return this.parseDBCSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType
        );
      default:
        return null;
    }
  }
  private parseDLMMSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string
  ): StandardSwapEvent | null {
    try {
      const discriminator = Array.from(instructionData.slice(0, 8));
      const expectedDiscriminator = {
        swap: [248, 198, 158, 145, 225, 117, 135, 200],
        swapExactOut: [250, 73, 101, 33, 38, 207, 75, 184],
        swap2: [65, 75, 63, 76, 235, 91, 91, 136],
        swapExactOut2: [43, 215, 247, 132, 137, 60, 243, 81],
      };

      let type = "";
      if (
        isValidDiscriminator(discriminator, expectedDiscriminator.swapExactOut)
      ) {
        type = "SWAP_EXACT_OUT";
      } else if (
        isValidDiscriminator(discriminator, expectedDiscriminator.swap)
      ) {
        type = "SWAP";
      } else if (
        isValidDiscriminator(discriminator, expectedDiscriminator.swapExactOut2)
      ) {
        type = "SWAP_EXACT_OUT_2";
      } else if (
        isValidDiscriminator(discriminator, expectedDiscriminator.swap2)
      ) {
        type = "SWAP_2";
      } else {
        return null;
      }

      const intoVaultIndex =
        changedTokenMetas.find((a) => a.addr === accounts[4].toBase58())
          ?.mint ===
        changedTokenMetas.find((a) => a.addr === accounts[2].toBase58())?.mint
          ? 2
          : 3;
      const outofVaultIndex = intoVaultIndex === 2 ? 3 : 2;

      const {
        poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        intoVault,
        outofVault,
      } = extractAccountInfo(accounts, [
        0,
        4,
        5,
        intoVaultIndex,
        outofVaultIndex,
      ]);

      return buildSwapEvent(
        poolAddress,
        "METEORA_DLMM_" + type,
        intoVault,
        outofVault,
        inputTokenAccount,
        outputTokenAccount,
        changedTokenMetas,
        instructionType
      );
    } catch (error) {
      console.error("Error parsing Meteora DLMM swap:", error);
      return null;
    }
  }

  private parseDAMMSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string,
    dexType: string
  ): StandardSwapEvent | null {
    try {
      const discriminator = Array.from(instructionData.slice(0, 8));
      const expectedDiscriminator = [248, 198, 158, 145, 225, 117, 135, 200];
      if (!isValidDiscriminator(discriminator, expectedDiscriminator)) {
        return null;
      }
      let candidateIndices = [0, 1, 2, 5, 6];
      if (dexType === "DAMM_V2") {
        candidateIndices = [1, 2, 3, 4, 5];
      }

      const intoVaultIndex =
        changedTokenMetas.find(
          (a) => a.addr === accounts[candidateIndices[1]!].toBase58()
        )?.mint ===
        changedTokenMetas.find(
          (a) => a.addr === accounts[candidateIndices[3]!].toBase58()
        )?.mint
          ? candidateIndices[3]!
          : candidateIndices[4]!;
      const outofVaultIndex =
        intoVaultIndex === candidateIndices[3]!
          ? candidateIndices[4]!
          : candidateIndices[3]!;
      const {
        poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        intoVault,
        outofVault,
      } = extractAccountInfo(accounts, [
        candidateIndices[0]!,
        candidateIndices[1]!,
        candidateIndices[2]!,
        intoVaultIndex,
        outofVaultIndex,
      ]);

      return buildSwapEvent(
        poolAddress,
        "METEORA_" + dexType + "_SWAP",
        intoVault,
        outofVault,
        inputTokenAccount,
        outputTokenAccount,
        changedTokenMetas,
        instructionType
      );
    } catch (error) {
      console.error("Error parsing Meteora DAMM swap:", error);
      return null;
    }
  }

  private parseDBCSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string
  ): StandardSwapEvent | null {
    const discriminator = Array.from(instructionData.slice(0, 8));
    const expectedDiscriminator = [248, 198, 158, 145, 225, 117, 135, 200];
    if (!isValidDiscriminator(discriminator, expectedDiscriminator)) {
      return null;
    }
    const {
      poolAddress,
      inputTokenAccount,
      outputTokenAccount,
      intoVault,
      outofVault,
    } = extractAccountInfo(accounts, [2, 3, 4, 6, 5]);
    return buildSwapEvent(
      poolAddress,
      "METEORA_DBC_SWAP",
      intoVault,
      outofVault,
      inputTokenAccount,
      outputTokenAccount,
      changedTokenMetas,
      instructionType
    );
  }
}
