import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { ThemeProvider } from "@/hooks/use-theme";
import ThemeToggle from "@/components/ThemeToggle";
import Dashboard from "@/pages/Dashboard";
import Inventory from "@/pages/Inventory";
import Warranties from "@/pages/Warranties";
import PoolGroups from "@/pages/PoolGroups";
import Analytics from "@/pages/Analytics";
import Configuration from "@/pages/Configuration";
import WarrantyExplorer from "@/pages/WarrantyExplorer";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/spare-pool" component={Inventory} />
      <Route path="/covered-units" component={Warranties} />
      <Route path="/coverage-pools" component={PoolGroups} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/configuration" component={Configuration} />
      <Route path="/warranty-explorer" component={WarrantyExplorer} />
      {/* Legacy routes for compatibility */}
      <Route path="/inventory" component={Inventory} />
      <Route path="/warranties" component={Warranties} />
      <Route path="/pool-groups" component={PoolGroups} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider style={style as React.CSSProperties}>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1 overflow-hidden">
                <header className="flex items-center justify-between gap-4 p-4 border-b">
                  <SidebarTrigger data-testid="button-sidebar-toggle" />
                  <ThemeToggle />
                </header>
                <main className="flex-1 overflow-auto p-6">
                  <Router />
                </main>
              </div>
            </div>
          </SidebarProvider>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
