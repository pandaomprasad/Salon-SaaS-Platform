"use client";

import { useState, useRef } from "react";
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Building2,
} from "lucide-react";
import apiClient from "@/lib/api-client";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { loginSuccess } from "@/store/slices/authSlice";

interface SalonProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SalonProfileModal({
  isOpen,
  onClose,
}: SalonProfileModalProps) {
  const dispatch = useDispatch();
  const { salon, user, token } = useSelector((state: RootState) => state.auth);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleResetForm = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError(null);
    setSuccess(false);
  };

  const handleClose = () => {
    handleResetForm();
    onClose();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    if (files.length > 5) {
      setError("You can only select up to 5 images.");
      return;
    }

    const validFiles = files.filter(f => f.type.startsWith("image/"));
    if (validFiles.length !== files.length) {
      setError("Please select valid image files only.");
      return;
    }

    if (validFiles.some(f => f.size > 5 * 1024 * 1024)) {
      setError("Each file must be less than 5MB.");
      return;
    }

    setSelectedFiles(validFiles);
    setPreviewUrls(validFiles.map(f => URL.createObjectURL(f)));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError("Please select images to upload.");
      return;
    }

    const salonId = salon?._id || (user as any)?.salonId || (user as any)?.salon?._id;
    if (!salonId) {
      setError("Salon ID not found. Please refresh the page.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload images
      const formData = new FormData();
      selectedFiles.forEach(file => formData.append("files", file));
      
      const uploadRes = await apiClient.post("/upload/multiple", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const imageUrls = uploadRes.data?.data?.map((d: any) => d.url) || [];
      if (!imageUrls.length) {
        throw new Error("Failed to get uploaded image URLs.");
      }

      // 2. Update salon coverImage and images array
      const res = await apiClient.patch(`/salons/${salonId}`, {
        coverImage: imageUrls[0],
        images: imageUrls
      });

      // Update salon in redux store
      if (res.data?.data) {
         dispatch(loginSuccess({ user: user!, token: token!, salon: res.data.data }));
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
      }, 2000);
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to upload image. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        className="bg-white border border-slate-200/80 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 pt-6 pb-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#f0f7ff] text-[#0284c7] flex items-center justify-center shrink-0">
              <Building2 size={20} strokeWidth={2.2} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">
                Salon Profile
              </h2>
              <p className="text-xs font-medium text-slate-400">
                Update your salon's cover image
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {success ? (
            <div className="py-8 text-center space-y-3">
              <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                <CheckCircle2 size={32} strokeWidth={2.5} />
              </div>
              <h3 className="text-lg font-black text-slate-900">
                Gallery Images Updated!
              </h3>
              <p className="text-xs font-medium text-slate-500 max-w-xs mx-auto">
                Your salon's gallery images have been successfully updated and will be visible as a carousel in the customer app.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold flex items-start gap-2.5">
                  <AlertCircle size={16} className="shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Upload Area */}
              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-2">
                  Gallery Images (Max 5)
                </label>
                
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className={`
                    relative w-full h-48 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden p-2
                    ${previewUrls.length > 0 ? 'border-[#0284c7] bg-[#f0f7ff]/50' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-slate-300'}
                  `}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    multiple
                    className="hidden"
                  />
                  
                  {previewUrls.length > 0 ? (
                    <div className="w-full h-full relative group">
                      <div className="grid grid-cols-3 gap-2 w-full h-full p-2">
                        {previewUrls.map((url, i) => (
                          <div key={i} className="relative rounded-lg overflow-hidden border border-slate-200 bg-white">
                            <img 
                              src={url} 
                              alt={`Preview ${i}`} 
                              className="w-full h-full object-cover"
                            />
                            {i === 0 && (
                              <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                                Cover
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center rounded-xl">
                        <UploadCloud size={24} className="text-white mb-2" />
                        <span className="text-xs font-bold text-white">Change Images</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center p-6 text-center">
                      <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400 mb-3">
                        <ImageIcon size={20} strokeWidth={2} />
                      </div>
                      <p className="text-sm font-bold text-slate-700">Click to upload images</p>
                      <p className="text-[11px] font-medium text-slate-400 mt-1">
                        Select up to 5 JPG, PNG or WEBP (Max. 5MB each)
                      </p>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-slate-400 mt-2 font-medium">
                  These images will be shown at the top of your salon page as a swipeable carousel. The first image will be the primary cover.
                </p>
              </div>

              {/* Actions */}
              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-slate-100 mt-6">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedFiles.length === 0}
                  className="px-5 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-extrabold transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {loading && <Loader2 size={14} className="animate-spin" />}
                  <span>{loading ? "Uploading..." : "Save Images"}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
