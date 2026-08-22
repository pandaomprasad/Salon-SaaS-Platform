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

  const selectedBranchId = typeof selectedBranch === "object" ? selectedBranch?._id : selectedBranch;
  const userBranchIdStr = typeof userBranchId === "object" ? (userBranchId as any)?._id : userBranchId;
  const userObjBranchId = typeof user?.branchId === "object" ? (user?.branchId as any)?._id : user?.branchId;

  // Owner uses the global branch selector, others use their assigned branch
  const branchId = selectedBranchId || userBranchIdStr || userObjBranchId || "";

  return { salonId, branchId, role, canManage };
}