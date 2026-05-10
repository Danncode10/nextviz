"use client";

import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "./ui/sidebar";
import { Globe, Play, ScrollText, Search, Webhook } from "lucide-react";
import { Input } from "./ui/input";

const NODE_PALETTE = [
  {
    group: "Triggers",
    nodes: [
      { type: "manualTrigger", label: "Manual Trigger", icon: Play, color: "text-primary" },
      { type: "onHTTP", label: "HTTP Trigger", icon: Webhook, color: "text-violet-400" },
    ],
  },
  {
    group: "Actions",
    nodes: [
      { type: "httpAction", label: "HTTP Action", icon: Globe, color: "text-orange-500" },
      { type: "logData", label: "Log Data", icon: ScrollText, color: "text-emerald-400" },
    ],
  },
];

export default function RightSidebar() {
  const [query, setQuery] = useState("");

  const onDragStart = (event: React.DragEvent, nodeType: string, label: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData("application/reactflow-label", label);
    event.dataTransfer.effectAllowed = "move";
  };

  const filtered = NODE_PALETTE.map((group) => ({
    ...group,
    nodes: group.nodes.filter((n) =>
      n.label.toLowerCase().includes(query.toLowerCase())
    ),
  })).filter((group) => group.nodes.length > 0);

  return (
    <Sidebar side="right" collapsible="icon">
      <SidebarHeader className="border-b border-border py-3 px-3 gap-2 flex flex-col group-data-[collapsible=icon]:items-center">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider group-data-[collapsible=icon]:hidden">
          Node Palette
        </p>
        <div className="relative group-data-[collapsible=icon]:hidden">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input
            placeholder="Search nodes..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="pl-8 h-8 text-xs"
          />
        </div>
        <Search className="hidden w-4 h-4 text-muted-foreground group-data-[collapsible=icon]:block" />
      </SidebarHeader>

      <SidebarContent>
        {filtered.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center px-4 py-6 group-data-[collapsible=icon]:hidden">
            No nodes match &ldquo;{query}&rdquo;
          </p>
        ) : (
          filtered.map((group) => (
            <SidebarGroup key={group.group}>
              <SidebarGroupLabel>{group.group}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {group.nodes.map((node) => (
                    <SidebarMenuItem key={node.type}>
                      <SidebarMenuButton
                        className="cursor-grab active:cursor-grabbing select-none"
                        draggable
                        onDragStart={(e) => onDragStart(e, node.type, node.label)}
                      >
                        <node.icon className={`w-4 h-4 shrink-0 ${node.color}`} />
                        <span>{node.label}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))
        )}
      </SidebarContent>
    </Sidebar>
  );
}
