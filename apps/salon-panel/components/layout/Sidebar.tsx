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
  CalendarOff,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import type { UserRole } from "@/lib/api";
import { type AppPage, PAGE_ACCESS } from "@/lib/rbac";
import { useState, useEffect } from "react";
import {
  bumpUnreadCount,
  getUnreadCount,
  seedUnreadCount,
} from "@/api/services/notificationService";
import { socketClient } from "@/lib/socket-client";

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
  { page: "leaves",        label: "Leaves",         icon: CalendarOff,     group: "manage" },
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
  userId?: string | null;
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
  userId,
  isOpen,
  salonName,
  onNavigate,
  onLogout,
  onClose,
}: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [unread, setUnread] = useState(0);
  const UNREAD_POLL_MS = 120000;

  useEffect(() => {
    if (!userId) return;

    let cancelled = false;
    const poll = async () => {
      try {
        const count = await getUnreadCount();
        if (!cancelled) {
          setUnread(count);
          seedUnreadCount(count);
        }
      } catch {
        // endpoint unavailable — badge stays 0
      }
    };
    poll();
    const timer = setInterval(poll, UNREAD_POLL_MS);

    socketClient.connect();
    socketClient.setUserId(userId);
    const offNotif = socketClient.onNotificationNew(() => {
      setUnread((prev) => {
        bumpUnreadCount(1);
        return prev + 1;
      });
    });

    return () => {
      cancelled = true;
      clearInterval(timer);
      offNotif();
    };
  }, [userId]);

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
          <NavGroup items={mainItems} currentPage={currentPage} collapsed={collapsed} onNavigate={handleNavigate} unread={unread} />

          {/* Management */}
          {manageItems.length > 0 && (
            <div>
              {!collapsed && (
                <p className="text-[9px] font-semibold tracking-[0.15em] text-muted uppercase px-3 mb-2">
                  Manage
                </p>
              )}
              <NavGroup items={manageItems} currentPage={currentPage} collapsed={collapsed} onNavigate={handleNavigate} unread={unread} />
            </div>
          )}

          {/* Other */}
          {otherItems.length > 0 && (
            <NavGroup items={otherItems} currentPage={currentPage} collapsed={collapsed} onNavigate={handleNavigate} unread={unread} />
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
  unread,
}: {
  items: NavItem[];
  currentPage: AppPage;
  collapsed: boolean;
  onNavigate: (page: AppPage) => void;
  unread: number;
}) {
  return (
    <div className="space-y-0.5">
      {items.map(({ page, label, icon: Icon }) => {
        const active = currentPage === page;
        const showBadge = page === "notifications" && unread > 0;
        return (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            title={collapsed ? label : undefined}
            className={`
              relative w-full flex items-center gap-3 rounded-lg text-[13px] font-medium
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
            {!collapsed && <span className="flex-1 text-left">{label}</span>}
            {showBadge && (
              <span
                className={`rounded-full bg-gold text-ink text-[9px] font-bold flex items-center justify-center h-4 min-w-[16px] px-1 shrink-0 ${
                  collapsed ? "absolute top-0 right-0" : ""
                }`}
              >
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
