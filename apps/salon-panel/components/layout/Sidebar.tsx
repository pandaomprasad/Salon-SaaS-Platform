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
} from "lucide-react";
import { NOTIFICATIONS } from "@/lib/data";
import { Page, Role } from "@/lib/types";

interface NavItem {
  page: Page;
  label: string;
  icon: React.ElementType;
  roles: Role[];
}

const NAV_ITEMS: NavItem[] = [
  {
    page: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    roles: ["owner", "manager", "staff"],
  },
  {
    page: "bookings",
    label: "Bookings",
    icon: CalendarDays,
    roles: ["owner", "manager", "staff"],
  },
  {
    page: "customers",
    label: "Customers",
    icon: Users,
    roles: ["owner", "manager", "staff"],
  },
  {
    page: "services",
    label: "Services",
    icon: Scissors,
    roles: ["owner", "manager"],
  },
  {
    page: "schedule",
    label: "Schedule",
    icon: CalendarClock,
    roles: ["owner", "manager"],
  },
  { page: "reports", label: "Reports", icon: BarChart3, roles: ["owner"] },
  {
    page: "notifications",
    label: "Notifications",
    icon: Bell,
    roles: ["owner", "manager", "staff"],
  },
];

interface SidebarProps {
  currentPage: Page;
  role: Role;
  name: string;
  email: string;
  initials: string;
  isOpen: boolean;
  salonName: string;
  onNavigate: (page: Page) => void;
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
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  function handleNavigate(page: Page) {
    onNavigate(page);
    onClose(); // close sidebar on mobile after navigation
  }

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-ink/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-40 w-56 bg-ink flex flex-col
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0
      `}
      >
        {/* Brand */}
        <div className="px-7 pt-8 pb-7 shrink-0">
          <p className="text-[9px] tracking-[0.35em] text-silver uppercase mb-2">
            Management
          </p>
          <h1 className="font-display text-[26px] text-white font-light tracking-wide leading-none">
            {salonName}
          </h1>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
          {visibleItems.map(({ page, label, icon: Icon }) => {
            const active = currentPage === page;
            return (
              <button
                key={page}
                onClick={() => handleNavigate(page)}
                className={`
                  w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-[11px]
                  font-medium tracking-[0.08em] uppercase transition-all duration-150
                  border-l-2 pl-[14px]
                  ${
                    active
                      ? "text-white bg-white/8 border-gold"
                      : "text-silver/60 hover:text-silver hover:bg-white/5 border-transparent"
                  }
                `}
              >
                <Icon size={14} strokeWidth={active ? 2 : 1.5} />
                <span className="flex-1 text-left">{label}</span>
                {page === "notifications" && unread > 0 && (
                  <span className="text-[9px] font-bold min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-gold text-ink">
                    {unread}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* User + logout */}
        <div className="px-4 py-5 border-t border-white/8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gold/20 text-gold flex items-center justify-center text-[11px] font-semibold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[12px] font-medium text-white truncate">
                {name}
              </p>
              <p className="text-[10px] text-silver/50 capitalize">{role}</p>
            </div>
            <button
              onClick={onLogout}
              title="Sign out"
              className="text-silver/40 hover:text-silver transition-colors shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
