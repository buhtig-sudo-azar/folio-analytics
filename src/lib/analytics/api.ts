// Analytics data fetching utilities with error resilience

const API_BASE = '/api/analytics';

export async function fetchAnalytics(type: string, params: Record<string, string> = {}): Promise<any> {
  try {
    const searchParams = new URLSearchParams({ type, ...params });
    const res = await fetch(`${API_BASE}?${searchParams.toString()}`);
    if (!res.ok) {
      console.warn(`Analytics fetch failed: ${res.status} for type=${type}`);
      return null;
    }
    return res.json();
  } catch (error) {
    console.warn(`Analytics fetch error for type=${type}:`, error);
    return null;
  }
}

export async function fetchProjects(): Promise<any[]> {
  try {
    const res = await fetch('/api/projects');
    if (!res.ok) {
      console.warn('Projects fetch failed:', res.status);
      return [];
    }
    return res.json();
  } catch (error) {
    console.warn('Projects fetch error:', error);
    return [];
  }
}

export async function createProject(data: { projectId: string; name: string; url?: string }) {
  const res = await fetch('/api/projects', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Create project failed');
  return res.json();
}

export async function deleteProject(id: string) {
  const res = await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Delete project failed');
  return res.json();
}

export async function clearProjectData(projectId: string) {
  const res = await fetch('/api/projects/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ projectId }),
  });
  if (!res.ok) throw new Error('Clear data failed');
  return res.json();
}

export async function clearAllData() {
  const res = await fetch('/api/projects/clear', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ all: true }),
  });
  if (!res.ok) throw new Error('Clear all data failed');
  return res.json();
}

export async function trackEvent(data: Record<string, unknown>) {
  try {
    const res = await fetch('/api/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (error) {
    console.warn('Track event error:', error);
    return { success: false };
  }
}

export function getExportUrl(format: string, type: string, period: string) {
  return `/api/export?format=${format}&type=${type}&period=${period}`;
}

// Format helpers
export function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${secs}s`;
}

export function formatPercent(value: number): string {
  return `${Math.round(value)}%`;
}

export const periodLabels: Record<string, string> = {
  '1d': 'Сегодня',
  '7d': '7 дней',
  '30d': '30 дней',
  '90d': '90 дней',
  '365d': 'Год',
};

export const periodDescriptions: Record<string, string> = {
  '1d': 'Показать данные за текущий день',
  '7d': 'Показать данные за последние 7 дней',
  '30d': 'Показать данные за последний месяц',
  '90d': 'Показать данные за последний квартал',
  '365d': 'Показать данные за последний год',
};

export const sectionLabels: Record<string, string> = {
  overview: 'Обзор',
  realtime: 'Реальное время',
  projects: 'Проекты',
  geography: 'География',
  devices: 'Устройства',
  traffic: 'Источники трафика',
  conversions: 'Конверсии',
  comparison: 'Сравнение',
  pages: 'Страницы',
  reports: 'Отчёты',
  settings: 'Настройки',
};

export const sectionDescriptions: Record<string, string> = {
  overview: 'Сводная информация: посетители, просмотры, динамика за выбранный период',
  realtime: 'Активные посетители прямо сейчас, текущие страницы и события в реальном времени',
  projects: 'Управление подключёнными сайтами: статистика, рейтинги, код подключения',
  geography: 'Географическое распределение посетителей: страны, города, регионы',
  devices: 'Устройства, браузеры, ОС и разрешения экранов ваших посетителей',
  traffic: 'Откуда приходят посетители: прямые, поиск, соцсети, рефералы, UTM',
  conversions: 'Воронка конверсии, цели и достижения — насколько эффективен сайт',
  comparison: 'Сравнение показателей двух проектов между собой',
  pages: 'Статистика по каждой странице: просмотры, уникальные посетители',
  reports: 'Экспорт данных в CSV/JSON и автоматические отчёты',
  settings: 'Подключение трекера, API, роли пользователей, уведомления',
};
