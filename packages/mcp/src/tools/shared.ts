/**
 * Shared MCP tool plumbing: JSON text results and readable error mapping.
 */

export type ToolTextContent = { type: 'text'; text: string };

export type ToolTextResult = {
  content: ToolTextContent[];
  isError?: boolean;
};

export function jsonResult(payload: unknown): ToolTextResult {
  return { content: [{ type: 'text', text: JSON.stringify(payload) }] };
}

/** Human-readable message; never leaks a stack trace to the client. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) return error.message;
  if (typeof error === 'string' && error.trim().length > 0) return error;
  return 'Unknown Wi-Fi scan error.';
}

export function errorResult(error: unknown): ToolTextResult {
  return {
    content: [{ type: 'text', text: JSON.stringify({ error: errorMessage(error) }) }],
    isError: true,
  };
}

/** Wrap a payload producer so failures become `isError` results. */
export function withErrorHandling<Args>(
  handler: (args: Args) => Promise<unknown>
): (args: Args) => Promise<ToolTextResult> {
  return async (args: Args) => {
    try {
      return jsonResult(await handler(args));
    } catch (error) {
      return errorResult(error);
    }
  };
}
