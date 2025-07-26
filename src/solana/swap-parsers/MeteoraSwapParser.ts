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
    innerTokenAccounts: any[],
    instructionIndex: number,
    dexType?: string
  ): StandardSwapEvent | null {
    switch (dexType) {
      case "DLMM":
        return this.parseDLMMSwap(
          instructionData,
          accounts,
          innerTokenAccounts,
          instructionIndex
        );
      case "DAMM":
        return this.parseDAMMSwap(
          instructionData,
          accounts,
          innerTokenAccounts,
          instructionIndex,
          "DAMM"
        );
      case "DAMM_V2":
        return this.parseDAMMSwap(
          instructionData,
          accounts,
          innerTokenAccounts,
          instructionIndex,
          "DAMM_V2"
        );
      case "DBC":
        return this.parseDBCSwap(
          instructionData,
          accounts,
          innerTokenAccounts,
          instructionIndex
        );
      default:
        return null;
    }
  }
  private parseDLMMSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number
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

      const inputVaultIndex =
        innerTokenAccounts.find((a) => a.addr === accounts[4].toBase58())
          ?.mint ===
        innerTokenAccounts.find((a) => a.addr === accounts[2].toBase58())?.mint
          ? 2
          : 3;
      const outputVaultIndex = inputVaultIndex === 2 ? 3 : 2;

      const {
        poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        inputVault,
        outputVault,
      } = extractAccountInfo(accounts, [
        0,
        4,
        5,
        inputVaultIndex,
        outputVaultIndex,
      ]);

      return buildSwapEvent(
        poolAddress,
        "METEORA_DLMM_" + type,
        inputVault,
        outputVault,
        inputTokenAccount,
        outputTokenAccount,
        innerTokenAccounts,
        instructionIndex
      );
    } catch (error) {
      console.error("Error parsing Meteora DLMM swap:", error);
      return null;
    }
  }

  private parseDAMMSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number,
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

      const inputVaultIndex =
        innerTokenAccounts.find(
          (a) => a.addr === accounts[candidateIndices[1]!].toBase58()
        )?.mint ===
        innerTokenAccounts.find(
          (a) => a.addr === accounts[candidateIndices[3]!].toBase58()
        )?.mint
          ? candidateIndices[3]!
          : candidateIndices[4]!;
      const outputVaultIndex =
        inputVaultIndex === candidateIndices[3]!
          ? candidateIndices[4]!
          : candidateIndices[3]!;
      const {
        poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        inputVault,
        outputVault,
      } = extractAccountInfo(accounts, [
        candidateIndices[0]!,
        candidateIndices[1]!,
        candidateIndices[2]!,
        inputVaultIndex,
        outputVaultIndex,
      ]);

      return buildSwapEvent(
        poolAddress,
        "METEORA_" + dexType + "_SWAP",
        inputVault,
        outputVault,
        inputTokenAccount,
        outputTokenAccount,
        innerTokenAccounts,
        instructionIndex
      );
    } catch (error) {
      console.error("Error parsing Meteora DAMM swap:", error);
      return null;
    }
  }

  private parseDBCSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number
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
      inputVault,
      outputVault,
    } = extractAccountInfo(accounts, [2, 3, 4, 6, 5]);
    return buildSwapEvent(
      poolAddress,
      "METEORA_DBC_SWAP",
      inputVault,
      outputVault,
      inputTokenAccount,
      outputTokenAccount,
      innerTokenAccounts,
      instructionIndex
    );
  }
}
