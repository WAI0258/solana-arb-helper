import type { DexProgram } from "../common/dex";
import type { StandardSwapEvent } from "../common/types";
import { RaydiumSwapParser } from "./swap-parsers/RaydiumSwapParser";
import { OrcaSwapParser } from "./swap-parsers/OrcaSwapParser";
import { MeteoraSwapParser } from "./swap-parsers/MeteoraSwapParser";
import { SolFiSwapParser } from "./swap-parsers/SolFiSwapParser";
import { PumpFunSwapParser } from "./swap-parsers/PumpFunSwapParser";
import { LifinitySwapParser } from "./swap-parsers/LifinitySwapParser";

export class SwapParser {
  private raydiumParser = new RaydiumSwapParser();
  private orcaParser = new OrcaSwapParser();
  private meteoraParser = new MeteoraSwapParser();
  private solfiParser = new SolFiSwapParser();
  private pumpFunParser = new PumpFunSwapParser();
  private lifinityParser = new LifinitySwapParser();
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
          return this.raydiumParser.parseSwap(
            instructionData,
            accounts,
            innerTokenAccounts,
            instructionIndex,
            dexProgram.dexProgramInfo?.type
          );
        case "ORCA":
          return this.orcaParser.parseSwap(
            instructionData,
            accounts,
            innerTokenAccounts,
            instructionIndex,
            dexProgram.dexProgramInfo?.type
          );
        case "serum":
          // Serum swap implementation not available
          return null;
        case "METEORA":
          return this.meteoraParser.parseSwap(
            instructionData,
            accounts,
            innerTokenAccounts,
            instructionIndex,
            dexProgram.dexProgramInfo?.type
          );
        case "SOLFI":
          return this.solfiParser.parseSwap(
            instructionData,
            accounts,
            innerTokenAccounts,
            instructionIndex
          );
        case "PUMPFUN":
          return this.pumpFunParser.parseSwap(
            instructionData,
            accounts,
            innerTokenAccounts,
            instructionIndex,
            dexProgram.dexProgramInfo?.type
          );
        case "LIFINITY":
          return this.lifinityParser.parseSwap(
            instructionData,
            accounts,
            innerTokenAccounts,
            instructionIndex,
            dexProgram.dexProgramInfo?.type
          );
        default:
          return null;
      }
    } catch (error) {
      console.error("Error parsing Solana swap event:", error);
      return null;
    }
  }
}
