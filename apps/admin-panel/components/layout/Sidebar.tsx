"use client";

import {
  LayoutDashboard,
  Building2,
  UserCog,
  Users,
  TrendingUp,
  LogOut,
  Shield,
  Clock,
  ClipboardCheck,
  Image as ImageIcon,
} from "lucide-react";

interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
}

const NAV_ITEMS: NavItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { path: "/approvals", label: "Approvals", icon: ClipboardCheck },
  { path: "/salons", label: "Salons", icon: Building2 },
  { path: "/owners", label: "Owners", icon: UserCog },
  { path: "/customers", label: "Customers", icon: Users },
  { path: "/banners", label: "Banners & Offers", icon: ImageIcon },
  { path: "/growth", label: "Growth", icon: TrendingUp },
  { path: "/activity", label: "Activity", icon: Clock },
];

interface SidebarProps {
  currentPath: string;
  name: string;
  email: string;
  onNavigate: (path: string) => void;
  onLogout: () => void;
}

export default function Sidebar({ currentPath, name, email, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-56 bg-ink flex flex-col">
      {/* Brand */}
      <div className="px-5 pt-6 pb-5">
        <div className="flex items-center gap-2.5">
          <img src="/logo.png" alt="ST CUT Logo" className="w-8 h-8 rounded-lg object-contain bg-black p-0.5 shrink-0" />
          <div>
            <p className="text-xs font-bold text-white tracking-wide">ST CUT HQ</p>
            <p className="text-[9px] text-amber-500 uppercase tracking-wider font-semibold">SuperAdmin Panel</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => {
          const active = currentPath === path || currentPath.startsWith(path + "/");
          return (
            <button
              key={path}
              onClick={() => onNavigate(path)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all ${
                active
                  ? "bg-accent text-white"
                  : "text-muted hover:text-white hover:bg-white/5"
              }`}
            >
              <Icon size={16} strokeWidth={active ? 2 : 1.5} />
              <span>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-lg bg-accent/20 text-accent flex items-center justify-center text-[11px] font-bold">
            {name.split(" ").map((n) => n[0]).join("").toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-medium text-white truncate">{name}</p>
            <p className="text-[10px] text-muted">Super Admin</p>
          </div>
          <button onClick={onLogout} className="text-muted hover:text-danger transition-colors p-1">
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}