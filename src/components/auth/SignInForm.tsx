"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const schema = z.object({
  email: z.string().email("Please enter a valid email"),
  password: z.string().min(1, "Please enter your password"),
});

type FormData = z.infer<typeof schema>;

interface SignInFormProps {
  onForgotPassword: () => void;
}

export function SignInForm({ onForgotPassword }: SignInFormProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { signIn, loading, error } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  async function onSubmit(data: FormData) {
    await signIn(data.email, data.password);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Email */}
      <div className="space-y-2">
        <Label htmlFor="signin-email" className="text-sm font-semibold text-[#3A2418]">
          Email address
        </Label>
        <Input
          id="signin-email"
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

      {/* Password */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="signin-password" className="text-sm font-semibold text-[#3A2418]">
            Password
          </Label>
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-[#B36050] hover:text-[#9A5040] font-medium transition-colors"
          >
            Forgot password?
          </button>
        </div>
        <div className="relative">
          <Input
            id="signin-password"
            type={showPassword ? "text" : "password"}
            placeholder="Your password"
            autoComplete="current-password"
            className="h-14 text-base rounded-xl border-[#E4D6C8] bg-white focus-visible:ring-[#B36050] placeholder:text-[#9A8578] pr-12"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6B544D] hover:text-[#3A2418] transition-colors"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        {errors.password && (
          <p className="text-sm text-[#B03020]">{errors.password.message}</p>
        )}
      </div>

      {/* Server error */}
      {error && (
        <div className="rounded-xl bg-[#FDF1EF] border border-[#F0C8BB] px-4 py-3">
          <p className="text-sm text-[#B03020]">{error}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={loading}
        className="w-full h-14 text-base font-semibold rounded-full bg-[#B36050] hover:bg-[#9A5040] text-white transition-colors mt-2"
      >
        {loading ? (
          <Loader2 size={20} className="animate-spin" />
        ) : (
          "Sign in"
        )}
      </Button>
    </form>
  );
}
