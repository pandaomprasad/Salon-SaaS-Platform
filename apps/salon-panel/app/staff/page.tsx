"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import { StatusBadge } from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { Input, Select } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import apiClient from "@/lib/api-client";
import {
    Search,
    RefreshCw,
    Plus,
    AlertCircle,
    Phone,
    Mail,
    Shield,
    UserCog,
    X,
} from "lucide-react";
import type { UserRole } from "@/lib/api";
import AddStaffModal from "@/components/staff/AddStaffModal";
// ── Types matching your actual backend response ──

interface StaffMember {
    _id: string;
    name: string;
    email: string;
    phone: string;
    role: { _id: string; name: string };
    salonId: string;
    branchId: string;
    avatar: string | null;
    extraPermissions: string[];
    deniedPermissions: string[];
    isActive: boolean;
    lastLoginAt: string | null;
    createdAt: string;
    updatedAt: string;
}

interface BranchOption {
    _id: string;
    name: string;
}

// ── Helpers ──

function getInitials(name: string): string {
    return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();
}

function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
}

export default function StaffPage() {
    const { user } = useSelector((state: RootState) => state.auth);
    const role = (user?.role || "staff") as UserRole;
    const canManage = role === "owner" || role === "manager";

    // Get salonId from the JWT token
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const decoded = token ? JSON.parse(atob(token.split(".")[1])) : null;
    const salonId = decoded?.salonId || "";
    const userBranchId = decoded?.branchId || "";

    const [branches, setBranches] = useState<BranchOption[]>([]);
    const [selectedBranch, setSelectedBranch] = useState<string>("");
    const [staffList, setStaffList] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");
    const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
    const [showAddModal, setShowAddModal] = useState(false);
    const [deactivatingId, setDeactivatingId] = useState<string | null>(null);

    // Fetch branches
    useEffect(() => {
        if (!salonId) return;

        async function fetchBranches() {
            try {
                const { data } = await apiClient.get(`/salons/${salonId}/branches`);
                const list = data.data?.branches || [];
                setBranches(list);

                // Auto-select: manager sees only their branch, owner sees first
                if (role === "manager" && userBranchId) {
                    setSelectedBranch(userBranchId);
                } else if (list.length > 0) {
                    setSelectedBranch(list[0]._id);
                }
            } catch {
                setError("Failed to load branches");
            }
        }

        fetchBranches();
    }, [salonId, role, userBranchId]);

    // Fetch staff when branch changes
    const fetchStaff = useCallback(async () => {
        if (!selectedBranch) return;
        setLoading(true);
        setError(null);
        try {
            const { data } = await apiClient.get(`/branches/${selectedBranch}/staff`);
            const list = data.data?.staff || [];
            setStaffList(list);
        } catch {
            setError("Failed to load staff");
        } finally {
            setLoading(false);
        }
    }, [selectedBranch]);

    useEffect(() => {
        fetchStaff();
    }, [fetchStaff]);

    // Filter
    const filtered = staffList.filter((s) => {
        const matchSearch =
            s.name.toLowerCase().includes(search.toLowerCase()) ||
            s.email.toLowerCase().includes(search.toLowerCase());
        const matchRole =
            roleFilter === "all" || s.role.name === roleFilter;
        return matchSearch && matchRole;
    });

    // Deactivate staff
    async function handleDeactivate(staffId: string) {
        if (!confirm("Are you sure you want to deactivate this staff member?")) return;
        setDeactivatingId(staffId);
        try {
            await apiClient.delete(`/branches/${selectedBranch}/staff/${staffId}`);
            setStaffList((prev) =>
                prev.map((s) => (s._id === staffId ? { ...s, isActive: false } : s)),
            );
            setSelectedStaff(null);
        } catch (err: any) {
            alert(err.response?.data?.message || "Failed to deactivate");
        } finally {
            setDeactivatingId(null);
        }
    }

    return (
        <ProtectedRoute page="staff">
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-display">Staff</h2>
                        <p className="text-sm text-ash mt-1">
                            {loading ? "Loading..." : `${filtered.length} staff members`}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            icon={<RefreshCw size={13} />}
                            onClick={fetchStaff}
                            loading={loading}
                        >
                            Refresh
                        </Button>
                        {canManage && (
                            <Button
                                size="sm"
                                icon={<Plus size={13} />}
                                onClick={() => setShowAddModal(true)}
                            >
                                Add Staff
                            </Button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    <div className="flex-1 min-w-60">
                        <Input
                            placeholder="Search by name or email..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            icon={<Search size={14} />}
                        />
                    </div>
                    {role === "owner" && branches.length > 1 && (
                        <div className="w-48">
                            <Select
                                value={selectedBranch}
                                onChange={(e) => setSelectedBranch(e.target.value)}
                                options={branches.map((b) => ({ value: b._id, label: b.name }))}
                            />
                        </div>
                    )}
                    <div className="w-40">
                        <Select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            options={[
                                { value: "all", label: "All Roles" },
                                { value: "manager", label: "Manager" },
                                { value: "staff", label: "Staff" },
                            ]}
                        />
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl px-4 py-3">
                        <AlertCircle size={14} />
                        <p className="text-sm">{error}</p>
                        <Button size="sm" variant="ghost" onClick={fetchStaff}>
                            Retry
                        </Button>
                    </div>
                )}

                {/* Staff Grid */}
                {loading ? (
                    <div className="text-center text-ash py-12 text-sm">Loading staff...</div>
                ) : filtered.length === 0 ? (
                    <div className="text-center text-ash py-12 text-sm">No staff members found.</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                        {filtered.map((s) => (
                            <div
                                key={s._id}
                                onClick={() => setSelectedStaff(s)}
                                className={`
                  bg-white border rounded-2xl p-5 cursor-pointer transition-all hover:shadow-md
                  ${s.isActive ? "border-smoke" : "border-red-200 opacity-60"}
                `}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Avatar */}
                                    <div className="w-11 h-11 rounded-xl bg-smoke text-ink flex items-center justify-center text-sm font-semibold shrink-0">
                                        {getInitials(s.name)}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-medium text-sm truncate">{s.name}</h3>
                                            {!s.isActive && (
                                                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-500">
                                                    Inactive
                                                </span>
                                            )}
                                        </div>
                                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-smoke text-ash capitalize mt-1 inline-block">
                                            {s.role.name}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 space-y-1.5">
                                    <div className="flex items-center gap-2 text-xs text-ash">
                                        <Mail size={11} />
                                        <span className="truncate">{s.email}</span>
                                    </div>
                                    {s.phone && (
                                        <div className="flex items-center gap-2 text-xs text-ash">
                                            <Phone size={11} />
                                            <span>{s.phone}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="mt-3 pt-3 border-t border-smoke/60 text-[11px] text-ash">
                                    Joined {formatDate(s.createdAt)}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Staff Detail Drawer */}
                {selectedStaff && (
                    <StaffDrawer
                        staff={selectedStaff}
                        canManage={canManage}
                        onDeactivate={handleDeactivate}
                        deactivatingId={deactivatingId}
                        onClose={() => setSelectedStaff(null)}
                    />
                )}

                {/* Add Staff Modal */}
                {showAddModal && (
                    <AddStaffModal
                        branchId={selectedBranch}
                        branchName={branches.find((b) => b._id === selectedBranch)?.name}
                        onSuccess={() => {
                            setShowAddModal(false);
                            fetchStaff();
                        }}
                        onClose={() => setShowAddModal(false)}
                    />
                )}
            </div>
        </ProtectedRoute>
    );
}

// ── Staff Detail Drawer ──

function StaffDrawer({
    staff: s,
    canManage,
    onDeactivate,
    deactivatingId,
    onClose,
}: {
    staff: StaffMember;
    canManage: boolean;
    onDeactivate: (id: string) => void;
    deactivatingId: string | null;
    onClose: () => void;
}) {
    const details = [
        ["Name", s.name],
        ["Email", s.email],
        ["Phone", s.phone || "—"],
        ["Role", s.role.name],
        ["Status", s.isActive ? "Active" : "Inactive"],
        ["Joined", formatDate(s.createdAt)],
        ["Last Login", s.lastLoginAt ? formatDate(s.lastLoginAt) : "Never"],
    ];

    return (
        <div
            className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-end p-6"
            onClick={onClose}
        >
            <div
                className="bg-paper rounded-2xl w-full max-w-md p-6 shadow-2xl animate-slide-up"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-smoke text-ink flex items-center justify-center text-sm font-semibold">
                            {getInitials(s.name)}
                        </div>
                        <div>
                            <h3 className="font-semibold text-base">{s.name}</h3>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-smoke text-ash capitalize">
                                {s.role.name}
                            </span>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-ash hover:text-ink transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Details */}
                <div className="space-y-3 text-sm">
                    {details.map(([key, val]) => (
                        <div key={key} className="flex justify-between">
                            <span className="text-ash">{key}</span>
                            <span className="font-medium capitalize">{val}</span>
                        </div>
                    ))}
                </div>

                {/* Permissions */}
                {(s.extraPermissions.length > 0 || s.deniedPermissions.length > 0) && (
                    <div className="mt-4 space-y-2">
                        {s.extraPermissions.length > 0 && (
                            <div className="bg-emerald-50 rounded-xl p-3">
                                <p className="text-xs font-medium text-emerald-700 mb-1 flex items-center gap-1">
                                    <Shield size={11} /> Extra Permissions
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {s.extraPermissions.map((p) => (
                                        <span key={p} className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                        {s.deniedPermissions.length > 0 && (
                            <div className="bg-red-50 rounded-xl p-3">
                                <p className="text-xs font-medium text-red-500 mb-1 flex items-center gap-1">
                                    <Shield size={11} /> Denied Permissions
                                </p>
                                <div className="flex flex-wrap gap-1">
                                    {s.deniedPermissions.map((p) => (
                                        <span key={p} className="text-[10px] bg-red-100 text-red-500 px-2 py-0.5 rounded-full">
                                            {p}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Actions */}
                {canManage && s.isActive && (
                    <div className="mt-6 pt-5 border-t border-smoke">
                        <Button
                            className="w-full"
                            variant="danger"
                            onClick={() => onDeactivate(s._id)}
                            loading={deactivatingId === s._id}
                        >
                            Deactivate Staff
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Add Staff Modal ──

// function AddStaffModal({
//     branchId,
//     onSuccess,
//     onClose,
// }: {
//     branchId: string;
//     onSuccess: () => void;
//     onClose: () => void;
// }) {
//     const [form, setForm] = useState({
//         name: "",
//         email: "",
//         password: "",
//         phone: "",
//         role: "staff",
//     });
//     const [saving, setSaving] = useState(false);
//     const [error, setError] = useState<string | null>(null);

//     function set(key: string, value: string) {
//         setForm((prev) => ({ ...prev, [key]: value }));
//     }

//     async function handleSubmit() {
//         if (!form.name || !form.email || !form.password) {
//             setError("Name, email, and password are required");
//             return;
//         }

//         setSaving(true);
//         setError(null);
//         try {
//             await apiClient.post(`/branches/${branchId}/staff`, {
//                 name: form.name,
//                 email: form.email,
//                 password: form.password,
//                 phone: form.phone || undefined,
//                 role: form.role,
//             });
//             onSuccess();
//         } catch (err: any) {
//             setError(err.response?.data?.message || "Failed to add staff");
//         } finally {
//             setSaving(false);
//         }
//     }

//     const isValid = form.name && form.email && form.password;

//     return (
//         <Modal title="Add Staff Member" onClose={onClose}>
//             <div className="space-y-4">
//                 <Input
//                     label="Name"
//                     placeholder="Full name"
//                     value={form.name}
//                     onChange={(e) => set("name", e.target.value)}
//                 />
//                 <Input
//                     label="Email"
//                     type="email"
//                     placeholder="email@salon.com"
//                     value={form.email}
//                     onChange={(e) => set("email", e.target.value)}
//                 />
//                 <Input
//                     label="Password"
//                     type="password"
//                     placeholder="Minimum 8 characters"
//                     value={form.password}
//                     onChange={(e) => set("password", e.target.value)}
//                 />
//                 <Input
//                     label="Phone"
//                     placeholder="+91-9000000000"
//                     value={form.phone}
//                     onChange={(e) => set("phone", e.target.value)}
//                 />
//                 <Select
//                     label="Role"
//                     value={form.role}
//                     onChange={(e) => set("role", e.target.value)}
//                     options={[
//                         { value: "staff", label: "Staff" },
//                         { value: "manager", label: "Manager" },
//                     ]}
//                 />

//                 {error && (
//                     <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl px-3 py-2.5">
//                         <AlertCircle size={14} />
//                         <p className="text-xs">{error}</p>
//                     </div>
//                 )}
//             </div>

//             <div className="flex gap-3 mt-6">
//                 <Button variant="secondary" className="flex-1" onClick={onClose}>
//                     Cancel
//                 </Button>
//                 <Button className="flex-1" onClick={handleSubmit} disabled={!isValid} loading={saving}>
//                     Add Staff
//                 </Button>
//             </div>
//         </Modal>
//     );
// }