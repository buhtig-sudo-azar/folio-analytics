'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  Eye,
  Users,
  Clock,
  TrendingUp,
} from 'lucide-react';
import {
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

interface PageData {
  page: string;
  views: number;
  uniqueVisitors: number;
}

export function PagesSection() {
  const { period, selectedProject } = useAppStore();
  const [pages, setPages] = useState<PageData[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { period };
      if (selectedProject) params.projectId = selectedProject;
      const data = await fetchAnalytics('pages', params);
      setPages(data);
    } catch (e) {
      console.error('Failed to load pages:', e);
    } finally {
      setLoading(false);
    }
  }, [period, selectedProject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalViews = pages.reduce((sum, p) => sum + p.views, 0);
  const totalUnique = pages.reduce((sum, p) => sum + p.uniqueVisitors, 0);

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">Всего просмотров</span>
            </div>
            <div className="text-2xl font-bold">{formatNumber(totalViews)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-500" />
              <span className="text-xs text-muted-foreground">Уникальных</span>
            </div>
            <div className="text-2xl font-bold">{formatNumber(totalUnique)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="h-4 w-4 text-purple-500" />
              <span className="text-xs text-muted-foreground">Страниц</span>
            </div>
            <div className="text-2xl font-bold">{pages.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-amber-500" />
              <span className="text-xs text-muted-foreground">Ср. на страницу</span>
            </div>
            <div className="text-2xl font-bold">{pages.length > 0 ? Math.round(totalViews / pages.length) : 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Page views chart */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Просмотры по страницам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            {pages.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pages.slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="page" className="text-xs font-mono" width={150} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="views" fill="#10b981" radius={[0, 4, 4, 0]} name="Просмотры" />
                  <Bar dataKey="uniqueVisitors" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Уникальные" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {loading ? 'Загрузка...' : 'Нет данных о страницах'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pages list */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Все страницы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {pages.length > 0 ? pages.map((page) => (
              <div key={page.page} className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/50 hover:bg-muted/50">
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-mono">{page.page}</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <span className="text-sm font-bold">{formatNumber(page.views)}</span>
                    <span className="text-xs text-muted-foreground ml-1">просм.</span>
                  </div>
                  <div className="text-center">
                    <span className="text-sm font-bold">{formatNumber(page.uniqueVisitors)}</span>
                    <span className="text-xs text-muted-foreground ml-1">уник.</span>
                  </div>
                </div>
              </div>
            )) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                Данные о страницах появятся при первых посещениях
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
