import { useSelector, useDispatch } from "react-redux";
import { useEffect } from "react";
import { RootState } from "@/store";
import { selectBranch } from "@/store/slices/authSlice";
import apiClient from "@/lib/api-client";
import type { UserRole } from "@/lib/api";

export function useBranch() {
  const dispatch = useDispatch();
  const { user, selectedBranch } = useSelector((state: RootState) => state.auth);
  const role = (user?.role || "staff") as UserRole;
  const canManage = role === "owner" || role === "manager";

  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const decoded = token ? JSON.parse(atob(token.split(".")[1])) : null;
  const salonId: string =
    decoded?.salonId ||
    (typeof user?.salonId === "object" ? (user?.salonId as any)?._id : user?.salonId) ||
    "";
  const userBranchId: string =
    decoded?.branchId ||
    (typeof user?.branchId === "object" ? (user?.branchId as any)?._id : user?.branchId) ||
    "";

  const selectedBranchId =
    typeof selectedBranch === "object" ? (selectedBranch as any)?._id : selectedBranch;

  // Owner uses the selected branch, others use their assigned branch
  const branchId = selectedBranchId || userBranchId || "";

  useEffect(() => {
    // If owner/manager has no selected branch in Redux state, auto-fetch the first branch for their salon
    if (!selectedBranchId && salonId) {
      async function autoSelectBranch() {
        try {
          const { data } = await apiClient.get(`/salons/${salonId}/branches`);
          const branches = data.data?.branches || [];
          if (branches.length > 0) {
            const targetBranch = userBranchId
              ? branches.find((b: any) => b._id === userBranchId) || branches[0]
              : branches[0];
            dispatch(selectBranch(targetBranch));
          }
        } catch (e) {}
      }
      autoSelectBranch();
    }
  }, [selectedBranchId, salonId, userBranchId, dispatch]);

  return { salonId, branchId, role, canManage };
}