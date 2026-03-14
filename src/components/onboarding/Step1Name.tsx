"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const schema = z.object({
  display_name: z.string().min(1, "Please enter a name"),
});

type FormData = z.infer<typeof schema>;

interface Step1NameProps {
  initialName: string;
  onNext: (displayName: string) => void;
}

export function Step1Name({ initialName, onNext }: Step1NameProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { display_name: initialName },
  });

  return (
    <form onSubmit={handleSubmit((d) => onNext(d.display_name))} className="space-y-8">
      <div className="text-center space-y-3">
        <div className="text-6xl mb-2">✿</div>
        <h1 className="font-playfair text-3xl font-bold text-[#3A2418]">
          What should we call you?
        </h1>
        <p className="text-[#896E66] text-base leading-relaxed">
          This is how your app will greet you each day.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="display_name" className="text-sm font-semibold text-[#3A2418]">
          Your name
        </Label>
        <Input
          id="display_name"
          placeholder="e.g. Margaret"
          autoFocus
          className="h-14 text-lg rounded-xl border-[#E4D6C8] bg-white focus-visible:ring-[#B36050] placeholder:text-[#C4A898] text-center"
          {...register("display_name")}
        />
        {errors.display_name && (
          <p className="text-sm text-[#B03020] text-center">{errors.display_name.message}</p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full h-14 text-base font-semibold rounded-full bg-[#B36050] hover:bg-[#9A5040] text-white"
      >
        That&apos;s me →
      </Button>
    </form>
  );
}
