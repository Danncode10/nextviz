import { SidebarProvider } from "@/components/ui/sidebar";
import AppSideBar from "@/components/app-sidebar";
import RightSidebar from "@/components/right-sidebar";

export default function NextVizLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <SidebarProvider>
      <AppSideBar />
      <main className="flex-1 h-screen overflow-hidden flex flex-col bg-zinc-950 relative">
        {children}
      </main>
      <RightSidebar />
    </SidebarProvider>
  );
}
