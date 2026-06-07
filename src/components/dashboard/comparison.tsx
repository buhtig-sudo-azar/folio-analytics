'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  GitCompareArrows,
  Eye,
  Users,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  Target,
  Clock,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';
import { fetchAnalytics, fetchProjects, formatNumber } from '@/lib/analytics/api';
import { useAppStore } from '@/lib/analytics/store';

interface ProjectInfo {
  id: string;
  projectId: string;
  name: string;
  url: string | null;
}

interface CompareData {
  projectA: {
    id: string;
    projectId: string;
    name: string;
    stats: {
      views: number;
      uniqueVisitors: number;
      opens: number;
      returns: number;
    };
  } | null;
  projectB: {
    id: string;
    projectId: string;
    name: string;
    stats: {
      views: number;
      uniqueVisitors: number;
      opens: number;
      returns: number;
    };
  } | null;
}

export function ComparisonSection() {
  const { period } = useAppStore();
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [projectA, setProjectA] = useState<string>('');
  const [projectB, setProjectB] = useState<string>('');
  const [comparison, setComparison] = useState<CompareData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProjects().then(setProjects).catch(console.error);
  }, []);

  const doCompare = useCallback(async () => {
    if (!projectA || !projectB) return;
    setLoading(true);
    try {
      const data = await fetchAnalytics('comparison', { projectA, projectB, period });
      // If API returns error object (no projectA/projectB data), treat as null
      if (data && data.error) {
        setComparison(null);
      } else {
        setComparison(data);
      }
    } catch (e) {
      console.error('Comparison failed:', e);
      setComparison(null);
    } finally {
      setLoading(false);
    }
  }, [projectA, projectB, period]);

  const getMetricDiff = (a: number, b: number) => {
    if (b === 0) return a > 0 ? 100 : 0;
    return Math.round(((a - b) / b) * 100);
  };

  const radarData = comparison?.projectA && comparison?.projectB ? [
    {
      metric: 'Просмотры',
      A: comparison.projectA.stats.views,
      B: comparison.projectB.stats.views,
    },
    {
      metric: 'Посетители',
      A: comparison.projectA.stats.uniqueVisitors,
      B: comparison.projectB.stats.uniqueVisitors,
    },
    {
      metric: 'Открытия',
      A: comparison.projectA.stats.opens,
      B: comparison.projectB.stats.opens,
    },
    {
      metric: 'Возвраты',
      A: comparison.projectA.stats.returns,
      B: comparison.projectB.stats.returns,
    },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Project selectors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <GitCompareArrows className="h-4 w-4" />
            Сравнение проектов
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-muted-foreground mb-1 block">Проект A</label>
              <Select value={projectA} onValueChange={setProjectA}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите проект" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="text-lg font-bold text-muted-foreground mt-5">VS</div>

            <div className="flex-1 min-w-[200px]">
              <label className="text-sm text-muted-foreground mb-1 block">Проект B</label>
              <Select value={projectB} onValueChange={setProjectB}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите проект" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button onClick={doCompare} disabled={!projectA || !projectB || loading} className="mt-5">
              Сравнить
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comparison results */}
      {comparison?.projectA && comparison?.projectB && (
        <>
          {/* Metric comparison cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Просмотры', icon: Eye, keyA: comparison.projectA.stats.views, keyB: comparison.projectB.stats.views },
              { label: 'Посетители', icon: Users, keyA: comparison.projectA.stats.uniqueVisitors, keyB: comparison.projectB.stats.uniqueVisitors },
              { label: 'Открытия', icon: Target, keyA: comparison.projectA.stats.opens, keyB: comparison.projectB.stats.opens },
              { label: 'Возвраты', icon: Clock, keyA: comparison.projectA.stats.returns, keyB: comparison.projectB.stats.returns },
            ].map(({ label, icon: Icon, keyA, keyB }) => {
              const diff = getMetricDiff(keyA, keyB);
              return (
                <Card key={label}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-lg font-bold">{formatNumber(keyA)}</div>
                        <p className="text-xs text-muted-foreground">{comparison.projectA.name}</p>
                      </div>
                      <div className="text-center">
                        {diff > 0 ? (
                          <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">
                            <ArrowUpRight className="h-3 w-3 mr-1" />+{diff}%
                          </Badge>
                        ) : diff < 0 ? (
                          <Badge className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20">
                            <ArrowDownRight className="h-3 w-3 mr-1" />{diff}%
                          </Badge>
                        ) : (
                          <Badge variant="secondary">0%</Badge>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold">{formatNumber(keyB)}</div>
                        <p className="text-xs text-muted-foreground">{comparison.projectB.name}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Radar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Сравнительный радар</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[350px]">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid className="stroke-border" />
                    <PolarAngleAxis dataKey="metric" className="text-xs" />
                    <PolarRadiusAxis className="text-xs" />
                    <Radar
                      name={comparison.projectA.name}
                      dataKey="A"
                      stroke="#10b981"
                      fill="#10b981"
                      fillOpacity={0.2}
                    />
                    <Radar
                      name={comparison.projectB.name}
                      dataKey="B"
                      stroke="#3b82f6"
                      fill="#3b82f6"
                      fillOpacity={0.2}
                    />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-sm">{comparison.projectA.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <span className="text-sm">{comparison.projectB.name}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bar comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Сравнение показателей</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={radarData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="metric" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip />
                    <Bar dataKey="A" fill="#10b981" name={comparison.projectA.name} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="B" fill="#3b82f6" name={comparison.projectB.name} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!comparison && !loading && (
        <Card>
          <CardContent className="p-8 text-center">
            <GitCompareArrows className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Выберите два проекта для сравнения</h3>
            <p className="text-sm text-muted-foreground">
              Сравните просмотры, конверсии, удержание и вовлечённость между проектами
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
