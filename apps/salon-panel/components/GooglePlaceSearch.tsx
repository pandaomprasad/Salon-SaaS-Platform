"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { MapPin, Search, Navigation, Loader2, X, CheckCircle2, Globe } from "lucide-react";
import apiClient from "@/lib/api-client";

declare global {
  interface Window {
    google?: any;
  }
}

export interface PlaceResult {

  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
  latitude: number | null;
  longitude: number | null;
  formattedAddress: string;
  placeName: string;
}

interface GooglePlaceSearchProps {
  onPlaceSelect: (place: PlaceResult) => void;
  placeholder?: string;
  label?: string;
}

interface PredictionItem {
  id: string;
  place_id: string;
  main_text: string;
  secondary_text: string;
  full_text: string;
  lat?: number | null;
  lng?: number | null;
  rawGooglePlace?: any;
}

export default function GooglePlaceSearch({
  onPlaceSelect,
  placeholder = "Search location or address with Google Maps...",
  label = "Search Location with Google Maps",
}: GooglePlaceSearchProps) {
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [geolocating, setGeolocating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const autocompleteServiceRef = useRef<any>(null);
  const placesServiceRef = useRef<any>(null);
  const dummyDivRef = useRef<HTMLDivElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Load Google Maps JS SDK dynamically if client key exists
  useEffect(() => {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (window.google?.maps?.places) {
      setGoogleLoaded(true);
      return;
    }

    const existingScript = document.getElementById("google-maps-sdk");
    if (!existingScript) {
      const script = document.createElement("script");
      script.id = "google-maps-sdk";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => {
        if (window.google?.maps?.places) {
          setGoogleLoaded(true);
        }
      };
      document.head.appendChild(script);
    } else {
      existingScript.addEventListener("load", () => {
        if (window.google?.maps?.places) setGoogleLoaded(true);
      });
    }
  }, []);

  // Initialize AutocompleteService when Google SDK is loaded
  useEffect(() => {
    if (googleLoaded && window.google?.maps?.places) {
      try {
        autocompleteServiceRef.current = new window.google.maps.places.AutocompleteService();
        if (dummyDivRef.current) {
          placesServiceRef.current = new window.google.maps.places.PlacesService(dummyDivRef.current);
        }
      } catch (err) {
        console.warn("Failed to initialize Google Places Services:", err);
      }
    }
  }, [googleLoaded]);

  // Handle outside click to close predictions dropdown
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clientSdkDisabledRef = useRef<boolean>(false);

  // Debounced Place Search
  useEffect(() => {
    if (!query.trim() || query.trim().length < 2) {
      setPredictions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setStatusMessage(null);

      // 1. Try Google Maps JS SDK Autocomplete in browser if not marked disabled
      if (autocompleteServiceRef.current && !clientSdkDisabledRef.current) {
        try {
          autocompleteServiceRef.current.getPlacePredictions(
            {
              input: query,
              componentRestrictions: { country: "in" },
            },
            (results: any[], status: string) => {
              if (status === "OK" && Array.isArray(results) && results.length > 0) {
                const mapped: PredictionItem[] = results.map((item) => ({
                  id: item.place_id,
                  place_id: item.place_id,
                  main_text: item.structured_formatting?.main_text || item.description.split(",")[0],
                  secondary_text: item.structured_formatting?.secondary_text || "",
                  full_text: item.description,
                  rawGooglePlace: item,
                }));
                setPredictions(mapped);
                setIsOpen(true);
                setLoading(false);
                return;
              }

              // If status is not OK (e.g. REQUEST_DENIED due to billing), disable client SDK and fallback to backend API
              if (status !== "OK" && status !== "ZERO_RESULTS") {
                console.warn(`Google Maps JS API returned status "${status}". Switching to backend search API.`);
                clientSdkDisabledRef.current = true;
              }
              fetchBackendPredictions(query);
            }
          );
          return;
        } catch (e) {
          console.warn("Google Maps JS API search exception, falling back to backend:", e);
          clientSdkDisabledRef.current = true;
        }
      }

      // 2. Fallback to backend search endpoint
      fetchBackendPredictions(query);
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const fetchBackendPredictions = async (searchQuery: string) => {
    try {
      const { data } = await apiClient.get(`/location/search?q=${encodeURIComponent(searchQuery)}`);
      if (data?.success && Array.isArray(data.data) && data.data.length > 0) {
        const mapped: PredictionItem[] = data.data.map((item: any) => ({
          id: item.id || item.place_id,
          place_id: item.place_id || item.id,
          main_text: item.main_text || item.name || item.area.split(",")[0],
          secondary_text: item.secondary_text || item.area.split(",").slice(1).join(",").trim(),
          full_text: item.area || item.name,
          lat: item.lat,
          lng: item.lng,
        }));
        setPredictions(mapped);
        setIsOpen(true);
      } else {
        setPredictions([]);
        setIsOpen(false);
      }
    } catch (err) {
      console.error("Backend location search failed:", err);
      setPredictions([]);
    } finally {
      setLoading(false);
    }
  };

  // Select Prediction & Auto-populate Address
  const handleSelectPrediction = useCallback(
    async (pred: PredictionItem) => {
      setQuery(pred.full_text);
      setIsOpen(false);
      setLoading(true);
      setStatusMessage("Retrieving address components...");

      // 1. If PlacesService is initialized in browser and client SDK is not disabled
      if (placesServiceRef.current && pred.place_id && !clientSdkDisabledRef.current) {
        try {
          placesServiceRef.current.getDetails(
            { placeId: pred.place_id, fields: ["address_components", "formatted_address", "geometry", "name"] },
            (placeDetail: any, status: string) => {
              if (status === "OK" && placeDetail) {
                parseAndEmitGooglePlace(placeDetail, pred.main_text);
                setLoading(false);
                setStatusMessage("Address auto-filled!");
                setTimeout(() => setStatusMessage(null), 4000);
                return;
              }
              if (status !== "OK") {
                clientSdkDisabledRef.current = true;
              }
              fetchBackendDetails(pred);
            }
          );
          return;
        } catch (err) {
          console.warn("PlacesService getDetails error:", err);
          clientSdkDisabledRef.current = true;
        }
      }

      // 2. Otherwise fetch via backend `/location/details`
      await fetchBackendDetails(pred);
    },
    [onPlaceSelect]
  );


  const parseClientAddressString = (addressStr: string) => {
    const pincodeMatch = addressStr.match(/\b([1-9][0-9]{5})\b/);
    const pincode = pincodeMatch ? pincodeMatch[1] : "";

    const states = [
      "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat",
      "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
      "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Orissa", "Punjab",
      "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
      "West Bengal", "Delhi", "Chandigarh", "Puducherry", "Jammu and Kashmir", "Ladakh"
    ];

    let state = "";
    for (const s of states) {
      if (new RegExp(`\\b${s}\\b`, "i").test(addressStr)) {
        state = s === "Orissa" ? "Odisha" : s;
        break;
      }
    }

    const cleanStr = addressStr
      .replace(/\b[1-9][0-9]{5}\b/g, "")
      .replace(/\bIndia\b/gi, "")
      .replace(/\s+/g, " ")
      .trim();

    const parts = cleanStr.split(",").map((p) => p.trim()).filter(Boolean);

    let street = "";
    let city = "";

    if (parts.length >= 3) {
      street = parts[0];
      city = parts[1];
    } else if (parts.length === 2) {
      street = parts[0];
      city = parts[1];
    } else if (parts.length === 1) {
      street = parts[0];
      city = parts[0];
    }

    return {
      street: street || parts[0] || addressStr.split(",")[0],
      city: city || "Brahmapur",
      state: state || "Odisha",
      pincode: pincode,
    };
  };

  const parseAndEmitGooglePlace = (placeDetail: any, defaultName: string) => {
    let streetNumber = "";
    let route = "";
    let sublocality = "";
    let locality = "";
    let city = "";
    let state = "";
    let pincode = "";
    let country = "";

    for (const comp of placeDetail.address_components || []) {
      const types = comp.types;
      if (types.includes("street_number")) streetNumber = comp.long_name;
      else if (types.includes("route")) route = comp.long_name;
      else if (types.includes("sublocality") || types.includes("neighborhood") || types.includes("sublocality_level_1")) {
        sublocality = comp.long_name;
      } else if (types.includes("locality")) {
        locality = comp.long_name;
      } else if (types.includes("administrative_area_level_2") && !locality) {
        city = comp.long_name;
      } else if (types.includes("administrative_area_level_1")) {
        state = comp.long_name;
      } else if (types.includes("postal_code")) {
        pincode = comp.long_name;
      } else if (types.includes("country")) {
        country = comp.long_name;
      }
    }

    const street = [streetNumber, route, sublocality].filter(Boolean).join(", ") || placeDetail.name || placeDetail.formatted_address.split(",")[0];
    const parsedFallback = parseClientAddressString(placeDetail.formatted_address || "");
    const finalCity = locality || city || sublocality || parsedFallback.city;
    const finalState = state || parsedFallback.state;
    const finalPincode = pincode || parsedFallback.pincode;
    const lat = placeDetail.geometry?.location?.lat() || null;
    const lng = placeDetail.geometry?.location?.lng() || null;

    onPlaceSelect({
      street,
      city: finalCity,
      state: finalState,
      pincode: finalPincode,
      country: country || "India",
      latitude: lat,
      longitude: lng,
      formattedAddress: placeDetail.formatted_address || `${street}, ${finalCity}`,
      placeName: placeDetail.name || defaultName,
    });
  };

  const fetchBackendDetails = async (pred: PredictionItem) => {
    try {
      const { data } = await apiClient.get(
        `/location/details?place_id=${encodeURIComponent(pred.place_id)}&q=${encodeURIComponent(pred.full_text)}`
      );
      if (data?.success && data.data) {
        const d = data.data;
        const parsedFallback = parseClientAddressString(pred.full_text);

        onPlaceSelect({
          street: d.street || parsedFallback.street || pred.main_text,
          city: d.city || parsedFallback.city,
          state: d.state || parsedFallback.state,
          pincode: d.pincode || parsedFallback.pincode,
          country: d.country || "India",
          latitude: d.latitude !== null && d.latitude !== undefined ? d.latitude : pred.lat || null,
          longitude: d.longitude !== null && d.longitude !== undefined ? d.longitude : pred.lng || null,
          formattedAddress: d.formattedAddress || pred.full_text,
          placeName: d.name || pred.main_text,
        });
        setStatusMessage("Address details populated!");
        setTimeout(() => setStatusMessage(null), 4000);
      } else {
        const parsed = parseClientAddressString(pred.full_text);
        onPlaceSelect({
          street: parsed.street || pred.main_text,
          city: parsed.city,
          state: parsed.state,
          pincode: parsed.pincode,
          country: "India",
          latitude: pred.lat || null,
          longitude: pred.lng || null,
          formattedAddress: pred.full_text,
          placeName: pred.main_text,
        });
      }
    } catch (err) {
      console.error("Failed to fetch backend place details:", err);
      const parsed = parseClientAddressString(pred.full_text);
      onPlaceSelect({
        street: parsed.street || pred.main_text,
        city: parsed.city,
        state: parsed.state,
        pincode: parsed.pincode,
        country: "India",
        latitude: pred.lat || null,
        longitude: pred.lng || null,
        formattedAddress: pred.full_text,
        placeName: pred.main_text,
      });
    } finally {
      setLoading(false);
    }
  };


  // GPS Geolocation Handler
  const handleUseCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setGeolocating(true);
    setStatusMessage("Getting current GPS location...");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const { data } = await apiClient.post("/location/reverse-geocode", { latitude, longitude });
          if (data?.success && data.data) {
            const loc = data.data;
            onPlaceSelect({
              street: loc.suburb ? `${loc.suburb}, ${loc.area}` : loc.area,
              city: loc.city,
              state: loc.state,
              pincode: loc.pincode || "",
              country: loc.country || "India",
              latitude,
              longitude,
              formattedAddress: loc.formattedAddress,
              placeName: loc.suburb || loc.city,
            });
            setQuery(loc.formattedAddress);
            setStatusMessage("Location detected from GPS!");
            setTimeout(() => setStatusMessage(null), 4000);
          }
        } catch (err) {
          console.error("GPS Reverse geocode error:", err);
          alert("Could not detect exact address from GPS.");
        } finally {
          setGeolocating(false);
        }
      },
      (err) => {
        console.warn("GPS Geolocation error:", err.message);
        setGeolocating(false);
        alert("Location access denied or unavailable.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || predictions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < predictions.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : predictions.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (highlightedIndex >= 0 && highlightedIndex < predictions.length) {
        handleSelectPrediction(predictions[highlightedIndex]);
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative space-y-1" ref={containerRef}>
      <div className="hidden" ref={dummyDivRef} />
      
      <div className="flex items-center justify-between">
        <label className="text-[12px] font-medium text-slate flex items-center gap-1.5">
          <MapPin size={13} className="text-rose-500" />
          {label}
        </label>
        <span className="text-[10px] font-semibold tracking-wide text-muted uppercase flex items-center gap-1 bg-subtle px-1.5 py-0.5 rounded border border-border">
          <Globe size={10} className="text-emerald-500" />
          Google Maps API Enabled
        </span>
      </div>

      <div className="relative flex items-center">
        <div className="absolute left-3 text-muted pointer-events-none flex items-center gap-1">
          {loading ? (
            <Loader2 size={15} className="animate-spin text-accent" />
          ) : (
            <Search size={15} className="text-slate/60" />
          )}
        </div>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (predictions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full bg-white border border-border rounded-lg pl-9 pr-24 py-2 text-[13px] placeholder:text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/20 transition-all shadow-sm"
        />

        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setPredictions([]);
                setIsOpen(false);
              }}
              className="p-1 text-muted hover:text-ink rounded-md transition-colors"
              title="Clear search"
            >
              <X size={13} />
            </button>
          )}

          <button
            type="button"
            onClick={handleUseCurrentLocation}
            disabled={geolocating}
            className="flex items-center gap-1 bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-medium px-2.5 py-1 rounded-md transition-all shadow-sm disabled:opacity-50"
            title="Auto-detect address using GPS"
          >
            {geolocating ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Navigation size={12} className="text-rose-400 fill-rose-400" />
            )}
            <span>{geolocating ? "GPS..." : "GPS"}</span>
          </button>
        </div>
      </div>

      {/* Status indicator */}
      {statusMessage && (
        <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 bg-emerald-50 border border-emerald-200/60 px-2.5 py-1 rounded-md animate-fade-in">
          <CheckCircle2 size={12} className="shrink-0 text-emerald-600" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Predictions Dropdown */}
      {isOpen && predictions.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white border border-border rounded-lg shadow-xl overflow-hidden max-h-60 overflow-y-auto animate-slide-up">
          <div className="px-3 py-1.5 bg-subtle/80 border-b border-border flex items-center justify-between text-[10px] text-muted">
            <span>SUGGESTED PLACES</span>
            <span className="font-mono">Google Places</span>
          </div>

          <div className="py-1">
            {predictions.map((item, idx) => (
              <button
                key={item.id || idx}
                type="button"
                onClick={() => handleSelectPrediction(item)}
                onMouseEnter={() => setHighlightedIndex(idx)}
                className={`w-full text-left px-3 py-2 flex items-start gap-2.5 transition-colors ${
                  highlightedIndex === idx ? "bg-accent/10 border-l-2 border-accent" : "hover:bg-subtle"
                }`}
              >
                <MapPin size={14} className="text-rose-500 shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-semibold text-ink truncate">{item.main_text}</p>
                  {item.secondary_text && (
                    <p className="text-[11px] text-muted truncate">{item.secondary_text}</p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
