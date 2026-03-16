"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { isMarked, toggleCell } from "@/lib/markup-cells";

export type MarkupTool = "mark" | "erase" | "pan";

interface GridCanvasProps {
  chartImageUrl: string | null;
  gridRows: number;
  gridCols: number;
  markedCells: string;
  tool: MarkupTool;
  onCellToggle: (row: number, col: number, newBitfield: string) => void;
}

export function GridCanvas({
  chartImageUrl,
  gridRows,
  gridCols,
  markedCells,
  tool,
  onCellToggle,
}: GridCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Transform state
  const transformRef = useRef({ scale: 1, offsetX: 0, offsetY: 0 });
  const [, forceRender] = useState(0);

  // Touch state for pinch/pan
  const touchRef = useRef<{
    lastDist: number;
    lastCenter: { x: number; y: number };
    isPanning: boolean;
    startOffset: { scale: number; offsetX: number; offsetY: number };
  } | null>(null);

  // Load image
  useEffect(() => {
    if (!chartImageUrl) {
      setImageLoaded(true); // No image, just show grid
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imageRef.current = img;
      setImageLoaded(true);
    };
    img.onerror = () => setImageLoaded(true);
    img.src = chartImageUrl;
  }, [chartImageUrl]);

  // Fit grid to container on load
  useEffect(() => {
    if (!imageLoaded || !containerRef.current) return;
    const container = containerRef.current;
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    // Calculate natural grid size
    const img = imageRef.current;
    let gridW: number, gridH: number;
    if (img) {
      gridW = img.naturalWidth;
      gridH = img.naturalHeight;
    } else {
      // No image — use cell-based sizing
      gridW = gridCols * 20;
      gridH = gridRows * 20;
    }

    const scaleX = cw / gridW;
    const scaleY = ch / gridH;
    const fitScale = Math.min(scaleX, scaleY, 1) * 0.95;
    transformRef.current = {
      scale: fitScale,
      offsetX: (cw - gridW * fitScale) / 2,
      offsetY: (ch - gridH * fitScale) / 2,
    };
    forceRender((n) => n + 1);
  }, [imageLoaded, gridRows, gridCols]);

  // Draw
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const container = containerRef.current;
    if (!container) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    canvas.width = cw * dpr;
    canvas.height = ch * dpr;
    canvas.style.width = `${cw}px`;
    canvas.style.height = `${ch}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const { scale, offsetX, offsetY } = transformRef.current;

    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    const img = imageRef.current;
    let cellW: number, cellH: number;

    if (img) {
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
      cellW = img.naturalWidth / gridCols;
      cellH = img.naturalHeight / gridRows;
    } else {
      cellW = 20;
      cellH = 20;
      // Draw background
      ctx.fillStyle = "#FAF6F0";
      ctx.fillRect(0, 0, gridCols * cellW, gridRows * cellH);
    }

    // Draw marked cells
    for (let r = 0; r < gridRows; r++) {
      for (let c = 0; c < gridCols; c++) {
        if (isMarked(markedCells, r, c, gridCols)) {
          ctx.fillStyle = "rgba(95, 122, 99, 0.45)";
          ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
          // Small checkmark
          ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
          const cx = c * cellW + cellW / 2;
          const cy = r * cellH + cellH / 2;
          const s = Math.min(cellW, cellH) * 0.2;
          ctx.beginPath();
          ctx.arc(cx, cy, s, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }

    // Draw grid lines
    ctx.strokeStyle = "rgba(58, 36, 24, 0.15)";
    ctx.lineWidth = 0.5;

    for (let r = 0; r <= gridRows; r++) {
      const y = r * cellH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(gridCols * cellW, y);
      ctx.stroke();
    }
    for (let c = 0; c <= gridCols; c++) {
      const x = c * cellW;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, gridRows * cellH);
      ctx.stroke();
    }

    // Highlight every 10th line thicker
    ctx.strokeStyle = "rgba(58, 36, 24, 0.35)";
    ctx.lineWidth = 1;
    for (let r = 0; r <= gridRows; r += 10) {
      const y = r * cellH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(gridCols * cellW, y);
      ctx.stroke();
    }
    for (let c = 0; c <= gridCols; c += 10) {
      const x = c * cellW;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, gridRows * cellH);
      ctx.stroke();
    }

    ctx.restore();
  }, [gridRows, gridCols, markedCells]);

  useEffect(() => {
    if (imageLoaded) {
      requestAnimationFrame(draw);
    }
  }, [imageLoaded, draw]);

  // Convert screen coords to grid cell
  const screenToCell = useCallback(
    (clientX: number, clientY: number): { row: number; col: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;
      const { scale, offsetX, offsetY } = transformRef.current;

      const img = imageRef.current;
      const cellW = img ? img.naturalWidth / gridCols : 20;
      const cellH = img ? img.naturalHeight / gridRows : 20;

      const gridX = (x - offsetX) / scale;
      const gridY = (y - offsetY) / scale;

      const col = Math.floor(gridX / cellW);
      const row = Math.floor(gridY / cellH);

      if (row >= 0 && row < gridRows && col >= 0 && col < gridCols) {
        return { row, col };
      }
      return null;
    },
    [gridRows, gridCols]
  );

  // Handle tap/click to mark
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (tool === "pan") return;

      const cell = screenToCell(e.clientX, e.clientY);
      if (!cell) return;

      const currentlyMarked = isMarked(markedCells, cell.row, cell.col, gridCols);

      // Mark tool: if cell is empty, mark it. If marked, unmark it.
      // Erase tool: always unmark.
      let newBf: string;
      if (tool === "erase") {
        newBf = toggleCell(markedCells, cell.row, cell.col, gridCols, false);
      } else {
        newBf = toggleCell(markedCells, cell.row, cell.col, gridCols, !currentlyMarked);
      }

      if (newBf !== markedCells) {
        onCellToggle(cell.row, cell.col, newBf);
      }
    },
    [tool, markedCells, gridCols, screenToCell, onCellToggle]
  );

  // Touch handling for pinch zoom + pan
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const center = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };
        touchRef.current = {
          lastDist: dist,
          lastCenter: center,
          isPanning: false,
          startOffset: { ...transformRef.current },
        };
      } else if (e.touches.length === 1 && tool === "pan") {
        const t = e.touches[0];
        touchRef.current = {
          lastDist: 0,
          lastCenter: { x: t.clientX, y: t.clientY },
          isPanning: true,
          startOffset: { ...transformRef.current },
        };
      }
    },
    [tool]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!touchRef.current) return;

      if (e.touches.length === 2 && !touchRef.current.isPanning) {
        e.preventDefault();
        const t1 = e.touches[0];
        const t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const center = {
          x: (t1.clientX + t2.clientX) / 2,
          y: (t1.clientY + t2.clientY) / 2,
        };

        const scaleFactor = dist / touchRef.current.lastDist;
        const newScale = Math.min(10, Math.max(0.2, transformRef.current.scale * scaleFactor));

        // Zoom toward center
        const dx = center.x - touchRef.current.lastCenter.x;
        const dy = center.y - touchRef.current.lastCenter.y;
        transformRef.current.offsetX += dx;
        transformRef.current.offsetY += dy;
        transformRef.current.scale = newScale;

        touchRef.current.lastDist = dist;
        touchRef.current.lastCenter = center;
        forceRender((n) => n + 1);
      } else if (e.touches.length === 1 && touchRef.current.isPanning) {
        const t = e.touches[0];
        const dx = t.clientX - touchRef.current.lastCenter.x;
        const dy = t.clientY - touchRef.current.lastCenter.y;
        transformRef.current.offsetX = touchRef.current.startOffset.offsetX + dx;
        transformRef.current.offsetY = touchRef.current.startOffset.offsetY + dy;
        forceRender((n) => n + 1);
      }
    },
    []
  );

  const handleTouchEnd = useCallback(() => {
    touchRef.current = null;
  }, []);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const t = transformRef.current;
    const newScale = Math.min(10, Math.max(0.2, t.scale * zoomFactor));

    // Zoom toward mouse position
    t.offsetX = mouseX - (mouseX - t.offsetX) * (newScale / t.scale);
    t.offsetY = mouseY - (mouseY - t.offsetY) * (newScale / t.scale);
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
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden bg-[#F5EEE8]"
      style={{ touchAction: "none" }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        onPointerDown={handlePointerDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      />
    </div>
  );
}
