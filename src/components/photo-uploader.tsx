"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, X, Loader2 } from "lucide-react";

type Photo = {
  id: string;
  url: string;
  position: number;
};

const MAX_PHOTOS = 6;

export function PhotoUploader() {
  const [photos, setPhotos] = useState<Photo[] | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/photos")
      .then((res) => res.json())
      .then((data) => setPhotos(data.photos ?? []));
  }, []);

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/photos", { method: "POST", body: formData });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data) {
        setError(data?.error ?? "Upload failed. Please try again.");
        return;
      }
      setPhotos((prev) => [...(prev ?? []), data.photo]);
    } catch {
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemove(photoId: string) {
    setPhotos((prev) => prev?.filter((p) => p.id !== photoId) ?? null);
    await fetch(`/api/photos/${photoId}`, { method: "DELETE" });
  }

  if (!photos) return null;

  return (
    <div>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {photos.map((photo) => (
          <div key={photo.id} className="group relative aspect-square overflow-hidden rounded-xl border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="" className="h-full w-full object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(photo.id)}
              className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}

        {photos.length < MAX_PHOTOS && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border text-muted transition hover:border-primary hover:text-primary disabled:opacity-50"
          >
            {uploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Plus className="h-5 w-5" />}
            <span className="text-xs">{uploading ? "Uploading…" : "Add photo"}</span>
          </button>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />

      {error && <p className="mt-2 text-sm text-red-500">{error}</p>}
      <p className="mt-2 text-xs text-muted">Up to {MAX_PHOTOS} photos, 5MB each.</p>
    </div>
  );
}
