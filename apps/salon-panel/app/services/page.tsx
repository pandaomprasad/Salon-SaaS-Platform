"use client";

import { useState, useEffect, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import ProtectedRoute from "@/components/ProtectedRoute";
import Button from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";
import Modal from "@/components/ui/Modal";
import apiClient from "@/lib/api-client";
import {
  Search,
  RefreshCw,
  Plus,
  AlertCircle,
  Clock,
  IndianRupee,
  Pencil,
  Trash2,
  X,
} from "lucide-react";
import type { UserRole } from "@/lib/api";
import { useBranch } from "@/hooks/useBranch";
import { getCached, setCache, invalidateCache } from "@/lib/cache";

// ── Types ──

interface ServiceItem {
  _id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  currency: string;
  durationMinutes: number;
  eligibleStaff: string[];
  isActive: boolean;
  createdAt: string;
  priceFormatted?: { display: string };
  packageOfferTag?: string;
  includedServices?: string[];
  image?: string;
  imageUrl?: string;
}

interface BranchOption {
  _id: string;
  name: string;
}

// ── Constants ──

const CATEGORIES = [
  { value: "hair", label: "Hair" },
  { value: "skin", label: "Skin" },
  { value: "nails", label: "Nails" },
  { value: "makeup", label: "Makeup" },
  { value: "spa", label: "Spa" },
  { value: "combo", label: "Combo / Package" },
  { value: "other", label: "Other" },
];

const CATEGORY_STYLES: Record<string, string> = {
  hair: "bg-purple-50 text-purple-700 border border-purple-200",
  skin: "bg-rose-50 text-rose-700 border border-rose-200",
  nails: "bg-pink-50 text-pink-700 border border-pink-200",
  makeup: "bg-amber-50 text-amber-700 border border-amber-200",
  spa: "bg-teal-50 text-teal-700 border border-teal-200",
  combo: "bg-amber-50 text-amber-800 border border-amber-300 font-semibold",
  other: "bg-gray-100 text-gray-600 border border-gray-200",
};

// ── Helpers ──

function formatPrice(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 0 })}`;
}

function formatDuration(mins: number): string {
  if (mins < 60) return `${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ── Page ──

export default function ServicesPage() {
  // const { user } = useSelector((state: RootState) => state.auth);
  // const role = (user?.role || "staff") as UserRole;
  // const canManage = role === "owner" || role === "manager";

  const { branchId, canManage } = useBranch();
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingService, setEditingService] = useState<ServiceItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fetch branches
  // useEffect(() => {
  //   if (!salonId) return;
  //   async function fetchBranches() {
  //     try {
  //       const { data } = await apiClient.get(`/salons/${salonId}/branches`);
  //       const list = data.data?.branches || [];
  //       setBranches(list);
  //       if (role === "manager" && userBranchId) {
  //         setSelectedBranch(userBranchId);
  //       } else if (list.length > 0) {
  //         setSelectedBranch(list[0]._id);
  //       }
  //     } catch {
  //       setError("Failed to load branches");
  //     }
  //   }
  //   fetchBranches();
  // }, [salonId, role, userBranchId]);

  // Fetch services
  const fetchServices = useCallback(async () => {
    if (!branchId) return;

    const cacheKey = `services_${branchId}`;
    const cached = getCached<ServiceItem[]>(cacheKey);

    if (cached) {
      setServices(cached);
      setLoading(false);
      try {
        const { data } = await apiClient.get(`/branches/${branchId}/services`);
        const list = data.data?.services || [];
        setServices(list);
        setCache(cacheKey, list);
      } catch { }
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await apiClient.get(`/branches/${branchId}/services`);
      const list = data.data?.services || [];
      setServices(list);
      setCache(cacheKey, list);
    } catch {
      setError("Failed to load services");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    setServices([]);
    fetchServices();
  }, [fetchServices]);

  // Filter
  const filtered = services.filter((s) => {
    const matchSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description || "").toLowerCase().includes(search.toLowerCase());
    const matchCategory = categoryFilter === "all" || s.category === categoryFilter;
    return matchSearch && matchCategory;
  });

  // Delete
  async function handleDelete(serviceId: string) {
    if (!confirm("Are you sure you want to delete this service?")) return;
    setDeletingId(serviceId);
    try {
      await apiClient.delete(`/branches/${branchId}/services/${serviceId}`);
      invalidateCache("services_");
      setServices((prev) => prev.filter((s) => s._id !== serviceId));
    } catch (err: any) {
      alert(err.response?.data?.message || "Failed to delete service");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <ProtectedRoute page="services">
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-display">Services & Pricing</h2>
            <p className="text-sm text-ash mt-1">
              {loading ? "Loading..." : `${filtered.length} services`}
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              icon={<RefreshCw size={13} />}
              onClick={fetchServices}
              loading={loading}
            >
              Refresh
            </Button>
            {canManage && (
              <Button size="sm" icon={<Plus size={13} />} onClick={() => setShowAddModal(true)}>
                Add Service
              </Button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-60">
            <Input
              placeholder="Search services..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              icon={<Search size={14} />}
            />
          </div>
          {/* {role === "owner" && branches.length > 1 && (
            <div className="w-48">
              <Select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                options={branches.map((b) => ({ value: b._id, label: b.name }))}
              />
            </div>
          )} */}
          <div className="w-40">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              options={[{ value: "all", label: "All Categories" }, ...CATEGORIES]}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl px-4 py-3">
            <AlertCircle size={14} />
            <p className="text-sm">{error}</p>
            <Button size="sm" variant="ghost" onClick={fetchServices}>Retry</Button>
          </div>
        )}

        {/* Services Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-border rounded-xl p-5 space-y-3">
                <div className="flex justify-between">
                  <div className="space-y-2 flex-1">
                    <div className="animate-pulse bg-border/50 rounded h-3.5 w-1/2" />
                    <div className="animate-pulse bg-border/50 rounded-full h-5 w-12" />
                  </div>
                  <div className="flex gap-1">
                    <div className="animate-pulse bg-border/50 rounded w-6 h-6" />
                    <div className="animate-pulse bg-border/50 rounded w-6 h-6" />
                  </div>
                </div>
                <div className="animate-pulse bg-border/50 rounded h-3 w-3/4" />
                <div className="pt-3 border-t border-border/50 flex gap-4">
                  <div className="animate-pulse bg-border/50 rounded h-4 w-16" />
                  <div className="animate-pulse bg-border/50 rounded h-4 w-16" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-ash py-12 text-sm">No services found.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((s) => (
              <div
                key={s._id}
                className={`bg-white border rounded-2xl p-5 transition-all hover:shadow-md ${s.isActive ? "border-smoke" : "border-red-200 opacity-60"
                  }`}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-sm truncate">{s.name}</h3>
                      {s.category === "combo" && (
                        <span className="text-[10px] bg-amber-500/15 text-amber-600 font-bold px-1.5 py-0.5 rounded">
                          ✨ Bundle
                        </span>
                      )}
                    </div>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize mt-1.5 inline-block ${CATEGORY_STYLES[s.category] || CATEGORY_STYLES.other
                        }`}
                    >
                      {s.category}
                    </span>
                  </div>
                  {canManage && (
                    <div className="flex gap-1 shrink-0 ml-2">
                      <button
                        onClick={() => setEditingService(s)}
                        className="text-ash hover:text-ink transition-colors p-1"
                      >
                        <Pencil size={13} />
                      </button>
                      <button
                        onClick={() => handleDelete(s._id)}
                        className="text-ash hover:text-red-500 transition-colors p-1"
                        disabled={deletingId === s._id}
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Offer tag */}
                {s.packageOfferTag && (
                  <div className="text-[11px] text-amber-700 font-medium mb-2 bg-amber-50/70 px-2 py-1 rounded-md border border-amber-200/60">
                    🏷️ {s.packageOfferTag}
                  </div>
                )}

                {/* Description */}
                {s.description && (
                  <p className="text-xs text-ash mb-3 line-clamp-2">{s.description}</p>
                )}

                {/* Included Sub-Services List */}
                {s.includedServices && s.includedServices.length > 0 && (
                  <div className="mb-3 pt-2 border-t border-smoke/40">
                    <p className="text-[10px] font-bold text-ash uppercase tracking-wider mb-1.5">
                      Included Services ({s.includedServices.length})
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {s.includedServices.map((item, idx) => (
                        <span
                          key={idx}
                          className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200/70 px-1.5 py-0.5 rounded-md font-medium"
                        >
                          ✓ {item}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Price + Duration */}
                <div className="flex items-center gap-4 pt-3 border-t border-smoke/60">
                  <div className="flex items-center gap-1.5">
                    <IndianRupee size={12} className="text-ash" />
                    <span className="text-sm font-semibold">{formatPrice(s.price)}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock size={12} className="text-ash" />
                    <span className="text-xs text-ash">{formatDuration(s.durationMinutes)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Modal */}
        {showAddModal && (
          <ServiceFormModal
            branchId={branchId}
            onSuccess={() => {
              setShowAddModal(false);
              invalidateCache("services_");
              fetchServices();
            }}
            onClose={() => setShowAddModal(false)}
          />
        )}

        {/* Edit Modal */}
        {editingService && (
          <ServiceFormModal
            branchId={branchId}
            service={editingService}
            onSuccess={() => {
              setEditingService(null);
              invalidateCache("services_");
              fetchServices();
            }}
            onClose={() => setEditingService(null)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

// ── Reusable Add / Edit Modal ──

const SUGGESTED_SUB_SERVICES = [
  "Hairstyling",
  "Nail",
  "Hair color",
  "Body Glowing",
  "Facial",
  "Spa",
  "Eyebrows",
  "Make up",
  "Retouch",
  "Corner Lashes",
  "Draping",
  "Head Massage",
];

function ServiceFormModal({
  branchId,
  service,
  onSuccess,
  onClose,
}: {
  branchId: string;
  service?: ServiceItem;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const isEditing = !!service;

  const [form, setForm] = useState({
    name: service?.name || "",
    description: service?.description || "",
    category: service?.category || "hair",
    price: service ? String(service.price / 100) : "",
    durationMinutes: service ? String(service.durationMinutes) : "",
    packageOfferTag: service?.packageOfferTag || "",
    imageUrl: service?.imageUrl || service?.image || "",
  });

  const [includedServices, setIncludedServices] = useState<string[]>(
    service?.includedServices || []
  );
  const [subServiceInput, setSubServiceInput] = useState("");

  const [fieldErrors, setFieldErrors] = useState<{ field: string; message: string }[]>([]);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setFieldErrors((prev) => prev.filter((e) => e.field !== key));
    setServerError(null);
  }

  function getError(field: string): string | undefined {
    return fieldErrors.find((e) => e.field === field)?.message;
  }

  function addSubService(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!includedServices.includes(trimmed)) {
      setIncludedServices((prev) => [...prev, trimmed]);
    }
    setSubServiceInput("");
  }

  function removeSubService(name: string) {
    setIncludedServices((prev) => prev.filter((item) => item !== name));
  }

  async function handleSubmit() {
    const errors: { field: string; message: string }[] = [];
    if (!form.name.trim()) errors.push({ field: "name", message: "Service name is required" });
    if (!form.category) errors.push({ field: "category", message: "Category is required" });
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) <= 0)
      errors.push({ field: "price", message: "Enter a valid price in ₹" });
    if (!form.durationMinutes || isNaN(Number(form.durationMinutes)))
      errors.push({ field: "durationMinutes", message: "Duration is required" });

    const priceInPaise = Math.round(Number(form.price) * 100);
    if (priceInPaise < 100) errors.push({ field: "price", message: "Minimum price is ₹1" });
    if (priceInPaise > 10000000) errors.push({ field: "price", message: "Maximum price is ₹1,00,000" });

    const duration = Number(form.durationMinutes);
    if (duration < 15 || duration > 480)
      errors.push({ field: "durationMinutes", message: "Duration must be 15–480 minutes" });

    if (errors.length > 0) {
      setFieldErrors(errors);
      return;
    }

    setSaving(true);
    setServerError(null);
    setFieldErrors([]);

    const payload: any = {
      name: form.name.trim(),
      category: form.category,
      price: priceInPaise,
      durationMinutes: duration,
      description: form.description.trim() || undefined,
      packageOfferTag: form.packageOfferTag.trim() || undefined,
      imageUrl: form.imageUrl.trim() || undefined,
      image: form.imageUrl.trim() || undefined,
      includedServices: includedServices.length > 0 ? includedServices : undefined,
    };

    try {
      if (isEditing) {
        await apiClient.patch(`/branches/${branchId}/services/${service!._id}`, payload);
      } else {
        await apiClient.post(`/branches/${branchId}/services`, payload);
      }
      onSuccess();
    } catch (err: any) {
      const res = err.response?.data;
      if (res?.errors && Array.isArray(res.errors)) {
        setFieldErrors(res.errors);
      } else {
        setServerError(res?.message || `Failed to ${isEditing ? "update" : "create"} service`);
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal title={isEditing ? "Edit Service" : "Add New Service"} onClose={onClose}>
      <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        <Input
          label="Service Name"
          placeholder="e.g. Bridal Beauty Makeup"
          value={form.name}
          onChange={(e) => set("name", e.target.value)}
          error={getError("name")}
        />

        <Select
          label="Category"
          value={form.category}
          onChange={(e) => set("category", e.target.value)}
          options={CATEGORIES}
          error={getError("category")}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Price (₹)"
            type="number"
            placeholder="e.g. 4999"
            value={form.price}
            onChange={(e) => set("price", e.target.value)}
            error={getError("price")}
          />
          <Input
            label="Duration (minutes)"
            type="number"
            placeholder="e.g. 180"
            value={form.durationMinutes}
            onChange={(e) => set("durationMinutes", e.target.value)}
            error={getError("durationMinutes")}
          />
        </div>

        {/* Combo / Package specific fields */}
        {(form.category === "combo" || includedServices.length > 0) && (
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-xl p-4 space-y-4">
            <div className="flex items-center gap-1.5 text-amber-800 font-bold text-xs">
              <span>✨ Combo Package Configuration</span>
            </div>

            <Input
              label="Package Offer Tag / Subtitle (optional)"
              placeholder="e.g. Completed Package Offer till sep 18, 2026"
              value={form.packageOfferTag}
              onChange={(e) => set("packageOfferTag", e.target.value)}
            />

            <Input
              label="Banner Image URL (optional)"
              placeholder="https://images.unsplash.com/..."
              value={form.imageUrl}
              onChange={(e) => set("imageUrl", e.target.value)}
            />

            <div>
              <label className="block text-xs font-medium text-ink mb-1.5">
                Included Sub-Services ({includedServices.length})
              </label>

              {/* Sub-services chips */}
              {includedServices.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3 bg-white p-2.5 rounded-lg border border-border">
                  {includedServices.map((sub) => (
                    <span
                      key={sub}
                      className="inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-800 font-medium px-2 py-1 rounded-md border border-emerald-200"
                    >
                      <span>✓ {sub}</span>
                      <button
                        type="button"
                        onClick={() => removeSubService(sub)}
                        className="text-emerald-700 hover:text-red-500 ml-0.5"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              {/* Add custom sub-service */}
              <div className="flex gap-2">
                <Input
                  placeholder="Type sub-service (e.g. Hairstyling, Facial)..."
                  value={subServiceInput}
                  onChange={(e) => setSubServiceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSubService(subServiceInput);
                    }
                  }}
                />
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => addSubService(subServiceInput)}
                >
                  Add
                </Button>
              </div>

              {/* Quick suggestions */}
              <div className="mt-2">
                <p className="text-[11px] text-ash mb-1">Quick add:</p>
                <div className="flex flex-wrap gap-1">
                  {SUGGESTED_SUB_SERVICES.filter(
                    (s) => !includedServices.includes(s)
                  ).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSubService(s)}
                      className="text-[11px] bg-white hover:bg-smoke text-ash hover:text-ink px-2 py-0.5 rounded border border-border transition-colors"
                    >
                      + {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        <Textarea
          label="Description (optional)"
          placeholder="Brief description of the service..."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          rows={3}
        />

        {serverError && (
          <div className="flex items-center gap-2 text-red-500 bg-red-50 rounded-xl px-3 py-2.5">
            <AlertCircle size={14} className="shrink-0" />
            <p className="text-xs">{serverError}</p>
          </div>
        )}
      </div>

      <div className="flex gap-3 mt-6">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button className="flex-1" onClick={handleSubmit} loading={saving}>
          {isEditing ? "Update Service" : "Create Service"}
        </Button>
      </div>
    </Modal>
  );
}