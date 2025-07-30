import type { DexProgram } from "../common/dex";
import type { StandardSwapEvent } from "../common/types";
import { SwapParserFactory } from "./swap-parsers/SwapParserFactory";

export class SwapParser {
  public parseSolanaSwapEvent(
    dexProgram: {
      dexProgram: string;
      dexProgramInfo: DexProgram | null;
    },
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string
  ): StandardSwapEvent | null {
    try {
      const parser = SwapParserFactory.getParser(dexProgram.dexProgram);
      if (!parser) {
        return null;
      }

      return parser.parseSwap(
        instructionData,
        accounts,
        changedTokenMetas,
        instructionType,
        dexProgram.dexProgramInfo?.type
      );
    } catch (error) {
      console.error("Error parsing Solana swap event:", error);
      return null;
    }
  }

  public getSupportedProtocols(): string[] {
    return SwapParserFactory.getSupportedProtocols();
  }
}
