import { z } from "zod";

export const MAX_ENVIRONMENT_VARIABLES = 64;
export const MAX_ENVIRONMENT_VARIABLE_VALUE_LENGTH = 4096;

const KEY_PATTERN = /^[A-Za-z_][A-Za-z0-9_]*$/;

const RESERVED_KEYS = new Set([
  "PATH",
  "HOME",
  "CI",
  "COREPACK_ENABLE_DOWNLOAD_PROMPT",
  "COREPACK_ENABLE_STRICT",
]);

export const environmentVariableKeySchema = z
  .string()
  .trim()
  .min(1, "Key is required")
  .max(128, "Key must be at most 128 characters")
  .regex(
    KEY_PATTERN,
    "Letters, digits and underscores only; can't start with a digit",
  )
  .refine((key) => !RESERVED_KEYS.has(key), {
    message: "This key is reserved by the build environment",
  });

export const environmentVariableValueSchema = z
  .string()
  .max(
    MAX_ENVIRONMENT_VARIABLE_VALUE_LENGTH,
    `Value must be at most ${MAX_ENVIRONMENT_VARIABLE_VALUE_LENGTH} characters`,
  );

const DOTENV_LINE = /^\s*(?:export\s+)?([^=\s#]+)\s*=\s*(.*)?\s*$/;

const unquote = (value: string): string => {
  const trimmed = value.trim();
  const quote = trimmed[0];

  if (
    trimmed.length >= 2 &&
    (quote === '"' || quote === "'") &&
    trimmed.endsWith(quote)
  ) {
    const inner = trimmed.slice(1, -1);
    return quote === '"' ? inner.replaceAll("\\n", "\n") : inner;
  }

  const commentIndex = trimmed.indexOf(" #");

  return commentIndex === -1 ? trimmed : trimmed.slice(0, commentIndex).trim();
};

export const parseDotEnv = (
  contents: string,
): { key: string; value: string }[] => {
  const entries = new Map<string, string>();

  for (const line of contents.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) {
      continue;
    }

    const match = DOTENV_LINE.exec(line);

    if (match) {
      entries.set(match[1], unquote(match[2] ?? ""));
    }
  }

  return Array.from(entries, ([key, value]) => ({ key, value }));
};

export const looksLikeDotEnv = (text: string): boolean =>
  text.includes("=") && (text.includes("\n") || DOTENV_LINE.test(text));
