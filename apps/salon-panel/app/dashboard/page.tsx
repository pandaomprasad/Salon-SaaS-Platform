"use client";

import { BOOKINGS, STAFF } from "@/lib/data";
import { User, Booking } from "@/lib/types";
import StatCard from "@/components/ui/StatCard";
import { StatusBadge } from "@/components/ui/Badge";
import { formatCurrency, formatDuration } from "@/lib/utils";
import { TrendingUp, CalendarDays, Users, Clock, Star } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import {useFetch} from "@/hooks/useApi";

const TODAY = "2026-03-22";
import { browseBranches } from "@/api/services/browseService";
interface DashboardPageProps {
  user: User;
}

export default function DashboardPage({ user }: DashboardPageProps) {

  return (
    <ProtectedRoute>
     <ul>
     
     </ul>
    </ProtectedRoute>
  );
}


