import { parseDocument } from "yaml";
import { z } from "zod";

import type { OpenApiDocument } from "./types";

const openApiDocumentSchema = z
  .object({
    openapi: z
      .string()
      .regex(/^3\.(0|1)\.\d+$/, "only OpenAPI 3.0 and 3.1 are supported"),
    info: z
      .object({
        title: z.string().min(1),
        version: z.string().min(1),
      })
      .loose(),
    paths: z.record(z.string(), z.unknown()),
    components: z
      .object({
        schemas: z.record(z.string(), z.unknown()).optional(),
      })
      .loose()
      .optional(),
  })
  .loose();

export class ContractParseError extends Error {
  readonly code: "invalid_syntax" | "invalid_openapi";
  readonly issues: string[];

  constructor(
    code: ContractParseError["code"],
    message: string,
    issues: string[],
  ) {
    super(message);
    this.name = "ContractParseError";
    this.code = code;
    this.issues = issues;
  }
}

export function parseContract(source: string): OpenApiDocument {
  const document = parseDocument(source, {
    prettyErrors: true,
    uniqueKeys: true,
  });

  if (document.errors.length > 0) {
    throw new ContractParseError(
      "invalid_syntax",
      "The contract is not valid JSON or YAML.",
      document.errors.map((error) => error.message),
    );
  }

  let parsed: unknown;
  try {
    parsed = document.toJS({ maxAliasCount: 20 });
  } catch (error) {
    throw new ContractParseError(
      "invalid_syntax",
      "The contract could not be safely expanded.",
      [error instanceof Error ? error.message : "YAML expansion failed."],
    );
  }

  const result = openApiDocumentSchema.safeParse(parsed);

  if (!result.success) {
    throw new ContractParseError(
      "invalid_openapi",
      "The document is not a supported OpenAPI contract.",
      result.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join(".") : "document";
        return `${path}: ${issue.message}`;
      }),
    );
  }

  return result.data as OpenApiDocument;
}
