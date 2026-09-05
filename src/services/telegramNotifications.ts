import { TelegramAlertPayload, TelegramAlertResponse } from '../types';

export async function sendTelegramNotification(
  payload: TelegramAlertPayload
): Promise<TelegramAlertResponse> {
  try {
    const response = await fetch('/api/notifications/telegram', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || `Ошибка сервера (${response.status})`);
    }

    const data: TelegramAlertResponse = await response.json();
    return data;
  } catch (error: any) {
    console.error('Failed to send Telegram notification:', error);
    return {
      success: false,
      message: error?.message || 'Не удалось отправить уведомление в Telegram',
      error: error?.message,
    };
  }
}
