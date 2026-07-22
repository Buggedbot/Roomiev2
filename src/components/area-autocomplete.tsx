"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPinned } from "lucide-react";
import { Input } from "@/components/ui";

type AreaAutocompleteProps = {
  id?: string;
  city: string;
  value: string;
  onValueChange: (text: string) => void;
  placeholder?: string;
};

export function AreaAutocomplete({
  id = "preferredArea",
  city,
  value,
  onValueChange,
  placeholder = "e.g. Koramangala",
}: AreaAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [areas, setAreas] = useState<string[]>([]);
  const [loadingAreas, setLoadingAreas] = useState(false);
  const [fetchedCity, setFetchedCity] = useState<string | null>(null);
  const [highlighted, setHighlighted] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestIdRef = useRef(0);

  const trimmedCity = city.trim();
  const disabled = trimmedCity.length === 0;

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
    if (!trimmedCity) {
      setAreas([]);
      setFetchedCity(null);
      setLoadingAreas(false);
      return;
    }

    setLoadingAreas(true);
    const requestId = ++requestIdRef.current;

    const debounce = setTimeout(async () => {
      try {
        const response = await fetch(`/api/places/areas?city=${encodeURIComponent(trimmedCity)}`);
        const data = await response.json();
        if (requestId !== requestIdRef.current) return;
        setAreas(data.areas ?? []);
        setFetchedCity(trimmedCity);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setAreas([]);
        setFetchedCity(trimmedCity);
      } finally {
        if (requestId === requestIdRef.current) setLoadingAreas(false);
      }
    }, 300);

    return () => clearTimeout(debounce);
  }, [trimmedCity]);

  const query = value.trim().toLowerCase();
  const filtered = query ? areas.filter((area) => area.toLowerCase().includes(query)) : areas;
  const isReady = fetchedCity === trimmedCity && !loadingAreas;
  const showDropdown = open && !disabled;

  function selectArea(area: string) {
    onValueChange(area);
    setOpen(false);
    setHighlighted(-1);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || filtered.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlighted((index) => (index + 1) % filtered.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlighted((index) => (index - 1 + filtered.length) % filtered.length);
    } else if (event.key === "Enter") {
      if (highlighted >= 0) {
        event.preventDefault();
        selectArea(filtered[highlighted]);
      }
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <Input
        id={id}
        value={value}
        disabled={disabled}
        placeholder={disabled ? "Select a city first" : placeholder}
        autoComplete="off"
        onChange={(event) => {
          onValueChange(event.target.value);
          setOpen(true);
          setHighlighted(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
      />

      {showDropdown && (
        <div className="absolute z-20 mt-1.5 w-full overflow-hidden rounded-xl border border-border bg-card shadow-lg">
          {!isReady ? (
            <div className="flex items-center gap-2 px-4 py-3 text-sm text-muted">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading nearby areas…
            </div>
          ) : filtered.length > 0 ? (
            <ul role="listbox" className="max-h-60 overflow-auto py-1">
              {filtered.map((area, index) => (
                <li key={area}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={index === highlighted}
                    onMouseEnter={() => setHighlighted(index)}
                    onClick={() => selectArea(area)}
                    className={`flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition ${
                      index === highlighted ? "bg-primary/10 text-primary" : "text-foreground hover:bg-foreground/5"
                    }`}
                  >
                    <MapPinned className="h-3.5 w-3.5 shrink-0 text-muted" />
                    <span className="truncate">{area}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="px-4 py-3 text-sm text-muted">No nearby localities found.</div>
          )}
        </div>
      )}
    </div>
  );
}
