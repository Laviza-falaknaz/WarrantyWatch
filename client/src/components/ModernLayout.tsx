import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Package,
  Shield,
  FileText,
  RefreshCw,
  Warehouse,
  Settings,
  ChevronLeft,
  ChevronRight,
  Search,
  Bell,
  Command,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useTheme } from "@/hooks/use-theme";
import { Moon, Sun } from "lucide-react";

interface NavItem {
  label: string;
  icon: any;
  path: string;
  badge?: number;
}

const navigationItems: NavItem[] = [
  { label: "Dashboard", icon: LayoutDashboard, path: "/" },
  { label: "Coverage Pools", icon: Shield, path: "/pools" },
  { label: "Inventory", icon: Package, path: "/inventory" },
  { label: "Warranties", icon: FileText, path: "/warranties" },
  { label: "Available Stock", icon: Warehouse, path: "/available-stock" },
  { label: "Claims", icon: FileText, path: "/claims" },
  { label: "Replacements", icon: RefreshCw, path: "/replacements" },
  { label: "Configuration", icon: Settings, path: "/configuration" },
];

export function ModernLayout({ children }: { children: React.ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [location, setLocation] = useLocation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      {/* Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 80 : 280 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="relative border-r bg-card flex flex-col"
      >
        {/* Logo Section */}
        <div className="h-16 flex items-center justify-between px-6 border-b">
          <AnimatePresence mode="wait">
            {!sidebarCollapsed && (
              <motion.div
                key="logo-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-2"
              >
                <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">Coverage</span>
              </motion.div>
            )}
            {sidebarCollapsed && (
              <motion.div
                key="logo-icon"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto"
              >
                <Shield className="w-5 h-5 text-primary-foreground" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;

            return (
              <motion.button
                key={item.path}
                onClick={() => setLocation(item.path)}
                whileHover={{ scale: 1.02, x: 4 }}
                whileTap={{ scale: 0.98 }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer
                  transition-colors relative group
                  ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  }
                `}
                data-testid={`nav-${item.path.slice(1) || "dashboard"}`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence mode="wait">
                  {!sidebarCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.15 }}
                      className="text-sm font-medium whitespace-nowrap overflow-hidden"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.badge && !sidebarCollapsed && (
                  <Badge variant="secondary" className="ml-auto">
                    {item.badge}
                  </Badge>
                )}
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-8 bg-primary rounded-r-full"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <div className="p-3 border-t">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="w-full"
            data-testid="button-toggle-sidebar"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 border-b bg-card/50 backdrop-blur-sm flex items-center justify-between px-6 gap-4">
          {/* Search Bar */}
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

          {/* Right Section */}
          <div className="flex items-center gap-2">
            {/* Status Badge */}
            <Badge variant="outline" className="gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              System Active
            </Badge>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full"></span>
            </Button>

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              data-testid="button-theme-toggle"
            >
              {theme === "dark" ? (
                <Sun className="w-5 h-5" />
              ) : (
                <Moon className="w-5 h-5" />
              )}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
