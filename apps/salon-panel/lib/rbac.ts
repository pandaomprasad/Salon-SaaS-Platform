import type { UserRole } from "@/lib/api";

// All pages in the app
export type AppPage =
  | "dashboard"
  | "bookings"
  | "customers"
  | "services"
  | "schedule"
  | "reports"
  | "notifications"
  | "branches"
  | "staff"
  | "leaves";

// Which roles can access which pages
// Maps directly to backend RBAC permissions
export const PAGE_ACCESS: Record<AppPage, UserRole[]> = {
  dashboard:     ["owner", "manager", "staff"],
  bookings:      ["owner", "manager", "staff"],
  customers:     ["owner", "manager", "staff"],
  services:      ["owner", "manager"],
  schedule:      ["owner", "manager", "staff"],
  reports:       ["owner", "manager"],
  notifications: ["owner", "manager", "staff"],
  branches:      ["owner"],
  staff:         ["owner", "manager"],
  leaves:        ["owner", "manager", "staff"],
};

// Check if a role can access a page
export function canAccess(role: UserRole, page: AppPage): boolean {
  return PAGE_ACCESS[page]?.includes(role) ?? false;
}

// Get all pages a role can see (for sidebar)
export function getAccessiblePages(role: UserRole): AppPage[] {
  return Object.entries(PAGE_ACCESS)
    .filter(([, roles]) => roles.includes(role))
    .map(([page]) => page as AppPage);
}

// Map URL pathname to AppPage
export function pathnameToPage(pathname: string): AppPage {
  const segment = pathname.split("/").filter(Boolean)[0] || "dashboard";
  return segment as AppPage;
}