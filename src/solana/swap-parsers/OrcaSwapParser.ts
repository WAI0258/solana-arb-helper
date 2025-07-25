/*
  According to Solscan and https://docs.sqd.ai/solana-indexing/how-to-start/indexing-orca/
*/
import type { StandardSwapEvent } from "../../common/types";
import {
  buildSwapEvent,
  extractAccountInfo,
  isValidDiscriminator,
} from "./utility";

export class OrcaSwapParser {
  parseSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number,
    dexType?: string
  ): StandardSwapEvent | null {
    switch (dexType) {
      case "CPMM_V1":
        return this.parseCPMMSwap(
          instructionData,
          accounts,
          innerTokenAccounts,
          instructionIndex,
          true
        );
      case "CPMM_V2":
        return this.parseCPMMSwap(
          instructionData,
          accounts,
          innerTokenAccounts,
          instructionIndex,
          false
        );
      case "CLMM":
        return this.parseCLMMSwap(
          instructionData,
          accounts,
          innerTokenAccounts,
          instructionIndex
        );
      default:
        return null;
    }
  }

  private parseCPMMSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number,
    isV1: boolean
  ): StandardSwapEvent | null {
    try {
      const discriminator = instructionData.readUInt8(0);
      if (discriminator.toString() !== "1") {
        return null;
      }

      const {
        poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        inputVault,
        outputVault,
      } = extractAccountInfo(accounts, [0, 3, 6, 4, 5]);

      return buildSwapEvent(
        poolAddress,
        isV1 ? "ORCA_CPMM_V1_SWAP" : "ORCA_CPMM_V2_SWAP",
        inputVault,
        outputVault,
        inputTokenAccount,
        outputTokenAccount,
        innerTokenAccounts,
        instructionIndex
      );
    } catch (error) {
      console.error("Error parsing Orca CPMM V1 swap:", error);
      return null;
    }
  }

  private parseCLMMSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      const discriminator = Array.from(instructionData.slice(0, 8));
      const aToB = instructionData.readUInt8(instructionData.length - 1);
      const expectedDiscriminator = {
        swap: [248, 198, 158, 145, 225, 117, 135, 200],
        two_hop_swap: [195, 96, 237, 108, 68, 162, 219, 230],
      };

      let type = "";
      let accountToExtract = [2, 3, 5, 4, 6];
      if (
        isValidDiscriminator(discriminator, expectedDiscriminator.two_hop_swap)
      ) {
        type = "ORCA_CLMM_TWO_HOP_SWAP";
      } else if (
        isValidDiscriminator(discriminator, expectedDiscriminator.swap)
      ) {
        type = "ORCA_CLMM_SWAP";
        if (aToB === 1) {
          accountToExtract = [2, 3, 5, 4, 6];
        } else {
          accountToExtract = [2, 5, 3, 6, 4];
        }
      } else {
        return null;
      }

      const {
        poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        inputVault,
        outputVault,
      } = extractAccountInfo(accounts, accountToExtract);

      return buildSwapEvent(
        poolAddress,
        type,
        inputVault,
        outputVault,
        inputTokenAccount,
        outputTokenAccount,
        innerTokenAccounts,
        instructionIndex
      );
    } catch (error) {
      console.error("Error parsing Orca CLMM swap:", error);
      return null;
    }
  }
}
