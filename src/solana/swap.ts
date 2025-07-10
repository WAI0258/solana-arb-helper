import type { DexProgram } from "../common/dex";
import type { StandardSwapEvent } from "../common/types";
import { RaydiumSwapParser } from "./swap-parsers/RaydiumSwapParser";
import { OrcaSwapParser } from "./swap-parsers/OrcaSwapParser";
import { SerumSwapParser } from "./swap-parsers/SerumSwapParser";
import { MeteoraSwapParser } from "./swap-parsers/MeteoraSwapParser";

export class SwapParser {
  private raydiumParser = new RaydiumSwapParser();
  private orcaParser = new OrcaSwapParser();
  private serumParser = new SerumSwapParser();
  private meteoraParser = new MeteoraSwapParser();
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
          return this.serumParser.parseSwap(
            instructionData,
            accounts,
            innerTokenAccounts,
            instructionIndex,
            dexProgram.dexProgramInfo?.type
          );
        case "METEORA":
          return this.meteoraParser.parseSwap(
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
