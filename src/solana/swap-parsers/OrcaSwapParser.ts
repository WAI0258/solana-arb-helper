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

const CLMM_DISCRIMINATORS = {
  swap: [248, 198, 158, 145, 225, 117, 135, 200],
  two_hop_swap: [195, 96, 237, 108, 68, 162, 219, 230],
  swap_v2: [43, 4, 237, 11, 26, 201, 30, 98],
  two_hop_swap_v2: [186, 143, 209, 29, 254, 2, 194, 117],
};

const ACCOUNT_INDICES = {
  cpmm: [0, 3, 6, 4, 5],
  clmm_swap_a2b: [2, 3, 5, 4, 6],
  clmm_swap_b2a: [2, 5, 3, 6, 4],
  clmm_swap_v2_a2b: [4, 7, 9, 8, 10],
  clmm_swap_v2_b2a: [4, 9, 7, 10, 8],
  two_hop_first_a2b: [2, 4, 6, 5, 7],
  two_hop_first_b2a: [2, 6, 4, 7, 5],
  two_hop_second_a2b: [3, 8, 10, 9, 11],
  two_hop_second_b2a: [3, 10, 8, 11, 9],
  two_hop_v2_into: [0, 8, 11, 9, 10],
  two_hop_v2_out: [1, 10, 13, 11, 12],
};

export class OrcaSwapParser {
  parseSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string,
    dexType?: string
  ): StandardSwapEvent | StandardSwapEvent[] | null {
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
      if (instructionData.readUInt8(0) !== 1) {
        return null;
      }

      const accountInfo = extractAccountInfo(accounts, ACCOUNT_INDICES.cpmm);
      const protocol = isV1 ? "ORCA_CPMM_V1_SWAP" : "ORCA_CPMM_V2_SWAP";

      return buildSwapEvent(
        accountInfo.poolAddress,
        protocol,
        accountInfo.intoVault,
        accountInfo.outofVault,
        accountInfo.inputTokenAccount,
        accountInfo.outputTokenAccount,
        changedTokenMetas,
        instructionType
      );
    } catch (error) {
      console.error("Error parsing Orca CPMM swap:", error);
      return null;
    }
  }

  private parseCLMMSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string
  ): StandardSwapEvent | StandardSwapEvent[] | null {
    try {
      const discriminator = Array.from(instructionData.slice(0, 8));

      if (
        isValidDiscriminator(discriminator, CLMM_DISCRIMINATORS.two_hop_swap)
      ) {
        return this.parseTwoHopSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType,
          "ORCA_CLMM_TWO_HOP_SWAP"
        );
      }

      if (
        isValidDiscriminator(discriminator, CLMM_DISCRIMINATORS.two_hop_swap_v2)
      ) {
        return this.parseTwoHopSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType,
          "ORCA_CLMM_TWO_HOP_SWAP_V2"
        );
      }

      let protocol: string;
      let accountIndices: number[];

      if (isValidDiscriminator(discriminator, CLMM_DISCRIMINATORS.swap)) {
        const a2b = instructionData.readUInt8(instructionData.length - 1);
        protocol = "ORCA_CLMM_SWAP";
        accountIndices =
          a2b === 1
            ? ACCOUNT_INDICES.clmm_swap_a2b
            : ACCOUNT_INDICES.clmm_swap_b2a;
      } else if (
        isValidDiscriminator(discriminator, CLMM_DISCRIMINATORS.swap_v2)
      ) {
        const a2b = instructionData.readUInt8(instructionData.length - 2);
        protocol = "ORCA_CLMM_SWAP_V2";
        accountIndices =
          a2b === 1
            ? ACCOUNT_INDICES.clmm_swap_v2_a2b
            : ACCOUNT_INDICES.clmm_swap_v2_b2a;
      } else {
        return null;
      }

      const accountInfo = extractAccountInfo(accounts, accountIndices);

      return buildSwapEvent(
        accountInfo.poolAddress,
        protocol,
        accountInfo.intoVault,
        accountInfo.outofVault,
        accountInfo.inputTokenAccount,
        accountInfo.outputTokenAccount,
        changedTokenMetas,
        instructionType
      );
    } catch (error) {
      console.error("Error parsing Orca CLMM swap:", error);
      return null;
    }
  }

  private parseTwoHopSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string,
    type: string
  ): StandardSwapEvent[] | null {
    try {
      const aToBOne = instructionData.readUInt8(25) !== 0;
      const aToBTwo = instructionData.readUInt8(26) !== 0;

      let firstSwapAccounts: number[];
      let secondSwapAccounts: number[];
      let type1: string;
      let type2: string;

      if (type === "ORCA_CLMM_TWO_HOP_SWAP") {
        // V1 two-hop swap
        firstSwapAccounts = aToBOne
          ? ACCOUNT_INDICES.two_hop_first_a2b
          : ACCOUNT_INDICES.two_hop_first_b2a;
        secondSwapAccounts = aToBTwo
          ? ACCOUNT_INDICES.two_hop_second_a2b
          : ACCOUNT_INDICES.two_hop_second_b2a;
        type1 = type + "_FIRST";
        type2 = type + "_SECOND";
      } else {
        // V2 two-hop swap
        firstSwapAccounts = ACCOUNT_INDICES.two_hop_v2_into;
        secondSwapAccounts = ACCOUNT_INDICES.two_hop_v2_out;
        type1 = type + "_INTO_POOL";
        type2 = type + "_OUT_OF_POOL";
      }

      const firstSwap = extractAccountInfo(accounts, firstSwapAccounts);
      const secondSwap = extractAccountInfo(accounts, secondSwapAccounts);

      const firstSwapEvent = buildSwapEvent(
        firstSwap.poolAddress,
        type1,
        firstSwap.intoVault,
        firstSwap.outofVault,
        firstSwap.inputTokenAccount,
        firstSwap.outputTokenAccount,
        changedTokenMetas,
        instructionType
      );

      const secondSwapEvent = buildSwapEvent(
        secondSwap.poolAddress,
        type2,
        secondSwap.intoVault,
        secondSwap.outofVault,
        secondSwap.inputTokenAccount,
        secondSwap.outputTokenAccount,
        changedTokenMetas,
        instructionType
      );

      return firstSwapEvent && secondSwapEvent
        ? [firstSwapEvent, secondSwapEvent]
        : null;
    } catch (error) {
      console.error("Error parsing Orca two-hop swap:", error);
      return null;
    }
  }
}
