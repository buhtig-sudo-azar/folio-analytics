'use client';

import { useState } from 'react';
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
  FileText,
  Download,
  Table,
  FileSpreadsheet,
  FileDown,
  Calendar,
  BarChart3,
} from 'lucide-react';
import { getExportUrl, periodLabels } from '@/lib/analytics/api';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export function ReportsSection() {
  const [exportPeriod, setExportPeriod] = useState('30d');
  const [exportType, setExportType] = useState('events');

  const handleExport = (format: string) => {
    const url = getExportUrl(format, exportType, exportPeriod);
    window.open(url, '_blank');
  };

  const reportTypes = [
    {
      title: 'Отчёт по посещениям',
      description: 'Общая статистика посещаемости, уникальные и повторные визиты, динамика',
      icon: BarChart3,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10',
      hint: 'Сводка по посещениям за выбранный период: сколько людей пришло, сколько вернулось, как меняется трафик',
    },
    {
      title: 'Отчёт по проектам',
      description: 'Рейтинг проектов, просмотры, конверсии, сравнительный анализ',
      icon: FileText,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
      hint: 'Какие проекты портфолио самые популярные, какие конверсии приносят и как они сравниваются между собой',
    },
    {
      title: 'Отчёт по географии',
      description: 'Распределение посетителей по странам, регионам и городам',
      icon: Calendar,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
      hint: 'Откуда приходят посетители географически — страны, города, регионы',
    },
    {
      title: 'Отчёт по конверсиям',
      description: 'Воронка конверсии, достижения целей, процент потерь на каждом этапе',
      icon: FileSpreadsheet,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10',
      hint: 'Насколько эффективно посетители проходят путь от просмотра до целевого действия',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Report types */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((report) => (
          <Tooltip key={report.title}>
            <TooltipTrigger asChild>
              <Card className="hover:shadow-md transition-shadow cursor-help">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${report.bg}`}>
                      <report.icon className={`h-6 w-6 ${report.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium mb-1">{report.title}</h3>
                      <p className="text-sm text-muted-foreground">{report.description}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-[280px]">
              <p className="text-xs text-primary-foreground/80">{report.hint}</p>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>

      {/* Export section */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="cursor-help">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4" />
                Экспорт данных
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-end gap-4 flex-wrap">
                  <div className="min-w-[160px]">
                    <label className="text-sm text-muted-foreground mb-1 block">Период</label>
                    <Select value={exportPeriod} onValueChange={setExportPeriod}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(periodLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="min-w-[160px]">
                    <label className="text-sm text-muted-foreground mb-1 block">Тип данных</label>
                    <Select value={exportType} onValueChange={setExportType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="events">События</SelectItem>
                        <SelectItem value="sessions">Сессии</SelectItem>
                        <SelectItem value="pages">Страницы</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={() => handleExport('csv')} className="gap-2">
                        <Table className="h-4 w-4" />
                        Скачать CSV
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Скачать данные в формате CSV (откроется в Excel/Google Sheets)</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline" onClick={() => handleExport('json')} className="gap-2">
                        <FileSpreadsheet className="h-4 w-4" />
                        Скачать JSON
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent side="bottom">
                      <p className="text-xs">Скачать данные в формате JSON (для разработчиков и интеграций)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[280px]">
          <p className="text-xs text-primary-foreground/80">Выберите период и тип данных, затем скачайте файл. CSV — для таблиц, JSON — для разработчиков</p>
        </TooltipContent>
      </Tooltip>

      {/* Auto-reports info */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Card className="cursor-help">
            <CardHeader>
              <CardTitle className="text-base">Автоматические отчёты</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { period: 'Ежедневный', description: 'Сводка за последние 24 часа с ключевыми метриками', hint: 'Пришлём уведомление каждый день с основными цифрами' },
                  { period: 'Еженедельный', description: 'Анализ трендов за неделю с сравнением с предыдущей', hint: 'Сравнение текущей недели с прошлой по ключевым метрикам' },
                  { period: 'Ежемесячный', description: 'Подробный отчёт за месяц с рекомендациями', hint: 'Полный обзор с анализом и рекомендациями по улучшению' },
                  { period: 'Ежеквартальный', description: 'Стратегический анализ за квартал', hint: 'Долгосрочные тренды и стратегические выводы' },
                  { period: 'Ежегодный', description: 'Годовой обзор с прогнозами развития', hint: 'Обзор всего года с прогнозами на следующий' },
                ].map((report) => (
                  <Tooltip key={report.period}>
                    <TooltipTrigger asChild>
                      <div className="flex items-center justify-between py-2 px-3 rounded-lg border border-border/50 cursor-help hover:bg-muted/50">
                        <div>
                          <span className="text-sm font-medium">{report.period}</span>
                          <p className="text-xs text-muted-foreground">{report.description}</p>
                        </div>
                        <Badge variant="secondary" className="text-xs">Авто</Badge>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="left" className="max-w-[250px]">
                      <p className="text-xs text-primary-foreground/80">{report.hint}</p>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </CardContent>
          </Card>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[250px]">
          <p className="text-xs text-primary-foreground/80">Автоматические отчёты будут отправляться на почту (функция в разработке)</p>
        </TooltipContent>
      </Tooltip>
    </div>
  );
}
