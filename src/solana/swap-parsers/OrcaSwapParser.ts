/*
  According to Solscan and https://docs.sqd.ai/solana-indexing/how-to-start/indexing-orca/
  https://github.com/subsquid-labs
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
    changedTokenMetas: any[],
    instructionType: string,
    dexType?: string
  ): StandardSwapEvent | null {
    switch (dexType) {
      case "CPMM_V1":
        return this.parseCPMMSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType,
          true
        );
      case "CPMM_V2":
        return this.parseCPMMSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType,
          false
        );
      case "CLMM":
        return this.parseCLMMSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType
        );
      default:
        return null;
    }
  }

  private parseCPMMSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string,
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
        intoVault,
        outofVault,
      } = extractAccountInfo(accounts, [0, 3, 6, 4, 5]);

      return buildSwapEvent(
        poolAddress,
        isV1 ? "ORCA_CPMM_V1_SWAP" : "ORCA_CPMM_V2_SWAP",
        intoVault,
        outofVault,
        inputTokenAccount,
        outputTokenAccount,
        changedTokenMetas,
        instructionType
      );
    } catch (error) {
      console.error("Error parsing Orca CPMM V1 swap:", error);
      return null;
    }
  }

  private parseCLMMSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string
  ): StandardSwapEvent | null {
    try {
      const discriminator = Array.from(instructionData.slice(0, 8));
      const expectedDiscriminator = {
        swap: [248, 198, 158, 145, 225, 117, 135, 200],
        two_hop_swap: [195, 96, 237, 108, 68, 162, 219, 230],
        swap_v2: [43, 4, 237, 11, 26, 201, 30, 98],
        two_hop_swap_v2: [186, 143, 209, 29, 254, 2, 194, 117],
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
        const a2b = instructionData.readUInt8(instructionData.length - 1);
        type = "ORCA_CLMM_SWAP";
        if (a2b === 1) {
          accountToExtract = [2, 3, 5, 4, 6];
        } else {
          accountToExtract = [2, 5, 3, 6, 4];
        }
      } else if (
        isValidDiscriminator(discriminator, expectedDiscriminator.swap_v2)
      ) {
        type = "ORCA_CLMM_SWAP_V2";
        const a2b = instructionData.readUInt8(instructionData.length - 2);
        if (a2b === 1) {
          accountToExtract = [4, 7, 9, 8, 10];
        } else {
          accountToExtract = [4, 9, 7, 10, 8];
        }
      } else if (
        isValidDiscriminator(
          discriminator,
          expectedDiscriminator.two_hop_swap_v2
        )
      ) {
        type = "ORCA_CLMM_TWO_HOP_SWAP_V2";
      } else {
        return null;
      }

      const {
        poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        intoVault,
        outofVault,
      } = extractAccountInfo(accounts, accountToExtract);

      return buildSwapEvent(
        poolAddress,
        type,
        intoVault,
        outofVault,
        inputTokenAccount,
        outputTokenAccount,
        changedTokenMetas,
        instructionType
      );
    } catch (error) {
      console.error("Error parsing Orca CLMM swap:", error);
      return null;
    }
  }
}
