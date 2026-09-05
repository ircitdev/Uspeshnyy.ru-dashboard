import { AiBudgetSettings } from '../types';

const BUDGET_STORAGE_KEY = 'uspeshnyy_ai_budget_settings';

export const DEFAULT_BUDGET_SETTINGS: AiBudgetSettings = {
  limitUsd: 50,
  alertEnabled: true,
  monthlyLimit: 50,
  isThresholdAlertEnabled: true,
};

export function getStoredAiBudget(): AiBudgetSettings {
  if (typeof window === 'undefined') return DEFAULT_BUDGET_SETTINGS;
  try {
    const raw = localStorage.getItem(BUDGET_STORAGE_KEY);
    if (!raw) return DEFAULT_BUDGET_SETTINGS;
    const parsed = JSON.parse(raw);
    const limit =
      typeof parsed.monthlyLimit === 'number' && parsed.monthlyLimit > 0
        ? parsed.monthlyLimit
        : typeof parsed.limitUsd === 'number' && parsed.limitUsd > 0
        ? parsed.limitUsd
        : 50;
    const alertOn =
      parsed.isThresholdAlertEnabled !== undefined
        ? Boolean(parsed.isThresholdAlertEnabled)
        : parsed.alertEnabled !== false;

    return {
      limitUsd: limit,
      alertEnabled: alertOn,
      monthlyLimit: limit,
      isThresholdAlertEnabled: alertOn,
    };
  } catch {
    return DEFAULT_BUDGET_SETTINGS;
  }
}

export const getAiBudgetSettings = getStoredAiBudget;

export function setStoredAiBudget(settings: Partial<AiBudgetSettings>): AiBudgetSettings {
  const current = getStoredAiBudget();
  const limit =
    settings.monthlyLimit !== undefined
      ? settings.monthlyLimit
      : settings.limitUsd !== undefined
      ? settings.limitUsd
      : current.monthlyLimit;
  const alertOn =
    settings.isThresholdAlertEnabled !== undefined
      ? settings.isThresholdAlertEnabled
      : settings.alertEnabled !== undefined
      ? settings.alertEnabled
      : current.isThresholdAlertEnabled;

  const updated: AiBudgetSettings = {
    limitUsd: limit,
    alertEnabled: alertOn,
    monthlyLimit: limit,
    isThresholdAlertEnabled: alertOn,
  };

  try {
    localStorage.setItem(BUDGET_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save AI budget settings to localStorage', e);
  }
  return updated;
}

export const setAiBudgetSettings = setStoredAiBudget;
