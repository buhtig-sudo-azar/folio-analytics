export interface AgentPersona {
  id: string;
  name: string;
  role: string;
  gradient: string; // tailwind gradient classes
  iconBg: string;
  greeting: string;
  description: string;
}

export const ANALYTICS_AGENT: AgentPersona = {
  id: 'analyst',
  name: 'Аналитик',
  role: 'AI-эксперт по веб-аналитике',
  gradient: 'from-emerald-500 to-blue-600',
  iconBg: 'bg-gradient-to-br from-emerald-500 to-blue-600',
  greeting: 'Привет! Я Аналитик — твой AI-эксперт по веб-аналитике. Спрашивай про метрики, трафик, устройства, конверсии — или как настроить трекер на сайте.',
  description: 'Специализируется на веб-аналитике: метрики, трафик, устройства, география, конверсии, настройка трекера',
};

export const SUGGESTIONS = [
  'Как работает трекер?',
  'Что такое bounce rate?',
  'Как улучшить конверсию?',
];
