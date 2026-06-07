'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Globe,
  MapPin,
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
  Treemap,
} from 'recharts';
import { fetchAnalytics, formatNumber } from '@/lib/analytics/api';
import { useAppStore } from '@/lib/analytics/store';

interface GeoData {
  countries: Array<{ country: string; visitors: number; uniqueVisitors: number }>;
  cities: Array<{ city: string; country: string; visitors: number }>;
}

// Country to approximate region mapping for heatmap
const regionMap: Record<string, string> = {
  'Russia': 'Европа/Азия',
  'United States': 'Сев. Америка',
  'Germany': 'Европа',
  'United Kingdom': 'Европа',
  'France': 'Европа',
  'India': 'Азия',
  'China': 'Азия',
  'Japan': 'Азия',
  'Brazil': 'Юж. Америка',
  'Canada': 'Сев. Америка',
  'Australia': 'Океания',
  'Ukraine': 'Европа',
  'Belarus': 'Европа',
  'Kazakhstan': 'Азия',
  'Netherlands': 'Европа',
  'Poland': 'Европа',
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316', '#84cc16', '#14b8a6'];

interface TreemapProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  name?: string;
  value?: number;
  index?: number;
  colors?: string[];
}

function TreemapCell(props: TreemapProps) {
  const { x = 0, y = 0, width = 0, height = 0, name = '', value = 0, index = 0, colors = COLORS } = props;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: colors[index % colors.length],
          stroke: 'hsl(var(--card))',
          strokeWidth: 2,
          rx: 4,
        }}
      />
      {width > 60 && height > 30 && (
        <>
          <text x={x + 8} y={y + 20} fill="white" fontSize={12} fontWeight="bold">
            {name.length > 15 ? name.slice(0, 15) + '...' : name}
          </text>
          <text x={x + 8} y={y + 36} fill="rgba(255,255,255,0.8)" fontSize={10}>
            {formatNumber(value)}
          </text>
        </>
      )}
    </g>
  );
}

export function GeographySection() {
  const { period, selectedProject } = useAppStore();
  const [data, setData] = useState<GeoData>({ countries: [], cities: [] });
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { period };
      if (selectedProject) params.projectId = selectedProject;
      const result = await fetchAnalytics('geography', params);
      setData(result || { countries: [], cities: [] });
    } catch (e) {
      console.error('Failed to load geography:', e);
    } finally {
      setLoading(false);
    }
  }, [period, selectedProject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const treemapData = data.countries.map(c => ({
    name: c.country,
    size: c.visitors,
    value: c.visitors,
  }));

  // Group by region
  const regionCounts: Record<string, number> = {};
  for (const c of data.countries) {
    const region = regionMap[c.country] || 'Другие';
    regionCounts[region] = (regionCounts[region] || 0) + c.visitors;
  }

  return (
    <div className="space-y-6">
      {/* World heatmap (treemap visualization) */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4 text-emerald-500" />
            Мировая карта посещений
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {treemapData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <Treemap
                  data={treemapData}
                  dataKey="size"
                  nameKey="name"
                  aspectRatio={4 / 3}
                  content={<TreemapCell />}
                />
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {loading ? 'Загрузка...' : 'Нет данных о географии'}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Regions distribution */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Распределение по регионам</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            {Object.entries(regionCounts).map(([region, count], i) => (
              <div key={region} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border/50">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-sm font-medium">{region}</span>
                <Badge variant="secondary" className="text-xs">{formatNumber(count)}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Country rankings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Рейтинг стран
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.countries.length > 0 ? data.countries.map((c, i) => {
                const maxVisitors = data.countries[0]?.visitors || 1;
                const percent = (c.visitors / maxVisitors) * 100;
                return (
                  <div key={c.country} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}</span>
                        <span className="text-sm">{c.country}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold">{formatNumber(c.visitors)}</span>
                        <span className="text-xs text-muted-foreground">({c.uniqueVisitors} уникальных)</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-emerald-500"
                        style={{ width: `${percent}%` }}
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

        {/* City rankings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <MapPin className="h-4 w-4 text-amber-500" />
              Рейтинг городов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {data.cities.length > 0 ? data.cities.map((c, i) => (
                <div key={`${c.city}_${c.country}`} className="flex items-center justify-between py-1 px-2 rounded hover:bg-muted/50">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}</span>
                    <div>
                      <span className="text-sm">{c.city}</span>
                      <span className="text-xs text-muted-foreground ml-2">{c.country}</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="text-xs">{formatNumber(c.visitors)}</Badge>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-4">Нет данных</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Country chart */}
      {data.countries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Посещения по странам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.countries.slice(0, 15)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="country" className="text-xs" width={100} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="visitors" fill="#10b981" radius={[0, 4, 4, 0]} name="Посетители" />
                  <Bar dataKey="uniqueVisitors" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Уникальные" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
