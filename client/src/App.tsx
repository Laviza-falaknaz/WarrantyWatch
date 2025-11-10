import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { ModernLayout } from "@/components/ModernLayout";
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
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TooltipProvider>
          <ModernLayout>
            <Router />
          </ModernLayout>
          <Toaster />
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
