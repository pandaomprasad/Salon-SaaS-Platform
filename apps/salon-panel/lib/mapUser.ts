import type { BackendUser } from "@/lib/api";
import type { User, Page } from "@/lib/types";

export const mapUser = (user: BackendUser): User => {
  return {
    id: user.id || user._id || "",
    email: user.email,
    password: "",
    name: user.name,
    role: user.role,
    initials: user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "",
  };
};

export const getCurrentPage = (path: string): Page => {
  const page = path.split("/")[1];

  const validPages: Page[] = [
    "dashboard",
    "bookings",
    "customers",
    "services",
    "reports",
    "schedule",
    "notifications",
    "branches",
    "staff",
  ];

  if (validPages.includes(page as Page)) {
    return page as Page;
  }

  return "dashboard";
};

export const getUserRole = (role: string) => {
  const validRoles = ["owner", "manager", "staff"];
  if (validRoles.includes(role)) return role;
  return "staff";
};