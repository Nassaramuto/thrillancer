import type { Quality } from "../world/game";

const read = (k: string): string | null => {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
};
const write = (k: string, v: string) => {
  try {
    localStorage.setItem(k, v);
  } catch {
    /* private mode or blocked storage: preference just does not persist */
  }
};
export const prefs = {
  quality: (): Quality => (read("zg.quality") === "low" ? "low" : "high"),
  setQuality: (q: Quality) => write("zg.quality", q),
  nickname: () => read("zg.nick") ?? "",
  setNickname: (n: string) => write("zg.nick", n),
};
