
import { RiskReport } from '../types';
import { riskService } from './riskService';

export const geminiService = {
  async fastAnalysis(input: string): Promise<RiskReport> {
    const endpoint = import.meta.env.VITE_IDENTITYGUARD_AI_ENDPOINT;
    if (!endpoint) return riskService.analyze(input);

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ context: input }),
    });

    if (!response.ok) return riskService.analyze(input);
    return response.json() as Promise<RiskReport>;
  }
};
