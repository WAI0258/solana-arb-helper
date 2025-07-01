// Solana Instruction Data Decoder
// 不依赖 Gill，专注于手动解析 instruction data

async function decodeInstructionData() {
  // 要解码的 instruction data
  const instructionData =
    "f8c69e91e17587c81bb9021100000000ffffffffffffffffdf97e479d64893b7090000000000000000";

  console.log("=== Solana Instruction Data Decoder ===");
  console.log("Raw instruction data:", instructionData);
  console.log("Data length:", instructionData.length / 2, "bytes");

  // 转换为 Buffer
  const data = Buffer.from(instructionData, "hex");
  console.log("Buffer length:", data.length, "bytes");

  // 1. 基本解析 - 按字节分析
  console.log("\n=== Basic Byte Analysis ===");
  console.log("Full data as hex:", data.toString("hex"));

  // 分析前8字节（通常是指令类型）
  const instructionType = data.slice(0, 8);
  console.log(
    "Instruction type (first 8 bytes):",
    instructionType.toString("hex")
  );

  // 尝试解析为不同的数据类型
  console.log(
    "As u64 (little endian):",
    data.slice(0, 8).readBigUInt64LE().toString()
  );
  console.log(
    "As u64 (big endian):",
    data.slice(0, 8).readBigUInt64BE().toString()
  );

  // 2. 尝试解析为常见的 DEX 指令格式
  console.log("\n=== DEX Instruction Format Analysis ===");

  if (data.length >= 24) {
    // 假设格式：8字节指令类型 + 8字节amountIn + 8字节amountOut
    const amountIn = data.slice(8, 16).readBigUInt64LE();
    const amountOut = data.slice(16, 24).readBigUInt64LE();

    console.log("Amount In (bytes 8-15):", amountIn.toString());
    console.log("Amount Out (bytes 16-23):", amountOut.toString());

    // 检查是否是合理的数值
    console.log("Amount In (hex):", data.slice(8, 16).toString("hex"));
    console.log("Amount Out (hex):", data.slice(16, 24).toString("hex"));
  }

  // 3. 详细字节分析
  console.log("\n=== Detailed Byte Analysis ===");

  // 分析每个8字节块
  const numBlocks = Math.floor(data.length / 8);
  console.log(`Found ${numBlocks} complete 8-byte blocks`);

  for (let i = 0; i < numBlocks; i++) {
    const block = data.slice(i * 8, (i + 1) * 8);
    const valueLE = block.readBigUInt64LE();
    const valueBE = block.readBigUInt64BE();

    console.log(`Block ${i + 1} (bytes ${i * 8}-${(i + 1) * 8 - 1}):`);
    console.log(`  Hex: ${block.toString("hex")}`);
    console.log(`  Little Endian: ${valueLE.toString()}`);
    console.log(`  Big Endian: ${valueBE.toString()}`);

    // 检查是否是特殊值
    if (valueLE === 0n) {
      console.log(`  Note: Zero value`);
    } else if (valueLE === 0xffffffffffffffffn) {
      console.log(`  Note: All ones (possibly -1 or max value)`);
    }
  }

  // 4. 尝试识别具体的 DEX 指令类型
  console.log("\n=== DEX Instruction Type Detection ===");

  // 常见的 DEX 指令类型（这些需要根据实际程序调整）
  const knownInstructions = {
    // Raydium V4 可能的指令类型
    "675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8": {
      swap: "0x9b7b4f8b", // 示例，需要根据实际程序调整
      addLiquidity: "0x1b8b4f8b",
      removeLiquidity: "0x2b8b4f8b",
    },
    // Orca V2 可能的指令类型
    "9W959DqEETiGZocYWCQPaJ6sBmUzgfxXfqGeTEdp3aQP": {
      swap: "0x8b8b4f8b", // 示例
      addLiquidity: "0x9b8b4f8b",
      removeLiquidity: "0xab8b4f8b",
    },
  };

  // 检查指令类型是否匹配已知的 DEX 指令
  const discriminatorHex = instructionType.toString("hex");
  console.log("Looking for known instruction types...");
  console.log("Discriminator:", discriminatorHex);

  // 5. 手动解析尝试
  console.log("\n=== Manual Parsing Attempts ===");

  // 尝试不同的解析方式
  const parsingAttempts = [
    {
      name: "Swap with amounts",
      format:
        "8 bytes discriminator + 8 bytes amountIn + 8 bytes amountOut + 8 bytes minAmountOut",
      data:
        data.length >= 32
          ? {
              discriminator: data.slice(0, 8).toString("hex"),
              amountIn: data.slice(8, 16).readBigUInt64LE().toString(),
              amountOut: data.slice(16, 24).readBigUInt64LE().toString(),
              minAmountOut: data.slice(24, 32).readBigUInt64LE().toString(),
            }
          : null,
    },
    {
      name: "Swap with slippage",
      format:
        "8 bytes discriminator + 8 bytes amountIn + 8 bytes amountOut + 8 bytes slippage",
      data:
        data.length >= 32
          ? {
              discriminator: data.slice(0, 8).toString("hex"),
              amountIn: data.slice(8, 16).readBigUInt64LE().toString(),
              amountOut: data.slice(16, 24).readBigUInt64LE().toString(),
              slippage: data.slice(24, 32).readBigUInt64LE().toString(),
            }
          : null,
    },
    {
      name: "Complex swap",
      format: "8 bytes discriminator + multiple u64 fields",
      data:
        data.length >= 16
          ? {
              discriminator: data.slice(0, 8).toString("hex"),
              fields: Array.from(
                { length: Math.floor((data.length - 8) / 8) },
                (_, i) => ({
                  index: i,
                  value: data
                    .slice(8 + i * 8, 16 + i * 8)
                    .readBigUInt64LE()
                    .toString(),
                  hex: data.slice(8 + i * 8, 16 + i * 8).toString("hex"),
                })
              ),
            }
          : null,
    },
  ];

  parsingAttempts.forEach((attempt) => {
    console.log(`\n${attempt.name}:`);
    console.log(`  Format: ${attempt.format}`);
    if (attempt.data) {
      console.log(`  Parsed data:`, JSON.stringify(attempt.data, null, 2));
    } else {
      console.log(`  Data too short for this format`);
    }
  });

  // 6. 特殊值分析
  console.log("\n=== Special Value Analysis ===");

  // 检查是否有特殊值
  const specialValues = [];
  for (let i = 0; i < data.length; i += 8) {
    if (i + 8 <= data.length) {
      const value = data.slice(i, i + 8).readBigUInt64LE();
      if (value === 0xffffffffffffffffn) {
        specialValues.push({
          position: i,
          value: "0xFFFFFFFFFFFFFFFF (all ones, possibly -1 or max value)",
        });
      } else if (value === 0n) {
        specialValues.push({
          position: i,
          value: "0 (zero)",
        });
      }
    }
  }

  if (specialValues.length > 0) {
    console.log("Found special values:");
    specialValues.forEach((sv) => {
      console.log(`  At byte ${sv.position}: ${sv.value}`);
    });
  } else {
    console.log("No obvious special values found");
  }

  // 7. 总结和建议
  console.log("\n=== Summary and Recommendations ===");
  console.log("1. Instruction data length:", data.length, "bytes");
  console.log("2. Discriminator:", data.slice(0, 8).toString("hex"));
  console.log("3. Data appears to contain multiple u64 values");
  console.log("4. To get accurate decoding, you need:");
  console.log("   - The program ID that generated this instruction");
  console.log("   - The program's IDL (Interface Definition Language)");
  console.log("   - Or use Gill CLI to decompile the program");

  console.log("\n=== Next Steps ===");
  console.log("1. Identify the program ID from the transaction");
  console.log(
    "2. Use Gill CLI to decompile the program: gill decompile <program_id>"
  );
  console.log("3. Look for the instruction format in the decompiled code");
  console.log(
    "4. Match the discriminator with the program's instruction types"
  );

  // 8. 基于当前数据的推测
  console.log("\n=== Current Data Analysis ===");
  console.log("Based on the data structure, this appears to be:");
  console.log("- An Anchor program instruction (8-byte discriminator)");
  console.log("- Contains multiple u64 parameters");
  console.log("- Likely a swap or liquidity operation");
  console.log("- May include amounts, limits, or other numeric parameters");
}

// 运行解码
decodeInstructionData().catch(console.error);
