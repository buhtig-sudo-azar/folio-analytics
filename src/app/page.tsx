'use client';

import { useAppStore } from '@/lib/analytics/store';
import { DashboardSidebar } from '@/components/dashboard/sidebar';
import { DashboardHeader } from '@/components/dashboard/header';
import { OverviewSection } from '@/components/dashboard/overview';
import { RealtimeSection } from '@/components/dashboard/realtime';
import { ProjectsSection } from '@/components/dashboard/projects';
import { GeographySection } from '@/components/dashboard/geography';
import { DevicesSection } from '@/components/dashboard/devices';
import { TrafficSection } from '@/components/dashboard/traffic';
import { ConversionsSection } from '@/components/dashboard/conversions';
import { ComparisonSection } from '@/components/dashboard/comparison';
import { PagesSection } from '@/components/dashboard/pages';
import { ReportsSection } from '@/components/dashboard/reports';
import { SettingsSection } from '@/components/dashboard/settings';
import { OnboardingDialog } from '@/components/dashboard/onboarding';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

export default function Home() {
  const { activeSection, sidebarOpen } = useAppStore();

  const renderSection = () => {
    switch (activeSection) {
      case 'overview': return <OverviewSection />;
      case 'realtime': return <RealtimeSection />;
      case 'projects': return <ProjectsSection />;
      case 'geography': return <GeographySection />;
      case 'devices': return <DevicesSection />;
      case 'traffic': return <TrafficSection />;
      case 'conversions': return <ConversionsSection />;
      case 'comparison': return <ComparisonSection />;
      case 'pages': return <PagesSection />;
      case 'reports': return <ReportsSection />;
      case 'settings': return <SettingsSection />;
      default: return <OverviewSection />;
    }
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-screen bg-background">
        <DashboardSidebar />
        <div className={cn(
          'transition-all duration-300',
          sidebarOpen ? 'ml-64' : 'ml-16'
        )}>
          <DashboardHeader />
          <main className="p-6">
            {renderSection()}
          </main>
        </div>
        <OnboardingDialog />
      </div>
    </TooltipProvider>
  );
}
