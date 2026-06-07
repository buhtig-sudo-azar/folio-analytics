'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  Eye,
  Clock,
  TrendingUp,
  Activity,
  MousePointerClick,
  Globe,
  Monitor,
  UserPlus,
  UserCheck,
  Repeat,
  Bot,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { fetchAnalytics, formatNumber, formatDuration } from '@/lib/analytics/api';
import { useAppStore } from '@/lib/analytics/store';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

interface BotStats {
  totalBotEvents: number;
  uniqueBots: number;
  botSessions: number;
  botBreakdown: Array<{ name: string; count: number }>;
}

interface OverviewData {
  totalEvents: number;
  pageViews: number;
  uniqueVisitors: number;
  sessions: number;
  newVisitors: number;
  returningVisitors: number;
  avgSessionDuration: number;
  bounceRate: number;
  projectViews: number;
  demoOpens: number;
  todayVisitors: number;
  todaySessions: number;
  weekVisitors: number;
  monthVisitors: number;
  conversionRate: string | number;
  botStats?: BotStats;
}

export function OverviewSection() {
  const { period, selectedProject } = useAppStore();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [visits, setVisits] = useState<Array<{ date: string; visits: number; uniqueVisitors: number }>>([]);
  const [geography, setGeography] = useState<{ countries: Array<{ country: string; visitors: number }> }>({ countries: [] });
  const [devices, setDevices] = useState<{ devices: Array<{ name: string; count: number }> }>({ devices: [] });
  const [traffic, setTraffic] = useState<{ sources: Array<{ name: string; count: number }> }>({ sources: [] });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (selectedProject) params.projectId = selectedProject;

      const [overviewData, visitsData, geoData, devData, trafData] = await Promise.all([
        fetchAnalytics('overview', { ...params, period }),
        fetchAnalytics('visits', { ...params, period }),
        fetchAnalytics('geography', { ...params, period }),
        fetchAnalytics('devices', { ...params, period }),
        fetchAnalytics('traffic', { ...params, period }),
      ]);

      setOverview(overviewData || null);
      setVisits(visitsData || []);
      setGeography(geoData || { countries: [] });
      setDevices(devData || { devices: [] });
      setTraffic(trafData || { sources: [] });
    } catch (e) {
      console.error('Failed to load overview:', e);
    } finally {
      setLoading(false);
    }
  }, [period, selectedProject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const statCards = overview ? [
    { title: 'Людей сегодня', subtitle: `${overview.todaySessions} заходов`, value: formatNumber(overview.todayVisitors), icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10', hint: `Уникальных людей: ${overview.todayVisitors}, всего заходов (сессий): ${overview.todaySessions}. Один человек может заходить несколько раз — каждый заход = отдельная сессия` },
    { title: 'Людей за неделю', value: formatNumber(overview.weekVisitors), icon: TrendingUp, color: 'text-blue-500', bg: 'bg-blue-500/10', hint: 'Уникальные люди за последние 7 дней. Один и тот же человек считается один раз, сколько бы раз ни заходил' },
    { title: 'Людей за месяц', value: formatNumber(overview.monthVisitors), icon: Eye, color: 'text-purple-500', bg: 'bg-purple-500/10', hint: 'Уникальные люди за последние 30 дней. Один и тот же человек считается один раз, сколько бы раз ни заходил' },
    { title: 'Новые', subtitle: `${overview.returningVisitors} возвр.`, value: formatNumber(overview.newVisitors), icon: UserPlus, color: 'text-sky-500', bg: 'bg-sky-500/10', hint: `Новых посетителей: ${overview.newVisitors}, возвращающихся: ${overview.returningVisitors}. Новый = первый визит, возвратившийся = был ранее` },
    { title: 'Всего заходов', value: formatNumber(overview.sessions), icon: Repeat, color: 'text-amber-500', bg: 'bg-amber-500/10', hint: 'Общее количество сессий (заходов). Один человек может заходить несколько раз — каждая сессия длится до 30 мин неактивности' },
    { title: 'Ср. длительность', value: formatDuration(overview.avgSessionDuration), icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10', hint: 'Среднее время, которое посетитель проводит на сайте за одну сессию' },
    { title: 'Просмотры', value: formatNumber(overview.pageViews), icon: Activity, color: 'text-cyan-500', bg: 'bg-cyan-500/10', hint: 'Общее количество просмотренных страниц. Один заход может включать несколько просмотров' },
    { title: 'Показатель отказов', value: `${overview.bounceRate}%`, icon: MousePointerClick, color: 'text-rose-500', bg: 'bg-rose-500/10', hint: 'Доля заходов, где человек посмотрел одну страницу и ушёл (чем меньше — тем лучше)' },
    // Bot card — always shown, indicates bot traffic is being tracked
    { title: 'Ботов', subtitle: overview.botStats?.uniqueBots ? `${overview.botStats.uniqueBots} уникальных` : undefined, value: formatNumber(overview.botStats?.totalBotEvents || 0), icon: Bot, color: 'text-zinc-400', bg: 'bg-zinc-400/10', hint: overview.botStats?.botBreakdown?.length ? `Боты detected: ${overview.botStats.botBreakdown.map(b => `${b.name} (${b.count})`).join(', ')}` : 'Автоматические запросы от ботов, краулеров, скрейперов. Не учитываются в статистике людей' },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Tooltip key={card.title}>
              <TooltipTrigger asChild>
                <Card className="cursor-help hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-lg ${card.bg}`}>
                        <Icon className={`h-4 w-4 ${card.color}`} />
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{loading ? '—' : card.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{card.title}</p>
                    {card.subtitle && (
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5">{card.subtitle}</p>
                    )}
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent className="max-w-[320px]">
                <p className="text-xs">{card.hint}</p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      {/* Visits Chart */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="cursor-help">
            <CardHeader>
              <CardTitle className="text-base">Динамика посещений</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                {visits.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={visits}>
                      <defs>
                        <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(v) => new Date(v).toLocaleDateString('ru', { day: '2-digit', month: '2-digit' })}
                        className="text-xs"
                      />
                      <YAxis className="text-xs" />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                        labelFormatter={(v) => new Date(v).toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' })}
                      />
                      <Area type="monotone" dataKey="visits" stroke="#10b981" fillOpacity={1} fill="url(#colorVisits)" name="Просмотры" />
                      <Area type="monotone" dataKey="uniqueVisitors" stroke="#3b82f6" fillOpacity={1} fill="url(#colorUnique)" name="Уникальные" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    {loading ? 'Загрузка...' : 'Нет данных за выбранный период'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent className="max-w-[300px]">
          <p className="text-xs">График показывает динамику просмотров (зелёный) и уникальных посетителей (синий) по дням за выбранный период</p>
        </TooltipContent>
      </Tooltip>

      {/* Bottom row: Geography + Devices + Traffic */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Countries */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Globe className="h-4 w-4 text-emerald-500" />
                  Топ стран
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {geography.countries.length > 0 ? geography.countries.slice(0, 8).map((c, i) => (
                    <div key={c.country} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}</span>
                        <span className="text-sm">{c.country}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">{formatNumber(c.visitors)}</Badge>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Нет данных</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-[250px]">
            <p className="text-xs">Рейтинг стран, из которых приходят посетители. Данные основаны на IP-адресе</p>
          </TooltipContent>
        </Tooltip>

        {/* Device Distribution */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-blue-500" />
                  Устройства
                </CardTitle>
              </CardHeader>
              <CardContent>
                {devices.devices.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={devices.devices}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="count"
                          nameKey="name"
                        >
                          {devices.devices.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Нет данных</p>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {devices.devices.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-1 text-xs">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span>{d.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-[250px]">
            <p className="text-xs">Распределение посетителей по типам устройств: десктоп, мобильный, планшет</p>
          </TooltipContent>
        </Tooltip>

        {/* Traffic Sources */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-amber-500" />
                  Источники трафика
                </CardTitle>
              </CardHeader>
              <CardContent>
                {traffic.sources.length > 0 ? (
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={traffic.sources} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                        <XAxis type="number" className="text-xs" />
                        <YAxis type="category" dataKey="name" className="text-xs" width={70} />
                        <RechartsTooltip />
                        <Bar dataKey="count" fill="#f59e0b" radius={[0, 4, 4, 0]} name="Сессии" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">Нет данных</p>
                )}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent className="max-w-[250px]">
            <p className="text-xs">Откуда приходят посетители: прямые переходы, поисковые системы, социальные сети, ссылки с других сайтов</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
