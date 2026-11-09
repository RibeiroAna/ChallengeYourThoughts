import { describe, expect, it } from '@jest/globals';

import en from '../locales/en.json';
import de from '../locales/de.json';
import ptBR from '../locales/pt-BR.json';
import { PATTERN_IDS } from '../../patterns';

type Tree = { [key: string]: string | Tree };

function keys(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === 'string' ? [`${prefix}${key}`] : keys(value, `${prefix}${key}.`),
  );
}

function placeholders(text: string) {
  return (text.match(/{{\s*\w+\s*}}/g) ?? []).sort();
}

function lookup(tree: Tree, path: string): string {
  return path.split('.').reduce<string | Tree>((node, key) => (node as Tree)[key], tree) as string;
}

describe.each([
  ['de', de],
  ['pt-BR', ptBR],
])('%s translation', (_, locale) => {
  it('has exactly the same keys as English', () => {
    expect(keys(locale).sort()).toEqual(keys(en).sort());
  });

  it('uses the same placeholders as English', () => {
    for (const key of keys(en)) {
      expect([key, placeholders(lookup(locale, key))]).toEqual([key, placeholders(lookup(en, key))]);
    }
  });
});

it('has a name, description and example for every thinking pattern', () => {
  for (const id of PATTERN_IDS) {
    expect(Object.keys((en.patterns as Tree)[id] as Tree).sort()).toEqual(['description', 'example', 'name']);
  }
});
