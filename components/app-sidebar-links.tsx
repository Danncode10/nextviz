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
import { ChevronRight, HistoryIcon, KeyIcon, WorkflowIcon, MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { useFlows } from "@/app/nextviz/_context/flows-context";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteFlow, saveFlow } from "@/lib/nextviz/actions";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const routes = [
  { name: "Flows", href: "/nextviz/flows", icon: WorkflowIcon },
  { name: "Credentials", href: "/nextviz/credentials", icon: KeyIcon },
  { name: "Executions", href: "/nextviz/executions", icon: HistoryIcon },
];

const AppSideBarLinks = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { flows, activeFlowId, refreshFlows } = useFlows();

  // ── Rename State ─────────────────────────────────────────────────────────
  const [renamingFlow, setRenamingFlow] = React.useState<{ id: string; name: string } | null>(null);
  const [newName, setNewName] = React.useState("");

  const handleRename = async () => {
    if (!renamingFlow || !newName.trim()) return;
    const flow = flows.find(f => f.id === renamingFlow.id);
    if (!flow) return;

    await saveFlow({ ...flow, name: newName });
    await refreshFlows();
    setRenamingFlow(null);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this flow?")) return;
    const res = await deleteFlow(id);
    if (res.success) {
      await refreshFlows();
      if (activeFlowId === id) {
        router.push("/nextviz");
      }
    } else {
      alert("Failed to delete flow: " + res.error);
    }
  };

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
                          <SidebarMenuSubItem key={flow.id} className="group/item relative">
                            <SidebarMenuSubButton
                              render={
                                <Link href={`/nextviz?flowId=${flow.id}`} />
                              }
                              isActive={activeFlowId === flow.id}
                            >
                              <span className="truncate">{flow.name}</span>
                            </SidebarMenuSubButton>

                            <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover/item:opacity-100 transition-opacity">
                              <DropdownMenu>
                                <DropdownMenuTrigger className="w-5 h-5 flex items-center justify-center rounded-md hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 outline-none">
                                  <MoreHorizontal className="w-3.5 h-3.5" />
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                  <DropdownMenuItem 
                                    onClick={() => {
                                      setRenamingFlow({ id: flow.id, name: flow.name });
                                      setNewName(flow.name);
                                    }}
                                    className="gap-2"
                                  >
                                    <Pencil className="w-3.5 h-3.5" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    onClick={() => handleDelete(flow.id)}
                                    className="gap-2 text-destructive focus:text-destructive"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
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

      <Dialog open={!!renamingFlow} onOpenChange={(open) => !open && setRenamingFlow(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Flow</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="rename-input">Flow Name</Label>
              <Input 
                id="rename-input" 
                value={newName} 
                onChange={(e) => setNewName(e.target.value)} 
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRenamingFlow(null)}>Cancel</Button>
            <Button onClick={handleRename}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarGroup>
  );
};

export default AppSideBarLinks;
