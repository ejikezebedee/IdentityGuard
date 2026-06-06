import { RiskReport } from '../types';

const sensitiveContexts = ['bank', 'loan', 'mortgage', 'passport', 'visa', 'crypto', 'wallet', 'exchange', 'medical', 'government'];
const publicContexts = ['social', 'forum', 'marketplace', 'gaming', 'newsletter'];

export const riskService = {
  analyze(context: string): RiskReport {
    const normalized = context.toLocaleLowerCase();
    const sensitiveHits = sensitiveContexts.filter(word => normalized.includes(word));
    const publicHits = publicContexts.filter(word => normalized.includes(word));
    const score = Math.min(95, 35 + sensitiveHits.length * 18 + publicHits.length * 8);

    const findings = [
      {
        label: 'Context exposure',
        level: sensitiveHits.length > 0 ? 'High' as const : publicHits.length > 0 ? 'Medium' as const : 'Low' as const,
        detail: sensitiveHits.length > 0
          ? `Sensitive context detected: ${sensitiveHits.join(', ')}. Use a unique alias and avoid reuse.`
          : 'No high-risk regulated context detected from the label alone.',
      },
      {
        label: 'Alias reuse',
        level: 'Medium' as const,
        detail: 'One alias should be used for one service context only.',
      },
      {
        label: 'Local handling',
        level: 'Low' as const,
        detail: 'Identity material stays in the browser vault when used in no-server mode.',
      },
    ];

    return {
      score,
      summary: score >= 70
        ? 'High caution recommended for this identity workflow.'
        : score >= 50
          ? 'Moderate caution recommended. Keep this alias isolated.'
          : 'Normal caution. Continue using unique aliases per service.',
      findings,
      recommendations: [
        'Use a different alias for every service or counterparty.',
        'Do not paste generated aliases into public profiles unless required.',
        'Revoke and replace aliases after suspected exposure.',
        'Keep the vault passphrase private and memorable.',
      ],
    };
  },
};
