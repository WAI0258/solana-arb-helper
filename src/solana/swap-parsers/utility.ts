import type { StandardSwapEvent, TokenBalanceChange } from "../../common/types";

export const isValidDiscriminator = (
  discriminator: number[],
  expected: number[]
): boolean => {
  return discriminator.every((byte, index) => byte === expected[index]);
};

export const extractAccountInfo = (accounts: any[], indices: number[]) => {
  return {
    poolAddress: accounts[indices[0]!]?.toBase58() || "",
    inputTokenAccount: accounts[indices[1]!]?.toBase58() || "",
    outputTokenAccount: accounts[indices[2]!]?.toBase58() || "",
    intoVault: accounts[indices[3]!]?.toBase58() || "",
    outofVault: accounts[indices[4]!]?.toBase58() || "",
  };
};
export const buildSwapEvent = (
  poolAddress: string,
  protocol: string,
  intoVault: string,
  outofVault: string,
  inputTokenAccount: string,
  outputTokenAccount: string,
  changedTokenMetas: any[],
  instructionType: string
): StandardSwapEvent | null => {
  let tokenIn;
  let tokenOut;
  let amountIn;
  let amountOut;
  if (instructionType === "inner") {
    const tokenInAccount = changedTokenMetas.find(
      (account) => account.addr === intoVault
    );
    const tokenOutAccount = changedTokenMetas.find(
      (account) => account.addr === outofVault
    );
    tokenIn = tokenInAccount?.mint;
    tokenOut = tokenOutAccount?.mint;
    amountIn = tokenInAccount?.amount;
    amountOut = tokenOutAccount?.amount;
  } else {
    const tokenInTransfer = changedTokenMetas.find(
      (account) => account.source === inputTokenAccount
    );
    const tokenOutTransfer = changedTokenMetas.find(
      (account) => account.destination === outputTokenAccount
    );
    tokenIn = tokenInTransfer?.mint;
    tokenOut = tokenOutTransfer?.mint;
    amountIn = tokenInTransfer?.amount;
    amountOut = tokenOutTransfer?.amount;
  }

  return {
    poolAddress,
    protocol,
    tokenIn: tokenIn,
    tokenOut: tokenOut,
    amountIn: getAbsoluteAmount(amountIn),
    amountOut: getAbsoluteAmount(amountOut),
    sender: inputTokenAccount,
    recipient: outputTokenAccount,
    instructionType,
  };
};

export const getAbsoluteAmount = (amount: bigint | undefined): bigint => {
  if (!amount) return 0n;
  return amount > 0n ? amount : -amount;
};
