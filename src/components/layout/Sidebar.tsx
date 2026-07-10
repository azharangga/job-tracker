import { useState, useEffect } from "react";
import { SidebarBody } from "./SidebarBody";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem("sidebar_collapsed") === "true";
  });

  useEffect(() => {
    const handleToggle = () => {
      setIsCollapsed(localStorage.getItem("sidebar_collapsed") === "true");
    };
    window.addEventListener("sidebar-toggle", handleToggle);
    return () => window.removeEventListener("sidebar-toggle", handleToggle);
  }, []);

  return (
    <aside
      className={cn(
        "hidden lg:flex flex-col shrink-0 border-r border-hairline bg-sidebar h-screen sticky top-0 transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[68px]" : "w-[240px]",
      )}
    >
      <SidebarBody isCollapsed={isCollapsed} />
    </aside>
  );
}
