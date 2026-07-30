"use client";

import {
  LayoutDashboard,
  CalendarDays,
  Users,
  Scissors,
  CalendarClock,
  BarChart3,
  Bell,
  LogOut,
  GitBranch,
  UserCog,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { UserRole } from "@/lib/api";
import { type AppPage, PAGE_ACCESS } from "@/lib/rbac";
import { useState } from "react";

interface NavItem {
  page: AppPage;
  label: string;
  icon: React.ElementType;
  group: "main" | "manage" | "other";
}

const NAV_ITEMS: NavItem[] = [
  { page: "dashboard",     label: "Dashboard",      icon: LayoutDashboard, group: "main" },
  { page: "bookings",      label: "Bookings",       icon: CalendarDays,    group: "main" },
  { page: "schedule",      label: "Schedule",       icon: CalendarClock,   group: "main" },
  { page: "customers",     label: "Customers",      icon: Users,           group: "main" },
  { page: "services",      label: "Services",       icon: Scissors,        group: "manage" },
  { page: "staff",         label: "Staff",          icon: UserCog,         group: "manage" },
  { page: "branches",      label: "Branches",       icon: GitBranch,       group: "manage" },
  { page: "reports",       label: "Reports",        icon: BarChart3,       group: "manage" },
  { page: "notifications", label: "Notifications",  icon: Bell,            group: "other" },
];

interface SidebarProps {
  currentPage: AppPage;
  role: UserRole;
  name: string;
  email: string;
  initials: string;
  isOpen: boolean;
  salonName: string;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
  onClose: () => void;
}

export default function Sidebar({
  currentPage,
  role,
  name,
  email,
  initials,
  isOpen,
  salonName,
  onNavigate,
  onLogout,
  onClose,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const visibleItems = NAV_ITEMS.filter((item) =>
    PAGE_ACCESS[item.page]?.includes(role),
  );

  const mainItems = visibleItems.filter((i) => i.group === "main");
  const manageItems = visibleItems.filter((i) => i.group === "manage");
  const otherItems = visibleItems.filter((i) => i.group === "other");

  function handleNavigate(page: AppPage) {
    onNavigate(page);
    onClose();
  }

  const sidebarWidth = collapsed ? "w-[68px]" : "w-60";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 ${sidebarWidth} bg-white border-r border-border
          flex flex-col transition-all duration-300 ease-in-out
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Brand */}
        <div className={`px-5 pt-6 pb-5 shrink-0 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed ? (
            <div>
              <p className="text-[9px] font-semibold tracking-[0.2em] text-muted uppercase">
                Salon
              </p>
              <h1 className="text-lg font-semibold text-ink mt-0.5 leading-tight truncate">
                {salonName}
              </h1>
            </div>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-primary text-white flex items-center justify-center text-xs font-bold">
              {salonName[0]}
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex text-muted hover:text-ink transition-colors p-1"
          >
            {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-6">
          {/* Main */}
          <NavGroup items={mainItems} currentPage={currentPage} collapsed={collapsed} onNavigate={handleNavigate} />

          {/* Management */}
          {manageItems.length > 0 && (
            <div>
              {!collapsed && (
                <p className="text-[9px] font-semibold tracking-[0.15em] text-muted uppercase px-3 mb-2">
                  Manage
                </p>
              )}
              <NavGroup items={manageItems} currentPage={currentPage} collapsed={collapsed} onNavigate={handleNavigate} />
            </div>
          )}

          {/* Other */}
          {otherItems.length > 0 && (
            <NavGroup items={otherItems} currentPage={currentPage} collapsed={collapsed} onNavigate={handleNavigate} />
          )}
        </nav>

        {/* User + logout */}
        <div className="px-3 py-4 border-t border-border shrink-0">
          <div className={`flex items-center ${collapsed ? "justify-center" : "gap-3 px-2"}`}>
            <div className="w-8 h-8 rounded-lg bg-accent/10 text-accent flex items-center justify-center text-[11px] font-semibold shrink-0">
              {initials}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-medium text-ink truncate">{name}</p>
                <p className="text-[10px] text-muted capitalize">{role}</p>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={onLogout}
                title="Sign out"
                className="text-muted hover:text-danger transition-colors shrink-0 p-1 rounded-md hover:bg-danger/5"
              >
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

function NavGroup({
  items,
  currentPage,
  collapsed,
  onNavigate,
}: {
  items: NavItem[];
  currentPage: AppPage;
  collapsed: boolean;
  onNavigate: (page: AppPage) => void;
}) {
  return (
    <div className="space-y-0.5">
      {items.map(({ page, label, icon: Icon }) => {
        const active = currentPage === page;
        return (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            title={collapsed ? label : undefined}
            className={`
              w-full flex items-center gap-3 rounded-lg text-[13px] font-medium
              transition-all duration-150
              ${collapsed ? "justify-center px-2 py-2.5" : "px-3 py-2"}
              ${
                active
                  ? "bg-accent/8 text-accent"
                  : "text-slate hover:text-ink hover:bg-subtle"
              }
            `}
          >
            <Icon size={16} strokeWidth={active ? 2 : 1.5} />
            {!collapsed && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}