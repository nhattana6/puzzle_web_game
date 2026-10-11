import type { ZodiacId } from './zodiac';

export type AnswerResult = 'incomplete' | 'correct' | 'wrong';

/** Answers are ordered sequences of zodiac signs picked on the lantern ring. */
export function checkAnswer(expected: readonly ZodiacId[], given: readonly ZodiacId[]): AnswerResult {
  if (given.length < expected.length) return 'incomplete';
  const matches = given.length === expected.length && expected.every((id, i) => given[i] === id);
  return matches ? 'correct' : 'wrong';
}
