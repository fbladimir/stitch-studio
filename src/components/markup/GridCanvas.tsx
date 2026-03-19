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

// ── Helpers ──────────────────────────────────────────────────────

const MIN_SCALE = 0.05;
const MAX_SCALE = 20;
const DECEL = 0.92; // momentum deceleration per frame
const MIN_VEL = 0.5; // stop momentum below this px/frame

function clampScale(s: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, s));
}

// ── Component ────────────────────────────────────────────────────

export const GridCanvas = forwardRef<GridCanvasHandle, GridCanvasProps>(function GridCanvas(
  { chartImageUrl, gridRows, gridCols, markedCells, tool, onCellToggle },
  ref
) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);

  // All transform state lives in refs — never goes through React state
  const scaleRef = useRef(1);
  const offsetRef = useRef({ x: 0, y: 0 });

  // Animation state
  const rafRef = useRef(0);
  const needsDrawRef = useRef(true);
  const isActiveRef = useRef(false); // gesture or momentum active

  // Momentum
  const velocityRef = useRef({ x: 0, y: 0 });

  // Animated zoom (for +/- buttons)
  const animZoomRef = useRef<{
    fromScale: number;
    toScale: number;
    cx: number;
    cy: number;
    fromOx: number;
    fromOy: number;
    startTime: number;
    duration: number;
  } | null>(null);

  // Touch/gesture tracking
  const gestureRef = useRef<{
    type: "pinch" | "pan";
    // Pinch
    initialDist: number;
    initialScale: number;
    lastCenter: { x: number; y: number };
    // Pan (single finger)
    panStartOffset: { x: number; y: number };
    panStartTouch: { x: number; y: number };
    // Velocity tracking for pan
    prevPos: { x: number; y: number };
    prevTime: number;
  } | null>(null);

  // Tap detection
  const tapRef = useRef<{ x: number; y: number; time: number; id: number } | null>(null);

  // Store latest props in refs for the render loop
  const markedCellsRef = useRef(markedCells);
  markedCellsRef.current = markedCells;
  const toolRef = useRef(tool);
  toolRef.current = tool;

  // ── Cell size ────────────────────────────────────────────────

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

  // ── Fit to screen ────────────────────────────────────────────

  const fitToScreen = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;
    const cw = container.clientWidth;
    const ch = container.clientHeight;
    const { gridW, gridH } = getGridSize();
    const fitScale = Math.min(cw / gridW, ch / gridH, 1) * 0.92;
    scaleRef.current = fitScale;
    offsetRef.current = {
      x: (cw - gridW * fitScale) / 2,
      y: (ch - gridH * fitScale) / 2,
    };
    needsDrawRef.current = true;
  }, [getGridSize]);

  // ── Animated zoom (for buttons) ──────────────────────────────

  const animateZoomTo = useCallback((targetScale: number) => {
    const container = containerRef.current;
    if (!container) return;
    const cx = container.clientWidth / 2;
    const cy = container.clientHeight / 2;
    const newScale = clampScale(targetScale);
    animZoomRef.current = {
      fromScale: scaleRef.current,
      toScale: newScale,
      cx,
      cy,
      fromOx: offsetRef.current.x,
      fromOy: offsetRef.current.y,
      startTime: performance.now(),
      duration: 200,
    };
    startLoop();
  }, []);

  // ── Expose zoom handles ──────────────────────────────────────

  useImperativeHandle(ref, () => ({
    zoomIn: () => animateZoomTo(scaleRef.current * 1.5),
    zoomOut: () => animateZoomTo(scaleRef.current * 0.667),
    fitToScreen: () => { fitToScreen(); startLoop(); },
  }), [animateZoomTo, fitToScreen]);

  // ── Image loading ────────────────────────────────────────────

  useEffect(() => {
    if (!chartImageUrl) { setImageLoaded(true); return; }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { imageRef.current = img; setImageLoaded(true); };
    img.onerror = () => setImageLoaded(true);
    img.src = chartImageUrl;
  }, [chartImageUrl]);

  useEffect(() => {
    if (imageLoaded) {
      fitToScreen();
      startLoop();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [imageLoaded]);

  // ── Main render loop ─────────────────────────────────────────
  // Runs continuously during gestures/momentum, draws only when needed

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const cw = container.clientWidth;
    const ch = container.clientHeight;

    // Only resize canvas buffer if dimensions changed
    if (canvas.width !== cw * dpr || canvas.height !== ch * dpr) {
      canvas.width = cw * dpr;
      canvas.height = ch * dpr;
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const scale = scaleRef.current;
    const { x: offsetX, y: offsetY } = offsetRef.current;
    const { cellW, cellH } = getCellSize();
    const mc = markedCellsRef.current;

    ctx.clearRect(0, 0, cw, ch);
    ctx.save();
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // Background image
    const img = imageRef.current;
    if (img) {
      ctx.drawImage(img, 0, 0, img.naturalWidth, img.naturalHeight);
    } else {
      ctx.fillStyle = "#FAF6F0";
      ctx.fillRect(0, 0, gridCols * cellW, gridRows * cellH);
    }

    // Viewport culling
    const visLeft = -offsetX / scale;
    const visTop = -offsetY / scale;
    const visRight = visLeft + cw / scale;
    const visBottom = visTop + ch / scale;

    const rStart = Math.max(0, Math.floor(visTop / cellH) - 1);
    const rEnd = Math.min(gridRows - 1, Math.ceil(visBottom / cellH) + 1);
    const cStart = Math.max(0, Math.floor(visLeft / cellW) - 1);
    const cEnd = Math.min(gridCols - 1, Math.ceil(visRight / cellW) + 1);

    // Marked cells
    for (let r = rStart; r <= rEnd; r++) {
      for (let c = cStart; c <= cEnd; c++) {
        if (isMarked(mc, r, c, gridCols)) {
          const x = c * cellW;
          const y = r * cellH;
          ctx.fillStyle = "rgba(95, 122, 99, 0.55)";
          ctx.fillRect(x, y, cellW, cellH);
          // White X
          ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
          ctx.lineWidth = Math.max(1, Math.min(cellW, cellH) * 0.08);
          const inset = Math.min(cellW, cellH) * 0.25;
          ctx.beginPath();
          ctx.moveTo(x + inset, y + inset);
          ctx.lineTo(x + cellW - inset, y + cellH - inset);
          ctx.moveTo(x + cellW - inset, y + inset);
          ctx.lineTo(x + inset, y + cellH - inset);
          ctx.stroke();
        }
      }
    }

    // Grid lines — visible range only
    ctx.strokeStyle = "rgba(58, 36, 24, 0.15)";
    ctx.lineWidth = 0.5;
    for (let r = Math.max(0, rStart); r <= Math.min(gridRows, rEnd + 1); r++) {
      ctx.beginPath();
      ctx.moveTo(cStart * cellW, r * cellH);
      ctx.lineTo((cEnd + 1) * cellW, r * cellH);
      ctx.stroke();
    }
    for (let c = Math.max(0, cStart); c <= Math.min(gridCols, cEnd + 1); c++) {
      ctx.beginPath();
      ctx.moveTo(c * cellW, rStart * cellH);
      ctx.lineTo(c * cellW, (rEnd + 1) * cellH);
      ctx.stroke();
    }
    // Bold every 10
    ctx.strokeStyle = "rgba(58, 36, 24, 0.35)";
    ctx.lineWidth = 1;
    for (let r = Math.ceil(Math.max(0, rStart) / 10) * 10; r <= Math.min(gridRows, rEnd + 1); r += 10) {
      ctx.beginPath();
      ctx.moveTo(cStart * cellW, r * cellH);
      ctx.lineTo((cEnd + 1) * cellW, r * cellH);
      ctx.stroke();
    }
    for (let c = Math.ceil(Math.max(0, cStart) / 10) * 10; c <= Math.min(gridCols, cEnd + 1); c += 10) {
      ctx.beginPath();
      ctx.moveTo(c * cellW, rStart * cellH);
      ctx.lineTo(c * cellW, (rEnd + 1) * cellH);
      ctx.stroke();
    }

    ctx.restore();
    needsDrawRef.current = false;
  }, [gridRows, gridCols, getCellSize]);

  // The loop: handles momentum + animated zoom + redraws
  const loop = useCallback(() => {
    let stillActive = false;

    // Momentum
    const v = velocityRef.current;
    if (Math.abs(v.x) > MIN_VEL || Math.abs(v.y) > MIN_VEL) {
      offsetRef.current.x += v.x;
      offsetRef.current.y += v.y;
      v.x *= DECEL;
      v.y *= DECEL;
      needsDrawRef.current = true;
      stillActive = true;
    } else {
      v.x = 0;
      v.y = 0;
    }

    // Animated zoom (for +/- buttons)
    const az = animZoomRef.current;
    if (az) {
      const elapsed = performance.now() - az.startTime;
      const t = Math.min(1, elapsed / az.duration);
      // Ease-out cubic
      const ease = 1 - Math.pow(1 - t, 3);
      const currentScale = az.fromScale + (az.toScale - az.fromScale) * ease;

      // Zoom toward center point
      const ratio = currentScale / az.fromScale;
      offsetRef.current.x = az.cx - (az.cx - az.fromOx) * ratio;
      offsetRef.current.y = az.cy - (az.cy - az.fromOy) * ratio;
      scaleRef.current = currentScale;

      needsDrawRef.current = true;
      if (t >= 1) {
        animZoomRef.current = null;
      } else {
        stillActive = true;
      }
    }

    if (needsDrawRef.current) {
      draw();
    }

    if (stillActive || isActiveRef.current) {
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [draw]);

  function startLoop() {
    needsDrawRef.current = true;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(loop);
    }
  }

  // Kick the loop whenever markedCells change (external update)
  useEffect(() => {
    needsDrawRef.current = true;
    if (!rafRef.current) {
      rafRef.current = requestAnimationFrame(loop);
    }
  }, [markedCells, loop]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // Stop loop when idle
  useEffect(() => {
    // After each loop frame, if nothing is active, stop
    const checkStop = () => {
      if (!isActiveRef.current && !animZoomRef.current &&
          Math.abs(velocityRef.current.x) <= MIN_VEL &&
          Math.abs(velocityRef.current.y) <= MIN_VEL) {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = 0;
        }
      }
    };
    const id = setInterval(checkStop, 500);
    return () => clearInterval(id);
  }, []);

  // ── Screen coords → grid cell ────────────────────────────────

  const screenToCell = useCallback(
    (clientX: number, clientY: number): { row: number; col: number } | null => {
      const canvas = canvasRef.current;
      if (!canvas) return null;
      const rect = canvas.getBoundingClientRect();
      const { cellW, cellH } = getCellSize();
      const scale = scaleRef.current;
      const { x: ox, y: oy } = offsetRef.current;
      const col = Math.floor(((clientX - rect.left) - ox) / scale / cellW);
      const row = Math.floor(((clientY - rect.top) - oy) / scale / cellH);
      if (row >= 0 && row < gridRows && col >= 0 && col < gridCols) return { row, col };
      return null;
    },
    [gridRows, gridCols, getCellSize]
  );

  // ── Touch handlers ───────────────────────────────────────────
  // All gestures use native touch events for lowest latency

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      // Kill momentum on new touch
      velocityRef.current = { x: 0, y: 0 };
      animZoomRef.current = null;

      if (e.touches.length === 2) {
        // Pinch — always works regardless of tool
        e.preventDefault();
        const t1 = e.touches[0], t2 = e.touches[1];
        const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
        const center = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };
        gestureRef.current = {
          type: "pinch",
          initialDist: dist,
          initialScale: scaleRef.current,
          lastCenter: center,
          panStartOffset: { ...offsetRef.current },
          panStartTouch: { x: 0, y: 0 },
          prevPos: center,
          prevTime: performance.now(),
        };
        tapRef.current = null;
        isActiveRef.current = true;
        startLoop();
      } else if (e.touches.length === 1) {
        const t = e.touches[0];
        const pos = { x: t.clientX, y: t.clientY };

        // Track for tap detection
        tapRef.current = { x: t.clientX, y: t.clientY, time: Date.now(), id: t.identifier };

        if (toolRef.current === "pan") {
          // Single finger pan
          gestureRef.current = {
            type: "pan",
            initialDist: 0,
            initialScale: scaleRef.current,
            lastCenter: pos,
            panStartOffset: { ...offsetRef.current },
            panStartTouch: pos,
            prevPos: pos,
            prevTime: performance.now(),
          };
          isActiveRef.current = true;
          startLoop();
        }
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const g = gestureRef.current;

    if (e.touches.length === 2) {
      e.preventDefault();
      const t1 = e.touches[0], t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      const center = { x: (t1.clientX + t2.clientX) / 2, y: (t1.clientY + t2.clientY) / 2 };

      if (!g || g.type !== "pinch") {
        // Transition from single touch to pinch
        gestureRef.current = {
          type: "pinch",
          initialDist: dist,
          initialScale: scaleRef.current,
          lastCenter: center,
          panStartOffset: { ...offsetRef.current },
          panStartTouch: { x: 0, y: 0 },
          prevPos: center,
          prevTime: performance.now(),
        };
        tapRef.current = null;
        isActiveRef.current = true;
        startLoop();
        return;
      }

      // Pinch zoom + pan
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const newScale = clampScale(g.initialScale * (dist / g.initialDist));
      const dx = center.x - g.lastCenter.x;
      const dy = center.y - g.lastCenter.y;

      const cx = center.x - rect.left;
      const cy = center.y - rect.top;
      const oldScale = scaleRef.current;

      offsetRef.current.x = cx - (cx - offsetRef.current.x) * (newScale / oldScale) + dx;
      offsetRef.current.y = cy - (cy - offsetRef.current.y) * (newScale / oldScale) + dy;
      scaleRef.current = newScale;

      // Track velocity for momentum
      const now = performance.now();
      const dt = now - g.prevTime;
      if (dt > 0) {
        velocityRef.current.x = (center.x - g.prevPos.x) / dt * 16; // ~1 frame at 60fps
        velocityRef.current.y = (center.y - g.prevPos.y) / dt * 16;
      }
      g.prevPos = center;
      g.prevTime = now;
      g.lastCenter = center;

      needsDrawRef.current = true;
    } else if (e.touches.length === 1 && g?.type === "pan") {
      // Single finger pan
      const t = e.touches[0];
      offsetRef.current.x = g.panStartOffset.x + (t.clientX - g.panStartTouch.x);
      offsetRef.current.y = g.panStartOffset.y + (t.clientY - g.panStartTouch.y);

      // Track velocity
      const now = performance.now();
      const dt = now - g.prevTime;
      if (dt > 0) {
        velocityRef.current.x = (t.clientX - g.prevPos.x) / dt * 16;
        velocityRef.current.y = (t.clientY - g.prevPos.y) / dt * 16;
      }
      g.prevPos = { x: t.clientX, y: t.clientY };
      g.prevTime = now;

      needsDrawRef.current = true;
      tapRef.current = null; // moved, not a tap
    } else if (e.touches.length === 1 && tapRef.current) {
      // Check if moved too far to be a tap
      const t = e.touches[0];
      const dist = Math.hypot(t.clientX - tapRef.current.x, t.clientY - tapRef.current.y);
      if (dist > 10) tapRef.current = null;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    const g = gestureRef.current;

    // If going from 2 fingers to 1, end the pinch but don't trigger tap
    if (e.touches.length === 1 && g?.type === "pinch") {
      gestureRef.current = null;
      isActiveRef.current = false;
      // Let momentum continue
      return;
    }

    if (e.touches.length === 0) {
      gestureRef.current = null;
      isActiveRef.current = false;

      // Check for tap
      const tap = tapRef.current;
      if (tap) {
        const dt = Date.now() - tap.time;
        if (dt < 300 && toolRef.current !== "pan") {
          const cell = screenToCell(tap.x, tap.y);
          if (cell) {
            const mc = markedCellsRef.current;
            const currentlyMarked = isMarked(mc, cell.row, cell.col, gridCols);
            const newBf = toolRef.current === "erase"
              ? toggleCell(mc, cell.row, cell.col, gridCols, false)
              : toggleCell(mc, cell.row, cell.col, gridCols, !currentlyMarked);
            if (newBf !== mc) onCellToggle(cell.row, cell.col, newBf);
          }
        }
        tapRef.current = null;
      }

      // Momentum kicks in (loop is still running)
      startLoop();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gridCols, screenToCell, onCellToggle]);

  // ── Mouse handlers (desktop) ─────────────────────────────────

  const mouseDownRef = useRef<{ x: number; y: number; time: number; button: number } | null>(null);
  const mouseDraggingRef = useRef(false);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    mouseDownRef.current = { x: e.clientX, y: e.clientY, time: Date.now(), button: e.button };
    mouseDraggingRef.current = false;
    velocityRef.current = { x: 0, y: 0 };

    // Middle button or pan tool = start dragging immediately
    if (e.button === 1 || toolRef.current === "pan") {
      gestureRef.current = {
        type: "pan",
        initialDist: 0,
        initialScale: scaleRef.current,
        lastCenter: { x: e.clientX, y: e.clientY },
        panStartOffset: { ...offsetRef.current },
        panStartTouch: { x: e.clientX, y: e.clientY },
        prevPos: { x: e.clientX, y: e.clientY },
        prevTime: performance.now(),
      };
      isActiveRef.current = true;
      startLoop();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const g = gestureRef.current;
    if (g?.type === "pan") {
      offsetRef.current.x = g.panStartOffset.x + (e.clientX - g.panStartTouch.x);
      offsetRef.current.y = g.panStartOffset.y + (e.clientY - g.panStartTouch.y);
      needsDrawRef.current = true;
      mouseDraggingRef.current = true;
    } else if (mouseDownRef.current) {
      const dist = Math.hypot(e.clientX - mouseDownRef.current.x, e.clientY - mouseDownRef.current.y);
      if (dist > 5) mouseDraggingRef.current = true;
    }
  }, []);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    gestureRef.current = null;
    isActiveRef.current = false;

    const start = mouseDownRef.current;
    mouseDownRef.current = null;

    // If it was a quick click (not drag) and mark/erase tool, toggle cell
    if (start && !mouseDraggingRef.current && start.button === 0 && toolRef.current !== "pan") {
      const dt = Date.now() - start.time;
      if (dt < 300) {
        const cell = screenToCell(e.clientX, e.clientY);
        if (cell) {
          const mc = markedCellsRef.current;
          const currentlyMarked = isMarked(mc, cell.row, cell.col, gridCols);
          const newBf = toolRef.current === "erase"
            ? toggleCell(mc, cell.row, cell.col, gridCols, false)
            : toggleCell(mc, cell.row, cell.col, gridCols, !currentlyMarked);
          if (newBf !== mc) onCellToggle(cell.row, cell.col, newBf);
        }
      }
    }
    mouseDraggingRef.current = false;
  }, [gridCols, screenToCell, onCellToggle]);

  // Mouse wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY > 0 ? 0.9 : 1.1;
    const oldScale = scaleRef.current;
    const newScale = clampScale(oldScale * factor);
    offsetRef.current.x = mx - (mx - offsetRef.current.x) * (newScale / oldScale);
    offsetRef.current.y = my - (my - offsetRef.current.y) * (newScale / oldScale);
    scaleRef.current = newScale;
    needsDrawRef.current = true;
    startLoop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Render ───────────────────────────────────────────────────

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
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
});
