"use client"

import React from 'react'
import {  
    SidebarGroup, 
    SidebarGroupContent, 
    SidebarGroupLabel, 
    SidebarMenu, 
    SidebarMenuButton, 
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubItem,
    SidebarMenuSubButton
} from "./ui/sidebar"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HistoryIcon, KeyIcon, WorkflowIcon, ChevronRight } from "lucide-react"

export const routes = [
    {
        name:'Flows',
        href:"/nextviz/flows",
        icon:WorkflowIcon
    },
    {
        name:'Credentials',
        href:"/nextviz/credentials",
        icon:KeyIcon
    },
    {
        name:'Executions',
        href:"/nextviz/executions",
        icon:HistoryIcon
    },
]

const AppSideBarLinks = () => {
    const pathname = usePathname()
  return (
   <SidebarGroup>
                <SidebarGroupContent>
                    <SidebarGroupLabel>
                        General
                    </SidebarGroupLabel>
                   <SidebarMenu>
                     {routes.map((route,i)=>{
                        const isActive = pathname.includes(route.href) || pathname === '/nextviz'; // Also active on root for Flows

                        if (route.name === "Flows") {
                            return (
                                <Collapsible defaultOpen className="group/collapsible" key={i}>
                                    <SidebarMenuItem>
                                        <SidebarMenuButton render={<CollapsibleTrigger />} isActive={isActive}>
                                            <route.icon/>
                                            {route.name}
                                            <ChevronRight className="ml-auto transition-transform group-data-open/collapsible:rotate-90" />
                                        </SidebarMenuButton>
                                        <CollapsibleContent>
                                            <SidebarMenuSub>
                                                <SidebarMenuSubItem>
                                                    <SidebarMenuSubButton render={<Link href="/nextviz" />} isActive={true}>
                                                        <span>nextviz example</span>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            </SidebarMenuSub>
                                        </CollapsibleContent>
                                    </SidebarMenuItem>
                                </Collapsible>
                            )
                        }

                        return (
                            <React.Fragment key={i}>
                                <SidebarMenuItem>
                                  <SidebarMenuButton render={<Link href={route.href} />} isActive={isActive} >
                                      <route.icon/>
                                      {route.name}
                                  </SidebarMenuButton>
                                </SidebarMenuItem>
                            </React.Fragment>
                        )
                    })}
                   </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
  )
}

export default AppSideBarLinks
