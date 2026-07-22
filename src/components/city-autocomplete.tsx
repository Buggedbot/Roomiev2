"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, LocateFixed, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui";
import type { CitySuggestion } from "@/app/api/places/search/route";

export type CitySelection = CitySuggestion;

type CityAutocompleteProps = {
  id?: string;
  value: string;
  onValueChange: (text: string) => void;
  onSelect: (selection: CitySelection) => void;
  required?: boolean;
  placeholder?: string;
};

export function CityAutocomplete({
  id = "city",
  value,
  onValueChange,
  onSelect,
  required,
  placeholder = "e.g. Bengaluru",
}: CityAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);
  const [toast, setToast] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);
  const justSelectedRef = useRef(false);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const query = value.trim();
    if (query.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const requestId = ++requestIdRef.current;

    const debounce = setTimeout(async () => {
      try {
        const response = await fetch(`/api/places/search?q=${encodeURIComponent(query)}`);
        const data = await response.json();
        if (requestId !== requestIdRef.current) return;
        setSuggestions(data.results ?? []);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setSuggestions([]);
      } finally {
        if (requestId === requestIdRef.current) setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [value]);

  function selectSuggestion(suggestion: CitySuggestion) {
    justSelectedRef.current = true;
    onValueChange(suggestion.city);
    onSelect(suggestion);
    setOpen(false);
    setSuggestions([]);
    setHighlighted(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((index) => (index - 1 + suggestions.length) % suggestions.length);
    } else if (event.key === "Enter") {
      if (highlighted >= 0) {
        event.preventDefault();
        selectSuggestion(suggestions[highlighted]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  function useCurrentLocation() {
    if (!("geolocation" in navigator)) {
      setToast("Location services are unavailable on this device.");
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const response = await fetch(`/api/places/reverse?lat=${latitude}&lon=${longitude}`);
          if (!response.ok) throw new Error("reverse geocode failed");
          const data = await response.json();

          justSelectedRef.current = true;
          onValueChange(data.city);
          onSelect({
            placeId: `geo:${latitude.toFixed(5)},${longitude.toFixed(5)}`,
            city: data.city,
            state: data.state,
            country: data.country,
            label: data.state ? `${data.city}, ${data.state}` : data.city,
            latitude,
            longitude,
          });
          setOpen(false);
        } catch {
          setToast("Unable to access your location.");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setToast("Unable to access your location.");
        setLocating(false);
      },
      { timeout: 10000 }
    );
  }

  const showDropdown = open && value.trim().length >= 2;

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Input
          id={id}
          required={required}
          autoComplete="off"
          value={value}
          placeholder={placeholder}
          onChange={(event) => {
            onValueChange(event.target.value);
            setOpen(true);
            setHighlighted(-1);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className="pr-10"
        />
        <button
          type="button"
          aria-label="Use current location"
          title="Use current location"
          onClick={useCurrentLocation}
          disabled={locating}
          className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-muted transition hover:bg-primary/10 hover:text-primary disabled:opacity-50"
        >
          {locating ? <Loader2 className="h-4 w-4 animate-spin" /> : <LocateFixed className="h-4 w-4" />}
        </button>
      </div>

      {showDropdown && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {loading ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Searching cities…
            </div>
          ) : suggestions.length > 0 ? (
            <ul role="listbox" className="max-h-60 overflow-auto py-1">
              {suggestions.map((suggestion, index) => (
                <li key={suggestion.placeId}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === highlighted}
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => selectSuggestion(suggestion)}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                      index === highlighted ? "bg-primary/10 text-primary" : "text-foreground hover:bg-foreground/5"
                    }`}
                  >
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" />
                    <span className="truncate">{suggestion.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-muted">No city found</div>
          )}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm shadow-xl shadow-black/10">
          <span>{toast}</span>
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss" className="text-muted hover:text-foreground">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
