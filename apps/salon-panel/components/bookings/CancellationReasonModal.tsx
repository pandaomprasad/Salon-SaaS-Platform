"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Send, Check } from "lucide-react";
import Button from "@/components/ui/Button";

interface CancellationReasonModalProps {
  isOpen: boolean;
  appointment: any;
  onClose: () => void;
  onConfirmCancel: (id: string, reason: string) => Promise<void>;
}

const PRESET_REASONS = [
  "Specialist unavailable due to emergency maintenance",
  "Branch closed temporarily for safety / power outage",
  "Customer requested cancellation via call",
  "Schedule conflict — slot double-booked",
];

export default function CancellationReasonModal({
  isOpen,
  appointment,
  onClose,
  onConfirmCancel,
}: CancellationReasonModalProps) {
  const [reason, setReason] = useState(PRESET_REASONS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !appointment) return null;

  const customerName = appointment.customerId?.name || appointment.customerName || "Customer";
  const serviceName = appointment.serviceId?.name || appointment.serviceName || "Service";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onConfirmCancel(appointment._id || appointment.id, reason.trim());
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to cancel appointment");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-paper border border-smoke/30 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-scale-up">
        {/* Modal Header */}
        <div className="bg-red-500/10 border-b border-red-500/20 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-red-500/20 flex items-center justify-center text-red-500">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="font-bold text-base text-ink">Cancel Appointment</h3>
              <p className="text-xs text-ash">Customer will receive an automated email notification</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-ash hover:text-ink hover:bg-smoke/30 transition-all"
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Summary Pill */}
          <div className="bg-smoke/20 border border-smoke/40 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div>
              <span className="font-semibold text-ink block">{serviceName}</span>
              <span className="text-ash">Client: {customerName}</span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-gold block">{appointment.date}</span>
              <span className="text-ash">{appointment.startTime} - {appointment.endTime}</span>
            </div>
          </div>

          {/* Quick Reason Chips */}
          <div>
            <label className="block text-xs font-semibold text-ash uppercase tracking-wider mb-2">
              Select Quick Reason
            </label>
            <div className="space-y-2">
              {PRESET_REASONS.map((preset) => {
                const isSelected = reason === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setReason(preset)}
                    className={`w-full text-left text-xs p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? "bg-red-500/10 border-red-500/40 text-red-400 font-medium shadow-sm"
                        : "bg-paper border-smoke/40 text-ash hover:text-ink hover:border-smoke"
                    }`}
                  >
                    <span>{preset}</span>
                    {isSelected && <Check size={14} className="text-red-400 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Text Area */}
          <div>
            <label className="block text-xs font-semibold text-ash uppercase tracking-wider mb-1.5">
              Custom Email Cancellation Reason
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter specific reason to send to customer via email..."
              className="w-full text-xs bg-paper border border-smoke/40 rounded-xl p-3 text-ink focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/60 transition-all resize-none"
              required
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="danger"
              className="flex-1 inline-flex items-center justify-center gap-2"
              loading={isSubmitting}
            >
              <Send size={14} />
              <span>Confirm &amp; Send Email</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
