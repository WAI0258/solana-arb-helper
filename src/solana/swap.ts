import type { DexProgram } from "../common/dex";
import type { ExtendedPoolInfo, StandardSwapEvent } from "../common/types";

export class SwapParser {
  public parseSolanaSwapEvent(
    dexProgram: {
      dexProgram: string;
      dexProgramInfo: DexProgram | null;
    },
    instructionData: Buffer,
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      switch (dexProgram.dexProgram) {
        case "RAYDIUM":
          return this.parseRaydiumSwap(
            dexProgram.dexProgramInfo,
            instructionData,
            instructionIndex
          );
        case "ORCA":
        case "serum":
      }
      return null;
    } catch (error) {
      console.error("Error parsing Solana swap event:", error);
      return null;
    }
  }

  private parseRaydiumSwap(
    dexProgramInfo: DexProgram | null,
    instructionData: Buffer,
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      switch (dexProgramInfo?.type) {
        case "CLMM":
          return this.parseRaydiumCLMMSwap(instructionData, instructionIndex);
        // case "AMM":
        //   return this.parseRaydiumAMMSwap(instructionData, instructionIndex);
      }

      return null;
    } catch (error) {
      console.error("Error parsing Raydium V4 swap:", error);
      return null;
    }
  }
  private parseRaydiumCLMMSwap(
    instructionData: Buffer,
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      // detect the type of swap
      const discriminator = Array.from(instructionData.slice(0, 8));
      const expectedDiscriminator = {
        swap: [248, 198, 158, 145, 225, 117, 135, 200],
        swap_router_base_in: [69, 125, 115, 218, 245, 186, 242, 196],
        swap_v2: [43, 4, 237, 11, 26, 201, 30, 98],
      };

      if (
        discriminator.every(
          (byte, index) => byte === expectedDiscriminator.swap[index]
        )
      ) {
        let offset = 8;
        const amount = instructionData.readBigUInt64LE(offset); // u64
        offset += 8;

        const otherAmountThreshold = instructionData.readBigUInt64LE(offset); // u64
        offset += 8;

        const sqrtPriceLimitX64 =
          instructionData.readBigUInt64LE(offset) +
          (instructionData.readBigUInt64LE(offset + 8) << 64n); // u128
        offset += 16;

        const isBaseInput = instructionData.readUInt8(offset) !== 0; // bool

        console.log("Parsed Raydium CLMM swap args:", {
          amount: amount.toString(),
          otherAmountThreshold: otherAmountThreshold.toString(),
          sqrtPriceLimitX64: sqrtPriceLimitX64.toString(),
          isBaseInput,
        });
      } else if (
        discriminator.every(
          (byte, index) =>
            byte === expectedDiscriminator.swap_router_base_in[index]
        )
      ) {
      } else if (
        discriminator.every(
          (byte, index) => byte === expectedDiscriminator.swap_v2[index]
        )
      ) {
      }
      return {
        poolAddress: "", // Would need to extract from accounts
        protocol: "RAYDIUM_CLMM",
        tokenIn: "", // Would need to extract from accounts
        tokenOut: "", // Would need to extract from accounts
        amountIn: amount,
        amountOut: otherAmountThreshold, // This might need adjustment based on swap direction
        sender: "", // Would need to extract from accounts
        recipient: "", // Would need to extract from accounts
        instructionIndex,
      };
    } catch (error) {
      console.error("Error parsing Raydium CLMM swap:", error);
      return null;
    }
  }
  private parseRaydiumAMMSwap(
    instructionData: Buffer,
    instructionIndex: number
  ): StandardSwapEvent | null {
    return null;
  }

  private parseOrcaV2Swap(
    instruction: any,
    poolInfo: ExtendedPoolInfo,
    innerTokenAccounts: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      const accounts = instruction.accounts;
      const data = instruction.data;

      const sender = accounts[0] || "";
      const recipient = accounts[1] || sender;
      const tokenIn = poolInfo.tokens[0] || "";
      const tokenOut = poolInfo.tokens[1] || "";
      const amountIn = BigInt(data.slice(8, 16).readBigUInt64LE());
      const amountOut = BigInt(data.slice(16, 24).readBigUInt64LE());

      return {
        poolAddress: poolInfo.poolId,
        protocol: poolInfo.protocol,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        sender,
        recipient,
        instructionIndex,
      };
    } catch (error) {
      console.error("Error parsing Orca V2 swap:", error);
      return null;
    }
  }

  private parseSerumV3Swap(
    instruction: any,
    poolInfo: ExtendedPoolInfo,
    innerTokenAccounts: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      const accounts = instruction.accounts;
      const data = instruction.data;

      const sender = accounts[0] || "";
      const recipient = accounts[1] || sender;
      const tokenIn = poolInfo.tokens[0] || "";
      const tokenOut = poolInfo.tokens[1] || "";
      const amountIn = BigInt(data.slice(8, 16).readBigUInt64LE());
      const amountOut = BigInt(data.slice(16, 24).readBigUInt64LE());

      return {
        poolAddress: poolInfo.poolId,
        protocol: poolInfo.protocol,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        sender,
        recipient,
        instructionIndex,
      };
    } catch (error) {
      console.error("Error parsing Serum V3 swap:", error);
      return null;
    }
  }

  private parseSaberSwap(
    instruction: any,
    poolInfo: ExtendedPoolInfo,
    innerTokenAccounts: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      const accounts = instruction.accounts;
      const data = instruction.data;

      const sender = accounts[0] || "";
      const recipient = accounts[1] || sender;
      const tokenIn = poolInfo.tokens[0] || "";
      const tokenOut = poolInfo.tokens[1] || "";
      const amountIn = BigInt(data.slice(8, 16).readBigUInt64LE());
      const amountOut = BigInt(data.slice(16, 24).readBigUInt64LE());

      return {
        poolAddress: poolInfo.poolId,
        protocol: poolInfo.protocol,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        sender,
        recipient,
        instructionIndex,
      };
    } catch (error) {
      console.error("Error parsing Saber swap:", error);
      return null;
    }
  }

  private parseAldrinV2Swap(
    instruction: any,
    poolInfo: ExtendedPoolInfo,
    innerTokenAccounts: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      const accounts = instruction.accounts;
      const data = instruction.data;

      const sender = accounts[0] || "";
      const recipient = accounts[1] || sender;
      const tokenIn = poolInfo.tokens[0] || "";
      const tokenOut = poolInfo.tokens[1] || "";
      const amountIn = BigInt(data.slice(8, 16).readBigUInt64LE());
      const amountOut = BigInt(data.slice(16, 24).readBigUInt64LE());

      return {
        poolAddress: poolInfo.poolId,
        protocol: poolInfo.protocol,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        sender,
        recipient,
        instructionIndex,
      };
    } catch (error) {
      console.error("Error parsing Aldrin V2 swap:", error);
      return null;
    }
  }

  private parseMercurialSwap(
    instruction: any,
    poolInfo: ExtendedPoolInfo,
    innerTokenAccounts: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      const accounts = instruction.accounts;
      const data = instruction.data;

      const sender = accounts[0] || "";
      const recipient = accounts[1] || sender;
      const tokenIn = poolInfo.tokens[0] || "";
      const tokenOut = poolInfo.tokens[1] || "";
      const amountIn = BigInt(data.slice(8, 16).readBigUInt64LE());
      const amountOut = BigInt(data.slice(16, 24).readBigUInt64LE());

      return {
        poolAddress: poolInfo.poolId,
        protocol: poolInfo.protocol,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        sender,
        recipient,
        instructionIndex,
      };
    } catch (error) {
      console.error("Error parsing Mercurial swap:", error);
      return null;
    }
  }

  private parseJupiterSwap(
    instruction: any,
    poolInfo: ExtendedPoolInfo,
    innerTokenAccounts: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      const accounts = instruction.accounts;
      const data = instruction.data;

      const sender = accounts[0] || "";
      const recipient = accounts[1] || sender;
      const tokenIn = poolInfo.tokens[0] || "";
      const tokenOut = poolInfo.tokens[1] || "";
      const amountIn = BigInt(data.slice(8, 16).readBigUInt64LE());
      const amountOut = BigInt(data.slice(16, 24).readBigUInt64LE());

      return {
        poolAddress: poolInfo.poolId,
        protocol: poolInfo.protocol,
        tokenIn,
        tokenOut,
        amountIn,
        amountOut,
        sender,
        recipient,
        instructionIndex,
      };
    } catch (error) {
      console.error("Error parsing Jupiter swap:", error);
      return null;
    }
  }
}
