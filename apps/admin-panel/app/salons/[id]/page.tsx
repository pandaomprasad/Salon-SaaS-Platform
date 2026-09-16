"use client";

import { useParams, useRouter } from "next/navigation";
import SalonDetailsView from "@/components/pages/SalonDetailsView";

export default function SalonDetailPage() {
  const params = useParams();
  const router = useRouter();
  const salonId = params.id as string;

  return (
    <SalonDetailsView
      salonId={salonId}
      onBack={() => router.push("/salons")}
    />
  );
}