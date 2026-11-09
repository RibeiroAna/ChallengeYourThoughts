import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import type { TFunction } from 'i18next';

import { evidenceTotal } from '../components/EvidenceBalance';
import { scaleBand } from '../components/BeliefSlider';
import type { EffectSide, EvidenceSide, ThoughtWithDetails } from '../db/thoughts';

/** Builds a Markdown document of one thought, in the current UI language. */
export function thoughtToMarkdown(thought: ThoughtWithDetails, t: TFunction, language: string): string {
  const belief = (value: number) => `${value}% (${t(`scale.belief.${scaleBand(value)}`)})`;
  const quote = (text: string) =>
    text
      .trim()
      .split('\n')
      .map((line) => `> ${line}`)
      .join('\n');
  const date = new Date(thought.createdAt).toLocaleString(language, { dateStyle: 'long', timeStyle: 'short' });

  const lines: string[] = [
    `# ${t('detail.title')}`,
    '',
    quote(thought.text),
    '',
    `*${t('detail.createdAt', { date })}*`,
    '',
    `**${t('detail.status')}:** ${t(`status.${thought.status}`)}`,
    '',
    `- **${t('detail.initialBelief')}:** ${belief(thought.initialBelief)}`,
  ];
  if (thought.finalBelief != null) lines.push(`- **${t('detail.finalBelief')}:** ${belief(thought.finalBelief)}`);

  const evidence = (side: EvidenceSide, heading: string) => {
    const items = thought.evidence.filter((e) => e.side === side && e.text.trim());
    lines.push('', `## ${heading}`, '');
    if (items.length === 0) lines.push(t('detail.none'));
    for (const e of items) {
      lines.push(`- ${e.text.trim()} — ${e.weight}% (${t(`scale.convincing.${scaleBand(e.weight, 1)}`)})`);
    }
  };

  if (thought.status !== 'saved' && thought.currentStep >= 3) {
    const effects = (side: EffectSide, heading: string) => {
      const items = thought.effects.filter((e) => e.side === side && e.text.trim());
      lines.push('', `## ${heading}`, '');
      if (items.length === 0) lines.push(t('detail.none'));
      for (const e of items) lines.push(`- ${e.text.trim()}`);
    };
    effects('positive', t('detail.positive'));
    effects('negative', t('detail.negative'));

    evidence('for', t('detail.evidenceFor'));
    evidence('against', t('detail.evidenceAgainst'));
    const forTotal = evidenceTotal(thought.evidence, 'for');
    const againstTotal = evidenceTotal(thought.evidence, 'against');
    if (thought.status === 'challenged' && forTotal + againstTotal > 0) {
      lines.push(
        '',
        `**${t('balance.label')}:** ${t('balance.for', { value: forTotal })} · ${t('balance.against', { value: againstTotal })}`,
      );
    }

    lines.push('', `## ${t('detail.patterns')}`, '');
    if (thought.patterns.length === 0) lines.push(t('detail.none'));
    for (const p of thought.patterns) lines.push(`- ${t(`patterns.${p}.name`)}`);

    if (thought.alternativeThought?.trim()) {
      lines.push('', `## ${t('detail.alternative')}`, '', quote(thought.alternativeThought));
      if (thought.alternativeBelief != null) {
        lines.push('', `- **${t('detail.alternativeBelief')}:** ${belief(thought.alternativeBelief)}`);
      }
    }
  }

  return lines.join('\n') + '\n';
}

/**
 * Writes the thought to a Markdown file in the app's cache and opens the system share sheet,
 * where the user can save it to Files/Drive or send it. Nothing is uploaded by the app itself.
 */
export async function shareThoughtAsMarkdown(thought: ThoughtWithDetails, t: TFunction, language: string) {
  const day = thought.createdAt.slice(0, 10);
  const file = new File(Paths.cache, `thought-${day}-${thought.id}.md`);
  if (file.exists) file.delete();
  file.create();
  await file.write(thoughtToMarkdown(thought, t, language));
  await Sharing.shareAsync(file.uri, { mimeType: 'text/markdown', UTI: 'net.daringfireball.markdown' });
}
