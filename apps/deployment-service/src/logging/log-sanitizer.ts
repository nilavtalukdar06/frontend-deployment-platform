const char = (codePoint: number): string => String.fromCharCode(codePoint);

const escapeCharacter = char(0x1b);
const controlSequenceIntroducer = char(0x9b);
const bell = char(0x07);

const ansiEscapePattern = new RegExp(
  `[${escapeCharacter}${controlSequenceIntroducer}][[\\]()#;?]*(?:(?:(?:;[-a-zA-Z\\d/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d/#&.:=?%@~_]*)*)?${bell}|(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~])`,
  "g",
);

const controlCharacterPattern = new RegExp(
  `[${char(0x00)}-${char(0x08)}${char(0x0b)}-${char(0x1f)}${char(0x7f)}]`,
  "g",
);

const minimumSecretLength = 8;

const redactionMask = "***";

export const stripTerminalFormatting = (text: string): string => {
  const withoutAnsi = text.replace(ansiEscapePattern, "");
  const lastCarriageReturn = withoutAnsi.lastIndexOf("\r");
  const visible =
    lastCarriageReturn >= 0
      ? withoutAnsi.slice(lastCarriageReturn + 1)
      : withoutAnsi;

  return visible.replace(controlCharacterPattern, "").trimEnd();
};

export const truncateUtf8 = (
  text: string,
  maxBytes: number,
): { text: string; truncated: boolean } => {
  const encoded = Buffer.from(text, "utf8");

  if (encoded.length <= maxBytes) {
    return { text, truncated: false };
  }

  let end = maxBytes;
  while (end > 0 && ((encoded[end] ?? 0) & 0xc0) === 0x80) {
    end -= 1;
  }

  return { text: encoded.subarray(0, end).toString("utf8"), truncated: true };
};

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export type Redactor = (text: string) => string;

export const createRedactor = (secrets: Iterable<string>): Redactor => {
  const candidates = new Set<string>();

  for (const secret of secrets) {
    if (secret.length < minimumSecretLength) {
      continue;
    }

    candidates.add(secret);
    candidates.add(encodeURIComponent(secret));
    candidates.add(Buffer.from(secret, "utf8").toString("base64"));
  }

  if (candidates.size === 0) {
    return (text) => text;
  }

  const pattern = new RegExp(
    [...candidates]
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp)
      .join("|"),
    "g",
  );

  return (text) => text.replace(pattern, redactionMask);
};
