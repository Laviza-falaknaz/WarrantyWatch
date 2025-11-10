import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Moon, Sun, Bell, Search, Command } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useTheme } from "@/hooks/use-theme";
import MonitorDashboard from "@/pages/MonitorDashboard";
import ExploreDashboard from "@/pages/ExploreDashboard";
import Inventory from "@/pages/Inventory";
import Warranties from "@/pages/Warranties";
import PoolGroups from "@/pages/PoolGroups";
import PoolDetail from "@/pages/PoolDetail";
import Configuration from "@/pages/Configuration";
import WarrantyExplorer from "@/pages/WarrantyExplorer";
import Claims from "@/pages/Claims";
import Replacements from "@/pages/Replacements";
import AvailableStockPage from "@/pages/AvailableStock";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={MonitorDashboard} />
      <Route path="/explore" component={ExploreDashboard} />
      <Route path="/pools" component={PoolGroups} />
      <Route path="/pools/:poolId" component={PoolDetail} />
      <Route path="/warranty-explorer" component={WarrantyExplorer} />
      <Route path="/inventory" component={Inventory} />
      <Route path="/warranties" component={Warranties} />
      <Route path="/available-stock" component={AvailableStockPage} />
      <Route path="/claims" component={Claims} />
      <Route path="/replacements" component={Replacements} />
      <Route path="/configuration" component={Configuration} />
      <Route component={NotFound} />
    </Switch>
  );
}

export default function App() {
  const { theme, setTheme } = useTheme();
  
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <SidebarProvider>
            <div className="flex h-screen w-full">
              <AppSidebar />
              <div className="flex flex-col flex-1">
                <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 gap-4">
                  <div className="flex items-center gap-4">
                    <SidebarTrigger data-testid="button-sidebar-toggle" />
                    <div className="flex-1 max-w-md relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search or press ⌘K..."
                        className="pl-9 pr-20 bg-background"
                        data-testid="input-search"
                      />
                      <kbd className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground">
                        <Command className="w-3 h-3" />K
                      </kbd>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="gap-2">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      System Active
                    </Badge>
                    <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                      <Bell className="w-5 h-5" />
                      <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                      data-testid="button-theme-toggle"
                    >
                      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                    </Button>
                  </div>
                </header>
                <main className="flex-1 overflow-auto">
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
