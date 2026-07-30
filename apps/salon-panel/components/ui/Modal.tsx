"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  width?: string;
}

export default function Modal({
  title,
  onClose,
  children,
  width = "max-w-lg",
}: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/20 backdrop-blur-sm flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className={`bg-white rounded-xl w-full ${width} shadow-xl shadow-black/5 animate-slide-up border border-border`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="font-semibold text-[15px]">{title}</h3>
          <button
            onClick={onClose}
            className="text-muted hover:text-ink transition-colors p-1 rounded-md hover:bg-subtle"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}