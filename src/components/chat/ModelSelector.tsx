'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Check, ChevronsUpDown, Circle, Loader2, RefreshCw, Plus,
  Zap, Clock, AlertTriangle, XCircle, Wifi
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useModelStore, type RateLimitInfo } from '@/lib/analytics/model-store';

export function ModelSelector() {
  const {
    currentModel,
    setCurrentModel,
    availableModels,
    rateLimits,
    modelsLoading,
    fetchAvailableModels,
    checkModel,
    checkAllLimits,
  } = useModelStore();

  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkingSingle, setCheckingSingle] = useState<string | null>(null);
  const [checkProgress, setCheckProgress] = useState({ current: 0, total: 0 });
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);
  const [showTestPanel, setShowTestPanel] = useState(false);

  // Load models on mount
  useEffect(() => {
    fetchAvailableModels();
  }, [fetchAvailableModels]);

  const handleCheckAll = useCallback(async () => {
    setChecking(true);
    setCheckProgress({ current: 0, total: availableModels.length });
    try {
      for (let i = 0; i < availableModels.length; i++) {
        setCheckProgress({ current: i + 1, total: availableModels.length });
        await checkModel(availableModels[i].id);
      }
    } finally {
      setChecking(false);
      setCheckProgress({ current: 0, total: 0 });
    }
  }, [availableModels, checkModel]);

  const handleCheckSingle = useCallback(async (modelId: string) => {
    setCheckingSingle(modelId);
    try {
      await checkModel(modelId);
    } finally {
      setCheckingSingle(null);
    }
  }, [checkModel]);

  const getStatusIcon = (modelId: string) => {
    const info: RateLimitInfo | undefined = rateLimits[modelId];
    if (!info) return <Circle className="h-2.5 w-2.5 text-muted-foreground/40" />;
    if (info.available) return <Wifi className="h-2.5 w-2.5 text-emerald-500" />;
    return <XCircle className="h-2.5 w-2.5 text-red-500" />;
  };

  const getStatusBadge = (modelId: string) => {
    const info: RateLimitInfo | undefined = rateLimits[modelId];
    if (!info) return null;

    if (info.available) {
      return (
        <span className="flex items-center gap-1 text-[9px] text-emerald-600 dark:text-emerald-400">
          <Zap className="h-2.5 w-2.5" />
          {info.latency ? `${info.latency}мс` : 'OK'}
        </span>
      );
    }

    const reasonMap: Record<string, string> = {
      rate_limited: 'Лимит',
      insufficient_credits: 'Нет кредита',
      model_not_found: 'Не найдена',
      model_overloaded: 'Перегрузка',
      network_error: 'Нет сети',
    };

    return (
      <span className="flex items-center gap-1 text-[9px] text-red-500">
        <AlertTriangle className="h-2.5 w-2.5" />
        {reasonMap[info.reason || ''] || info.reason || 'Ошибка'}
      </span>
    );
  };

  const handleAddCustom = () => {
    const val = customInput.trim();
    if (val) {
      setCurrentModel(val);
      setCustomInput('');
      setShowCustom(false);
      setOpen(false);
    }
  };

  const currentName = availableModels.find((m) => m.id === currentModel)?.name || currentModel;
  const currentInfo = rateLimits[currentModel];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground px-2 max-w-[200px]"
        >
          {currentInfo ? (
            currentInfo.available ? (
              <Wifi className="h-2.5 w-2.5 text-emerald-500" />
            ) : (
              <XCircle className="h-2.5 w-2.5 text-red-500" />
            )
          ) : (
            <Circle className="h-2.5 w-2.5 text-muted-foreground/40" />
          )}
          <span className="truncate">{currentName}</span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[360px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Поиск модели..." />
          <CommandList>
            <CommandEmpty>Модель не найдена</CommandEmpty>
            <CommandGroup>
              {modelsLoading ? (
                <div className="flex items-center justify-center py-4 text-xs text-muted-foreground">
                  <Loader2 className="h-3 w-3 animate-spin mr-2" />
                  Загрузка...
                </div>
              ) : (
                availableModels.map((model) => (
                  <CommandItem
                    key={model.id}
                    value={model.id}
                    onSelect={() => {
                      setCurrentModel(model.id);
                      setOpen(false);
                    }}
                    className="flex items-center gap-2 py-2"
                  >
                    {getStatusIcon(model.id)}
                    <span className="flex-1 truncate text-xs">{model.name}</span>
                    {getStatusBadge(model.id)}
                    {/* Per-model test button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCheckSingle(model.id);
                      }}
                      disabled={checkingSingle === model.id}
                      title="Проверить доступность"
                    >
                      {checkingSingle === model.id ? (
                        <Loader2 className="h-2.5 w-2.5 animate-spin" />
                      ) : (
                        <Zap className="h-2.5 w-2.5" />
                      )}
                    </Button>
                    {currentModel === model.id && <Check className="h-3 w-3 shrink-0 text-primary" />}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>

          {/* Test progress bar */}
          {checking && checkProgress.total > 0 && (
            <div className="px-3 py-1.5">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>Проверка моделей...</span>
                <span>{checkProgress.current}/{checkProgress.total}</span>
              </div>
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${(checkProgress.current / checkProgress.total) * 100}%` }}
                />
              </div>
            </div>
          )}

          <div className="border-t border-border p-2 space-y-2">
            <div className="flex gap-1.5">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 flex-1 text-xs"
                onClick={handleCheckAll}
                disabled={checking}
              >
                {checking ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <RefreshCw className="h-3 w-3 mr-1" />}
                Проверить все
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowTestPanel(!showTestPanel)}
                title="Панель тестирования"
              >
                <Clock className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => setShowCustom(!showCustom)}
                title="Добавить кастомную модель"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            {showCustom && (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={customInput}
                  onChange={(e) => setCustomInput(e.target.value)}
                  placeholder="custom/model-id:free"
                  className="flex-1 h-7 px-2 text-xs bg-muted rounded-md border border-border focus:outline-none focus:ring-1 focus:ring-primary"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddCustom(); }}
                />
                <Button size="sm" className="h-7 text-xs" onClick={handleAddCustom}>
                  OK
                </Button>
              </div>
            )}
          </div>
        </Command>

        {/* Test Results Panel */}
        {showTestPanel && (
          <div className="border-t border-border p-2 max-h-[200px] overflow-y-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                Результаты тестов
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4"
                onClick={() => setShowTestPanel(false)}
              >
                <XCircle className="h-2.5 w-2.5" />
              </Button>
            </div>
            {Object.keys(rateLimits).length === 0 ? (
              <p className="text-[10px] text-muted-foreground text-center py-2">
                Нажмите «Проверить все» для тестирования
              </p>
            ) : (
              <div className="space-y-0.5">
                {Object.entries(rateLimits)
                  .sort(([, a], [, b]) => {
                    // Available first, then by latency
                    if (a.available !== b.available) return a.available ? -1 : 1;
                    return (a.latency || 9999) - (b.latency || 9999);
                  })
                  .map(([modelId, info]) => {
                    const modelName = availableModels.find(m => m.id === modelId)?.name || modelId;
                    return (
                      <div
                        key={modelId}
                        className={cn(
                          'flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px]',
                          currentModel === modelId && 'bg-muted'
                        )}
                      >
                        {info.available ? (
                          <Wifi className="h-2.5 w-2.5 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-2.5 w-2.5 text-red-500 shrink-0" />
                        )}
                        <span className="flex-1 truncate">{modelName}</span>
                        {info.available && info.latency && (
                          <span className={cn(
                            'shrink-0 font-mono',
                            info.latency < 2000 ? 'text-emerald-500' :
                            info.latency < 5000 ? 'text-yellow-500' : 'text-red-500'
                          )}>
                            {info.latency}мс
                          </span>
                        )}
                        {!info.available && (
                          <span className="shrink-0 text-red-400">
                            {info.reason === 'rate_limited' ? '429' : 'XXX'}
                          </span>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
