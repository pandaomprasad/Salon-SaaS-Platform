"use client";

import React, { useState } from "react";
import { MapPin, ExternalLink, Copy, Check, Navigation } from "lucide-react";

interface LocationMapPreviewProps {
  coordinates?: {
    lat: number | null;
    lng: number | null;
  } | null;
  address?: string;
}

export default function LocationMapPreview({ coordinates, address }: LocationMapPreviewProps) {
  const [copied, setCopied] = useState(false);

  if (!coordinates || coordinates.lat === null || coordinates.lng === null) {
    return null;
  }

  const { lat, lng } = coordinates;
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  const embedMapUrl = `https://maps.google.com/maps?q=${lat},${lng}&hl=en&z=15&output=embed`;

  const copyCoordinates = () => {
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="border border-border rounded-lg p-3 bg-slate-50/70 space-y-2.5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-600">
            <MapPin size={13} className="fill-rose-500 text-rose-600" />
          </div>
          <div>
            <span className="text-[12px] font-semibold text-slate-800">Geolocated Pin</span>
            <p className="text-[10px] text-muted truncate max-w-[280px]">
              {address || "Exact map location pinned"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={copyCoordinates}
            className="flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-white border border-border px-2 py-0.5 rounded hover:bg-subtle transition-colors shadow-2xs"
            title="Copy coordinates"
          >
            {copied ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
            <span>{copied ? "Copied" : `${lat.toFixed(4)}, ${lng.toFixed(4)}`}</span>
          </button>

          <a
            href={googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-medium text-accent hover:text-accent/80 transition-colors bg-accent/10 px-2 py-0.5 rounded"
          >
            <span>Open Map</span>
            <ExternalLink size={10} />
          </a>
        </div>
      </div>

      {/* Interactive Map Embed Container */}
      <div className="relative w-full h-32 rounded-md overflow-hidden border border-border bg-slate-200 shadow-inner">
        <iframe
          title="Google Map Preview"
          src={embedMapUrl}
          className="w-full h-full border-0 grayscale-[20%] hover:grayscale-0 transition-all duration-300 pointer-events-auto"
          loading="lazy"
        />
        <div className="absolute bottom-1.5 left-1.5 bg-black/70 backdrop-blur-xs text-white text-[9px] font-mono px-2 py-0.5 rounded flex items-center gap-1">
          <Navigation size={9} className="text-emerald-400 fill-emerald-400" />
          <span>LAT: {lat.toFixed(5)} | LNG: {lng.toFixed(5)}</span>
        </div>
      </div>
    </div>
  );
}
