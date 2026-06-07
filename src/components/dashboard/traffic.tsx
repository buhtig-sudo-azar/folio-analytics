'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  Search,
  Share2,
  Link,
  Globe,
  ArrowUpRight,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { fetchAnalytics, formatNumber } from '@/lib/analytics/api';
import { useAppStore } from '@/lib/analytics/store';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

interface TrafficData {
  sources: Array<{ name: string; count: number }>;
  details: Array<{ name: string; count: number }>;
}

interface UTMData {
  sources: Array<{ name: string; count: number }>;
  mediums: Array<{ name: string; count: number }>;
  campaigns: Array<{ name: string; count: number }>;
  contents: Array<{ name: string; count: number }>;
  terms: Array<{ name: string; count: number }>;
}

const sourceLabels: Record<string, string> = {
  direct: 'Прямые',
  search: 'Поисковые системы',
  social: 'Социальные сети',
  referral: 'Переходы с сайтов',
  utm: 'UTM кампании',
};

const sourceIcons: Record<string, React.ElementType> = {
  direct: Globe,
  search: Search,
  social: Share2,
  referral: Link,
  utm: TrendingUp,
};

export function TrafficSection() {
  const { period, selectedProject } = useAppStore();
  const [traffic, setTraffic] = useState<TrafficData>({ sources: [], details: [] });
  const [utm, setUTM] = useState<UTMData>({ sources: [], mediums: [], campaigns: [], contents: [], terms: [] });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { period };
      if (selectedProject) params.projectId = selectedProject;
      const [trafData, utmData] = await Promise.all([
        fetchAnalytics('traffic', params),
        fetchAnalytics('utm', params),
      ]);
      setTraffic(trafData);
      setUTM(utmData);
    } catch (e) {
      console.error('Failed to load traffic:', e);
    } finally {
      setLoading(false);
    }
  }, [period, selectedProject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalTraffic = traffic.sources.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      {/* Source type cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {['direct', 'search', 'social', 'referral', 'utm'].map((source) => {
          const item = traffic.sources.find(s => s.name === source);
          const Icon = sourceIcons[source] || Globe;
          const count = item?.count || 0;
          const percent = totalTraffic > 0 ? Math.round((count / totalTraffic) * 100) : 0;

          return (
            <Card key={source}>
              <CardContent className="p-4 text-center">
                <div className="flex justify-center mb-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="h-4 w-4 text-primary" />
                  </div>
                </div>
                <div className="text-xl font-bold">{formatNumber(count)}</div>
                <p className="text-xs text-muted-foreground">{sourceLabels[source]}</p>
                <Badge variant="secondary" className="mt-1 text-xs">{percent}%</Badge>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Traffic sources pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Распределение источников</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              {traffic.sources.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={traffic.sources}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${sourceLabels[name] || name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {traffic.sources.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {loading ? 'Загрузка...' : 'Нет данных'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detailed sources */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Детализация источников</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-[300px] overflow-y-auto">
              {traffic.details.length > 0 ? traffic.details.map((item, i) => {
                const maxCount = traffic.details[0]?.count || 1;
                const percent = (item.count / maxCount) * 100;
                return (
                  <div key={item.name} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{item.name}</span>
                      <span className="text-sm font-bold">{formatNumber(item.count)}</span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${percent}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              }) : (
                <p className="text-sm text-muted-foreground text-center py-4">Нет данных</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* UTM Analytics */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-500" />
            UTM Аналитика
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="sources">
            <TabsList className="mb-4">
              <TabsTrigger value="sources">Source</TabsTrigger>
              <TabsTrigger value="mediums">Medium</TabsTrigger>
              <TabsTrigger value="campaigns">Campaign</TabsTrigger>
              <TabsTrigger value="contents">Content</TabsTrigger>
              <TabsTrigger value="terms">Term</TabsTrigger>
            </TabsList>

            {['sources', 'mediums', 'campaigns', 'contents', 'terms'].map((tab) => {
              const tabData = utm[tab as keyof UTMData] as Array<{ name: string; count: number }>;
              return (
                <TabsContent key={tab} value={tab}>
                  {tabData.length > 0 ? (
                    <div className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={tabData.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                          <XAxis dataKey="name" className="text-xs" angle={-15} textAnchor="end" height={50} />
                          <YAxis className="text-xs" />
                          <Tooltip
                            contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                          />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="События" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-8">
                      Нет UTM-данных. Используйте UTM-метки в ссылках для отслеживания кампаний.
                    </p>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
