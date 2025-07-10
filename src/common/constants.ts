// Token Address
export const WSOL_ADDRESS = "So11111111111111111111111111111111111111112";
export const USDC_ADDRESS = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDT_ADDRESS = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";
export const RAY_ADDRESS = "4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R";
export const SRM_ADDRESS = "SRMuApVNdxXokk5GT7XD5cUUgXMBCoAz2LHeuAoKWRt";
export const ORCA_ADDRESS = "orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE";

// System Program ID
export const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";

export const SPL_ASSOCIATED_TOKEN_PROGRAM_ID =
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
export const SPL_TOKEN_PROGRAM_ID = {
  TOKEN_PROGRAM: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA",
  TOKEN_2022_PROGRAM: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
};

export const SOLANA_RPC_ENDPOINTS = {
  MAINNET: "https://api.mainnet-beta.solana.com",
  DEVNET: "https://api.devnet.solana.com",
  LOCALNET: "http://localhost:8899",
} as const;

// Cache Config
export const CACHE_CONFIG = {
  POOL_CACHE_TTL: 24 * 60 * 60 * 1000,
  TOKEN_CACHE_TTL: 7 * 24 * 60 * 60 * 1000,
  MAX_CACHE_SIZE: 10000,
} as const;
