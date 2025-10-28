import { AppSidebar } from "../app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

export default function AppSidebarExample() {
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex-1 p-6">
          <h2 className="text-lg font-medium">Main Content Area</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Click sidebar items to navigate
          </p>
        </div>
      </div>
    </SidebarProvider>
  );
}
