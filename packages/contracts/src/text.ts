import { CHAT_MAX_LENGTH, NICKNAME_MAX, NICKNAME_MIN } from "./constants.ts";

// Control characters, zero-width / bidi override characters.
const INVISIBLE = /[\u0000-\u001F\u007F-\u009F​-‏‪-‮⁠-⁤﻿]/g;

export function sanitizeText(input: string, maxLen = CHAT_MAX_LENGTH): string {
  return input.normalize("NFKC").replace(INVISIBLE, "").replace(/\s+/g, " ").trim().slice(0, maxLen);
}

const NICK_OK = /^[\p{L}\p{N}][\p{L}\p{N} _.\-]*$/u;

export type NicknameResult = { ok: true; value: string } | { ok: false; reason: string };

export function validateNickname(raw: unknown): NicknameResult {
  if (typeof raw !== "string") return { ok: false, reason: "Nickname must be text." };
  const value = sanitizeText(raw, 64);
  if (value.length < NICKNAME_MIN || value.length > NICKNAME_MAX) {
    return { ok: false, reason: `Nickname must be ${NICKNAME_MIN}-${NICKNAME_MAX} characters.` };
  }
  if (!NICK_OK.test(value)) {
    return { ok: false, reason: "Use letters, numbers, spaces, dot, dash or underscore." };
  }
  return { ok: true, value };
}
