import { User as ApiUser } from "@/api/services/authService";
import { User as AppUser, Page } from "@/lib/types";
import { Role } from "@/lib/types";

export const mapUser = (user: ApiUser): AppUser => {
  return {
    id: user._id,
    email: user.email,
    password: "", // never store real password
    name: user.name, // ✅ ADD THIS
    role: user.role, // ✅ ADD THIS
    initials: user.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase(),
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
  ];

  if (validPages.includes(page as Page)) {
    return page as Page;
  }

  return "dashboard"; // fallback
};

export const getUserRole = (role: string): Role => {
  const validRoles: Role[] = ["owner", "manager", "staff"];

  if (validRoles.includes(role as Role)) {
    return role as Role;
  }

  return "staff"; // fallback (safe default)
};
