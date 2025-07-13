import type { ParsedTransactionWithMeta } from "@solana/web3.js";
import type { TokenBalanceChange } from "../../common/types";
import { AccountProcessor } from "./account";
import bs58 from "bs58";

export interface InstructionInfo {
  programId: any;
  data: Buffer;
  accounts: any[];
  instructionIndex: number;
}

export class InstructionProcessor {
  private accountProcessor: AccountProcessor;

  constructor() {
    this.accountProcessor = new AccountProcessor();
  }

  /**
   * Get all instructions from a transaction
   */
  public getAllInstructions(tx: ParsedTransactionWithMeta): InstructionInfo[] {
    const innerInstructions = tx.meta?.innerInstructions || [];
    const allInstructions: InstructionInfo[] = [];

    for (const innerInstruction of innerInstructions) {
      if (!innerInstruction) continue;

      for (let j = 0; j < innerInstruction.instructions.length; j++) {
        const instruction = innerInstruction.instructions[j];
        if (!instruction) continue;

        const instructionInfo = this.parseInstruction(instruction, j);
        if (instructionInfo) {
          // Resolve programId if it's an index
          if (typeof instructionInfo.programId === "number") {
            const resolvedProgramId =
              this.accountProcessor.getAccountKeyByIndex(
                tx,
                instructionInfo.programId
              );
            if (resolvedProgramId) {
              instructionInfo.programId = resolvedProgramId;
            }
          }

          // Resolve account indices if they are numbers
          if (
            instructionInfo.accounts.length > 0 &&
            typeof instructionInfo.accounts[0] === "number"
          ) {
            const resolvedAccounts = instructionInfo.accounts
              .map((accountIndex: number) =>
                this.accountProcessor.getAccountKeyByIndex(tx, accountIndex)
              )
              .filter((account) => account !== null);
            instructionInfo.accounts = resolvedAccounts;
          }

          allInstructions.push(instructionInfo);
        }
      }
    }

    return allInstructions;
  }

  /**
   * Parse individual instruction
   */
  private parseInstruction(
    instruction: any,
    index: number
  ): InstructionInfo | null {
    try {
      let dataBuffer = Buffer.from([]);
      if ("data" in instruction && instruction.data) {
        if (
          typeof instruction.data === "string" &&
          this.isBase58(instruction.data)
        ) {
          try {
            dataBuffer = Buffer.from(bs58.decode(instruction.data));
          } catch {
            dataBuffer = Buffer.from(instruction.data, "base64");
          }
        } else {
          dataBuffer = Buffer.from(instruction.data);
        }
      }

      let programId = instruction.programId;
      if ("programIdIndex" in instruction) {
        programId = instruction.programIdIndex;
      }

      return {
        programId,
        data: dataBuffer,
        accounts: instruction.accounts || [],
        instructionIndex: index,
      };
    } catch (error) {
      console.error(`Error parsing instruction at index ${index}:`, error);
      return null;
    }
  }

  /**
   * Check if a string is base58 encoded
   */
  private isBase58(str: string): boolean {
    const base58Chars =
      "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
    return str.split("").every((char) => base58Chars.includes(char));
  }

  /**
   * Get program ID as string
   */
  public getProgramIdString(instruction: InstructionInfo): string {
    if (instruction.programId && instruction.programId.toBase58) {
      return instruction.programId.toBase58();
    } else if (typeof instruction.programId === "string") {
      return instruction.programId;
    } else {
      throw new Error("Unknown programId format");
    }
  }

  /**
   * Get account addresses
   */
  public getAccountAddresses(instruction: InstructionInfo): string[] {
    return instruction.accounts.map((account) => {
      if (account && account.toBase58) {
        return account.toBase58();
      } else if (typeof account === "string") {
        return account;
      } else {
        throw new Error("Unknown account format");
      }
    });
  }

  /**
   * Filter token accounts for instruction
   */
  public filterTokenAccountsForInstruction(
    instruction: InstructionInfo,
    tokenAccounts: TokenBalanceChange[]
  ): TokenBalanceChange[] {
    const accountAddresses = this.getAccountAddresses(instruction);
    return tokenAccounts.filter((account) =>
      accountAddresses.includes(account.addr)
    );
  }
}
