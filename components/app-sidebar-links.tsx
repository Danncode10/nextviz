"use client";

import React from "react";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./ui/sidebar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, HistoryIcon, KeyIcon, WorkflowIcon } from "lucide-react";
import { useFlows } from "@/app/nextviz/_context/flows-context";

const routes = [
  { name: "Flows", href: "/nextviz/flows", icon: WorkflowIcon },
  { name: "Credentials", href: "/nextviz/credentials", icon: KeyIcon },
  { name: "Executions", href: "/nextviz/executions", icon: HistoryIcon },
];

const AppSideBarLinks = () => {
  const pathname = usePathname();
  const { flows, activeFlowId } = useFlows();

  return (
    <SidebarGroup>
      <SidebarGroupContent>
        <SidebarGroupLabel>General</SidebarGroupLabel>
        <SidebarMenu>
          {routes.map((route, i) => {
            const isActive =
              pathname.includes(route.href) || pathname === "/nextviz";

            if (route.name === "Flows") {
              return (
                <Collapsible defaultOpen className="group/collapsible" key={i}>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      render={<CollapsibleTrigger />}
                      isActive={isActive}
                    >
                      <route.icon />
                      {route.name}
                      <ChevronRight className="ml-auto transition-transform group-data-open/collapsible:rotate-90" />
                    </SidebarMenuButton>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {flows.map((flow) => (
                          <SidebarMenuSubItem key={flow.id}>
                            <SidebarMenuSubButton
                              render={
                                <Link href={`/nextviz?flowId=${flow.id}`} />
                              }
                              isActive={activeFlowId === flow.id}
                            >
                              <span className="truncate">{flow.name}</span>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                        {flows.length === 0 && (
                          <SidebarMenuSubItem>
                            <span className="px-2 py-1 text-xs text-muted-foreground">
                              No flows yet
                            </span>
                          </SidebarMenuSubItem>
                        )}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                </Collapsible>
              );
            }

            return (
              <React.Fragment key={i}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    render={<Link href={route.href} />}
                    isActive={isActive}
                  >
                    <route.icon />
                    {route.name}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </React.Fragment>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
};

export default AppSideBarLinks;
