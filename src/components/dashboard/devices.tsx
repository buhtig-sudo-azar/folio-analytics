'use client';

import { useEffect, useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Monitor,
  Smartphone,
  Tablet,
  Laptop,
  Globe,
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

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#f97316'];

interface DevicesData {
  devices: Array<{ name: string; count: number }>;
  screenResolutions: Array<{ name: string; count: number }>;
  models: Array<{ name: string; count: number }>;
}

type BrowsersData = Array<{ name: string; count: number }>;
type OSData = Array<{ name: string; count: number }>;

const deviceIcons: Record<string, React.ElementType> = {
  desktop: Monitor,
  laptop: Laptop,
  tablet: Tablet,
  mobile: Smartphone,
};

const deviceLabels: Record<string, string> = {
  desktop: 'Десктоп',
  laptop: 'Ноутбук',
  tablet: 'Планшет',
  mobile: 'Мобильный',
};

export function DevicesSection() {
  const { period, selectedProject } = useAppStore();
  const [devices, setDevices] = useState<DevicesData>({ devices: [], screenResolutions: [], models: [] });
  const [browsers, setBrowsers] = useState<BrowsersData>([]);
  const [os, setOS] = useState<OSData>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { period };
      if (selectedProject) params.projectId = selectedProject;
      const [devData, brData, osData] = await Promise.all([
        fetchAnalytics('devices', params),
        fetchAnalytics('browsers', params),
        fetchAnalytics('os', params),
      ]);
      setDevices(devData || { devices: [], screenResolutions: [], models: [] });
      setBrowsers(brData || []);
      setOS(osData || []);
    } catch (e) {
      console.error('Failed to load devices:', e);
    } finally {
      setLoading(false);
    }
  }, [period, selectedProject]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalDevices = devices.devices.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="space-y-6">
      {/* Device type cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {['desktop', 'laptop', 'tablet', 'mobile'].map((type) => {
          const device = devices.devices.find(d => d.name === type);
          const Icon = deviceIcons[type] || Monitor;
          const count = device?.count || 0;
          const percent = totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0;

          return (
            <Tooltip key={type}>
              <TooltipTrigger asChild>
                <Card className="cursor-help">
                  <CardContent className="p-4 text-center">
                    <div className="flex justify-center mb-3">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                    </div>
                    <div className="text-2xl font-bold">{formatNumber(count)}</div>
                    <p className="text-sm text-muted-foreground">{deviceLabels[type]}</p>
                    <Badge variant="secondary" className="mt-2 text-xs">{percent}%</Badge>
                  </CardContent>
                </Card>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-[250px]">
                <p className="text-xs text-primary-foreground/80">
                  {type === 'desktop' ? 'Пользователи с настольных компьютеров' :
                   type === 'laptop' ? 'Пользователи с ноутбуков' :
                   type === 'tablet' ? 'Пользователи с планшетов' :
                   'Пользователи с мобильных телефонов'} — {percent}% от всех
                </p>
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Device distribution pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Распределение устройств</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {devices.devices.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={devices.devices}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={3}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${deviceLabels[name] || name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {devices.devices.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
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

        {/* Screen resolutions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Разрешения экрана</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {devices.screenResolutions.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={devices.screenResolutions.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis type="category" dataKey="name" className="text-xs font-mono" width={90} />
                    <RechartsTooltip />
                    <Bar dataKey="count" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Сессии" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {loading ? 'Загрузка...' : 'Нет данных'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Browsers */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Браузеры</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {browsers.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={browsers.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Сессии" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  {loading ? 'Загрузка...' : 'Нет данных'}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Operating Systems */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Операционные системы</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {os.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={os}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="count"
                      nameKey="name"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {os.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
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
      </div>
    </div>
  );
}
