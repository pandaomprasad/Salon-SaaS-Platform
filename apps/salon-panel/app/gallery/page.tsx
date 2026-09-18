"use client";
/* eslint-disable @next/next/no-img-element */

import React, { useState, useRef } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Image as ImageIcon,
  Trash2
} from "lucide-react";
import apiClient from "@/lib/api-client";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "@/store";
import { loginSuccess } from "@/store/slices/authSlice";

export default function GalleryPage() {
  const dispatch = useDispatch();
  const { salon, user, token } = useSelector((state: RootState) => state.auth);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Existing images from the salon object
  const existingImages = salon?.images || (salon?.coverImage ? [salon.coverImage] : []);

  const handleResetForm = () => {
    setSelectedFiles([]);
    setPreviewUrls([]);
    setError(null);
  };

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 3000);
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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setError("Please select images to upload.");
      return;
    }

    // @ts-ignore
    const salonId = salon?._id || (user as { salonId?: string })?.salonId || (user as { salon?: { _id: string } })?.salon?._id;
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

      const imageUrls = uploadRes.data?.data?.map((d: { url: string }) => d.url) || [];
      if (!imageUrls.length) {
        throw new Error("Failed to get uploaded image URLs.");
      }

      // Combine existing and new images
      const combinedImages = [...existingImages, ...imageUrls].slice(0, 10); // arbitrary max 10 total

      // 2. Update salon coverImage and images array
      const res = await apiClient.patch(`/salons/${salonId}`, {
        coverImage: combinedImages[0],
        images: combinedImages
      });

      // Update salon in redux store
      if (res.data?.data) {
         dispatch(loginSuccess({ user: user!, token: token!, salon: res.data.data }));
      }

      handleResetForm();
      showSuccess("Images successfully uploaded and saved!");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }, message?: string };
      const msg =
        errorObj?.response?.data?.message ||
        errorObj?.message ||
        "Failed to upload images. Please try again.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteImage = async (imageUrlToRemove: string) => {
    if (!confirm("Are you sure you want to remove this image?")) return;

    // @ts-ignore
    const salonId = salon?._id || (user as { salonId?: string })?.salonId || (user as { salon?: { _id: string } })?.salon?._id;
    if (!salonId) return;

    try {
      const updatedImages = existingImages.filter((img: string) => img !== imageUrlToRemove);
      
      const res = await apiClient.patch(`/salons/${salonId}`, {
        coverImage: updatedImages.length > 0 ? updatedImages[0] : "",
        images: updatedImages
      });

      if (res.data?.data) {
         dispatch(loginSuccess({ user: user!, token: token!, salon: res.data.data }));
      }
      
      showSuccess("Image removed successfully.");
    } catch (err: unknown) {
      const errorObj = err as { response?: { data?: { message?: string } }, message?: string };
      alert("Failed to remove image: " + (errorObj?.response?.data?.message || errorObj?.message));
    }
  };

  return (
    <ProtectedRoute page="gallery">
      <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Gallery</h1>
            <p className="text-xs sm:text-sm font-medium text-slate-500 mt-1">
              Manage your salon&apos;s images and cover photo shown to customers.
            </p>
          </div>
        </div>

        {successMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-700 text-xs font-semibold flex items-center gap-2.5">
            <CheckCircle2 size={16} className="shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-rose-700 text-xs font-semibold flex items-center gap-2.5">
            <AlertCircle size={16} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Existing Images Grid */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-4">Current Gallery Images</h2>
          
          {existingImages.length === 0 ? (
             <div className="text-center py-10 px-4 bg-slate-50 border border-slate-100 rounded-2xl">
               <div className="w-12 h-12 rounded-2xl bg-white text-slate-400 flex items-center justify-center mx-auto mb-3 shadow-xs">
                 <ImageIcon size={24} />
               </div>
               <p className="text-sm font-bold text-slate-700">No images yet</p>
               <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                 Upload images below to make your salon stand out in the customer app.
               </p>
             </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {existingImages.map((imgUrl: string, idx: number) => (
                <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-square shadow-xs">
                  <img src={imgUrl} alt={`Gallery ${idx}`} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button 
                      onClick={() => handleDeleteImage(imgUrl)}
                      className="w-10 h-10 rounded-full bg-white/90 text-rose-600 flex items-center justify-center hover:bg-rose-50 hover:scale-110 transition-all shadow-md"
                      title="Remove Image"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  
                  {/* Badges */}
                  {idx === 0 && (
                    <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-extrabold px-2 py-1 rounded-md shadow-sm">
                      Cover Image
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upload New Section */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 md:p-6 shadow-sm">
          <h2 className="text-sm font-bold text-slate-900 mb-1">Add New Images</h2>
          <p className="text-xs text-slate-500 mb-4">Upload up to 5 images at once. These will be added to your gallery.</p>
          
          <form onSubmit={handleUploadSubmit}>
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative w-full min-h-[200px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden p-4
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
                <div className="w-full h-full relative">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 w-full h-full">
                    {previewUrls.map((url, i) => (
                      <div key={i} className="relative rounded-xl overflow-hidden border border-slate-200 bg-white aspect-square shadow-xs">
                        <img 
                          src={url} 
                          alt={`Preview ${i}`} 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center py-8 text-center">
                  <div className="w-14 h-14 bg-white rounded-full shadow-sm flex items-center justify-center text-slate-400 mb-4 border border-slate-100">
                    <UploadCloud size={24} strokeWidth={2.5} />
                  </div>
                  <p className="text-sm font-extrabold text-slate-700">Click to browse images</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-1.5 max-w-xs">
                    Select up to 5 high-quality JPG, PNG, or WEBP images (Max 5MB each).
                  </p>
                </div>
              )}
            </div>

            {previewUrls.length > 0 && (
              <div className="flex items-center justify-end gap-3 mt-5 pt-5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetForm}
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-xs font-extrabold text-slate-600 hover:bg-slate-50 transition-colors"
                >
                  Clear Selection
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-[#0284c7] hover:bg-[#0369a1] text-white text-xs font-extrabold transition-all shadow-md flex items-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  <span>{loading ? "Uploading..." : "Upload & Save"}</span>
                </button>
              </div>
            )}
          </form>
        </div>

      </div>
    </ProtectedRoute>
  );
}
