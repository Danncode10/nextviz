import { SidebarProvider } from "@/components/ui/sidebar";
import AppSideBar from "@/components/app-sidebar";
import RightSidebar from "@/components/right-sidebar";
import { FlowsProvider } from "./_context/flows-context";

export default function NextVizLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <FlowsProvider>
        <AppSideBar />
        <main className="flex-1 h-screen overflow-hidden flex flex-col bg-zinc-950 relative">
          {children}
        </main>
        <RightSidebar />
      </FlowsProvider>
    </SidebarProvider>
  );
}
