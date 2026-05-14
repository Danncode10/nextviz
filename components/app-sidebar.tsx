"use client";

import React from 'react'
import { Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarRail } from "./ui/sidebar"
import AppSideBarLinks from "./app-sidebar-links"
import { ModeToggle } from './mode-toggle'
import { TerminalSquare } from 'lucide-react'

const AppSideBar = () => {
  const toggleConsole = () => {
    document.dispatchEvent(new CustomEvent("nextviz:toggle-console"));
  };

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
            <div className="flex items-center justify-between px-4 py-3 group-data-[collapsible=icon]:justify-center">
              <span className="text-xs text-muted-foreground group-data-[collapsible=icon]:hidden">Local Bridge v1.0</span>
              <button
                onClick={toggleConsole}
                title="Toggle Console"
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <TerminalSquare className="w-4 h-4" />
                <span className="group-data-[collapsible=icon]:hidden">Console</span>
              </button>
            </div>
        </SidebarFooter>
    </Sidebar>
  )
}

export default AppSideBar
