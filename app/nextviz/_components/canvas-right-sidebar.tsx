"use client";

import { usePathname } from "next/navigation";
import RightSidebar from "@/components/right-sidebar";

export function CanvasRightSidebar() {
  const pathname = usePathname();
  if (pathname !== "/nextviz") return null;
  return <RightSidebar />;
}
