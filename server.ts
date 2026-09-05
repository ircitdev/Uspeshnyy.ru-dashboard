import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const PORT = 3000;

function getFallbackSummary(summaryData: any, periodDays: number = 30) {
  const leads = summaryData?.leads?.value ?? 0;
  const newLeads = summaryData?.leads?.new ?? 0;
  const cost = summaryData?.cost?.value ?? 0;
  const prevCost = summaryData?.cost?.prev ?? 0;
  const calls = summaryData?.calls?.value ?? 0;
  const reportsTotal = summaryData?.reports_total ?? 0;
  const reportsPeriod = summaryData?.reports_period?.value ?? 0;

  const costDiff = prevCost > 0 ? (((cost - prevCost) / prevCost) * 100).toFixed(1) : '0';
  const isCostGrowing = cost > prevCost;

  return {
    title: `Экспресс-аналитика за ${periodDays} дн.`,
    executiveSummary: `За отчётный период зарегистрировано ${newLeads} новых лидов (всего в базе: ${leads}). Было сгенерировано ${reportsPeriod} отчётов при суммарных расходах на ИИ в размере ${cost.toLocaleString('ru-RU')} ₽ за ${calls.toLocaleString('ru-RU')} обращений. Общая динамика стабильная, инфраструктура функционирует в штатном режиме.`,
    keyInsights: [
      `Лидогенерация: +${newLeads} пользователей за период; средняя вовлеченность составляет ${(reportsTotal / (leads || 1)).toFixed(1)} отчётов на пользователя.`,
      `Бюджет на ИИ: расход ${cost.toLocaleString('ru-RU')} ₽ (${isCostGrowing ? '+' : ''}${costDiff}% по сравнению с прошлым периодом), средняя стоимость запроса: ${(cost / (calls || 1)).toFixed(2)} ₽.`,
      `Активность отчётов: пользователи сформировали ${reportsPeriod} отчётов, конверсия новых обращений сохраняет позитивный тренд.`,
    ],
    recommendations: [
      {
        category: 'Оптимизация ИИ',
        text: 'Настроить агрессивное кэширование типовых системных промптов и ограничить максимальный размер контекста для частых запросов.',
        impact: 'Высокий (-15% затрат)',
      },
      {
        category: 'Конверсия лидов',
        text: 'Активировать сегментированные пуш-уведомления для пользователей без повторных отчётов в течение 7 дней.',
        impact: 'Средний (+10% retention)',
      },
      {
        category: 'Управление качеством',
        text: 'Провести регулярный аудит запросов с повышенным временем ответа для выявления узких мест в цепочках генерации.',
        impact: 'Средний (рост стабильности)',
      },
    ],
    status: isCostGrowing && Number(costDiff) > 25 ? 'warning' : 'positive',
    generatedAt: new Date().toISOString(),
    isAiGenerated: false,
  };
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '10mb' }));

  // Health check endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Gemini AI Summary endpoint
  app.post('/api/gemini/summary', async (req, res) => {
    const { summaryData, periodDays = 30 } = req.body || {};

    const apiKey = process.env.GEMINI_API_KEY;

    // If API key is not present, return the calculated fallback summary
    if (!apiKey) {
      const fallback = getFallbackSummary(summaryData, periodDays);
      return res.json(fallback);
    }

    try {
      const ai = new GoogleGenAI({ apiKey });

      const prompt = `
Проанализируй текущие бизнес-метрики и технические данные панели управления за последние ${periodDays} дней:
- Лиды всего: ${summaryData?.leads?.value ?? 0}, новых за период: ${summaryData?.leads?.new ?? 0}
- Отчётов всего: ${summaryData?.reports_total ?? 0}, за период: ${summaryData?.reports_period?.value ?? 0}
- Расходы на ИИ: ${summaryData?.cost?.value ?? 0} ₽ (предыдущий период: ${summaryData?.cost?.prev ?? 0} ₽)
- Вызовов моделей ИИ: ${summaryData?.calls?.value ?? 0} (предыдущий период: ${summaryData?.calls?.prev ?? 0})
- Просмотров страниц: ${summaryData?.views?.value ?? 0}, комментариев: ${summaryData?.comments?.value ?? 0}
- Событий системы: ${summaryData?.events?.value ?? 0}

Сформируй ёмкий, профессиональный и полезный аналитический отчёт с кратким выводом, 3-4 ключевыми инсайтами и 3 практическими рекомендациями.
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          systemInstruction:
            'Вы — опытный продуктовый аналитик и технический директор. Дайте объективную, конкретную оценку ситуации на русском языке, избегая шаблонной воды и рекламных клише.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING, description: 'Заголовок саммари' },
              executiveSummary: {
                type: Type.STRING,
                description: 'Краткий вывод по текущей ситуации (2-3 предложения)',
              },
              keyInsights: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3-4 ключевых инсайта с конкретными цифрами и динамикой',
              },
              recommendations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    category: { type: Type.STRING, description: 'Категория рекомендации' },
                    text: { type: Type.STRING, description: 'Конкретное действие' },
                    impact: { type: Type.STRING, description: 'Ожидаемый эффект' },
                  },
                  required: ['category', 'text', 'impact'],
                },
                description: '3 практические рекомендации',
              },
              status: {
                type: Type.STRING,
                description: 'Общий статус: positive, neutral, или warning',
              },
            },
            required: ['title', 'executiveSummary', 'keyInsights', 'recommendations', 'status'],
          },
        },
      });

      const parsed = JSON.parse(response.text?.trim() || '{}');
      return res.json({
        ...parsed,
        generatedAt: new Date().toISOString(),
        isAiGenerated: true,
      });
    } catch (err: any) {
      console.error('Error in /api/gemini/summary:', err);
      // Fallback on model error
      const fallback = getFallbackSummary(summaryData, periodDays);
      return res.json({
        ...fallback,
        errorNote: 'Использован локальный анализ (Gemini API вернул временную ошибку)',
      });
    }
  });

  // Vite middleware in dev or static files in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
