import { TokenListProvider } from "@solana/spl-token-registry";

export const getTokenInfo = async (mintAddress: string) => {
  const tokens = await new TokenListProvider().resolve();
  const tokenMap = tokens.getList().reduce((map, token) => {
    map.set(token.address, token);
    return map;
  }, new Map());
  return tokenMap.get(mintAddress);
};
