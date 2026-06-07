'use client';

import { useEffect, useState } from 'react';
import { Check, ChevronsUpDown, Circle, Loader2, RefreshCw, Plus } from 'lucide-react';
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
    checkAllLimits,
  } = useModelStore();

  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const [customInput, setCustomInput] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  // Load models on mount
  useEffect(() => {
    fetchAvailableModels();
  }, [fetchAvailableModels]);

  const handleCheckAll = async () => {
    setChecking(true);
    try {
      await checkAllLimits();
    } finally {
      setChecking(false);
    }
  };

  const getDotColor = (modelId: string): string => {
    const info: RateLimitInfo | undefined = rateLimits[modelId];
    if (!info) return 'bg-muted-foreground/40';
    if (info.available) return 'bg-emerald-500';
    return 'bg-red-500';
  };

  const getDotTitle = (modelId: string): string => {
    const info: RateLimitInfo | undefined = rateLimits[modelId];
    if (!info) return 'Не проверена';
    if (info.available) return `Доступна (латентность: ${info.latency}мс)`;
    return `Лимит: ${info.reason || 'исчерпана'}`;
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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 gap-1.5 text-[11px] text-muted-foreground hover:text-foreground px-2 max-w-[200px]"
        >
          <Circle className={cn('h-2 w-2 fill-current', getDotColor(currentModel))} />
          <span className="truncate">{currentName}</span>
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
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
                    className="flex items-center gap-2"
                  >
                    <Circle
                      className={cn('h-2 w-2 shrink-0', getDotColor(model.id))}
                      title={getDotTitle(model.id)}
                    />
                    <span className="flex-1 truncate text-xs">{model.name}</span>
                    {currentModel === model.id && <Check className="h-3 w-3 shrink-0 text-primary" />}
                  </CommandItem>
                ))
              )}
            </CommandGroup>
          </CommandList>

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
                onClick={() => setShowCustom(!showCustom)}
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
      </PopoverContent>
    </Popover>
  );
}
