"use client"

import React from 'react'
import {  SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { HistoryIcon, KeyIcon, WorkflowIcon } from "lucide-react"

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
                        const isActive = pathname.includes(route.href)
                        return (
                            <React.Fragment key={i}>
                                <SidebarMenuItem>
                                  <Link href={route.href}>
                                    <SidebarMenuButton isActive={isActive} >
                                        <route.icon/>
                                        {route.name}
                                    </SidebarMenuButton>
                                  </Link>
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
