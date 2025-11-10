import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/hooks/use-theme";
import { ModernLayout } from "@/components/ModernLayout";
import Dashboard from "@/pages/Dashboard";
import MonitorWarranties from "@/pages/MonitorWarranties";
import ExploreWarranties from "@/pages/ExploreWarranties";
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
      <Route path="/" component={Dashboard} />
      <Route path="/monitor-warranties" component={MonitorWarranties} />
      <Route path="/explore-warranties" component={ExploreWarranties} />
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
