import type { ZodiacId } from './zodiac';

export type AnswerResult = 'incomplete' | 'correct' | 'wrong';

/** Answers are ordered sequences of zodiac signs picked on the lantern ring. */
export function checkAnswer(expected: readonly ZodiacId[], given: readonly ZodiacId[]): AnswerResult {
  if (given.length < expected.length) return 'incomplete';
  const matches = given.length === expected.length && expected.every((id, i) => given[i] === id);
  return matches ? 'correct' : 'wrong';
}

/**
 * Pause after a wrong answer, doubling each time (1.5s, 3s, 6s, 12s, then 15s),
 * so trying sequences at random is slower than solving the scene.
 */
export function cooldownMs(wrongCount: number): number {
  if (wrongCount <= 0) return 0;
  return Math.min(15_000, 1_500 * 2 ** (wrongCount - 1));
}
