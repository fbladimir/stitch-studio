"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Dog } from "@/types";

const PET_EMOJIS = ["🐶", "🐱", "🐰", "🐹", "🐦", "🐠", "🐢", "🦜", "🐺", "🦊", "🐻", "🐼"];

interface Step3DogsProps {
  onNext: (dogs: Dog[]) => void;
}

export function Step3Dogs({ onNext }: Step3DogsProps) {
  const [dogs, setDogs] = useState<Dog[]>([]);
  const [name, setName] = useState("");
  const [selectedEmoji, setSelectedEmoji] = useState("🐶");
  const [showAdd, setShowAdd] = useState(false);

  function addDog() {
    if (!name.trim()) return;
    setDogs((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: name.trim(), emoji: selectedEmoji },
    ]);
    setName("");
    setSelectedEmoji("🐶");
    setShowAdd(false);
  }

  function removeDog(id: string) {
    setDogs((prev) => prev.filter((d) => d.id !== id));
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <div className="text-6xl mb-2">🐾</div>
        <h1 className="font-playfair text-3xl font-bold text-[#3A2418]">
          Got pets?
        </h1>
        <p className="text-[#896E66] text-base leading-relaxed">
          Tell us about your fur babies — they&apos;ll send you tail wags on the home screen!
        </p>
      </div>

      {/* Pet pills */}
      {dogs.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {dogs.map((dog) => (
            <div
              key={dog.id}
              className="flex items-center gap-2 bg-[#FDF4F1] border border-[#F0C8BB] rounded-full px-4 py-2 animate-in fade-in slide-in-from-bottom-2 duration-200"
            >
              <span className="text-xl">{dog.emoji}</span>
              <span className="text-sm font-semibold text-[#3A2418]">{dog.name}</span>
              <button
                onClick={() => removeDog(dog.id)}
                className="text-[#C4A898] hover:text-[#B03020] transition-colors ml-1"
                aria-label={`Remove ${dog.name}`}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add pet form */}
      {showAdd ? (
        <div className="bg-[#FDF4F1] rounded-2xl border border-[#F0C8BB] p-5 space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#3A2418]">Pet&apos;s name</label>
            <Input
              placeholder="e.g. Bella"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addDog()}
              className="h-12 text-base rounded-xl border-[#E4D6C8] bg-white focus-visible:ring-[#B36050]"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[#3A2418]">Pick an emoji</label>
            <div className="flex flex-wrap gap-2">
              {PET_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setSelectedEmoji(emoji)}
                  className={`w-11 h-11 text-2xl rounded-xl transition-all ${
                    selectedEmoji === emoji
                      ? "bg-[#B36050] shadow-md scale-110"
                      : "bg-white border border-[#E4D6C8] hover:border-[#B36050]"
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={addDog}
              disabled={!name.trim()}
              className="flex-1 h-12 rounded-full bg-[#B36050] hover:bg-[#9A5040] text-white font-semibold"
            >
              Add {selectedEmoji}
            </Button>
            <button
              type="button"
              onClick={() => setShowAdd(false)}
              className="px-5 h-12 rounded-full border border-[#E4D6C8] text-[#896E66] text-sm font-medium hover:bg-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="w-full h-14 flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[#E4D6C8] text-[#896E66] hover:border-[#B36050] hover:text-[#B36050] hover:bg-[#FDF4F1] transition-all font-medium"
        >
          <Plus size={20} />
          Add a pet
        </button>
      )}

      <div className="space-y-3 pt-2">
        <Button
          onClick={() => onNext(dogs)}
          className="w-full h-14 text-base font-semibold rounded-full bg-[#B36050] hover:bg-[#9A5040] text-white"
        >
          {dogs.length > 0 ? "All done! Let's stitch →" : "Skip, let's stitch →"}
        </Button>
      </div>
    </div>
  );
}
