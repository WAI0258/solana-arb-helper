import type { StandardSwapEvent } from "../../common/types";
import { RaydiumSwapParser } from "./RaydiumSwapParser";
import { OrcaSwapParser } from "./OrcaSwapParser";
import { MeteoraSwapParser } from "./MeteoraSwapParser";
import { SolFiSwapParser } from "./SolFiSwapParser";
import { PumpFunSwapParser } from "./PumpFunSwapParser";
import { LifinitySwapParser } from "./LifinitySwapParser";
import { OpenBookParser } from "./OpenBookParser";

export interface BaseSwapParser {
  parseSwap(
    instructionData: Buffer,
    accounts: any[],
    changedTokenMetas: any[],
    instructionType: string,
    dexType?: string
  ): StandardSwapEvent | null;
}

export class SwapParserFactory {
  private static parsers = new Map<string, new () => BaseSwapParser>();
  private static instances = new Map<string, BaseSwapParser>();

  static {
    SwapParserFactory.register("RAYDIUM", RaydiumSwapParser);
    SwapParserFactory.register("ORCA", OrcaSwapParser);
    SwapParserFactory.register("METEORA", MeteoraSwapParser);
    SwapParserFactory.register("SOLFI", SolFiSwapParser);
    SwapParserFactory.register("PUMPFUN", PumpFunSwapParser);
    SwapParserFactory.register("LIFINITY", LifinitySwapParser);
    SwapParserFactory.register("OPENBOOK", OpenBookParser);
  }

  static register(
    protocol: string,
    parserClass: new () => BaseSwapParser
  ): void {
    this.parsers.set(protocol, parserClass);
  }

  static getParser(protocol: string): BaseSwapParser | null {
    if (!this.instances.has(protocol)) {
      const ParserClass = this.parsers.get(protocol);
      if (ParserClass) {
        this.instances.set(protocol, new ParserClass());
      }
    }
    return this.instances.get(protocol) || null;
  }

  static getSupportedProtocols(): string[] {
    return Array.from(this.parsers.keys());
  }

  static clearInstances(): void {
    this.instances.clear();
  }
}
