import { useSelector } from "react-redux";
import { RootState } from "@/store";
import type { UserRole } from "@/lib/api";

export function useBranch() {
  const { user, selectedBranch } = useSelector((state: RootState) => state.auth);
  const role = (user?.role || "staff") as UserRole;
  const canManage = role === "owner" || role === "manager";

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const salonId: string = decoded?.salonId || "";
  const userBranchId: string = decoded?.branchId || "";

  // Owner uses the global branch selector, others use their assigned branch
  const branchId = role === "owner"
    ? selectedBranch?._id || ""
    : userBranchId;

  return { salonId, branchId, role, canManage };
}