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

      const candidateModels = [
        process.env.GEMINI_MODEL,
        'gemini-3.6-flash',
        'gemini-flash-latest',
        'gemini-flash-lite-latest',
        'gemini-3.8-flash',
      ].filter(Boolean) as string[];

      let response: any = null;
      let lastError: any = null;

      for (const model of candidateModels) {
        // Try each model with up to 2 attempts for transient 503/429
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            response = await ai.models.generateContent({
              model,
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
            if (response?.text) {
              break;
            }
          } catch (mErr: any) {
            lastError = mErr;
            const status = mErr?.status || mErr?.code || mErr?.error?.code;
            const isTransient = status === 503 || status === 429 || mErr?.message?.includes('high demand') || mErr?.message?.includes('UNAVAILABLE');

            if (isTransient && attempt === 1) {
              // Quick backoff before retrying once
              await new Promise((resolve) => setTimeout(resolve, 600));
              continue;
            }
            break;
          }
        }

        if (response?.text) {
          break;
        }
      }

      if (!response?.text) {
        throw lastError || new Error('No valid response received from Gemini model');
      }

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

  // Telegram critical alert endpoint
  app.post('/api/notifications/telegram', async (req, res) => {
    const {
      telegramId,
      currentCost: rawCost,
      currentExpense,
      limitUsd: rawLimit,
      limit,
      periodDays = 30,
      isTest = false,
      customDetails,
    } = req.body || {};

    const currentCost = rawCost !== undefined ? Number(rawCost) : (currentExpense !== undefined ? Number(currentExpense) : 0);
    const limitUsd = rawLimit !== undefined ? Number(rawLimit) : (limit !== undefined ? Number(limit) : 50);

    if (!telegramId || typeof telegramId !== 'string' || !telegramId.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Не указан Telegram ID для отправки уведомления',
      });
    }

    const cleanId = telegramId.trim();
    const token = process.env.TELEGRAM_BOT_TOKEN;
    const now = new Date();
    const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = now.toLocaleDateString('ru-RU');

    const costDiffPct =
      limitUsd > 0 && currentCost > limitUsd
        ? (((currentCost - limitUsd) / limitUsd) * 100).toFixed(1)
        : '0';

    let text = '';
    if (isTest) {
      text = `🔔 *Тестовое оповещение — Успешный бот*\n\n` +
        `✅ Канал доставки критических уведомлений успешно подключен к Telegram ID: \`${cleanId}\`\n\n` +
        `📊 *Текущие параметры мониторинга ИИ:*\n` +
        `• Установленный лимит: *$${Number(limitUsd).toFixed(2)}*\n` +
        `• Текущие расходы: *$${Number(currentCost).toFixed(2)}*\n` +
        `• Статус триггера: *Активен*\n` +
        `• Время проверки: *${dateString}, ${timeString}*\n\n` +
        `При превышении лимита или выявлении критической аномалии бот моментально пришлёт экстренный сигнал сюда.`;
    } else {
      text = `🚨 *КРИТИЧЕСКОЕ ОПОВЕЩЕНИЕ: ПРЕВЫШЕН ЛИМИТ РАСХОДОВ НА ИИ*\n\n` +
        `⚠️ Расходы на генерацию и вызовы нейросетей превысили установленный порог безопасности!\n\n` +
        `💰 *Текущий расход:* *$${Number(currentCost).toFixed(2)}*\n` +
        `🎯 *Лимит бюджета:* *$${Number(limitUsd).toFixed(2)}*\n` +
        `📈 *Превышение:* *+${costDiffPct}%* (+$${Math.max(0, currentCost - limitUsd).toFixed(2)})\n` +
        `⏱ *Отчётный интервал:* *${periodDays} дн.*\n` +
        `🕒 *Время фиксации:* *${dateString} в ${timeString}*\n\n` +
        (customDetails ? `ℹ️ *Детали:* ${customDetails}\n\n` : '') +
        `🛠 *Рекомендация:* проверьте дашборд использования (Usage), оптимизируйте размер контекста или увеличьте лимит.`;
    }

    if (token) {
      try {
        const tgRes = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            chat_id: cleanId,
            text,
            parse_mode: 'Markdown',
          }),
        });

        const tgData: any = await tgRes.json();
        if (!tgData.ok) {
          console.warn('Telegram API responded with error:', tgData);
          return res.status(400).json({
            success: false,
            error: `Ошибка Telegram API: ${tgData.description || 'Не удалось доставить сообщение'}`,
            chatId: cleanId,
          });
        }

        return res.json({
          success: true,
          simulated: false,
          message: `Уведомление успешно доставлено в Telegram (ID: ${cleanId})`,
          deliveredAt: new Date().toISOString(),
          chatId: cleanId,
          previewText: text,
        });
      } catch (err: any) {
        console.error('Error contacting Telegram API:', err);
        return res.status(500).json({
          success: false,
          error: `Сбой сети при отправке в Telegram: ${err.message}`,
          chatId: cleanId,
        });
      }
    } else {
      return res.json({
        success: true,
        simulated: true,
        message: `Telegram ID ${cleanId} сохранён. Тестовое оповещение успешно сформировано.`,
        deliveredAt: new Date().toISOString(),
        chatId: cleanId,
        previewText: text,
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
