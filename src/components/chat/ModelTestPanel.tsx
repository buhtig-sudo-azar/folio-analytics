'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Wifi, XCircle, Zap, Clock, AlertTriangle, RefreshCw,
  Loader2, ChevronDown, ChevronUp, Shield, ShieldOff,
  ArrowUpDown, CheckCircle2, XCircle as XIcon
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useModelStore, type RateLimitInfo, type FreeModel } from '@/lib/analytics/model-store';

interface ModelTestResult {
  modelId: string;
  modelName: string;
  status: 'pending' | 'testing' | 'available' | 'unavailable';
  latency?: number;
  reason?: string;
  remaining?: number;
  resetAt?: number;
}

type SortField = 'name' | 'status' | 'latency';
type SortDir = 'asc' | 'desc';

export function ModelTestPanel({ onClose }: { onClose: () => void }) {
  const {
    availableModels,
    rateLimits,
    apiToken,
    fetchAvailableModels,
    checkModel,
    currentModel,
    setCurrentModel,
    modelsLoading,
  } = useModelStore();

  const [testing, setTesting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState<Map<string, ModelTestResult>>(new Map());
  const [sortField, setSortField] = useState<SortField>('status');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [showDetails, setShowDetails] = useState<string | null>(null);
  const [testMode, setTestMode] = useState<'quick' | 'full'>('quick');

  // Sync results from rateLimits store
  useEffect(() => {
    const newResults = new Map<string, ModelTestResult>();
    for (const [modelId, info] of Object.entries(rateLimits)) {
      const model = availableModels.find(m => m.id === modelId);
      newResults.set(modelId, {
        modelId,
        modelName: model?.name || modelId,
        status: info.available ? 'available' : 'unavailable',
        latency: info.latency,
        reason: info.reason,
        remaining: info.rateLimit?.remaining,
      });
    }
    setResults(newResults);
  }, [rateLimits, availableModels]);

  const handleTestAll = useCallback(async () => {
    setTesting(true);
    const models = availableModels;
    setProgress({ current: 0, total: models.length });

    // Reset all to pending
    const newResults = new Map(results);
    for (const m of models) {
      newResults.set(m.id, {
        modelId: m.id,
        modelName: m.name,
        status: 'testing',
      });
    }
    setResults(newResults);

    for (let i = 0; i < models.length; i++) {
      const m = models[i];
      setProgress({ current: i + 1, total: models.length });

      // Update to testing
      setResults(prev => {
        const next = new Map(prev);
        next.set(m.id, { modelId: m.id, modelName: m.name, status: 'testing' });
        return next;
      });

      try {
        const info = await checkModel(m.id);
        setResults(prev => {
          const next = new Map(prev);
          next.set(m.id, {
            modelId: m.id,
            modelName: m.name,
            status: info.available ? 'available' : 'unavailable',
            latency: info.latency,
            reason: info.reason,
            remaining: info.remaining,
          });
          return next;
        });
      } catch {
        setResults(prev => {
          const next = new Map(prev);
          next.set(m.id, {
            modelId: m.id,
            modelName: m.name,
            status: 'unavailable',
            reason: 'network_error',
          });
          return next;
        });
      }

      // Small delay between tests to avoid overwhelming the API
      if (testMode === 'full' && i < models.length - 1) {
        await new Promise(r => setTimeout(r, 500));
      }
    }

    setTesting(false);
  }, [availableModels, checkModel, testMode, results]);

  const handleTestSingle = useCallback(async (model: FreeModel) => {
    setResults(prev => {
      const next = new Map(prev);
      next.set(model.id, { modelId: model.id, modelName: model.name, status: 'testing' });
      return next;
    });

    try {
      const info = await checkModel(model.id);
      setResults(prev => {
        const next = new Map(prev);
        next.set(model.id, {
          modelId: model.id,
          modelName: model.name,
          status: info.available ? 'available' : 'unavailable',
          latency: info.latency,
          reason: info.reason,
          remaining: info.remaining,
        });
        return next;
      });
    } catch {
      setResults(prev => {
        const next = new Map(prev);
        next.set(model.id, {
          modelId: model.id,
          modelName: model.name,
          status: 'unavailable',
          reason: 'network_error',
        });
        return next;
      });
    }
  }, [checkModel]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedModels = [...availableModels].sort((a, b) => {
    const aResult = results.get(a.id);
    const bResult = results.get(b.id);
    const dir = sortDir === 'asc' ? 1 : -1;

    switch (sortField) {
      case 'name':
        return a.name.localeCompare(b.name) * dir;
      case 'status': {
        const statusOrder = { available: 0, testing: 1, pending: 2, unavailable: 3 };
        const aStatus = aResult?.status || 'pending';
        const bStatus = bResult?.status || 'pending';
        return (statusOrder[aStatus] - statusOrder[bStatus]) * dir;
      }
      case 'latency': {
        const aLat = aResult?.latency ?? 99999;
        const bLat = bResult?.latency ?? 99999;
        return (aLat - bLat) * dir;
      }
      default:
        return 0;
    }
  });

  const availableCount = [...results.values()].filter(r => r.status === 'available').length;
  const unavailableCount = [...results.values()].filter(r => r.status === 'unavailable').length;
  const notTestedCount = availableModels.length - availableCount - unavailableCount;

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Header */}
      <div className="px-3 py-2 border-b border-border space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-emerald-500" />
            <span className="text-xs font-bold">Тест моделей</span>
          </div>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onClose}>
            <XIcon className="h-3 w-3" />
          </Button>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[10px]">
          <span className="flex items-center gap-1 text-emerald-500">
            <Wifi className="h-2.5 w-2.5" />
            {availableCount} доступно
          </span>
          <span className="flex items-center gap-1 text-red-500">
            <XCircle className="h-2.5 w-2.5" />
            {unavailableCount} лимит
          </span>
          <span className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-2.5 w-2.5" />
            {notTestedCount} не проверено
          </span>
        </div>

        {/* Progress bar */}
        {testing && (
          <div>
            <div className="flex items-center justify-between text-[9px] text-muted-foreground mb-0.5">
              <span>Проверка {progress.current}/{progress.total}...</span>
              <span>{Math.round((progress.current / progress.total) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="default"
            size="sm"
            className="h-6 text-[10px] gap-1 flex-1 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white"
            onClick={handleTestAll}
            disabled={testing || availableModels.length === 0}
          >
            {testing ? (
              <Loader2 className="h-2.5 w-2.5 animate-spin" />
            ) : (
              <Zap className="h-2.5 w-2.5" />
            )}
            {testing ? 'Тестирование...' : 'Тест всех моделей'}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-6 text-[10px]", testMode === 'quick' && 'text-primary')}
            onClick={() => setTestMode('quick')}
            title="Быстрый тест (без задержек)"
          >
            <Clock className="h-2.5 w-2.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className={cn("h-6 text-[10px]", testMode === 'full' && 'text-primary')}
            onClick={() => setTestMode('full')}
            title="Полный тест (с задержками между запросами)"
          >
            <Shield className="h-2.5 w-2.5" />
          </Button>
        </div>

        {/* API key indicator */}
        <div className="flex items-center gap-1 text-[9px] text-muted-foreground">
          {apiToken ? (
            <>
              <Shield className="h-2.5 w-2.5 text-emerald-500" />
              <span className="text-emerald-500">Свой ключ</span>
            </>
          ) : (
            <>
              <ShieldOff className="h-2.5 w-2.5" />
              <span>Серверный ключ</span>
            </>
          )}
        </div>
      </div>

      {/* Sortable header */}
      <div className="flex items-center gap-1 px-3 py-1.5 text-[9px] font-medium text-muted-foreground uppercase tracking-wider border-b border-border bg-muted/30">
        <button
          className="flex items-center gap-0.5 hover:text-foreground transition-colors flex-1"
          onClick={() => handleSort('name')}
        >
          Модель
          <ArrowUpDown className="h-2 w-2" />
        </button>
        <button
          className="flex items-center gap-0.5 hover:text-foreground transition-colors w-16 text-center"
          onClick={() => handleSort('status')}
        >
          Статус
          <ArrowUpDown className="h-2 w-2" />
        </button>
        <button
          className="flex items-center gap-0.5 hover:text-foreground transition-colors w-14 text-right"
          onClick={() => handleSort('latency')}
        >
          Пинг
          <ArrowUpDown className="h-2 w-2" />
        </button>
        <div className="w-5" /> {/* test button space */}
      </div>

      {/* Results list */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {modelsLoading ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Загрузка списка моделей...
          </div>
        ) : sortedModels.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-xs text-muted-foreground">
            Нет доступных моделей
          </div>
        ) : (
          sortedModels.map((model) => {
            const result = results.get(model.id);
            const status = result?.status || 'pending';
            const isCurrent = currentModel === model.id;
            const isExpanded = showDetails === model.id;

            return (
              <div key={model.id} className="border-b border-border/50 last:border-0">
                <div
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1.5 cursor-pointer transition-colors',
                    isCurrent && 'bg-primary/5',
                    status === 'testing' && 'bg-yellow-500/5',
                    'hover:bg-muted/50'
                  )}
                  onClick={() => setCurrentModel(model.id)}
                >
                  {/* Status icon */}
                  <div className="w-4 flex justify-center shrink-0">
                    {status === 'testing' && <Loader2 className="h-3 w-3 animate-spin text-yellow-500" />}
                    {status === 'available' && <Wifi className="h-3 w-3 text-emerald-500" />}
                    {status === 'unavailable' && <XCircle className="h-3 w-3 text-red-500" />}
                    {status === 'pending' && <Clock className="h-3 w-3 text-muted-foreground/40" />}
                  </div>

                  {/* Name */}
                  <span className={cn(
                    'flex-1 truncate text-[11px]',
                    isCurrent ? 'font-semibold text-foreground' : 'text-foreground/80'
                  )}>
                    {model.name}
                  </span>

                  {/* Status badge */}
                  <div className="w-16 text-center shrink-0">
                    {status === 'available' && (
                      <span className="text-[9px] text-emerald-500 font-medium">OK</span>
                    )}
                    {status === 'unavailable' && (
                      <span className="text-[9px] text-red-500 font-medium">
                        {result?.reason === 'rate_limited' ? '429' :
                         result?.reason === 'model_not_found' ? '404' :
                         result?.reason === 'model_overloaded' ? '503' :
                         result?.reason === 'insufficient_credits' ? '402' : 'ERR'}
                      </span>
                    )}
                    {status === 'testing' && (
                      <span className="text-[9px] text-yellow-500">...</span>
                    )}
                  </div>

                  {/* Latency */}
                  <div className="w-14 text-right shrink-0">
                    {result?.latency ? (
                      <span className={cn(
                        'text-[9px] font-mono',
                        result.latency < 2000 ? 'text-emerald-500' :
                        result.latency < 5000 ? 'text-yellow-500' : 'text-red-500'
                      )}>
                        {result.latency}мс
                      </span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground">—</span>
                    )}
                  </div>

                  {/* Test single button */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-5 w-5 shrink-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleTestSingle(model);
                    }}
                    disabled={status === 'testing'}
                    title="Проверить"
                  >
                    {status === 'testing' ? (
                      <Loader2 className="h-2.5 w-2.5 animate-spin" />
                    ) : (
                      <Zap className="h-2.5 w-2.5" />
                    )}
                  </Button>

                  {/* Expand details */}
                  <button
                    className="h-5 w-5 shrink-0 flex items-center justify-center hover:bg-muted rounded"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDetails(isExpanded ? null : model.id);
                    }}
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-2.5 w-2.5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-2.5 w-2.5 text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Expanded details */}
                {isExpanded && result && (
                  <div className="px-3 pb-2 pl-9 space-y-1">
                    <div className="text-[9px] text-muted-foreground space-y-0.5">
                      <div className="flex justify-between">
                        <span>ID:</span>
                        <span className="font-mono">{model.id}</span>
                      </div>
                      {result.latency && (
                        <div className="flex justify-between">
                          <span>Латентность:</span>
                          <span className={cn(
                            'font-mono',
                            result.latency < 2000 ? 'text-emerald-500' :
                            result.latency < 5000 ? 'text-yellow-500' : 'text-red-500'
                          )}>{result.latency}мс</span>
                        </div>
                      )}
                      {result.remaining !== undefined && (
                        <div className="flex justify-between">
                          <span>Остаток:</span>
                          <span className="font-mono">{result.remaining} запросов</span>
                        </div>
                      )}
                      {result.reason && (
                        <div className="flex justify-between">
                          <span>Причина:</span>
                          <span className="font-mono text-red-500">{result.reason}</span>
                        </div>
                      )}
                      {model.contextLength && (
                        <div className="flex justify-between">
                          <span>Контекст:</span>
                          <span className="font-mono">{model.contextLength.toLocaleString()} токенов</span>
                        </div>
                      )}
                    </div>
                    {isCurrent && (
                      <div className="flex items-center gap-1 text-[9px] text-primary">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Текущая модель
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
