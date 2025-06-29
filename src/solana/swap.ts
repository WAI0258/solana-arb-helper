import type { ExtendedPoolInfo, StandardSwapEvent } from "../common/types";

export class SwapParser {
  public parseSolanaSwapEvent(
    innerTokenAccounts: any[],
    poolInfo: ExtendedPoolInfo,
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      console.log(
        "innerTokenAccounts: ",
        JSON.stringify(innerTokenAccounts, null, 2)
      );
      return {
        poolAddress: poolInfo.poolId,
        protocol: poolInfo.protocol,
        tokenIn: innerTokenAccounts[0].addr,
        tokenOut: innerTokenAccounts[1].addr,
        amountIn: innerTokenAccounts[0].uiTokenAmount.uiAmount,
        amountOut: innerTokenAccounts[1].uiTokenAmount.uiAmount,
        sender,
        recipient,
        instructionIndex,
      };
    } catch (error) {
      console.error("Error parsing Solana swap event:", error);
      return null;
    }
  }

  private parseRaydiumV4Swap(
    instruction: any,
    poolInfo: ExtendedPoolInfo,
    innerTokenAccounts: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      const accounts = instruction.accounts;
      const data = instruction.data;

      console.log("instruction: ", JSON.stringify(instruction, null, 2));
      const sender = accounts[0] || "";
      const recipient = accounts[1] || sender;
      const tokenIn = poolInfo.tokens[0].address || "";
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
      console.error("Error parsing Raydium V4 swap:", error);
      return null;
    }
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
