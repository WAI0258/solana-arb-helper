import type { StandardSwapEvent } from "../../common/types";
import {
  getAbsoluteAmount,
  isValidDiscriminator,
  extractAccountInfo,
  buildSwapEvent,
} from "./utility";

export class RaydiumSwapParser {
  parseSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number,
    dexType?: string
  ): StandardSwapEvent | null {
    switch (dexType) {
      case "CLMM":
        return this.parseCLMMSwap(
          instructionData,
          accounts,
          innerTokenAccounts,
          instructionIndex
        );
      case "AMM":
        return this.parseAMMSwap(
          instructionData,
          accounts,
          innerTokenAccounts,
          instructionIndex
        );
      case "CPMM":
        return this.parseCPMMSwap(
          instructionData,
          accounts,
          innerTokenAccounts,
          instructionIndex
        );
      default:
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
      const expectedDiscriminator = {
        swap: [248, 198, 158, 145, 225, 117, 135, 200],
        swap_router_base_in: [69, 125, 115, 218, 245, 186, 242, 196],
        swap_v2: [43, 4, 237, 11, 26, 201, 30, 98],
      };

      if (!isValidDiscriminator(discriminator, expectedDiscriminator.swap)) {
        return null;
      }

      const {
        poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        inputVault,
        outputVault,
      } = extractAccountInfo(accounts, [2, 3, 4, 5, 6]);

      return buildSwapEvent(
        poolAddress,
        "RAYDIUM_CLMM_SWAP",
        inputVault,
        outputVault,
        inputTokenAccount,
        outputTokenAccount,
        innerTokenAccounts,
        instructionIndex
      );
    } catch (error) {
      console.error("Error parsing Raydium CLMM swap:", error);
      return null;
    }
  }

  private parseAMMSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      const discriminator = instructionData.readUInt8(0);
      const expectedDiscriminator = {
        swapBaseIn: 9,
        swapBaseOut: 11,
      };

      let type = "";
      if (discriminator === expectedDiscriminator.swapBaseIn) {
        type = "SWAP_BASE_IN";
      } else if (discriminator === expectedDiscriminator.swapBaseOut) {
        type = "SWAP_BASE_OUT";
      } else {
        return null;
      }

      const authority = accounts[2]; // pool payer
      const user = accounts[accounts.length - 1]; // user token account(may be one of them)

      // customize account mapping
      const poolTokenAccount = innerTokenAccounts.filter(
        (account) => account.owner === authority.toBase58()
      );
      const inputPoolTokenAccount = poolTokenAccount.find((account) =>
        type === "SWAP_BASE_IN" ? account.amount < 0 : account.amount > 0
      );
      const outputPoolTokenAccount = poolTokenAccount.find((account) =>
        type === "SWAP_BASE_IN" ? account.amount > 0 : account.amount < 0
      );

      const {
        poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        inputVault,
        outputVault,
      } = {
        poolAddress: accounts[1].toBase58(),
        inputTokenAccount: innerTokenAccounts.find(
          (account) => account.owner === user.toBase58()
        )?.addr,
        outputTokenAccount: accounts[accounts.length - 2].toBase58(),
        inputVault: inputPoolTokenAccount?.addr,
        outputVault: outputPoolTokenAccount?.addr,
      };

      const { tokenIn, tokenOut } = this.getAMMTokenMapping(
        type,
        inputVault,
        outputVault,
        innerTokenAccounts
      );

      return {
        poolAddress,
        protocol: "RAYDIUM_AMM_" + type,
        tokenIn: tokenIn?.mint,
        tokenOut: tokenOut?.mint,
        amountIn: getAbsoluteAmount(tokenIn?.amount),
        amountOut: getAbsoluteAmount(tokenOut?.amount),
        sender: inputTokenAccount,
        recipient: outputTokenAccount,
        instructionIndex,
      };
    } catch (error) {
      console.error("Error parsing Raydium AMM swap:", error);
      return null;
    }
  }

  private parseCPMMSwap(
    instructionData: Buffer,
    accounts: any[],
    innerTokenAccounts: any[],
    instructionIndex: number
  ): StandardSwapEvent | null {
    try {
      const discriminator = Array.from(instructionData.slice(0, 8));
      const expectedDiscriminator = {
        swap_base_input: [143, 190, 90, 218, 196, 30, 51, 222],
        swap_base_output: [55, 217, 98, 86, 163, 74, 180, 173],
      };

      let type = "";
      if (
        isValidDiscriminator(
          discriminator,
          expectedDiscriminator.swap_base_input
        )
      ) {
        type = "SWAP_BASE_INPUT";
      } else if (
        isValidDiscriminator(
          discriminator,
          expectedDiscriminator.swap_base_output
        )
      ) {
        type = "SWAP_BASE_OUTPUT";
      } else {
        return null;
      }

      const {
        poolAddress,
        inputTokenAccount,
        outputTokenAccount,
        inputVault,
        outputVault,
      } = extractAccountInfo(accounts, [3, 4, 5, 6, 7]);

      return buildSwapEvent(
        poolAddress,
        "RAYDIUM_CPMM_" + type,
        inputVault,
        outputVault,
        inputTokenAccount,
        outputTokenAccount,
        innerTokenAccounts,
        instructionIndex
      );
    } catch (error) {
      console.error("Error parsing Raydium CPMM swap:", error);
      return null;
    }
  }

  private getAMMTokenMapping(
    type: string,
    inputVault: string,
    outputVault: string,
    innerTokenAccounts: any[]
  ) {
    let tokenIn: any;
    let tokenOut: any;
    if (type === "SWAP_BASE_IN") {
      tokenIn = innerTokenAccounts.find(
        (account) => account.addr === outputVault
      );
      tokenOut = innerTokenAccounts.find(
        (account) => account.addr === inputVault
      );
    } else if (type === "SWAP_BASE_OUT") {
      tokenIn = innerTokenAccounts.find(
        (account) => account.addr === inputVault
      );
      tokenOut = innerTokenAccounts.find(
        (account) => account.addr === outputVault
      );
    }

    return { tokenIn, tokenOut };
  }
}
