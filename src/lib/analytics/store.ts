import { create } from 'zustand';

export type Section =
  | 'overview'
  | 'realtime'
  | 'projects'
  | 'geography'
  | 'devices'
  | 'traffic'
  | 'conversions'
  | 'comparison'
  | 'pages'
  | 'reports'
  | 'settings';

interface AppState {
  activeSection: Section;
  setActiveSection: (section: Section) => void;
  period: string;
  setPeriod: (period: string) => void;
  selectedProject: string | null;
  setSelectedProject: (projectId: string | null) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  realtimeEnabled: boolean;
  setRealtimeEnabled: (enabled: boolean) => void;
  showOnboarding: boolean;
  setShowOnboarding: (show: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeSection: 'overview',
  setActiveSection: (section) => set({ activeSection: section }),
  period: '7d',
  setPeriod: (period) => set({ period }),
  selectedProject: null,
  setSelectedProject: (projectId) => set({ selectedProject: projectId }),
  sidebarOpen: true,
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  realtimeEnabled: false,
  setRealtimeEnabled: (enabled) => set({ realtimeEnabled: enabled }),
  showOnboarding: typeof window !== 'undefined' ? !localStorage.getItem('admin-panel-onboarding-seen') : true,
  setShowOnboarding: (show) => {
    if (!show) localStorage.setItem('admin-panel-onboarding-seen', '1');
    set({ showOnboarding: show });
  },
}));
