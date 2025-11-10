import { LayoutDashboard, Package, Shield, Layers, Search, Settings, ClipboardList, RefreshCw, Warehouse, Activity, Compass } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from "@/components/ui/sidebar";
import { useLocation } from "wouter";

const menuGroups = [
  {
    label: "Dashboard & Monitoring",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
      },
      {
        title: "Monitor Warranties",
        url: "/monitor-warranties",
        icon: Activity,
      },
      {
        title: "Explore Warranties",
        url: "/explore-warranties",
        icon: Compass,
      },
    ],
  },
  {
    label: "Pool Management",
    items: [
      {
        title: "Coverage Pools",
        url: "/coverage-pools",
        icon: Layers,
      },
      {
        title: "Warranty Explorer",
        url: "/warranty-explorer",
        icon: Search,
      },
    ],
  },
  {
    label: "Inventory",
    items: [
      {
        title: "Replacement Stock",
        url: "/spare-pool",
        icon: Package,
      },
      {
        title: "Stock under Warranty",
        url: "/covered-units",
        icon: Shield,
      },
      {
        title: "Available Stock",
        url: "/available-stock",
        icon: Warehouse,
      },
      {
        title: "Claimed Units",
        url: "/claims",
        icon: ClipboardList,
      },
      {
        title: "Replacements Sent",
        url: "/replacements",
        icon: RefreshCw,
      },
    ],
  },
  {
    label: "Settings",
    items: [
      {
        title: "Configuration",
        url: "/configuration",
        icon: Settings,
      },
    ],
  },
];

export function AppSidebar() {
  const [location] = useLocation();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-base font-semibold px-2 mb-2">
            Coverage Pool Management
          </SidebarGroupLabel>
        </SidebarGroup>
        
        {menuGroups.map((group, groupIndex) => (
          <div key={group.label}>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-medium text-muted-foreground px-2">
                {group.label}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.items.map((item) => {
                    const isActive = location === item.url;
                    return (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton asChild isActive={isActive}>
                          <a href={item.url} data-testid={`link-${item.title.toLowerCase().replace(/\s+/g, "-")}`}>
                            <item.icon />
                            <span>{item.title}</span>
                          </a>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            {groupIndex < menuGroups.length - 1 && <SidebarSeparator />}
          </div>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
