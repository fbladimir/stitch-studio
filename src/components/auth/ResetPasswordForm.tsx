"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
});

type FormData = z.infer<typeof schema>;

interface ResetPasswordFormProps {
  onBack: () => void;
}

export function ResetPasswordForm({ onBack }: ResetPasswordFormProps) {
  const [sent, setSent] = useState(false);
  const { resetPassword, loading, error } = useAuth();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    const ok = await resetPassword(data.email);
    if (ok) setSent(true);
  }

  if (sent) {
    return (
      <div className="text-center space-y-4 py-4">
        <div className="flex justify-center">
          <CheckCircle2 size={56} className="text-[#5F7A63]" strokeWidth={1.5} />
        </div>
        <h3 className="font-playfair text-xl font-semibold text-[#3A2418]">
          Check your email
        </h3>
        <p className="text-[#6B544D] leading-relaxed">
          We sent a reset link to{" "}
          <span className="font-semibold text-[#3A2418]">{getValues("email")}</span>.
          Click the link in the email to set a new password.{" "}
        </p>
        <button
          onClick={onBack}
          className="text-sm text-[#B36050] font-medium hover:text-[#9A5040] transition-colors"
        >
          ← Back to sign in
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div>
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1 text-sm text-[#6B544D] hover:text-[#3A2418] transition-colors mb-4"
        >
          <ArrowLeft size={16} />
          Back to sign in
        </button>
        <p className="text-[#6B544D] text-sm leading-relaxed">
          Enter your email and we&apos;ll send you a link to reset your password.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="reset-email" className="text-sm font-semibold text-[#3A2418]">
          Email address
        </Label>
        <Input
          id="reset-email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          className="h-14 text-base rounded-xl border-[#E4D6C8] bg-white focus-visible:ring-[#B36050] placeholder:text-[#9A8578]"
          {...register("email")}
        />
        {errors.email && (
          <p className="text-sm text-[#B03020]">{errors.email.message}</p>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-[#FDF1EF] border border-[#F0C8BB] px-4 py-3">
          <p className="text-sm text-[#B03020]">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-14 text-base font-semibold rounded-full bg-[#B36050] hover:bg-[#9A5040] text-white transition-colors"
      >
        {loading ? <Loader2 size={20} className="animate-spin" /> : "Send reset link"}
      </Button>
    </form>
  );
}
