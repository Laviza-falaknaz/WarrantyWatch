import { LayoutDashboard, Package, Shield, Layers, Search, Settings, ClipboardList, RefreshCw, Warehouse } from "lucide-react";
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
    label: "Overview",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: "Core Inventory",
    items: [
      {
        title: "Replacement Pool",
        url: "/spare-pool",
        icon: Package,
      },
      {
        title: "Stock under Warranty",
        url: "/covered-units",
        icon: Shield,
      },
    ],
  },
  {
    label: "Inventory Tracking",
    items: [
      {
        title: "Available Stock",
        url: "/available-stock",
        icon: Warehouse,
      },
      {
        title: "Claims History",
        url: "/claims",
        icon: ClipboardList,
      },
      {
        title: "Replacements",
        url: "/replacements",
        icon: RefreshCw,
      },
    ],
  },
  {
    label: "Management & Tools",
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
