// DEX Program
export interface DexProgram {
  address: string;
  type: string;
  protocol?: string;
}

const DEX_PROGRAM_ID = {
  RAYDIUM: {
    STABLE_SWAP_AMM: {
      address: "5quBtoiQqxF9Jv6KYKctB59NT3gtJD2Y65kdnB1Uev3h",
      type: "CURVE",
      protocol: "Raydium Stable Swap AMM",
    },
    CONCENTRATED_LIQUIDITY: {
      address: "CAMMCzo5YL8w4VFF8KVHrK22GGUsp5VTaW7grrKgrWqK",
      type: "CLMM", // https://github.com/raydium-io/raydium-docs/blob/master/dev-resources/raydium-clmm-dev-doc.pdf
      protocol: "Raydium Concentrated Liquidity AMM",
    },
    LIQUIDITY_POOL_V4: {
      address: "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8",
      type: "AMM", // https://github.com/raydium-io/raydium-docs/blob/master/dev-resources/raydium-hybrid-amm-dev-doc.pdf
      protocol: "Raydium Liquidity Pool V4",
    },
    CPMM: {
      address: "CPMMoo8L3F4NbTegBCKVNunggL7H1ZpdTHKxQB5qKP1C",
      type: "CPMM",
      protocol: "Raydium CPMM",
    },
  },
  ORCA: {
    SWAP_V1: {
      address: "DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1",
      type: "CPMM_V1",
      protocol: "Orca Swap V1",
    },
    SWAP_V2: {
      address: "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP",
      type: "CPMM_V2",
      protocol: "Orca Swap V2",
    },
    WHIRLPOOL: {
      address: "whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc",
      type: "CLMM",
      protocol: "Orca Whirlpool",
    },
  },
  METEORA: {
    DLMM: {
      address: "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo",
      type: "DLMM",
      protocol: "Meteora DLMM",
    },
    DAMM: {
      address: "Eo7WjKq67rjJQSZxS6z3YkapzY3eMj6Xy8X5EQVn5UaB",
      type: "DAMM",
      protocol: "Meteora DAMM / Pool Program",
    },
    DAMM_V2: {
      address: "cpamdpZCGKUy5JxQXB4dcpGPiikHawvSWAd6mEn1sGG",
      type: "DAMM_V2",
      protocol: "Meteora DAMM V2",
    },
    DBC: {
      address: "dbcij3LWUppWqq96dh6gJWwBifmcGfLSB5D4DuSMaqN",
      type: "DynamicBondingCurve",
      protocol: "Meteora Dynamic Bonding Curve",
    },
  },
  PUMPFUN: {
    PumpFun: {
      address: "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P",
      type: "BondingCurve",
      protocol: "PumpFun Bonding Curve",
    },
    AMM: {
      address: "pAMMBay6oceH9fJKBRHGP5D4bD4sWpmSwMn52FMfXEA",
      type: "AMM",
      protocol: "PumpFun AMM",
    },
  },
  SOLFI: {
    SOLFI: {
      address: "SoLFiHG9TfgtdUXUjWAxi3LtvYuFyDLVhBWxdMZxyCe",
      type: "AMM",
      protocol: "SolFi AMM",
    },
  },
  SERUM: {
    DEX_V3: {
      address: "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin",
      type: "ORDERBOOK_DEX",
      protocol: "Serum DEX V3",
    },
  },
  SABER: {
    STABLE_SWAP: {
      address: "SSwpkEEcbUqx4vtoEByFjSkhKdCT862DNVb52nZg1UZ",
      type: "STABLE_SWAP",
      protocol: "Saber Stable Swap",
    },
  },
  ALDRIN: {
    AMM_V2: {
      address: "CURVGoZn8zycx6FXwwevgBTB2gVvdbGTEpvMJDbgs2t4",
      type: "AMM",
      protocol: "Aldrin AMM V2",
    },
  },
  MERCURIAL: {
    STABLE_SWAP: {
      address: "MERLuDFBMmsHnsBPZw2sDQZHvXFMwp8EdjudcU2HKky",
      type: "STABLE_SWAP",
      protocol: "Mercurial Stable Swap",
    },
  },
  JUPITER: {
    AGGREGATOR_V6: {
      address: "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4",
      type: "AGGREGATOR",
      protocol: "Jupiter Aggregator V6",
    },
  },
} as const;

const ALL_DEX_PROGRAM_IDS = Object.values(DEX_PROGRAM_ID).reduce<string[]>(
  (acc, dexPrograms) => {
    acc.push(...Object.values(dexPrograms).map((program) => program.address));
    return acc;
  },
  []
);

const ALL_DEX_NAMES = Object.keys(DEX_PROGRAM_ID);

export const isDexProgramId = (programId: string): boolean => {
  return ALL_DEX_PROGRAM_IDS.includes(programId);
};

export const getDexNameByProgramId = (programId: string): string => {
  for (const dexName of ALL_DEX_NAMES) {
    if (
      Object.values(
        DEX_PROGRAM_ID[dexName as keyof typeof DEX_PROGRAM_ID]
      ).some((program) => program.address === programId)
    ) {
      return dexName;
    }
  }
  return "Unknown";
};

export const getDexProgramIds = (
  dexName: keyof typeof DEX_PROGRAM_ID
): string[] => {
  return Object.values(DEX_PROGRAM_ID[dexName]).map(
    (program) => program.address
  );
};

export const getProgramInfo = (programId: string): DexProgram | null => {
  for (const dexPrograms of Object.values(DEX_PROGRAM_ID)) {
    for (const program of Object.values(dexPrograms)) {
      if (program.address === programId) {
        return program;
      }
    }
  }
  return null;
};

export const getProgramsByType = (type: string): DexProgram[] => {
  const programs: DexProgram[] = [];
  for (const dexPrograms of Object.values(DEX_PROGRAM_ID)) {
    for (const program of Object.values(dexPrograms)) {
      if (program.type === type) {
        programs.push(program);
      }
    }
  }
  return programs;
};

export const getDexPrograms = (
  dexName: keyof typeof DEX_PROGRAM_ID
): DexProgram[] => {
  return Object.values(DEX_PROGRAM_ID[dexName]);
};
