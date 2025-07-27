import type {
  StandardSwapEvent,
  EdgeInfo,
  ArbitrageCycle,
} from "../common/types";

export class ArbitrageDetector {
  public buildSolanaSwapGraph(
    swapEvents: StandardSwapEvent[]
  ): Map<string, Map<string, EdgeInfo>> {
    const graph = new Map<string, Map<string, EdgeInfo>>();

    for (const swap of swapEvents) {
      if (!graph.has(swap.tokenIn)) {
        graph.set(swap.tokenIn, new Map());
      }
      const edges = graph.get(swap.tokenIn)!;

      const existingEdge = edges.get(swap.tokenOut);
      if (existingEdge) {
        edges.set(swap.tokenOut, {
          amountIn: existingEdge.amountIn + swap.amountIn,
          amountOut: existingEdge.amountOut + swap.amountOut,
          poolAddress: swap.poolAddress,
          protocol: swap.protocol,
        });
      } else {
        edges.set(swap.tokenOut, {
          amountIn: swap.amountIn,
          amountOut: swap.amountOut,
          poolAddress: swap.poolAddress,
          protocol: swap.protocol,
        });
      }
    }

    return graph;
  }

  public calculateSolanaSwapGraphTokenChanges(
    graph: Map<string, Map<string, EdgeInfo>>
  ): Map<string, bigint> {
    const tokenChanges = new Map<string, bigint>();

    for (const [from, edges] of graph.entries()) {
      if (!tokenChanges.has(from)) {
        tokenChanges.set(from, 0n);
      }

      for (const [to, edgeInfo] of edges.entries()) {
        if (!tokenChanges.has(to)) {
          tokenChanges.set(to, 0n);
        }

        const fromChange = tokenChanges.get(from)!;
        tokenChanges.set(from, fromChange - edgeInfo.amountIn);

        const toChange = tokenChanges.get(to)!;
        tokenChanges.set(to, toChange + edgeInfo.amountOut);
      }
    }

    return tokenChanges;
  }

  public findSolanaArbitrageCycles(
    swapEvents: StandardSwapEvent[]
  ): ArbitrageCycle[] {
    const cycles: ArbitrageCycle[] = [];
    const graph = new Map<string, Map<string, EdgeInfo>>();

    for (const swap of swapEvents) {
      // add new edge
      if (!graph.has(swap.tokenIn)) {
        graph.set(swap.tokenIn, new Map());
      }
      const edges = graph.get(swap.tokenIn)!;

      const existingEdge = edges.get(swap.tokenOut);
      if (existingEdge) {
        edges.set(swap.tokenOut, {
          amountIn: existingEdge.amountIn + swap.amountIn,
          amountOut: existingEdge.amountOut + swap.amountOut,
          poolAddress: swap.poolAddress,
          protocol: swap.protocol,
        });
      } else {
        edges.set(swap.tokenOut, {
          amountIn: swap.amountIn,
          amountOut: swap.amountOut,
          poolAddress: swap.poolAddress,
          protocol: swap.protocol,
        });
      }

      // find cycle
      const cycle = this.findSolanaCycle(
        graph,
        swap.tokenIn,
        swap.tokenIn,
        new Set(),
        [],
        []
      );

      if (cycle) {
        cycles.push(cycle);
        // remove cycle edges
        for (const edge of cycle.edges) {
          const edges = graph.get(edge.tokenIn);
          if (edges) {
            edges.delete(edge.tokenOut);
            // no outgoing edges, remove node
            if (edges.size === 0) {
              graph.delete(edge.tokenIn);
            }
          }
        }
      }
    }

    return cycles;
  }

  private findSolanaCycle(
    graph: Map<string, Map<string, EdgeInfo>>,
    startToken: string,
    currentToken: string,
    visited: Set<string>,
    path: string[],
    currentEdges: Array<{
      tokenIn: string;
      tokenOut: string;
      amountIn: bigint;
      amountOut: bigint;
      poolAddress: string;
      protocol: string;
    }>
  ): ArbitrageCycle | null {
    if (path.length > 0 && currentToken === startToken) {
      // calculate token changes
      const tokenChanges = new Map<string, bigint>();
      let profitToken: string | undefined;
      let maxProfit = 0n;

      // specific to each token
      for (const edge of currentEdges) {
        const currentIn = tokenChanges.get(edge.tokenIn) || 0n;
        const currentOut = tokenChanges.get(edge.tokenOut) || 0n;
        tokenChanges.set(edge.tokenIn, currentIn - edge.amountIn);
        tokenChanges.set(edge.tokenOut, currentOut + edge.amountOut);
      }

      // find max profit token
      for (const [token, change] of tokenChanges.entries()) {
        if (change > maxProfit) {
          maxProfit = change;
          profitToken = token;
        }
      }

      // check if there is any negative change
      for (const [token, change] of tokenChanges.entries()) {
        if (change < 0n) {
          return null;
        }
      }

      if (profitToken && maxProfit > 0n) {
        return {
          edges: currentEdges.map((edge) => ({
            tokenIn: edge.tokenIn,
            tokenOut: edge.tokenOut,
            amountIn: edge.amountIn.toString(),
            amountOut: edge.amountOut.toString(),
            poolAddress: edge.poolAddress,
            protocol: edge.protocol,
          })),
          profitToken,
          profitAmount: maxProfit.toString(),
          tokenChanges: this.formatSolanaTokenChanges(tokenChanges),
        };
      }
      return null;
    }

    if (visited.has(currentToken)) {
      return null;
    }

    visited.add(currentToken);
    path.push(currentToken);

    const graphEdges = graph.get(currentToken);
    if (graphEdges) {
      for (const [nextToken, edgeInfo] of graphEdges.entries()) {
        const cycle = this.findSolanaCycle(
          graph,
          startToken,
          nextToken,
          visited,
          path,
          [
            ...currentEdges,
            {
              tokenIn: currentToken,
              tokenOut: nextToken,
              amountIn: edgeInfo.amountIn,
              amountOut: edgeInfo.amountOut,
              poolAddress: edgeInfo.poolAddress,
              protocol: edgeInfo.protocol,
            },
          ]
        );
        if (cycle) {
          return cycle;
        }
      }
    }

    visited.delete(currentToken);
    path.pop();
    return null;
  }

  public validateSolanaSwapGraphTokenChanges(
    graph: Map<string, Map<string, EdgeInfo>>
  ): { isValid: boolean; profitToken?: string } {
    const tokenChanges = this.calculateSolanaSwapGraphTokenChanges(graph);

    let positiveCount = 0;
    let profitToken: string | undefined;

    // check if there is any negative change
    for (const [token, change] of tokenChanges.entries()) {
      if (change < 0n) {
        return { isValid: false };
      }
      if (change > 0n) {
        positiveCount++;
        if (!profitToken) {
          profitToken = token;
        }
      }
    }
    return {
      isValid: positiveCount > 0,
      profitToken,
    };
  }

  public formatSolanaTokenChanges(
    tokenChanges: Map<string, bigint> | Record<string, string>
  ): Record<string, string> {
    if (tokenChanges instanceof Map) {
      return Object.fromEntries(
        Array.from(tokenChanges.entries()).map(([token, change]) => [
          token,
          change.toString(),
        ])
      );
    }
    return tokenChanges;
  }

  public getSolanaArbitrageInfo(swapEvents: StandardSwapEvent[]): {
    arbitrageCycles: ArbitrageCycle[];
    isArbitrage: boolean;
  } {
    const arbitrageCycles = this.findSolanaArbitrageCycles(swapEvents);
    const flag = this.validateSolanaSwapGraphTokenChanges(
      this.buildSolanaSwapGraph(swapEvents)
    );

    const isArbitrage = arbitrageCycles.length > 0 && flag.isValid;
    return {
      arbitrageCycles,
      isArbitrage,
    };
  }
}
