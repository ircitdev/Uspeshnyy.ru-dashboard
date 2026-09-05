import { SummaryData } from '../types';

export interface GeminiSummaryResult {
  title: string;
  executiveSummary: string;
  keyInsights: string[];
  recommendations: Array<{
    category: string;
    text: string;
    impact: string;
  }>;
  status: 'positive' | 'neutral' | 'warning';
  generatedAt: string;
  isAiGenerated: boolean;
  errorNote?: string;
}

export async function fetchGeminiSummary(
  summaryData: SummaryData,
  periodDays: number = 30
): Promise<GeminiSummaryResult> {
  const response = await fetch('/api/gemini/summary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      summaryData,
      periodDays,
    }),
  });

  if (!response.ok) {
    throw new Error(`Ошибка запроса к ИИ (${response.status})`);
  }

  const data = await response.json();
  return data as GeminiSummaryResult;
}
