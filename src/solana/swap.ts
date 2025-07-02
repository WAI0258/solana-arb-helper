import type { DexProgram } from "../common/dex";
import type { ExtendedPoolInfo, StandardSwapEvent } from "../common/types";

export class SwapParser {
  public parseSolanaSwapEvent(
    dexProgram: {
      dexProgram: string;
      dexProgramInfo: DexProgram | null;
    },
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      switch (dexProgram.dexProgram) {
        case "RAYDIUM":
          return this.parseRaydiumSwap(
            dexProgram.dexProgramInfo,
            instructionData,
            accounts,
            innerTokenAccounts,
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
    accounts: any[],
    innerTokenAccountsWithBalanceChanges: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      switch (dexProgramInfo?.type) {
        case "CLMM":
          return this.parseRaydiumCLMMSwap(
            instructionData,
            accounts,
            innerTokenAccountsWithBalanceChanges,
            instructionIndex
          );
        case "AMM":
          return this.parseRaydiumAMMSwap(
            instructionData,
            accounts,
            innerTokenAccountsWithBalanceChanges,
            instructionIndex
          );
        default:
          return null;
      }

      return null;
    } catch (error) {
      console.error("Error parsing Raydium V4 swap:", error);
      return null;
    }
  }
  private parseRaydiumCLMMSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccountsWithBalanceChanges: any[],
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

      let amount = 0n;
      let otherAmountThreshold = 0n;
      let sqrtPriceLimitX64 = 0n;
      let isBaseInput = false;

      let poolAddress = "";
      let inputTokenAccount = "";
      let outputTokenAccount = "";
      let inputVault = "";
      let outputVault = "";

      if (
        discriminator.every(
          (byte, index) => byte === expectedDiscriminator.swap[index]
        )
      ) {
        // swap
        let offset = 8;
        amount = instructionData.readBigUInt64LE(offset); // u64
        offset += 8;

        otherAmountThreshold = instructionData.readBigUInt64LE(offset); // u64
        offset += 8;

        sqrtPriceLimitX64 =
          instructionData.readBigUInt64LE(offset) +
          (instructionData.readBigUInt64LE(offset + 8) << 64n); // u128
        offset += 16;

        isBaseInput = instructionData.readUInt8(offset) !== 0; // bool

        poolAddress = accounts[2].toBase58();
        inputTokenAccount = accounts[3].toBase58();
        outputTokenAccount = accounts[4].toBase58();
        inputVault = accounts[5].toBase58();
        outputVault = accounts[6].toBase58();
      } else if (
        discriminator.every(
          (byte, index) =>
            byte === expectedDiscriminator.swap_router_base_in[index]
        )
      ) {
        // swap_router_base_in
      } else if (
        discriminator.every(
          (byte, index) => byte === expectedDiscriminator.swap_v2[index]
        )
      ) {
        // swap_v2
      }

      // use vault to get token and calculate amount(amountIn === swap.amount)
      const tokenIn = innerTokenAccountsWithBalanceChanges.find(
        (account) => account.addr === inputVault
      );
      const tokenOut = innerTokenAccountsWithBalanceChanges.find(
        (account) => account.addr === outputVault
      );
      return {
        poolAddress: poolAddress,
        protocol: "RAYDIUM_CLMM_SWAP",
        tokenIn: tokenIn?.mint,
        tokenOut: tokenOut?.mint,
        amountIn: tokenIn?.amount > 0n ? tokenIn?.amount : -tokenIn?.amount,
        amountOut: tokenOut?.amount > 0n ? tokenOut?.amount : -tokenOut?.amount,
        sender: inputTokenAccount,
        recipient: outputTokenAccount,
        instructionIndex,
      };
    } catch (error) {
      console.error("Error parsing Raydium CLMM swap:", error);
      return null;
    }
  }
  private parseRaydiumAMMSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccountsWithBalanceChanges: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      // detect the type of swap
      const discriminator = instructionData.readUInt8(0);
      const expectedDiscriminator = {
        swapBaseIn: 9,
        swapBaseOut: 11,
      };

      let amountIn = 0n;
      let minimumAmountOut = 0n;
      let maxAmountIn = 0n;
      let amountOut = 0n;
      let type = "";
      if (discriminator === expectedDiscriminator.swapBaseIn) {
        // swapBaseIn
        let offset = 1;
        amountIn = instructionData.readBigUInt64LE(offset); // u64
        offset += 8;

        minimumAmountOut = instructionData.readBigUInt64LE(offset); // u64
        offset += 8;
        type = "SWAP_BASE_IN";
      } else if (discriminator === expectedDiscriminator.swapBaseOut) {
        // swapBaseOut
        let offset = 1;
        maxAmountIn = instructionData.readBigUInt64LE(offset); // u64
        offset += 8;

        amountOut = instructionData.readBigUInt64LE(offset); // u64
        offset += 8;
        type = "SWAP_BASE_OUT";
      }
      const poolAddress = accounts[1].toBase58();
      const inputTokenAccount = accounts[14].toBase58();
      const outputTokenAccount = accounts[15].toBase58();
      const inputVault = accounts[4].toBase58();
      const outputVault = accounts[5].toBase58();

      let tokenIn: any;
      let tokenOut: any;
      if (type === "SWAP_BASE_IN") {
        tokenIn = innerTokenAccountsWithBalanceChanges.find(
          (account) => account.addr === outputVault
        );
        tokenOut = innerTokenAccountsWithBalanceChanges.find(
          (account) => account.addr === inputVault
        );
      } else if (type === "SWAP_BASE_OUT") {
        tokenIn = innerTokenAccountsWithBalanceChanges.find(
          (account) => account.addr === inputVault
        );
        tokenOut = innerTokenAccountsWithBalanceChanges.find(
          (account) => account.addr === outputVault
        );
      }
      return {
        poolAddress: poolAddress,
        protocol: "RAYDIUM_AMM_" + type,
        tokenIn: tokenIn?.mint,
        tokenOut: tokenOut?.mint,
        amountIn: tokenIn?.amount > 0n ? tokenIn?.amount : -tokenIn?.amount,
        amountOut: tokenOut?.amount > 0n ? tokenOut?.amount : -tokenOut?.amount,
        sender: inputTokenAccount,
        recipient: outputTokenAccount,
        instructionIndex,
      };
    } catch (error) {
      console.error("Error parsing Raydium AMM swap:", error);
      return null;
    }
  }

  private parseOrcaV2Swap(): StandardSwapEvent | null {
    return null;
  }

  private parseSerumV3Swap(): StandardSwapEvent | null {
    return null;
  }

  private parseSaberSwap(): StandardSwapEvent | null {
    return null;
  }

  private parseAldrinV2Swap(): StandardSwapEvent | null {
    return null;
  }

  private parseMercurialSwap(): StandardSwapEvent | null {
    return null;
  }

  private parseJupiterSwap(): StandardSwapEvent | null {
    return null;
  }
}
