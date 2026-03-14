"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/image";
import { createClient } from "@/lib/supabase/client";

interface Step2PhotoProps {
  userId: string;
  displayName: string;
  onNext: (photoUrl: string | null) => void;
}

export function Step2Photo({ userId, displayName, onNext }: Step2PhotoProps) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);

  async function handleFile(file: File) {
    const compressed = await compressImage(file);
    const url = URL.createObjectURL(compressed);
    setPreview(url);
    setPendingFile(compressed);
  }

  async function handleSave() {
    if (!pendingFile) return onNext(null);
    setUploading(true);
    const supabase = createClient();
    const ext = "jpg";
    const path = `${userId}/profile.${ext}`;
    const { error } = await supabase.storage
      .from("profile-photos")
      .upload(path, pendingFile, { upsert: true });
    if (error) {
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from("profile-photos").getPublicUrl(path);
    setUploading(false);
    onNext(data.publicUrl);
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="text-6xl mb-2">📸</div>
        <h1 className="font-playfair text-3xl font-bold text-[#3A2418]">
          Add a photo, {displayName}!
        </h1>
        <p className="text-[#896E66] text-base leading-relaxed">
          Totally optional — but it&apos;s a nice touch.
        </p>
      </div>

      {/* Avatar preview */}
      <div className="flex justify-center">
        <div className="relative w-36 h-36 rounded-full border-4 border-[#F0C8BB] bg-[#FDF4F1] flex items-center justify-center overflow-hidden shadow-md">
          {preview ? (
            <Image src={preview} alt="Profile preview" fill className="object-cover" />
          ) : (
            <Camera size={40} className="text-[#C4A898]" strokeWidth={1.5} />
          )}
        </div>
      </div>

      {/* Photo buttons */}
      <div className="grid grid-cols-2 gap-3">
        <button
          type="button"
          onClick={() => cameraRef.current?.click()}
          className="flex flex-col items-center gap-2 h-20 rounded-2xl border-2 border-[#E4D6C8] bg-white hover:border-[#B36050] hover:bg-[#FDF4F1] transition-all"
        >
          <Camera size={22} className="text-[#B36050] mt-3" />
          <span className="text-sm font-semibold text-[#3A2418]">Take photo</span>
        </button>
        <button
          type="button"
          onClick={() => libraryRef.current?.click()}
          className="flex flex-col items-center gap-2 h-20 rounded-2xl border-2 border-[#E4D6C8] bg-white hover:border-[#B36050] hover:bg-[#FDF4F1] transition-all"
        >
          <ImageIcon size={22} className="text-[#B36050] mt-3" />
          <span className="text-sm font-semibold text-[#3A2418]">Choose from library</span>
        </button>
      </div>

      {/* Hidden inputs */}
      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
      <input
        ref={libraryRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <div className="space-y-3">
        {preview && (
          <Button
            onClick={handleSave}
            disabled={uploading}
            className="w-full h-14 text-base font-semibold rounded-full bg-[#B36050] hover:bg-[#9A5040] text-white"
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : "Looks great! →"}
          </Button>
        )}
        <button
          type="button"
          onClick={() => onNext(null)}
          className="w-full py-3 text-sm text-[#896E66] hover:text-[#3A2418] font-medium transition-colors"
        >
          Skip for now →
        </button>
      </div>
    </div>
  );
}
