'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  ArrowDownRight,
  Target,
  TrendingUp,
  Filter,
  CheckCircle2,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
} from 'recharts';
import { fetchAnalytics, formatNumber } from '@/lib/analytics/api';
import { useAppStore } from '@/lib/analytics/store';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface FunnelStep {
  name: string;
  value: number;
  dropoff: number;
  conversionRate: number;
}

interface ConversionsData {
  total: number;
  byGoal: Array<{
    id: string;
    name: string;
    eventType: string;
    conversions: number;
  }>;
  recent: Array<{
    id: string;
    goalId: string;
    createdAt: string;
  }>;
}

const FUNNEL_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6'];

const funnelStepHints: Record<string, string> = {
  'Портфолио': 'Посетитель открыл главную страницу портфолио',
  'Просмотр проекта': 'Посетитель перешёл к конкретному проекту',
  'Открытие проекта': 'Посетитель открыл демо или подробности проекта',
  'Переход в демо': 'Посетитель кликнул по ссылке на демо-версию',
  'Связь с владельцем': 'Посетитель открыл контакты или форму связи',
};

export function ConversionsSection() {
  const { period, selectedProject } = useAppStore();
  const [funnel, setFunnel] = useState<FunnelStep[]>([]);
  const [conversions, setConversions] = useState<ConversionsData>({ total: 0, byGoal: [], recent: [] });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { period };
      if (selectedProject) params.projectId = selectedProject;
      const [funnelData, convData] = await Promise.all([
        fetchAnalytics('funnel', params),
        fetchAnalytics('conversions', params),
      ]);
      setFunnel(funnelData || []);
      setConversions(convData || { total: 0, byGoal: [], recent: [] });
    } catch (e) {
      console.error('Failed to load conversions:', e);
    } finally {
      setLoading(false);
    }
  }, [period, selectedProject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const maxFunnelValue = funnel.length > 0 ? funnel[0].value : 0;

  return (
    <div className="space-y-6">
      {/* Conversion funnel */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="cursor-help">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Filter className="h-4 w-4 text-emerald-500" />
                Воронка конверсии
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {funnel.length > 0 ? funnel.map((step, i) => {
                  const width = maxFunnelValue > 0 ? Math.max((step.value / maxFunnelValue) * 100, 15) : 15;
                  return (
                    <Tooltip key={step.name}>
                      <TooltipTrigger asChild>
                        <div className="space-y-2 cursor-help">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: FUNNEL_COLORS[i % FUNNEL_COLORS.length] }}
                              />
                              <span className="text-sm font-medium">{step.name}</span>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-bold">{formatNumber(step.value)}</span>
                              {i > 0 && step.dropoff > 0 && (
                                <div className="flex items-center gap-1 text-rose-500">
                                  <ArrowDownRight className="h-3 w-3" />
                                  <span className="text-xs">-{step.dropoff}%</span>
                                </div>
                              )}
                              <Badge variant="outline" className="text-xs">
                                {step.conversionRate}% от начала
                              </Badge>
                            </div>
                          </div>
                          <div className="flex justify-center">
                            <div
                              className="h-12 rounded-lg flex items-center justify-center text-white font-bold text-sm transition-all duration-500"
                              style={{
                                width: `${width}%`,
                                backgroundColor: FUNNEL_COLORS[i % FUNNEL_COLORS.length],
                                minWidth: '80px',
                              }}
                            >
                              {formatNumber(step.value)}
                            </div>
                          </div>
                          {i < funnel.length - 1 && (
                            <div className="flex justify-center text-muted-foreground">
                              <ArrowDownRight className="h-4 w-4 rotate-90" />
                            </div>
                          )}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="left" className="max-w-[280px]">
                        <p className="text-xs text-primary-foreground/80">{funnelStepHints[step.name] || `Шаг воронки: ${step.name}`}</p>
                        <p className="text-xs text-primary-foreground/60 mt-1">Потеря от предыдущего шага: {step.dropoff}% | Конверсия от начала: {step.conversionRate}%</p>
                      </TooltipContent>
                    </Tooltip>
                  );
                }) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    {loading ? 'Загрузка...' : 'Нет данных о конверсиях. Аналитика начнёт собираться при первых посещениях.'}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[280px]">
          <p className="text-xs text-primary-foreground/80">Воронка показывает путь посетителя от первого захода до целевого действия. Наведите на каждый шаг для подробностей</p>
        </TooltipContent>
      </Tooltip>

      {/* Goals and conversions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4 text-blue-500" />
                  Цели
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {conversions.byGoal.length > 0 ? conversions.byGoal.map((goal) => (
                    <div key={goal.id} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/50">
                      <div>
                        <div className="text-sm font-medium">{goal.name}</div>
                        <div className="text-xs text-muted-foreground">{goal.eventType}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <span className="font-bold">{goal.conversions}</span>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Цели создаются автоматически при добавлении проекта
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[250px]">
            <p className="text-xs text-primary-foreground/80">Список отслеживаемых целей и сколько раз каждая была достигнута. Цели создаются автоматически при подключении проекта</p>
          </TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  Конверсии по целям
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  {conversions.byGoal.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={conversions.byGoal}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis dataKey="name" className="text-xs" angle={-15} textAnchor="end" height={60} />
                        <YAxis className="text-xs" />
                        <RechartsTooltip
                          contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        />
                        <Bar dataKey="conversions" fill="#10b981" radius={[4, 4, 0, 0]} name="Конверсии" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-full text-muted-foreground">
                      Нет данных
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[250px]">
            <p className="text-xs text-primary-foreground/80">График количества конверсий по каждой цели за выбранный период</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Total conversions */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="cursor-help">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Всего конверсий</p>
                  <p className="text-3xl font-bold">{formatNumber(conversions.total)}</p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-500/10">
                  <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px]">
          <p className="text-xs text-primary-foreground/80">Общее количество целевых действий за выбранный период. Целевое действие — это когда посетитель совершает нужное вам действие (открыл демо, отправил форму и т.д.)</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
