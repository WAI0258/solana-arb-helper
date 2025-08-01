import type { StandardSwapEvent } from "../../common/types";
import {
  getAbsoluteAmount,
  isValidDiscriminator,
  extractAccountInfo,
  buildSwapEvent,
} from "./utility";

const CURVE_DISCRIMINATOR = 9;

const CLMM_DISCRIMINATORS = {
  swap: [248, 198, 158, 145, 225, 117, 135, 200],
  swap_router_base_in: [69, 125, 115, 218, 245, 186, 242, 196],
  swap_v2: [43, 4, 237, 11, 26, 201, 30, 98],
};

const AMM_DISCRIMINATORS = {
  swapBaseIn: 9,
  swapBaseOut: 11,
};

const CPMM_DISCRIMINATORS = {
  swap_base_input: [143, 190, 90, 218, 196, 30, 51, 222],
  swap_base_output: [55, 217, 98, 86, 163, 74, 180, 173],
};

const ACCOUNT_INDICES = {
  clmm: [2, 3, 4, 5, 6],
  cpmm: [3, 4, 5, 6, 7],
};

export class RaydiumSwapParser {
  parseSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string,
    dexType?: string
  ): StandardSwapEvent | null {
    switch (dexType) {
      case "CURVE":
        return this.parseCurveSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType
        );
      case "CLMM":
        return this.parseCLMMSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType
        );
      case "AMM":
        return this.parseAMMSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType
        );
      case "CPMM":
        return this.parseCPMMSwap(
          instructionData,
          accounts,
          changedTokenMetas,
          instructionType
        );
      default:
        return null;
    }
  }

  private parseCurveSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string
  ): StandardSwapEvent | null {
    try {
      if (instructionData.readUInt8(0) !== CURVE_DISCRIMINATOR) {
        return null;
      }

      const authority = accounts[2]; // pool payer
      const user = accounts[accounts.length - 1]; // user token account(may be one of them)
      const userTokenAccounts = changedTokenMetas.filter(
        (account) => account.owner === user.toBase58()
      );
      // customize account mapping
      const poolTokenAccount = changedTokenMetas.filter(
        (account) => account.owner === authority.toBase58()
      );
      const inputPoolTokenAccount = poolTokenAccount.find(
        (account) => account.amount < 0
      );
      const outputPoolTokenAccount = poolTokenAccount.find(
        (account) => account.amount > 0
      );

      const accountInfo = {
        poolAddress: accounts[1].toBase58(),
        inputTokenAccount: userTokenAccounts.filter(
          (account) => account.addr !== accounts[accounts.length - 2].toBase58()
        )[0]?.addr,
        outputTokenAccount: accounts[accounts.length - 2].toBase58(),
        intoVault: outputPoolTokenAccount?.addr,
        outofVault: inputPoolTokenAccount?.addr,
      };

      const { tokenIn, tokenOut } = this.getAMMTokenMapping(
        "SWAP_BASE_IN",
        accountInfo.intoVault,
        accountInfo.outofVault,
        changedTokenMetas
      );

      return {
        poolAddress: accountInfo.poolAddress,
        protocol: "RAYDIUM_CURVE_SWAP",
        tokenIn: tokenIn?.mint,
        tokenOut: tokenOut?.mint,
        amountIn: getAbsoluteAmount(tokenIn?.amount),
        amountOut: getAbsoluteAmount(tokenOut?.amount),
        sender: accountInfo.inputTokenAccount,
        recipient: accountInfo.outputTokenAccount,
        instructionType,
      };
    } catch (error) {
      console.error("Error parsing Raydium Curve swap:", error);
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

      let protocol: string;
      if (isValidDiscriminator(discriminator, CLMM_DISCRIMINATORS.swap)) {
        protocol = "RAYDIUM_CLMM_SWAP";
      } else if (
        isValidDiscriminator(
          discriminator,
          CLMM_DISCRIMINATORS.swap_router_base_in
        )
      ) {
        protocol = "RAYDIUM_CLMM_SWAP_ROUTER_BASE_IN";
      } else if (
        isValidDiscriminator(discriminator, CLMM_DISCRIMINATORS.swap_v2)
      ) {
        protocol = "RAYDIUM_CLMM_SWAP_V2";
      } else {
        return null;
      }

      const accountInfo = extractAccountInfo(accounts, ACCOUNT_INDICES.clmm);

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
      console.error("Error parsing Raydium CLMM swap:", error);
      return null;
    }
  }

  private parseAMMSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string
  ): StandardSwapEvent | null {
    try {
      const discriminator = instructionData.readUInt8(0);

      let protocol: string;
      if (discriminator === AMM_DISCRIMINATORS.swapBaseIn) {
        protocol = "SWAP_BASE_IN";
      } else if (discriminator === AMM_DISCRIMINATORS.swapBaseOut) {
        protocol = "SWAP_BASE_OUT";
      } else {
        return null;
      }

      const authority = accounts[2]; // pool payer
      const user = accounts[accounts.length - 1]; // user token account(may be one of them)

      if (instructionType === "outer") {
        const accountInfo = {
          poolAddress: accounts[1].toBase58(),
          inputTokenAccount: changedTokenMetas.find(
            (account) => account.authority === user.toBase58()
          )?.source,
          outputTokenAccount: changedTokenMetas.find(
            (account) => account.authority !== user.toBase58()
          )?.destination,
          intoVault: changedTokenMetas.find(
            (account) => account.authority === user.toBase58()
          )?.destination,
          outofVault: changedTokenMetas.find(
            (account) => account.authority !== user.toBase58()
          )?.source,
        };

        return buildSwapEvent(
          accountInfo.poolAddress,
          "RAYDIUM_AMM_" + protocol,
          accountInfo.intoVault,
          accountInfo.outofVault,
          accountInfo.inputTokenAccount,
          accountInfo.outputTokenAccount,
          changedTokenMetas,
          instructionType
        );
      }

      const userTokenAccounts = changedTokenMetas.filter(
        (account) => account.owner === user.toBase58()
      );
      // customize account mapping
      const poolTokenAccount = changedTokenMetas.filter(
        (account) => account.owner === authority.toBase58()
      );
      const inputPoolTokenAccount = poolTokenAccount.find((account) =>
        protocol === "SWAP_BASE_IN" ? account.amount < 0 : account.amount > 0
      );
      const outputPoolTokenAccount = poolTokenAccount.find((account) =>
        protocol === "SWAP_BASE_IN" ? account.amount > 0 : account.amount < 0
      );

      const accountInfo = {
        poolAddress: accounts[1].toBase58(),
        inputTokenAccount: userTokenAccounts.filter(
          (account) => account.addr !== accounts[accounts.length - 2].toBase58()
        )[0]?.addr,
        outputTokenAccount: accounts[accounts.length - 2].toBase58(),
        intoVault: inputPoolTokenAccount?.addr,
        outofVault: outputPoolTokenAccount?.addr,
      };

      const { tokenIn, tokenOut } = this.getAMMTokenMapping(
        protocol,
        accountInfo.intoVault,
        accountInfo.outofVault,
        changedTokenMetas
      );

      return {
        poolAddress: accountInfo.poolAddress,
        protocol: "RAYDIUM_AMM_" + protocol,
        tokenIn: tokenIn?.mint,
        tokenOut: tokenOut?.mint,
        amountIn: getAbsoluteAmount(tokenIn?.amount),
        amountOut: getAbsoluteAmount(tokenOut?.amount),
        sender: accountInfo.inputTokenAccount,
        recipient: accountInfo.outputTokenAccount,
        instructionType,
      };
    } catch (error) {
      console.error("Error parsing Raydium AMM swap:", error);
      return null;
    }
  }

  private parseCPMMSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string
  ): StandardSwapEvent | null {
    try {
      const discriminator = Array.from(instructionData.slice(0, 8));

      let protocol: string;
      if (
        isValidDiscriminator(discriminator, CPMM_DISCRIMINATORS.swap_base_input)
      ) {
        protocol = "SWAP_BASE_INPUT";
      } else if (
        isValidDiscriminator(
          discriminator,
          CPMM_DISCRIMINATORS.swap_base_output
        )
      ) {
        protocol = "SWAP_BASE_OUTPUT";
      } else {
        return null;
      }

      const accountInfo = extractAccountInfo(accounts, ACCOUNT_INDICES.cpmm);

      return buildSwapEvent(
        accountInfo.poolAddress,
        "RAYDIUM_CPMM_" + protocol,
        accountInfo.intoVault,
        accountInfo.outofVault,
        accountInfo.inputTokenAccount,
        accountInfo.outputTokenAccount,
        changedTokenMetas,
        instructionType
      );
    } catch (error) {
      console.error("Error parsing Raydium CPMM swap:", error);
      return null;
    }
  }

  private getAMMTokenMapping(
    type: string,
    intoVault: string,
    outofVault: string,
    changedTokenMetas: any[]
  ) {
    let tokenIn: any;
    let tokenOut: any;
    if (type === "SWAP_BASE_IN") {
      tokenIn = changedTokenMetas.find(
        (account) => account.addr === outofVault
      );
      tokenOut = changedTokenMetas.find(
        (account) => account.addr === intoVault
      );
    } else if (type === "SWAP_BASE_OUT") {
      tokenIn = changedTokenMetas.find((account) => account.addr === intoVault);
      tokenOut = changedTokenMetas.find(
        (account) => account.addr === outofVault
      );
    }

    return { tokenIn, tokenOut };
  }
}
