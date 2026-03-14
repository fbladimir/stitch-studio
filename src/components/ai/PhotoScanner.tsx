"use client";

import { useRef, useState } from "react";
import { compressImage, fileToBase64 } from "@/lib/image";

export type ScanMode = "cover" | "colorkey" | "stash";

interface PhotoScannerProps {
  mode: ScanMode;
  onScanComplete: (result: unknown) => void;
  onClose?: () => void;
  className?: string;
}

const MODE_LABELS: Record<ScanMode, { title: string; description: string; scanning: string }> = {
  cover: {
    title: "Scan Cover Page",
    description: "Photograph the front cover of your pattern to auto-fill details",
    scanning: "Reading your pattern cover...",
  },
  colorkey: {
    title: "Scan Color Key",
    description: "Photograph the color key or thread list page to extract all threads",
    scanning: "Extracting thread list...",
  },
  stash: {
    title: "Scan Thread Stash",
    description: "Photograph your thread organizer or labels to bulk-add threads",
    scanning: "Reading thread numbers...",
  },
};

export function PhotoScanner({ mode, onScanComplete, onClose, className = "" }: PhotoScannerProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string | null>(null);
  const [compressedFile, setCompressedFile] = useState<File | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const labels = MODE_LABELS[mode];

  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    try {
      const compressed = await compressImage(file);
      setCompressedFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      setError("Could not process that image. Please try another photo.");
    }

    e.target.value = "";
  }

  function clearPhoto() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setCompressedFile(null);
    setError(null);
  }

  async function handleScan() {
    if (!compressedFile) return;
    setScanning(true);
    setError(null);

    try {
      const base64 = await fileToBase64(compressedFile);
      const endpoint = `/api/ai/scan-${mode === "colorkey" ? "colorkey" : mode}`;

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: base64 }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Scan failed. Please try again.");
      }

      const result = await res.json();
      onScanComplete(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setScanning(false);
    }
  }

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="font-playfair font-bold text-[16px] text-[#3A2418]">
            {labels.title}
          </p>
          <p className="font-nunito text-[12px] text-[#896E66] mt-1">
            {labels.description}
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#FAF6F0] border border-[#E4D6C8] flex items-center justify-center text-[#896E66] text-sm active:scale-95"
          >
            ×
          </button>
        )}
      </div>

      {/* Preview or capture buttons */}
      {preview ? (
        <div className="relative">
          <div className="w-full aspect-[4/3] rounded-2xl overflow-hidden border border-[#E4D6C8]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview}
              alt="Photo to scan"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Scanning overlay */}
          {scanning && (
            <div className="absolute inset-0 bg-black/40 rounded-2xl flex flex-col items-center justify-center gap-3">
              <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              <p className="font-nunito font-semibold text-[14px] text-white">
                {labels.scanning}
              </p>
            </div>
          )}

          {/* Actions below preview */}
          {!scanning && (
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleScan}
                className="flex-1 h-12 rounded-full bg-[#B36050] text-white font-nunito font-bold text-[14px] active:scale-[0.98] transition-transform shadow-md flex items-center justify-center gap-2"
              >
                <span>✨</span> Scan with AI
              </button>
              <button
                onClick={clearPhoto}
                className="h-12 px-5 rounded-full border border-[#E4D6C8] text-[#896E66] font-nunito font-semibold text-[13px] active:scale-[0.98]"
              >
                Retake
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-[#E4D6C8] bg-[#FAF6F0] flex flex-col items-center justify-center gap-4">
          <span className="text-5xl opacity-30">
            {mode === "cover" ? "📷" : mode === "colorkey" ? "🧵" : "📦"}
          </span>
          <p className="font-nunito text-[12px] text-[#B6A090]">
            Take a photo or choose from your library
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => cameraRef.current?.click()}
              className="h-11 px-4 rounded-xl border border-[#E4D6C8] bg-white font-nunito font-semibold text-[13px] text-[#3A2418] flex items-center gap-2 active:scale-[0.98]"
            >
              📷 Take Photo
            </button>
            <button
              type="button"
              onClick={() => libraryRef.current?.click()}
              className="h-11 px-4 rounded-xl border border-[#E4D6C8] bg-white font-nunito font-semibold text-[13px] text-[#3A2418] flex items-center gap-2 active:scale-[0.98]"
            >
              🖼️ Library
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-[#FDF0EE] border border-[#B03020]/20 rounded-xl px-4 py-3">
          <p className="font-nunito text-[13px] text-[#B03020]">{error}</p>
        </div>
      )}

      {/* Hidden file inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handlePhotoSelect}
        className="hidden"
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        onChange={handlePhotoSelect}
        className="hidden"
      />
    </div>
  );
}
