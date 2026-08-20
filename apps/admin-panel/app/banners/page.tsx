"use client";

import { useState, useEffect } from "react";
import apiClient from "@/lib/api-client";
import {
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Tag,
  Image as ImageIcon,
  Sparkles,
  RotateCw,
  Pencil,
} from "lucide-react";

interface BannerItem {
  _id: string;
  title: string;
  subtitle?: string;
  details?: string;
  tag?: string;
  ctaText?: string;
  imageUrl?: string;
  promoCode?: string;
  targetType?: string;
  targetId?: string;
  category?: string;
  isActive: boolean;
  clickCount?: number;
  createdAt?: string;
}

const DEFAULT_BANNER_IMAGE =
  "https://images.unsplash.com/photo-1560066984-138dadb4c035?q=80&w=800&auto=format&fit=crop";

export default function BannersPage() {
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerItem | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    details: "",
    tag: "SPECIAL OFFER",
    ctaText: "Claim discount",
    imageUrl: "",
    promoCode: "",
    targetType: "EXPLORE",
  });

  const fetchBanners = async () => {
    try {
      const res = await apiClient.get("/admin/banners");
      const list = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setBanners(list);
    } catch (err) {
      console.log("Failed to fetch banners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormData({
      title: "",
      subtitle: "",
      details: "",
      tag: "SPECIAL OFFER",
      ctaText: "Claim discount",
      imageUrl: "",
      promoCode: "",
      targetType: "EXPLORE",
    });
    setShowModal(true);
  };

  const handleOpenEdit = (banner: BannerItem) => {
    setEditingBanner(banner);
    setFormData({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      details: banner.details || "",
      tag: banner.tag || "SPECIAL OFFER",
      ctaText: banner.ctaText || "Claim discount",
      imageUrl: banner.imageUrl || "",
      promoCode: banner.promoCode || "",
      targetType: banner.targetType || "EXPLORE",
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    setSubmitting(true);
    try {
      if (editingBanner) {
        await apiClient.put(`/admin/banners/${editingBanner._id}`, {
          ...formData,
          imageUrl: formData.imageUrl.trim() || DEFAULT_BANNER_IMAGE,
        });
      } else {
        await apiClient.post("/admin/banners", {
          ...formData,
          imageUrl: formData.imageUrl.trim() || DEFAULT_BANNER_IMAGE,
        });
      }
      setShowModal(false);
      setEditingBanner(null);
      fetchBanners();
    } catch (err: any) {
      console.error("Banner save error:", err);
      const msg = err?.response?.data?.message || err?.message || "Failed to save banner";
      alert(`Failed to save banner: ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await apiClient.put(`/admin/banners/${id}`, { isActive: !currentStatus });
      setBanners((prev) =>
        prev.map((b) => (b._id === id ? { ...b, isActive: !currentStatus } : b))
      );
    } catch (err) {
      alert("Failed to update status");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this promo banner?")) return;
    try {
      await apiClient.delete(`/admin/banners/${id}`);
      setBanners((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      alert("Failed to delete banner");
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Banners & Promotional Offers</h1>
          <p className="text-sm text-muted mt-1">
            Manage promotional banners displayed on the customer mobile app home carousel.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setLoading(true);
              fetchBanners();
            }}
            className="flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-ink border border-border px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
            title="Refresh banners"
          >
            <RotateCw size={15} className={loading ? "animate-spin text-accent" : "text-slate-500"} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleOpenAdd}
            className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm"
          >
            <Plus size={16} />
            <span>Add Promo Banner</span>
          </button>
        </div>
      </div>

      {/* Banners Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-48 bg-white rounded-2xl border border-border">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-accent"></div>
        </div>
      ) : banners.length === 0 ? (
        <div className="bg-white rounded-2xl border border-border p-8 text-center max-w-md mx-auto my-8">
          <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto mb-3">
            <Sparkles size={24} />
          </div>
          <h3 className="text-lg font-bold text-ink mb-1">No Active Banners</h3>
          <p className="text-xs text-muted mb-4">
            Create promotional offers or coupon banners to display to customers on the app home screen.
          </p>
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-accent text-white px-4 py-2 rounded-xl text-xs font-semibold"
          >
            <Plus size={14} /> Add First Banner
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <div
              key={banner._id}
              className={`bg-white rounded-2xl border transition-all overflow-hidden flex flex-col ${
                banner.isActive ? "border-border shadow-sm" : "border-border/60 opacity-60"
              }`}
            >
              {/* Preview Banner Card */}
              <div className="relative h-44 bg-slate-900 overflow-hidden">
                <img
                  src={banner.imageUrl || DEFAULT_BANNER_IMAGE}
                  alt={banner.title}
                  className="w-full h-full object-cover opacity-50"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent p-4 flex flex-col justify-end">
                  <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500 text-black uppercase tracking-wider self-start mb-1.5">
                    {banner.tag || "OFFER"}
                  </span>
                  <h4 className="text-white font-bold text-base line-clamp-1">{banner.title}</h4>
                  {banner.subtitle && (
                    <p className="text-white/80 text-xs line-clamp-1 mt-0.5">{banner.subtitle}</p>
                  )}
                </div>
              </div>

              {/* Banner Details & Controls */}
              <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                <div className="space-y-1">
                  {banner.promoCode && (
                    <div className="flex items-center gap-1.5 text-xs text-amber-600 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg w-fit">
                      <Tag size={12} />
                      <span>Code: {banner.promoCode}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-muted pt-1">
                    <span>
                      Clicks: <strong className="text-ink">{banner.clickCount || 0}</strong>
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                        banner.isActive
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {banner.isActive ? "LIVE ON APP" : "PAUSED"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-border">
                  <button
                    onClick={() => handleToggleActive(banner._id, banner.isActive)}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-colors ${
                      banner.isActive
                        ? "bg-slate-100 text-slate-700 hover:bg-slate-200"
                        : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100"
                    }`}
                  >
                    {banner.isActive ? <EyeOff size={14} /> : <Eye size={14} />}
                    <span>{banner.isActive ? "Pause" : "Activate"}</span>
                  </button>

                  <button
                    onClick={() => handleOpenEdit(banner)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                    title="Edit banner details"
                  >
                    <Pencil size={16} />
                  </button>

                  <button
                    onClick={() => handleDelete(banner._id)}
                    className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                    title="Delete banner"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create / Edit Banner Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-xl border border-border">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-ink">
                {editingBanner ? "Edit Promo Banner" : "Add New Promo Banner"}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-muted hover:text-ink text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Banner Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 20% off your first luxury session"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Subtitle / Deal Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Use code FIRST20 on checkout"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">Tag Label</label>
                  <input
                    type="text"
                    placeholder="SPECIAL OFFER"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1">
                    Promo Code (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="FIRST20"
                    value={formData.promoCode}
                    onChange={(e) => setFormData({ ...formData, promoCode: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">Image URL</label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink mb-1">
                  Offer Details & Terms
                </label>
                <textarea
                  rows={3}
                  placeholder="Mention full offer terms, eligibility, and redemption instructions..."
                  value={formData.details}
                  onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 resize-none"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-muted hover:text-ink"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-accent text-white px-5 py-2 rounded-xl text-xs font-semibold hover:bg-accent/90 disabled:opacity-50"
                >
                  {submitting ? "Saving…" : editingBanner ? "Save Changes" : "Publish to App"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
