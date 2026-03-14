"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { SignInForm } from "@/components/auth/SignInForm";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";

type View = "signin" | "signup" | "reset";

function AuthCard() {
  const searchParams = useSearchParams();
  const tab = searchParams.get("tab");
  const [view, setView] = useState<View>(tab === "signup" ? "signup" : "signin");

  useEffect(() => {
    if (tab === "signup") setView("signup");
    else if (tab === "signin") setView("signin");
  }, [tab]);

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-[#E4D6C8] p-7">
      {view === "reset" ? (
        <>
          <h2 className="font-playfair text-2xl font-semibold text-[#3A2418] mb-6">
            Reset password
          </h2>
          <ResetPasswordForm onBack={() => setView("signin")} />
        </>
      ) : (
        <>
          <div className="flex rounded-2xl bg-[#FAF6F0] p-1 mb-7">
            <button
              onClick={() => setView("signin")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                view === "signin"
                  ? "bg-white text-[#3A2418] shadow-sm"
                  : "text-[#6B544D] hover:text-[#3A2418]"
              }`}
            >
              Sign in
            </button>
            <button
              onClick={() => setView("signup")}
              className={`flex-1 py-2.5 text-sm font-semibold rounded-xl transition-all duration-200 ${
                view === "signup"
                  ? "bg-white text-[#3A2418] shadow-sm"
                  : "text-[#6B544D] hover:text-[#3A2418]"
              }`}
            >
              Create account
            </button>
          </div>

          <h2 className="font-playfair text-2xl font-semibold text-[#3A2418] mb-6">
            {view === "signin" ? "Welcome back" : "Let's get started"}
          </h2>

          {view === "signin" ? (
            <SignInForm onForgotPassword={() => setView("reset")} />
          ) : (
            <SignUpForm />
          )}
        </>
      )}
    </div>
  );
}

export default function AuthPage() {
  return (
    <div className="min-h-screen bg-[#FAF6F0] flex flex-col">
      <div className="h-1.5 bg-gradient-to-r from-[#B36050] via-[#CA8070] to-[#F0C8BB]" />

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">

          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-[#B36050] mb-5 shadow-lg">
              <span className="text-4xl">🪡</span>
            </div>
            <h1 className="font-playfair text-4xl font-bold text-[#3A2418] tracking-tight">
              Stitch Studio
            </h1>
            <p className="text-[#6B544D] mt-2 text-base">
              Your cross stitch companion
            </p>
          </div>

          <Suspense fallback={
            <div className="bg-white rounded-3xl border border-[#E4D6C8] p-7 h-64 animate-pulse" />
          }>
            <AuthCard />
          </Suspense>

          <p className="text-center text-xs text-[#C4A898] mt-8 leading-relaxed">
            Made with love for your stitching journey ✿
          </p>
        </div>
      </div>
    </div>
  );
}
