"use client";

import {
  LayoutDashboard,
  CalendarDays,
  Clock,
  Users,
  Scissors,
  UserCog,
  CalendarOff,
  GitBranch,
  BarChart3,
  Bell,
  LogOut,
  ChevronsLeft,
  ChevronsRight,
  KeyRound,
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
  { page: "schedule",      label: "Schedule",       icon: Clock,           group: "main" },
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
  collapsed: boolean;
  salonName: string;
  onNavigate: (page: AppPage) => void;
  onLogout: () => void;
  onChangePassword?: () => void;
  onClose: () => void;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  currentPage,
  role,
  name,
  email,
  initials,
  userId,
  isOpen,
  collapsed,
  salonName,
  onNavigate,
  onLogout,
  onChangePassword,
  onClose,
  onToggleCollapse,
}: SidebarProps) {
  const [unread, setUnread] = useState(0);
  const UNREAD_POLL_MS = 120000;

  useEffect(() => {
    let cancelled = false;
    const poll = async () => {
      try {
        const count = await getUnreadCount();
        if (!cancelled) {
          setUnread(count);
        }
      } catch {
        // silent fallback
      }
    };
    poll();
    const timer = setInterval(poll, UNREAD_POLL_MS);

    const handleUnreadEvent = async () => {
      try {
        const count = await getUnreadCount();
        if (!cancelled) setUnread(count);
      } catch {}
    };
    if (typeof window !== "undefined") {
      window.addEventListener("notifications_unread_updated", handleUnreadEvent);
    }

    if (userId) {
      socketClient.connect();
      socketClient.setUserId(userId);
    }
    const offNotif = socketClient.onNotificationNew(() => {
      setUnread((prev) => {
        bumpUnreadCount(1);
        return prev + 1;
      });
    });

    return () => {
      cancelled = true;
      clearInterval(timer);
      if (typeof window !== "undefined") {
        window.removeEventListener("notifications_unread_updated", handleUnreadEvent);
      }
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

  const sidebarWidth = collapsed ? "w-[72px]" : "w-64";

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/30 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 ${sidebarWidth} bg-white border-r border-slate-200/80
          flex flex-col transition-all duration-300 ease-in-out shadow-sm
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        {/* Brand Header */}
        <div className={`px-5 pt-5 pb-6 shrink-0 flex items-center ${collapsed ? "justify-center" : "justify-between"}`}>
          {!collapsed ? (
            <div className="flex items-center gap-3 min-w-0">
              <img
                src="/logo.png"
                alt="ST CUT Logo"
                className="w-10 h-10 rounded-xl object-contain bg-black p-1 shrink-0 shadow-md border border-slate-800"
              />
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
                  ST CUT PARTNER
                </p>
                <h1 className="text-sm font-extrabold text-slate-900 leading-tight truncate">
                  {salonName || "Ramesh Salon"}
                </h1>
              </div>
            </div>
          ) : (
            <img
              src="/logo.png"
              alt="ST CUT Logo"
              className="w-9 h-9 rounded-xl object-contain bg-black p-1 shrink-0 shadow-md border border-slate-800"
            />
          )}
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex text-slate-400 hover:text-slate-700 transition-colors p-1"
          >
            {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 overflow-y-auto space-y-5 scrollbar-thin">
          {/* Main Items */}
          <NavGroup items={mainItems} currentPage={currentPage} collapsed={collapsed} onNavigate={handleNavigate} unread={unread} />

          {/* Management Items */}
          {manageItems.length > 0 && (
            <div className="pt-2">
              {!collapsed && (
                <p className="text-[10px] font-extrabold tracking-[0.15em] text-slate-400 uppercase px-3 mb-2">
                  MANAGE
                </p>
              )}
              <NavGroup items={manageItems} currentPage={currentPage} collapsed={collapsed} onNavigate={handleNavigate} unread={unread} />
            </div>
          )}

          {/* Other Items */}
          {otherItems.length > 0 && (
            <div className="pt-2">
              <NavGroup items={otherItems} currentPage={currentPage} collapsed={collapsed} onNavigate={handleNavigate} unread={unread} />
            </div>
          )}
        </nav>

        {/* Profile Footer */}
        <div className="p-3 border-t border-slate-100 shrink-0 bg-white">
          <div className={`flex items-center ${collapsed ? "flex-col gap-2" : "gap-2 px-1 py-1"}`}>
            <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm">
              {initials || "R"}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-900 truncate">{name || "Ramesh rana"}</p>
                <p className="text-[11px] font-medium text-slate-400 capitalize">{role || "Owner"}</p>
              </div>
            )}
            {!collapsed ? (
              <div className="flex items-center gap-1 shrink-0">
                {onChangePassword && (
                  <button
                    onClick={onChangePassword}
                    title="Change Password"
                    className="text-slate-400 hover:text-[#5542f6] hover:bg-[#efeefd] transition-colors p-1.5 rounded-lg"
                  >
                    <KeyRound size={16} strokeWidth={1.75} />
                  </button>
                )}
                <button
                  onClick={onLogout}
                  title="Sign out"
                  className="text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors p-1.5 rounded-lg"
                >
                  <LogOut size={16} strokeWidth={1.75} />
                </button>
              </div>
            ) : (
              onChangePassword && (
                <button
                  onClick={onChangePassword}
                  title="Change Password"
                  className="text-slate-400 hover:text-[#5542f6] hover:bg-[#efeefd] transition-colors p-1.5 rounded-lg"
                >
                  <KeyRound size={16} strokeWidth={1.75} />
                </button>
              )
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
    <div className="space-y-1">
      {items.map(({ page, label, icon: Icon }) => {
        const active = currentPage === page;
        const showBadge = page === "notifications" && unread > 0;
        return (
          <button
            key={page}
            onClick={() => onNavigate(page)}
            title={collapsed ? label : undefined}
            className={`
              relative w-full flex items-center gap-3.5 rounded-xl text-xs font-semibold
              transition-all duration-150
              ${collapsed ? "justify-center px-2 py-3" : "px-3.5 py-2.5"}
              ${
                active
                  ? "bg-[#efeefd] text-[#5542f6]"
                  : "text-slate-600 hover:text-[#5542f6] hover:bg-slate-50"
              }
            `}
          >
            <Icon size={18} strokeWidth={active ? 2.2 : 1.75} className={active ? "text-[#5542f6]" : "text-slate-500"} />
            {!collapsed && <span className="flex-1 text-left tracking-wide">{label}</span>}
            {showBadge && (
              <span
                className={`rounded-full bg-rose-500 text-white text-[10px] font-extrabold flex items-center justify-center h-4 min-w-[16px] px-1 shrink-0 shadow-sm ${
                  collapsed ? "absolute top-1 right-1" : ""
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
