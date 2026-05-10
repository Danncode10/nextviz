import React, { Suspense } from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "./ui/sidebar"
import AppSideBarLinks from "./app-sidebar-links"
import { ModeToggle } from './mode-toggle'

const AppSideBar = () => {
  return (
    <Sidebar collapsible='icon'>
        <SidebarRail/>
        <SidebarHeader className="flex items-center gap-2 flex-row group-data-[collapsible=icon]:justify-center py-4">
            <div className="bg-primary text-primary-foreground p-1 rounded-sm">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-network"><rect x="16" y="16" width="6" height="6" rx="1"/><rect x="2" y="16" width="6" height="6" rx="1"/><rect x="9" y="2" width="6" height="6" rx="1"/><path d="M5 16v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3"/><path d="M12 12V8"/></svg>
            </div>
            <p className="text-xl font-black group-data-[collapsible=icon]:hidden">NextViz</p>
        </SidebarHeader>
        <SidebarContent>
           <AppSideBarLinks/>
           <ModeToggle/>
        </SidebarContent>
        <SidebarFooter>
            <div className="p-4 group-data-[collapsible=icon]:hidden text-xs text-muted-foreground text-center">
              Local Bridge v1.0
            </div>
        </SidebarFooter>
    </Sidebar>
  )
}

export default AppSideBar
