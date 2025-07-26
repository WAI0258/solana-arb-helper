import type { StandardSwapEvent } from "../../common/types";

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
    inputVault: accounts[indices[3]!]?.toBase58() || "",
    outputVault: accounts[indices[4]!]?.toBase58() || "",
  };
};
export const buildSwapEvent = (
  poolAddress: string,
  protocol: string,
  inputVault: string,
  outputVault: string,
  inputTokenAccount: string,
  outputTokenAccount: string,
  innerTokenAccounts: any[],
  instructionIndex: number
): StandardSwapEvent | null => {
  const tokenIn = innerTokenAccounts.find(
    (account) => account.addr === inputVault
  );
  const tokenOut = innerTokenAccounts.find(
    (account) => account.addr === outputVault
  );

  return {
    poolAddress,
    protocol,
    tokenIn: tokenIn?.mint,
    tokenOut: tokenOut?.mint,
    amountIn: getAbsoluteAmount(tokenIn?.amount),
    amountOut: getAbsoluteAmount(tokenOut?.amount),
    sender: inputTokenAccount,
    recipient: outputTokenAccount,
    instructionIndex,
  };
};

export const getAbsoluteAmount = (amount: bigint | undefined): bigint => {
  if (!amount) return 0n;
  return amount > 0n ? amount : -amount;
};
