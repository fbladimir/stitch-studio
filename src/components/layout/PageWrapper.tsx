import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  className?: string;
  /** Skip default px/pt padding — for full-bleed pages */
  noPadding?: boolean;
}

export function PageWrapper({
  children,
  className,
  noPadding = false,
}: PageWrapperProps) {
  return (
    <main
      className={cn(
        "min-h-screen",
        // Mobile: pad bottom so content clears the fixed bottom nav + safe area
        "pb-[calc(72px+env(safe-area-inset-bottom))]",
        // Tablet+: side nav takes left space, reset bottom padding
        "md:pb-6 md:pl-[220px]",
        !noPadding && "px-4",
        className
      )}
      style={!noPadding ? { paddingTop: "max(16px, env(safe-area-inset-top))" } : undefined}
    >
      {children}
    </main>
  );
}
