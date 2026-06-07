'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  FolderKanban,
  Eye,
  Users,
  Plus,
  ExternalLink,
  Copy,
  Check,
  Trash2,
  Code,
  Activity,
  TrendingUp,
  Clock,
  Target,
  Trophy,
  Link as LinkIcon,
  BarChart3,
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
import { fetchAnalytics, fetchProjects, createProject, formatNumber } from '@/lib/analytics/api';
import { useAppStore } from '@/lib/analytics/store';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface ProjectInfo {
  id: string;
  projectId: string;
  name: string;
  url: string | null;
  description: string | null;
  _count: { events: number; conversions: number; goals: number };
  recentEvents: number;
  recentUniqueUsers: number;
}

interface ProjectAnalytics {
  id: string;
  projectId: string;
  name: string;
  url: string | null;
  views: number;
  uniqueVisitors: number;
  opens: number;
  returns: number;
  totalEvents: number;
}

interface RankingData {
  mostVisited: ProjectAnalytics | null;
  fastestGrowing: ProjectAnalytics | null;
  bestConversion: ProjectAnalytics | null;
  all: ProjectAnalytics[];
}

export function ProjectsSection() {
  const { period } = useAppStore();
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [analytics, setAnalytics] = useState<ProjectAnalytics[]>([]);
  const [ranking, setRanking] = useState<RankingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [newProject, setNewProject] = useState({ projectId: '', name: '', url: '', description: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [projectsData, analyticsData, rankingData] = await Promise.all([
        fetchProjects(),
        fetchAnalytics('projects', { period }),
        fetchAnalytics('ranking', { period }),
      ]);
      setProjects(projectsData || []);
      setAnalytics(analyticsData || []);
      setRanking(rankingData || null);
    } catch (e) {
      console.error('Failed to load projects:', e);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddProject = async () => {
    if (!newProject.projectId || !newProject.name) return;
    try {
      await createProject({
        projectId: newProject.projectId,
        name: newProject.name,
        url: newProject.url || undefined,
      });
      setNewProject({ projectId: '', name: '', url: '', description: '' });
      setDialogOpen(false);
      loadData();
    } catch (e) {
      console.error('Failed to add project:', e);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm('Удалить проект и все связанные данные?')) return;
    try {
      await fetch(`/api/projects?id=${id}`, { method: 'DELETE' });
      loadData();
    } catch (e) {
      console.error('Failed to delete project:', e);
    }
  };

  const copyTrackerCode = (project: ProjectInfo) => {
    const code = `<script>
  window.AdminPanelTracker = {
    endpoint: '${window.location.origin}/api/track',
    projectId: '${project.projectId}',
    projectName: '${project.name}'
  };
</script>
<script src="${window.location.origin}/tracker/tracker.js" async></script>`;
    navigator.clipboard.writeText(code);
    setCopiedId(project.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getTrackerCode = (project: ProjectInfo) => {
    return `<!-- ADMIN Panel Tracker: ${project.name} -->
<script>
  window.AdminPanelTracker = {
    endpoint: '${window.location.origin}/api/track',
    projectId: '${project.projectId}',
    projectName: '${project.name}'
  };
</script>
<script src="${window.location.origin}/tracker/tracker.js" async></script>`;
  };

  const maxViews = Math.max(...analytics.map(p => p.views), 1);

  return (
    <div className="space-y-6">
      {/* Header with Add button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Управление проектами</h2>
        <Tooltip>
          <TooltipTrigger asChild>
            <div>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Подключить проект
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Подключить новый проект</DialogTitle>
                  </DialogHeader>
                  <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-muted-foreground">
                    Можно отслеживать <strong className="text-foreground">любой сайт</strong> в интернете — GitHub Pages, Vercel, Netlify, WordPress, Tilda, собственный сервер, витрина на Яндекс.Маркете — что угодно. Просто вставьте трекер-код на нужный сайт.
                  </div>
                  <div className="space-y-4">
                    <div>
                      <Label>Название проекта *</Label>
                      <Input
                        placeholder="Мой сайт, Магазин, Блог..."
                        value={newProject.name}
                        onChange={(e) => {
                          const name = e.target.value;
                          const autoId = name
                            .toLowerCase()
                            .replace(/[^\wа-яё]/gi, '-')
                            .replace(/-+/g, '-')
                            .replace(/^-|-$/g, '');
                          setNewProject(p => ({ ...p, name, projectId: p.projectId || autoId }));
                        }}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Любое имя на любом языке — как вам удобно</p>
                    </div>
                    <div>
                      <Label>Технический ID *</Label>
                      <Input
                        placeholder="my-site, online-shop, company-landing"
                        value={newProject.projectId}
                        onChange={(e) => setNewProject(p => ({ ...p, projectId: e.target.value.replace(/\s/g, '-') }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Латиница и дефисы — это внутренний идентификатор, нужен только для системы. Автоматически генерируется из названия</p>
                    </div>
                    <div>
                      <Label>URL проекта *</Label>
                      <Input
                        placeholder="https://example.com, https://myshop.ru, https://tilda.cc/mysite..."
                        value={newProject.url}
                        onChange={(e) => setNewProject(p => ({ ...p, url: e.target.value }))}
                      />
                      <p className="text-xs text-muted-foreground mt-1">Адрес вашего сайта — любого! Не обязательно GitHub</p>
                    </div>
                    <div>
                      <Label>Описание</Label>
                      <Textarea
                        placeholder="Краткое описание проекта (необязательно)"
                        value={newProject.description}
                        onChange={(e) => setNewProject(p => ({ ...p, description: e.target.value }))}
                      />
                    </div>
                    <Button onClick={handleAddProject} disabled={!newProject.projectId || !newProject.name} className="w-full">
                      Подключить
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </TooltipTrigger>
          <TooltipContent side="left" className="max-w-[250px]">
            <p className="text-xs text-primary-foreground/80">Добавить новый сайт для отслеживания. После добавления вы получите трекер-код для вставки на сайт</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Ranking */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Trophy className="h-4 w-4 text-amber-500" />
                  <span className="text-xs text-muted-foreground">Самый посещаемый</span>
                </div>
                {ranking?.mostVisited ? (
                  <>
                    <div className="text-lg font-bold">{ranking.mostVisited.name}</div>
                    <span className="text-sm text-muted-foreground">{formatNumber(ranking.mostVisited.views)} просмотров</span>
                  </>
                ) : <p className="text-sm text-muted-foreground">Нет данных</p>}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[250px]">
            <p className="text-xs text-primary-foreground/80">Проект с наибольшим количеством просмотров за выбранный период</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-emerald-500" />
                  <span className="text-xs text-muted-foreground">Быстрорастущий</span>
                </div>
                {ranking?.fastestGrowing ? (
                  <>
                    <div className="text-lg font-bold">{ranking.fastestGrowing.name}</div>
                    <span className="text-sm text-muted-foreground">{formatNumber(ranking.fastestGrowing.totalEvents)} событий</span>
                  </>
                ) : <p className="text-sm text-muted-foreground">Нет данных</p>}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[250px]">
            <p className="text-xs text-primary-foreground/80">Проект с наибольшей активностью (кол-во событий) за выбранный период</p>
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Target className="h-4 w-4 text-rose-500" />
                  <span className="text-xs text-muted-foreground">Лучшая конверсия</span>
                </div>
                {ranking?.bestConversion ? (
                  <>
                    <div className="text-lg font-bold">{ranking.bestConversion.name}</div>
                    <span className="text-sm text-muted-foreground">
                      {ranking.bestConversion.views > 0 ? ((ranking.bestConversion.opens / ranking.bestConversion.views) * 100).toFixed(1) : 0}%
                    </span>
                  </>
                ) : <p className="text-sm text-muted-foreground">Нет данных</p>}
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[250px]">
            <p className="text-xs text-primary-foreground/80">Проект с самым высоким процентом открытий демо относительно просмотров</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Chart */}
      {analytics.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Card className="cursor-help">
              <CardHeader>
                <CardTitle className="text-base">Просмотры по проектам</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analytics}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                      <XAxis dataKey="name" className="text-xs" angle={-15} textAnchor="end" height={60} />
                      <YAxis className="text-xs" />
                      <RechartsTooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                      <Bar dataKey="views" fill="#10b981" radius={[4, 4, 0, 0]} name="Просмотры" />
                      <Bar dataKey="uniqueVisitors" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Уникальные" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="max-w-[250px]">
            <p className="text-xs text-primary-foreground/80">Сравнение проектов по просмотрам (зелёный) и уникальным посетителям (синий)</p>
          </TooltipContent>
        </Tooltip>
      )}

      {/* Project cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => {
          const a = analytics.find(x => x.id === project.id);
          return (
            <Card key={project.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <FolderKanban className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="font-medium truncate">{project.name}</h3>
                      <p className="text-xs text-muted-foreground font-mono">{project.projectId}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {project.url && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <a href={project.url} target="_blank" rel="noopener noreferrer">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                          </a>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-xs">Открыть сайт проекта</p>
                        </TooltipContent>
                      </Tooltip>
                    )}
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => copyTrackerCode(project)}
                        >
                          {copiedId === project.id ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Code className="h-3.5 w-3.5" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">{copiedId === project.id ? 'Скопировано!' : 'Скопировать трекер-код для вставки на сайт'}</p>
                      </TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => handleDeleteProject(project.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">
                        <p className="text-xs">Удалить проект и все его данные</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>

                {project.description && (
                  <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                )}

                {/* Stats */}
                <div className="grid grid-cols-4 gap-3 mb-3">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center cursor-help">
                        <div className="text-lg font-bold">{formatNumber(a?.views || project._count.events)}</div>
                        <div className="text-xs text-muted-foreground">Просмотры</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Общее количество просмотров за период</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center cursor-help">
                        <div className="text-lg font-bold">{formatNumber(a?.uniqueVisitors || project.recentUniqueUsers)}</div>
                        <div className="text-xs text-muted-foreground">Посетители</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Уникальные посетители за период</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center cursor-help">
                        <div className="text-lg font-bold">{formatNumber(a?.opens || 0)}</div>
                        <div className="text-xs text-muted-foreground">Открытия</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Сколько раз открыли демо/подробности проекта</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="text-center cursor-help">
                        <div className="text-lg font-bold">{project._count.goals}</div>
                        <div className="text-xs text-muted-foreground">Цели</div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Количество отслеживаемых целей (автосоздание при подключении)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>

                {/* Progress bar */}
                {(a?.views || 0) > 0 && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden cursor-help">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${((a?.views || 0) / maxViews) * 100}%` }} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Доля просмотров этого проекта от самого популярного</p>
                    </TooltipContent>
                  </Tooltip>
                )}

                {/* Live indicator */}
                {project.recentEvents > 0 && (
                  <div className="flex items-center gap-2 mt-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-emerald-500">{project.recentEvents} событий за 24ч</span>
                  </div>
                )}

                {/* Tracker code (collapsible) with instructions */}
                <details className="mt-3">
                  <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
                    <LinkIcon className="h-3 w-3" />
                    Код подключения и инструкция
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-xs text-muted-foreground">
                      <strong className="text-foreground">Куда вставлять:</strong> откройте HTML вашего сайта, найдите тег <code className="bg-muted px-1 py-0.5 rounded font-mono">&lt;/head&gt;</code> и вставьте этот код <strong className="text-foreground">прямо перед ним</strong>. Подробная инструкция — в разделе «Настройки».
                    </div>
                    <pre className="bg-muted p-3 rounded-lg text-xs overflow-x-auto font-mono">
                      {getTrackerCode(project)}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full gap-2 text-xs"
                      onClick={() => copyTrackerCode(project)}
                    >
                      {copiedId === project.id ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                      {copiedId === project.id ? 'Скопировано!' : 'Скопировать код'}
                    </Button>
                  </div>
                </details>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {projects.length === 0 && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <FolderKanban className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Нет подключённых проектов</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Подключите проект вручную или вставьте трекер-код на сайт — проект появится автоматически при первом посещении
            </p>
            <Button onClick={() => setDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Подключить проект
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
