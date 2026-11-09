/** Stable pattern ids. Names and explanations live in the translation files under `patterns.<id>`. */
export const PATTERN_IDS = [
  'all_or_nothing',
  'overgeneralisation',
  'mental_filter',
  'disqualifying_positive',
  'mind_reading',
  'fortune_telling',
  'catastrophising',
  'magnification_minimisation',
  'emotional_reasoning',
  'should_statements',
  'labelling',
  'personalisation_blame',
] as const;
export type PatternId = (typeof PATTERN_IDS)[number];
