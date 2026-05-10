"use client";

import { Sidebar, SidebarContent, SidebarHeader, SidebarGroup, SidebarGroupLabel, SidebarGroupContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "./ui/sidebar"
import { Globe, Play, Plus, ScrollText, Webhook } from "lucide-react"

export default function RightSidebar() {
  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/reactflow-label', label);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="border-b border-border py-4 px-4 flex items-center group-data-[collapsible=icon]:justify-center">
        <h2 className="font-semibold text-sm flex items-center gap-2 group-data-[collapsible=icon]:hidden">
          <Plus className="w-4 h-4" /> Add Node
        </h2>
        <Plus className="w-4 h-4 hidden group-data-[collapsible=icon]:block" />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Triggers</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => onDragStart(e, 'manualTrigger', 'Manual Trigger')}
                >
                  <Play className="w-4 h-4 text-primary shrink-0" />
                  <span>Manual Trigger</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => onDragStart(e, 'onHTTP', 'HTTP Trigger')}
                >
                  <Webhook className="w-4 h-4 text-violet-400 shrink-0" />
                  <span>HTTP Trigger</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Actions</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => onDragStart(e, 'httpAction', 'HTTP Action')}
                >
                  <Globe className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>HTTP Action</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="cursor-grab active:cursor-grabbing"
                  draggable
                  onDragStart={(e) => onDragStart(e, 'logData', 'Log Data')}
                >
                  <ScrollText className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Log Data</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  )
}
