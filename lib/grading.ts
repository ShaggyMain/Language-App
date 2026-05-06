/**
 * Fuzzy answer grading. Treats `it's` and `its` as equivalent, ignores case
 * and trailing punctuation, and reports how close a wrong answer was so the
 * UI can show "almost!" feedback with a diff.
 */

export type GradeResult = {
  correct: boolean;
  score: number;
  closest: string;
  diff: DiffPart[];
  reason: "exact" | "normalized" | "near" | "wrong";
};

export type DiffPart = {
  text: string;
  kind: "same" | "missing" | "extra" | "changed";
};

const APOSTROPHES = /[‘’ʼ`´]/g;

const CONTRACTIONS: Array<[RegExp, string]> = [
  [/\bit's\b/g, "its"],
  [/\bdon'?t\b/g, "dont"],
  [/\bdoesn'?t\b/g, "doesnt"],
  [/\bdidn'?t\b/g, "didnt"],
  [/\bisn'?t\b/g, "isnt"],
  [/\baren'?t\b/g, "arent"],
  [/\bwasn'?t\b/g, "wasnt"],
  [/\bweren'?t\b/g, "werent"],
  [/\bhasn'?t\b/g, "hasnt"],
  [/\bhaven'?t\b/g, "havent"],
  [/\bhadn'?t\b/g, "hadnt"],
  [/\bcan'?t\b/g, "cant"],
  [/\bcouldn'?t\b/g, "couldnt"],
  [/\bwon'?t\b/g, "wont"],
  [/\bwouldn'?t\b/g, "wouldnt"],
  [/\bshan'?t\b/g, "shant"],
  [/\bshouldn'?t\b/g, "shouldnt"],
  [/\bmustn'?t\b/g, "mustnt"],
  [/\bi'?m\b/g, "im"],
  [/\byou're\b/g, "youre"],
  [/\bwe're\b/g, "were"],
  [/\bthey're\b/g, "theyre"],
  [/\bhe's\b/g, "hes"],
  [/\bshe's\b/g, "shes"],
  [/\bthat's\b/g, "thats"],
  [/\bthere's\b/g, "theres"],
  [/\bwhat's\b/g, "whats"],
  [/\bwho's\b/g, "whos"],
  [/\bi've\b/g, "ive"],
  [/\byou've\b/g, "youve"],
  [/\bwe've\b/g, "weve"],
  [/\bthey've\b/g, "theyve"],
  [/\bi'll\b/g, "ill"],
  [/\byou'll\b/g, "youll"],
  [/\bhe'll\b/g, "hell"],
  [/\bshe'll\b/g, "shell"],
  [/\bwe'll\b/g, "well"],
  [/\bthey'll\b/g, "theyll"],
  [/\bi'd\b/g, "id"],
  [/\byou'd\b/g, "youd"],
  [/\bhe'd\b/g, "hed"],
  [/\bshe'd\b/g, "shed"],
  [/\bwe'd\b/g, "wed"],
  [/\bthey'd\b/g, "theyd"],
];

export function normalize(input: string): string {
  let s = input.toLowerCase().trim();
  s = s.replace(APOSTROPHES, "'");
  for (const [re, repl] of CONTRACTIONS) s = s.replace(re, repl);
  s = s.replace(/[.,!?;:"()¡¿]/g, "");
  s = s.replace(/'/g, "");
  s = s.replace(/\s+/g, " ");
  return s;
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array(b.length + 1);
  const curr = new Array(b.length + 1);
  for (let j = 0; j <= b.length; j++) prev[j] = j;

  for (let i = 1; i <= a.length; i++) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j++) prev[j] = curr[j];
  }
  return prev[b.length];
}

export function similarity(a: string, b: string): number {
  if (!a.length && !b.length) return 1;
  const dist = levenshtein(a, b);
  return 1 - dist / Math.max(a.length, b.length);
}

/** Word-level diff using LCS — used to highlight where the user went wrong. */
export function wordDiff(user: string, target: string): DiffPart[] {
  const a = user.split(" ").filter(Boolean);
  const b = target.split(" ").filter(Boolean);
  const m = a.length;
  const n = b.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }

  const out: DiffPart[] = [];
  let i = m;
  let j = n;
  while (i > 0 && j > 0) {
    if (a[i - 1] === b[j - 1]) {
      out.unshift({ text: b[j - 1], kind: "same" });
      i--;
      j--;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      out.unshift({ text: a[i - 1], kind: "extra" });
      i--;
    } else {
      out.unshift({ text: b[j - 1], kind: "missing" });
      j--;
    }
  }
  while (i > 0) {
    out.unshift({ text: a[--i], kind: "extra" });
  }
  while (j > 0) {
    out.unshift({ text: b[--j], kind: "missing" });
  }
  return mergeAdjacentSwaps(out);
}

function mergeAdjacentSwaps(parts: DiffPart[]): DiffPart[] {
  const out: DiffPart[] = [];
  for (const part of parts) {
    const prev = out[out.length - 1];
    if (prev && prev.kind === "extra" && part.kind === "missing") {
      out[out.length - 1] = { text: `${part.text}→${prev.text}`, kind: "changed" };
    } else if (prev && prev.kind === "missing" && part.kind === "extra") {
      out[out.length - 1] = { text: `${prev.text}→${part.text}`, kind: "changed" };
    } else {
      out.push(part);
    }
  }
  return out;
}

export const NEAR_THRESHOLD = 0.7;
export const PASS_THRESHOLD = 0.92;

export function grade(userInput: string, accepted: string[]): GradeResult {
  if (!accepted.length) {
    throw new Error("grade(): at least one accepted answer is required");
  }
  const userNorm = normalize(userInput);
  const targets = accepted.map((a) => ({ raw: a, norm: normalize(a) }));

  if (targets.some((t) => t.raw === userInput.trim())) {
    return {
      correct: true,
      score: 1,
      closest: userInput.trim(),
      diff: [{ text: userInput.trim(), kind: "same" }],
      reason: "exact",
    };
  }
  if (targets.some((t) => t.norm === userNorm)) {
    const match = targets.find((t) => t.norm === userNorm)!;
    return {
      correct: true,
      score: 1,
      closest: match.raw,
      diff: [{ text: match.raw, kind: "same" }],
      reason: "normalized",
    };
  }

  let best = targets[0];
  let bestScore = 0;
  for (const t of targets) {
    const s = similarity(userNorm, t.norm);
    if (s > bestScore) {
      bestScore = s;
      best = t;
    }
  }

  return {
    correct: bestScore >= PASS_THRESHOLD,
    score: bestScore,
    closest: best.raw,
    diff: wordDiff(userNorm, best.norm),
    reason: bestScore >= PASS_THRESHOLD ? "normalized" : bestScore >= NEAR_THRESHOLD ? "near" : "wrong",
  };
}
