'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Users,
  Globe,
  Eye,
  Zap,
  ArrowUpRight,
} from 'lucide-react';
import { fetchAnalytics, formatNumber } from '@/lib/analytics/api';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface RealtimeData {
  activeVisitors: number;
  activePages: string[];
  activeProjects: string[];
  activeCountries: string[];
  recentEvents: Array<{
    eventType: string;
    page: string;
    country: string;
    userId: string;
    timestamp: string;
  }>;
  totalActive: number;
}

export function RealtimeSection() {
  const [data, setData] = useState<RealtimeData | null>(null);
  const [pulse, setPulse] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const result = await fetchAnalytics('realtime');
        setData(result);
        setPulse(true);
        setTimeout(() => setPulse(false), 1000);
      } catch (e) {
        console.error('Failed to load realtime data:', e);
      }
    };

    void loadData();
    intervalRef.current = setInterval(loadData, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const eventLabels: Record<string, string> = {
    page_view: 'Просмотр страницы',
    project_view: 'Просмотр проекта',
    demo_open: 'Открытие демо',
    external_link_click: 'Переход по ссылке',
    contact_open: 'Открытие контактов',
    contact_form_open: 'Открытие формы',
    form_submit: 'Отправка формы',
    click: 'Клик',
    scroll: 'Скролл',
  };

  const eventHints: Record<string, string> = {
    page_view: 'Посетитель открыл страницу сайта',
    project_view: 'Посетитель перешёл к просмотру проекта в портфолио',
    demo_open: 'Посетитель открыл демо-версию проекта',
    external_link_click: 'Посетитель кликнул по внешней ссылке',
    contact_open: 'Посетитель открыл раздел контактов',
    contact_form_open: 'Посетитель открыл форму обратной связи',
    form_submit: 'Посетитель отправил форму',
    click: 'Клик по элементу на странице',
    scroll: 'Скролл страницы',
  };

  return (
    <div className="space-y-6">
      {/* Live indicator */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-3 cursor-help">
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full bg-emerald-500 ${pulse ? 'animate-ping' : ''}`} />
              <span className="text-sm font-medium text-emerald-500">LIVE</span>
            </div>
            <span className="text-sm text-muted-foreground">Обновление каждые 5 секунд</span>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[250px]">
          <p className="text-xs">Данные обновляются автоматически каждые 5 секунд. Зелёный индикатор показывает наличие активности</p>
        </TooltipContent>
      </Tooltip>

      {/* Active stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Users className="h-4 w-4 text-emerald-500" />
                  </div>
                  <Zap className="h-3 w-3 text-emerald-500" />
                </div>
                <div className="text-3xl font-bold text-emerald-500">
                  {data ? data.activeVisitors : '—'}
                </div>
                <p className="text-xstext-muted-foreground mt-1">Активные сейчас</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[250px]">
            <p className="text-xs">Уникальные посетители, проявившие активность за последние 5 минут</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Eye className="h-4 w-4 text-blue-500" />
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {data ? data.activePages.length : '—'}
                </div>
                <p className="text-xstext-muted-foreground mt-1">Активные страницы</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[250px]">
            <p className="text-xs">Страницы вашего сайта, которые прямо сейчас просматривают посетители</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    <Activity className="h-4 w-4 text-purple-500" />
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {data ? data.activeProjects.length : '—'}
                </div>
                <p className="text-xstext-muted-foreground mt-1">Активные проекты</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[250px]">
            <p className="text-xs">Проекты из портфолио, которые прямо сейчас просматривают</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Globe className="h-4 w-4 text-amber-500" />
                  </div>
                </div>
                <div className="text-2xl font-bold">
                  {data ? data.activeCountries.length : '—'}
                </div>
                <p className="text-xstext-muted-foreground mt-1">Страны</p>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[250px]">
            <p className="text-xs">Количество стран, из которых прямо сейчас идут посещения</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Active pages and countries */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Текущие страницы
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {data && data.activePages.length > 0 ? data.activePages.map((page) => (
                    <div key={page} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50">
                      <span className="text-sm font-mono">{page}</span>
                      <ArrowUpRight className="h-3 w-3 text-muted-foreground" />
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Нет активных страниц</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[250px]">
            <p className="text-xs">Список страниц, которые прямо сейчас открыты у посетителей</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4" />
                  Текущие страны
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {data && data.activeCountries.length > 0 ? data.activeCountries.map((country) => (
                    <Badge key={country} variant="secondary">{country}</Badge>
                  )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Нет данных</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-[250px]">
            <p className="text-xs">Страны, из которых прямо сейчас заходят посетители</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Recent events stream */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="cursor-help">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Поток событий
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {data && data.recentEvents.length > 0 ? data.recentEvents.map((event, i) => (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/50 hover:bg-muted/50 cursor-help">
                        <div className="flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="text-sm font-medium">
                            {eventLabels[event.eventType] || event.eventType}
                          </span>
                          {event.page && (
                            <span className="text-xstext-muted-foreground font-mono">{event.page}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {event.country && (
                            <Badge variant="outline" className="text-xs">{event.country}</Badge>
                          )}
                          <span className="text-xstext-muted-foreground">
                            {new Date(event.timestamp).toLocaleTimeString('ru')}
                          </span>
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[250px]">
                      <p className="text-xs">{eventHints[event.eventType] || 'Действие посетителя на сайте'}</p>
                    </TooltipContent>
                  </Tooltip>
                )) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    Нет недавних событий. Аналитика начнёт собираться при первых посещениях.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="right" className="max-w-[250px]">
          <p className="text-xs">Лента последних действий посетителей в реальном времени. Наведите на событие для подробностей</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
