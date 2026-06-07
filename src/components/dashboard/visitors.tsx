'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  User,
  Bot,
  UserPlus,
  UserCheck,
  Search,
  Monitor,
  Globe,
  Clock,
  Repeat,
  ChevronLeft,
  ChevronRight,
  Eye,
  ArrowUpDown,
} from 'lucide-react';
import { fetchAnalytics, formatDuration, formatNumber } from '@/lib/analytics/api';
import { useAppStore } from '@/lib/analytics/store';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

type FilterType = 'all' | 'humans' | 'bots' | 'new' | 'returning';

interface VisitorData {
  userId: string;
  sessions: number;
  firstSeen: string;
  lastSeen: string;
  browser: string | null;
  os: string | null;
  deviceType: string | null;
  screenRes: string | null;
  language: string | null;
  country: string | null;
  countryCode: string | null;
  region: string | null;
  city: string | null;
  trafficSource: string | null;
  trafficName: string | null;
  isBot: boolean;
  botName: string | null;
  isNewUser: boolean;
  totalDuration: number;
  totalPages: number;
  avgDuration: number;
  bounces: number;
}

interface VisitorsResponse {
  visitors: VisitorData[];
  totals: {
    all: number;
    humans: number;
    bots: number;
    new: number;
    returning: number;
  };
  limit: number;
  offset: number;
}

type SortField = 'lastSeen' | 'firstSeen' | 'sessions' | 'avgDuration' | 'totalPages';
type SortDir = 'asc' | 'desc';

const filterTabs: { key: FilterType; label: string; icon: React.ElementType }[] = [
  { key: 'all', label: 'Все', icon: Users },
  { key: 'humans', label: 'Люди', icon: User },
  { key: 'bots', label: 'Боты', icon: Bot },
  { key: 'new', label: 'Новые', icon: UserPlus },
  { key: 'returning', label: 'Возвр.', icon: UserCheck },
];

const deviceTypeLabels: Record<string, string> = {
  desktop: 'Десктоп',
  laptop: 'Ноутбук',
  mobile: 'Мобильный',
  tablet: 'Планшет',
  bot: 'Бот',
};

const deviceTypeColors: Record<string, string> = {
  desktop: 'bg-blue-500/10 text-blue-500',
  laptop: 'bg-indigo-500/10 text-indigo-500',
  mobile: 'bg-green-500/10 text-green-500',
  tablet: 'bg-amber-500/10 text-amber-500',
  bot: 'bg-zinc-500/10 text-zinc-500',
};

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;

  if (diff < 60000) return 'только что';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} мин назад`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч назад`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)} дн назад`;
  return new Date(dateStr).toLocaleDateString('ru', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleString('ru', {
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
}

export function VisitorsSection() {
  const { period, selectedProject } = useAppStore();
  const [data, setData] = useState<VisitorsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [sortField, setSortField] = useState<SortField>('lastSeen');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 50;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        period,
        filter,
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
      };
      if (selectedProject) params.projectId = selectedProject;
      if (search) params.search = search;

      const result = await fetchAnalytics('visitors', params);
      setData(result || null);
    } catch (e) {
      console.error('Failed to load visitors:', e);
    } finally {
      setLoading(false);
    }
  }, [period, selectedProject, filter, search, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(0);
  }, [filter, search]);

  const handleSearch = () => {
    setSearch(searchInput);
    setPage(0);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  // Sort visitors client-side
  const sortedVisitors = data ? [...data.visitors].sort((a, b) => {
    let va: number | string = '';
    let vb: number | string = '';
    switch (sortField) {
      case 'lastSeen': va = a.lastSeen; vb = b.lastSeen; break;
      case 'firstSeen': va = a.firstSeen; vb = b.firstSeen; break;
      case 'sessions': va = a.sessions; vb = b.sessions; break;
      case 'avgDuration': va = a.avgDuration; vb = b.avgDuration; break;
      case 'totalPages': va = a.totalPages; vb = b.totalPages; break;
    }
    if (typeof va === 'string') {
      return sortDir === 'asc' ? va.localeCompare(vb as string) : (vb as string).localeCompare(va);
    }
    return sortDir === 'asc' ? (va as number) - (vb as number) : (vb as number) - (va as number);
  }) : [];

  const totals = data?.totals || { all: 0, humans: 0, bots: 0, new: 0, returning: 0 };

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex flex-wrap gap-2">
        {filterTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = filter === tab.key;
          const count = tab.key === 'all' ? totals.all
            : tab.key === 'humans' ? totals.humans
            : tab.key === 'bots' ? totals.bots
            : tab.key === 'new' ? totals.new
            : totals.returning;

          return (
            <Button
              key={tab.key}
              variant={isActive ? 'default' : 'outline'}
              size="sm"
              className="gap-2"
              onClick={() => setFilter(tab.key)}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
              <Badge variant={isActive ? 'secondary' : 'outline'} className="text-[10px] px-1.5 py-0">
                {formatNumber(count)}
              </Badge>
            </Button>
          );
        })}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Поиск по ID, стране, городу, браузеру, ОС, боту..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            className="pl-9"
          />
        </div>
        <Button onClick={handleSearch} variant="outline" size="icon">
          <Search className="h-4 w-4" />
        </Button>
      </div>

      {/* Visitors table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            Уникальные посетители
            {data && (
              <Badge variant="outline" className="text-xs ml-2">
                {formatNumber(totals.all)} всего
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Загрузка...
            </div>
          ) : sortedVisitors.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              Нет данных за выбранный период
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Кто</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                      <button onClick={() => toggleSort('sessions')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        Заходов <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Устройство</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Браузер / ОС</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Гео</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Источник</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                      <button onClick={() => toggleSort('avgDuration')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        Ср. время <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                      <button onClick={() => toggleSort('lastSeen')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        Последний <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">
                      <button onClick={() => toggleSort('firstSeen')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                        Первый <ArrowUpDown className="h-3 w-3" />
                      </button>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sortedVisitors.map((v, i) => (
                    <tr key={v.userId} className={cn(
                      'border-b border-border/50 hover:bg-muted/30 transition-colors',
                      v.isBot && 'bg-zinc-500/5'
                    )}>
                      {/* Who */}
                      <td className="py-2 px-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex items-center gap-2 cursor-help">
                              {v.isBot ? (
                                <Bot className="h-4 w-4 text-zinc-400 shrink-0" />
                              ) : v.isNewUser ? (
                                <UserPlus className="h-4 w-4 text-sky-500 shrink-0" />
                              ) : (
                                <UserCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                              )}
                              <div>
                                <div className="font-mono text-xs truncate max-w-[100px]">
                                  {v.userId.slice(0, 12)}...
                                </div>
                                {v.isBot && v.botName && (
                                  <div className="text-[10px] text-zinc-400">{v.botName}</div>
                                )}
                              </div>
                            </div>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[300px]">
                            <div className="space-y-1 text-xs">
                              <p><span className="font-medium">ID:</span> {v.userId}</p>
                              <p><span className="font-medium">Тип:</span> {v.isBot ? `Бот (${v.botName || 'неизвестный'})` : v.isNewUser ? 'Новый посетитель' : 'Возвращающийся'}</p>
                              <p><span className="font-medium">Заходов:</span> {v.sessions}</p>
                              <p><span className="font-medium">Страниц:</span> {v.totalPages}</p>
                              <p><span className="font-medium">Отказов:</span> {v.bounces}/{v.sessions}</p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </td>

                      {/* Sessions */}
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1">
                          <Repeat className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium">{v.sessions}</span>
                        </div>
                      </td>

                      {/* Device */}
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="secondary" className={cn('text-[10px] px-1.5 py-0', deviceTypeColors[v.deviceType || ''] || '')}>
                            {deviceTypeLabels[v.deviceType || ''] || v.deviceType || '?'}
                          </Badge>
                          {v.screenRes && (
                            <span className="text-[10px] text-muted-foreground">{v.screenRes}</span>
                          )}
                        </div>
                      </td>

                      {/* Browser / OS */}
                      <td className="py-2 px-2">
                        <div>
                          <div className="text-xs">{v.browser || '—'}</div>
                          <div className="text-[10px] text-muted-foreground">{v.os || '—'}</div>
                        </div>
                      </td>

                      {/* Geo */}
                      <td className="py-2 px-2">
                        <div>
                          <div className="text-xs">{v.city || v.country || '—'}</div>
                          {v.country && v.city && (
                            <div className="text-[10px] text-muted-foreground">{v.country}</div>
                          )}
                        </div>
                      </td>

                      {/* Traffic source */}
                      <td className="py-2 px-2">
                        <div className="text-xs">
                          {v.trafficName || (v.trafficSource === 'direct' ? 'Прямой' : v.trafficSource || '—')}
                        </div>
                      </td>

                      {/* Avg duration */}
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-1 text-xs">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          {formatDuration(v.avgDuration)}
                        </div>
                      </td>

                      {/* Last seen */}
                      <td className="py-2 px-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs cursor-help">{timeAgo(v.lastSeen)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{formatTime(v.lastSeen)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>

                      {/* First seen */}
                      <td className="py-2 px-2">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="text-xs text-muted-foreground cursor-help">{timeAgo(v.firstSeen)}</span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">{formatTime(v.firstSeen)}</p>
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {data && (
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
              <div className="text-xs text-muted-foreground">
                Показано {sortedVisitors.length} из {formatNumber(totals.all)} посетителей
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 0}
                  onClick={() => setPage(p => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="flex items-center text-xs text-muted-foreground px-2">
                  Стр. {page + 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={sortedVisitors.length < PAGE_SIZE}
                  onClick={() => setPage(p => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary cards */}
      {data && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Card>
            <CardContent className="p-3 text-center">
              <Users className="h-5 w-5 mx-auto mb-1 text-blue-500" />
              <div className="text-lg font-bold">{formatNumber(totals.all)}</div>
              <p className="text-[10px] text-muted-foreground">Всего уникальных</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <User className="h-5 w-5 mx-auto mb-1 text-emerald-500" />
              <div className="text-lg font-bold">{formatNumber(totals.humans)}</div>
              <p className="text-[10px] text-muted-foreground">Людей</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <Bot className="h-5 w-5 mx-auto mb-1 text-zinc-400" />
              <div className="text-lg font-bold">{formatNumber(totals.bots)}</div>
              <p className="text-[10px] text-muted-foreground">Ботов</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <UserPlus className="h-5 w-5 mx-auto mb-1 text-sky-500" />
              <div className="text-lg font-bold">{formatNumber(totals.new)}</div>
              <p className="text-[10px] text-muted-foreground">Новых</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3 text-center">
              <UserCheck className="h-5 w-5 mx-auto mb-1 text-amber-500" />
              <div className="text-lg font-bold">{formatNumber(totals.returning)}</div>
              <p className="text-[10px] text-muted-foreground">Возвратившихся</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
