"use client";

import { useRef, useEffect, useCallback, useState, useImperativeHandle, forwardRef } from "react";
import { isMarked, toggleCell } from "@/lib/markup-cells";

export type MarkupTool = "mark" | "erase" | "pan";

export interface GridCanvasHandle {
  zoomIn: () => void;
  zoomOut: () => void;
  fitToScreen: () => void;
}

interface GridCanvasProps {
  chartImageUrl: string | null;
  gridRows: number;
  gridCols: number;
  markedCells: string;
  tool: MarkupTool;
  onCellToggle: (row: number, col: number, newBitfield: string) => void;
}

export const GridCanvas = forwardRef<GridCanvasHandle, GridCanvasProps>(function GridCanvas(
  { chartImageUrl, gridRows, gridCols, markedCells, tool, onCellToggle },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Transform state
  const transformRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 });
  const [, forceRender] = useState(0);

  // Touch state
  const touchRef = useRef<{
    initialDist: number;
    initialScale: number;
    lastCenter: { x: number; y: number };
    isPanning: boolean;
    panStartOffset: { x: number; y: number };
    panStartTouch: { x: number; y: number };
  } | null>(null);

  const getCellSize = useCallback(() => {
    const img = imageRef.current;
    return {
      cellW: img ? img.naturalWidth / gridCols : 20,
      cellH: img ? img.naturalHeight / gridRows : 20,
    };
  }, [gridRows, gridCols]);

  const getGridSize = useCallback(() => {
    const { cellW, cellH } = getCellSize();
    return { gridW: gridCols * cellW, gridH: gridRows * cellH };
  }, [getCellSize, gridCols, gridRows]);

  // Fit grid to container
  const fitToScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const { gridW, gridH } = getGridSize();
    const fitScale = Math.min(cw / gridW, ch / gridH, 1) * 0.92;
    transformRef.current = {
      scale: fitScale,
      offsetX: (cw - gridW * fitScale) / 2,
      offsetY: (ch - gridH * fitScale) / 2,
    };
    forceRender((n) => n + 1);
  }, [getGridSize]);

  // Zoom toward center of viewport
  const zoomBy = useCallback((factor: number) => {
    const container = containerRef.current;
    if (!container) return;
    const t = transformRef.current;
    const cx = container.clientWidth / 2;
    const cy = container.clientHeight / 2;
    const newScale = Math.min(15, Math.max(0.1, t.scale * factor));
    t.offsetX = cx - (cx - t.offsetX) * (newScale / t.scale);
    t.offsetY = cy - (cy - t.offsetY) * (newScale / t.scale);
    t.scale = newScale;
    forceRender((n) => n + 1);
  }, []);

  // Expose zoom functions
  useImperativeHandle(ref, () => ({
    zoomIn: () => zoomBy(1.4),
    zoomOut: () => zoomBy(0.7),
    fitToScreen,
  }), [zoomBy, fitToScreen]);

  // Load image
  useEffect(() => {
    if (!chartImageUrl) { setImageLoaded(true); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { imageRef.current = img; setImageLoaded(true); };
    img.onerror = () => setImageLoaded(true);
    img.src = chartImageUrl;
  }, [chartImageUrl]);

  // Fit on load
  useEffect(() => { if (imageLoaded) fitToScreen(); }, [imageLoaded, fitToScreen]);

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { scale, offsetX, offsetY } = transformRef.current;
    const { cellW, cellH } = getCellSize();

    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const img = imageRef.current;
    if (img) {
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
    } else {
      ctx.fillStyle = "#FAF6F0";
      ctx.fillRect(0, 0, gridCols * cellW, gridRows * cellH);
    }

    // Marked cells
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        if (isMarked(markedCells, r, c, gridCols)) {
          ctx.fillStyle = "rgba(95, 122, 99, 0.45)";
          ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          const cx = c * cellW + cellW / 2;
          const cy = r * cellH + cellH / 2;
          ctx.beginPath();
          ctx.arc(cx, cy, Math.min(cellW, cellH) * 0.2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Grid lines
    ctx.strokeStyle = "rgba(58, 36, 24, 0.15)";
    ctx.lineWidth = 0.5;
    for (let r = 0; r <= gridRows; r++) {
      ctx.beginPath(); ctx.moveTo(0, r * cellH); ctx.lineTo(gridCols * cellW, r * cellH); ctx.stroke();
    }
    for (let c = 0; c <= gridCols; c++) {
      ctx.beginPath(); ctx.moveTo(c * cellW, 0); ctx.lineTo(c * cellW, gridRows * cellH); ctx.stroke();
    }
    // Bold every 10
    ctx.strokeStyle = "rgba(58, 36, 24, 0.35)";
    ctx.lineWidth = 1;
    for (let r = 0; r <= gridRows; r += 10) {
      ctx.beginPath(); ctx.moveTo(0, r * cellH); ctx.lineTo(gridCols * cellW, r * cellH); ctx.stroke();
    }
    for (let c = 0; c <= gridCols; c += 10) {
      ctx.beginPath(); ctx.moveTo(c * cellW, 0); ctx.lineTo(c * cellW, gridRows * cellH); ctx.stroke();
    }

    ctx.restore();
  }, [gridRows, gridCols, markedCells, getCellSize]);

  useEffect(() => { if (imageLoaded) requestAnimationFrame(draw); }, [imageLoaded, draw]);

  // Screen coords → grid cell
  const screenToCell = useCallback(
    (clientX: number, clientY: number): { row: number; col: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const { scale, offsetX, offsetY } = transformRef.current;
      const { cellW, cellH } = getCellSize();
      const col = Math.floor(((clientX - rect.left) - offsetX) / scale / cellW);
      const row = Math.floor(((clientY - rect.top) - offsetY) / scale / cellH);
      if (row >= 0 && row < gridRows && col >= 0 && col < gridCols) return { row, col };
      return null;
    },
    [gridRows, gridCols, getCellSize]
  );

  // Tap to mark (only for single quick taps, not drags)
  const pointerStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    pointerStartRef.current = { x: e.clientX, y: e.clientY, time: Date.now() };
  }, []);

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const start = pointerStartRef.current;
      pointerStartRef.current = null;
      if (!start) return;
      if (tool === "pan") return;

      // Only mark if it was a quick tap (< 300ms, < 10px movement)
      const dt = Date.now() - start.time;
      const dist = Math.hypot(e.clientX - start.x, e.clientY - start.y);
      if (dt > 300 || dist > 10) return;

      const cell = screenToCell(e.clientX, e.clientY);
      if (!cell) return;

      const currentlyMarked = isMarked(markedCells, cell.row, cell.col, gridCols);
      const newBf = tool === "erase"
        ? toggleCell(markedCells, cell.row, cell.col, gridCols, false)
        : toggleCell(markedCells, cell.row, cell.col, gridCols, !currentlyMarked);

      if (newBf !== markedCells) onCellToggle(cell.row, cell.col, newBf);
    },
    [tool, markedCells, gridCols, screenToCell, onCellToggle]
  );

  // Pinch zoom + pan
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0], t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        touchRef.current = {
          initialDist: dist,
          initialScale: transformRef.current.scale,
          lastCenter: { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 },
          isPanning: false,
          panStartOffset: { x: transformRef.current.offsetX, y: transformRef.current.offsetY },
          panStartTouch: { x: 0, y: 0 },
        };
      } else if (e.touches.length === 1 && tool === "pan") {
        const t = e.touches[0];
        touchRef.current = {
          initialDist: 0,
          initialScale: transformRef.current.scale,
          lastCenter: { x: 0, y: 0 },
          isPanning: true,
          panStartOffset: { x: transformRef.current.offsetX, y: transformRef.current.offsetY },
          panStartTouch: { x: t.clientX, y: t.clientY },
        };
      }
    },
    [tool]
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchRef.current) return;

    if (e.touches.length === 2 && !touchRef.current.isPanning) {
      e.preventDefault();
      const t1 = e.touches[0], t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const center = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };

      // Scale relative to initial pinch distance
      const newScale = Math.min(15, Math.max(0.1,
        touchRef.current.initialScale * (dist / touchRef.current.initialDist)
      ));

      // Pan based on center movement
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const prevCenter = touchRef.current.lastCenter;
        const dx = center.x - prevCenter.x;
        const dy = center.y - prevCenter.y;

        // Zoom toward pinch center
        const cx = center.x - (rect?.left ?? 0);
        const cy = center.y - (rect?.top ?? 0);
        const oldScale = transformRef.current.scale;
        transformRef.current.offsetX = cx - (cx - transformRef.current.offsetX) * (newScale / oldScale) + dx;
        transformRef.current.offsetY = cy - (cy - transformRef.current.offsetY) * (newScale / oldScale) + dy;
        transformRef.current.scale = newScale;
      }

      touchRef.current.lastCenter = center;
      forceRender((n) => n + 1);
    } else if (e.touches.length === 1 && touchRef.current.isPanning) {
      const t = e.touches[0];
      transformRef.current.offsetX = touchRef.current.panStartOffset.x + (t.clientX - touchRef.current.panStartTouch.x);
      transformRef.current.offsetY = touchRef.current.panStartOffset.y + (t.clientY - touchRef.current.panStartTouch.y);
      forceRender((n) => n + 1);
    }
  }, []);

  const handleTouchEnd = useCallback(() => { touchRef.current = null; }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const t = transformRef.current;
    const newScale = Math.min(15, Math.max(0.1, t.scale * factor));
    t.offsetX = mx - (mx - t.offsetX) * (newScale / t.scale);
    t.offsetY = my - (my - t.offsetY) * (newScale / t.scale);
    t.scale = newScale;
    forceRender((n) => n + 1);
  }, []);

  if (!imageLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FAF6F0]">
        <div className="w-10 h-10 border-4 border-[#F0C8BB] border-t-[#B36050] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex-1 relative overflow-hidden bg-[#F5EEE8]" style={{ touchAction: "none" }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      />
    </div>
  );
});
