import type { StandardSwapEvent } from "../../common/types";
import {
  isValidDiscriminator,
  extractAccountInfo,
  buildSwapEvent,
} from "./utility";

const DLMM_DISCRIMINATORS = {
  swap: [248, 198, 158, 145, 225, 117, 135, 200],
  swapExactOut: [250, 73, 101, 33, 38, 207, 75, 184],
  swap2: [65, 75, 63, 76, 235, 91, 91, 136],
  swapExactOut2: [43, 215, 247, 132, 137, 60, 243, 81],
};

const DAMM_DISCRIMINATOR = [248, 198, 158, 145, 225, 117, 135, 200];
const DBC_DISCRIMINATOR = [248, 198, 158, 145, 225, 117, 135, 200];

const ACCOUNT_INDICES = {
  damm: [0, 1, 2, 5, 6],
  damm_v2: [1, 2, 3, 4, 5],
  dbc: [2, 3, 4, 6, 5],
};

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

      let protocol: string;
      if (
        isValidDiscriminator(discriminator, DLMM_DISCRIMINATORS.swapExactOut)
      ) {
        protocol = "SWAP_EXACT_OUT";
      } else if (
        isValidDiscriminator(discriminator, DLMM_DISCRIMINATORS.swap)
      ) {
        protocol = "SWAP";
      } else if (
        isValidDiscriminator(discriminator, DLMM_DISCRIMINATORS.swapExactOut2)
      ) {
        protocol = "SWAP_EXACT_OUT_2";
      } else if (
        isValidDiscriminator(discriminator, DLMM_DISCRIMINATORS.swap2)
      ) {
        protocol = "SWAP_2";
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

      const accountInfo = extractAccountInfo(accounts, [
        0,
        4,
        5,
        intoVaultIndex,
        outofVaultIndex,
      ]);

      return buildSwapEvent(
        accountInfo.poolAddress,
        "METEORA_DLMM_" + protocol,
        accountInfo.intoVault,
        accountInfo.outofVault,
        accountInfo.inputTokenAccount,
        accountInfo.outputTokenAccount,
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
      if (!isValidDiscriminator(discriminator, DAMM_DISCRIMINATOR)) {
        return null;
      }

      const candidateIndices =
        dexType === "DAMM_V2" ? ACCOUNT_INDICES.damm_v2 : ACCOUNT_INDICES.damm;

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

      const accountInfo = extractAccountInfo(accounts, [
        candidateIndices[0]!,
        candidateIndices[1]!,
        candidateIndices[2]!,
        intoVaultIndex,
        outofVaultIndex,
      ]);

      return buildSwapEvent(
        accountInfo.poolAddress,
        "METEORA_" + dexType + "_SWAP",
        accountInfo.intoVault,
        accountInfo.outofVault,
        accountInfo.inputTokenAccount,
        accountInfo.outputTokenAccount,
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
    try {
      const discriminator = Array.from(instructionData.slice(0, 8));
      if (!isValidDiscriminator(discriminator, DBC_DISCRIMINATOR)) {
        return null;
      }

      const accountInfo = extractAccountInfo(accounts, ACCOUNT_INDICES.dbc);

      return buildSwapEvent(
        accountInfo.poolAddress,
        "METEORA_DBC_SWAP",
        accountInfo.intoVault,
        accountInfo.outofVault,
        accountInfo.inputTokenAccount,
        accountInfo.outputTokenAccount,
        changedTokenMetas,
        instructionType
      );
    } catch (error) {
      console.error("Error parsing Meteora DBC swap:", error);
      return null;
    }
  }
}
