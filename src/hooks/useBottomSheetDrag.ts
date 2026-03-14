"use client";

import { useRef, useCallback } from "react";

interface UseBottomSheetDragOptions {
  onClose: () => void;
  /** Distance in px to trigger dismiss (default: 100) */
  threshold?: number;
}

/**
 * iOS-native-style drag-to-dismiss for bottom sheet modals.
 * Attach the returned handlers to the sheet's container div.
 *
 * Usage:
 *   const { sheetRef, handleTouchStart, handleTouchMove, handleTouchEnd } = useBottomSheetDrag({ onClose });
 *   <div ref={sheetRef} onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
 */
export function useBottomSheetDrag({ onClose, threshold = 100 }: UseBottomSheetDragOptions) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isDragging = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    // Only allow drag from the top 48px of the sheet (handle area)
    const sheet = sheetRef.current;
    if (!sheet) return;
    const sheetRect = sheet.getBoundingClientRect();
    const touchY = e.touches[0].clientY;
    if (touchY - sheetRect.top > 48) return;

    startY.current = touchY;
    currentY.current = touchY;
    isDragging.current = true;
    sheet.style.transition = "none";
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !sheetRef.current) return;
    currentY.current = e.touches[0].clientY;
    const dy = Math.max(0, currentY.current - startY.current);
    sheetRef.current.style.transform = `translateY(${dy}px)`;

    // Dim backdrop proportionally
    const opacity = Math.max(0, 1 - dy / 300);
    const backdrop = sheetRef.current.parentElement?.querySelector<HTMLElement>("[data-sheet-backdrop]");
    if (backdrop) backdrop.style.opacity = String(opacity);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (!isDragging.current || !sheetRef.current) return;
    isDragging.current = false;
    const dy = currentY.current - startY.current;

    if (dy > threshold) {
      // Dismiss: slide out
      sheetRef.current.style.transition = "transform 0.25s ease-out";
      sheetRef.current.style.transform = "translateY(100%)";
      const backdrop = sheetRef.current.parentElement?.querySelector<HTMLElement>("[data-sheet-backdrop]");
      if (backdrop) {
        backdrop.style.transition = "opacity 0.25s ease-out";
        backdrop.style.opacity = "0";
      }
      setTimeout(onClose, 250);
    } else {
      // Snap back
      sheetRef.current.style.transition = "transform 0.2s ease-out";
      sheetRef.current.style.transform = "translateY(0)";
      const backdrop = sheetRef.current.parentElement?.querySelector<HTMLElement>("[data-sheet-backdrop]");
      if (backdrop) {
        backdrop.style.transition = "opacity 0.2s ease-out";
        backdrop.style.opacity = "1";
      }
    }
  }, [onClose, threshold]);

  return { sheetRef, handleTouchStart, handleTouchMove, handleTouchEnd };
}
