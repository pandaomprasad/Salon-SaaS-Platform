"use client";

import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { socketClient } from "@/lib/socket-client";
import { playBookingChime, isSoundEnabled, setSoundEnabled, testSound } from "@/lib/sound";
import { invalidateCache } from "@/lib/cache";
import { Bell, Calendar, User, X, Volume2, VolumeX, ArrowRight, Sparkles } from "lucide-react";
import { useRouter, usePathname } from "next/navigation";

interface NewBookingInfo {
  id: string;
  customerName: string;
  serviceName: string;
  date: string;
  time: string;
  price: string;
  status: string;
}

export default function BookingNotificationToast() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, selectedBranch, salon } = useSelector((state: RootState) => state.auth);

  const [activeToast, setActiveToast] = useState<NewBookingInfo | null>(null);
  const [soundOn, setSoundOn] = useState<boolean>(true);

  useEffect(() => {
    setSoundOn(isSoundEnabled());
  }, []);

  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) {
      testSound();
    }
  };

  const handleNewBookingEvent = useCallback((data: any) => {
    console.log("⚡ [REALTIME TOAST] New appointment received via socket:", data);
    invalidateCache("bookings_");

    const appt = data?.appointment || data;
    if (!appt) return;

    // Extract customer, service, date, time
    const cust = typeof appt.customerId === "object" ? appt.customerId?.name : appt.customerName || "Customer";
    const serv = typeof appt.serviceId === "object" ? appt.serviceId?.name : appt.serviceName || "Service";
    const priceVal = appt.pricePaid || appt.serviceId?.price || appt.amount || 0;
    const priceStr = `₹${Number(priceVal).toLocaleString("en-IN")}`;

    const info: NewBookingInfo = {
      id: appt._id || data.appointmentId || String(Date.now()),
      customerName: cust || "Customer",
      serviceName: serv || "Haircut / Salon Service",
      date: appt.date || "Today",
      time: appt.startTime || appt.time || "Scheduled",
      price: priceStr,
      status: appt.status || "PENDING",
    };

    setActiveToast(info);
    playBookingChime();
  }, []);

  useEffect(() => {
    if (!user) return;

    const branchId = selectedBranch?._id || null;
    const salonId = (salon as any)?._id || (user as any)?.salonId || null;

    socketClient.connect({ branchId, salonId });
    if (user.id) {
      socketClient.setUserId(user.id);
    }

    const unsubCreated = socketClient.onAppointmentCreated(handleNewBookingEvent);

    return () => {
      unsubCreated();
    };
  }, [user, selectedBranch?._id, salon, handleNewBookingEvent]);

  // Auto-dismiss toast after 9 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      setActiveToast(null);
    }, 9000);
    return () => clearTimeout(timer);
  }, [activeToast]);

  if (!activeToast) return null;

  return (
    <div className="fixed top-4 right-4 z-[9999] max-w-md w-full animate-bounce-in">
      <div className="bg-slate-900 text-white border border-slate-700/80 rounded-2xl shadow-2xl p-4.5 backdrop-blur-xl relative overflow-hidden">
        {/* Top glowing bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500" />

        {/* Card Header */}
        <div className="flex items-center justify-between mb-2.5 pt-1">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold tracking-wider text-emerald-400 uppercase">
              <Sparkles size={13} />
              <span>New Booking Alert!</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleToggleSound}
              title={soundOn ? "Mute sound notifications" : "Enable sound notifications"}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              {soundOn ? <Volume2 size={14} className="text-emerald-400" /> : <VolumeX size={14} className="text-slate-500" />}
            </button>
            <button
              onClick={() => setActiveToast(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Main Details */}
        <div className="space-y-1.5 my-2 text-sm">
          <div className="flex items-center gap-2 font-medium text-slate-100">
            <User size={14} className="text-teal-400 shrink-0" />
            <span className="truncate">{activeToast.customerName}</span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-300 bg-slate-800/80 rounded-xl px-3 py-2 border border-slate-700/50">
            <div className="truncate font-medium text-slate-200">
              {activeToast.serviceName}
            </div>
            <div className="font-semibold text-emerald-400 ml-2 shrink-0">
              {activeToast.price}
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-400 pt-0.5">
            <Calendar size={12} className="text-slate-400 shrink-0" />
            <span>{activeToast.date}</span>
            <span>•</span>
            <span>{activeToast.time}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-3 pt-2.5 border-t border-slate-800 flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">Real-time update received</span>
          {pathname !== "/bookings" ? (
            <button
              onClick={() => {
                setActiveToast(null);
                router.push("/bookings");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-semibold text-xs rounded-lg transition-colors shadow-sm"
            >
              <span>View Bookings</span>
              <ArrowRight size={13} />
            </button>
          ) : (
            <button
              onClick={() => setActiveToast(null)}
              className="px-2.5 py-1 text-xs text-emerald-400 font-medium hover:underline"
            >
              Showing on screen
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
