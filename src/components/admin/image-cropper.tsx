"use client";

import { useEffect, useRef, useState } from "react";

export const CROP_ASPECTS = {
  "4:3": { label: "Landscape 4:3", frameW: 320, frameH: 240, outW: 1200, outH: 900 },
  "1:1": { label: "Square 1:1", frameW: 280, frameH: 280, outW: 1000, outH: 1000 },
} as const;
export type CropAspect = keyof typeof CROP_ASPECTS;

/**
 * Modal crop editor: drag to reposition, slider (or arrow keys) to zoom/move,
 * then "Use this crop" renders the visible frame to a JPEG file. Pure canvas,
 * no dependencies.
 */
export function ImageCropper({
  src,
  fileName,
  onCancel,
  onDone,
}: {
  src: string;
  fileName: string;
  onCancel: () => void;
  onDone: (file: File, aspect: CropAspect) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const drag = useRef<{ x: number; y: number; ox: number; oy: number } | null>(null);
  const [aspect, setAspect] = useState<CropAspect>("4:3");
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [off, setOff] = useState({ x: 0, y: 0 });

  const { frameW: W, frameH: H, outW, outH } = CROP_ASPECTS[aspect];
  const base = natural ? Math.max(W / natural.w, H / natural.h) : 1;
  const scale = base * zoom;
  const dw = natural ? natural.w * scale : 0;
  const dh = natural ? natural.h * scale : 0;

  function clamp(x: number, y: number, s = scale) {
    if (!natural) return { x: 0, y: 0 };
    const mx = Math.max(0, (natural.w * s - W) / 2);
    const my = Math.max(0, (natural.h * s - H) / 2);
    return { x: Math.min(mx, Math.max(-mx, x)), y: Math.min(my, Math.max(-my, y)) };
  }

  useEffect(() => {
    const d = dialogRef.current;
    if (d && !d.open) d.showModal();
  }, []);

  function changeAspect(next: CropAspect) {
    setAspect(next);
    setZoom(1);
    setOff({ x: 0, y: 0 });
  }

  function changeZoom(z: number) {
    if (!natural) return;
    setZoom(z);
    setOff((o) => clamp(o.x, o.y, base * z));
  }

  function apply() {
    const img = imgRef.current;
    if (!img || !natural) return;
    const sw = W / scale;
    const sh = H / scale;
    const sx = natural.w / 2 - (W / 2 + off.x) / scale;
    const sy = natural.h / 2 - (H / 2 + off.y) / scale;
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, outW, outH);
    ctx.drawImage(img, sx, sy, sw, sh, 0, 0, outW, outH);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const stem = fileName.replace(/\.[^.]+$/, "") || "image";
        onDone(new File([blob], `${stem}-cropped.jpg`, { type: "image/jpeg" }), aspect);
      },
      "image/jpeg",
      0.9,
    );
  }

  const step = 10;
  return (
    <dialog
      ref={dialogRef}
      onCancel={(e) => {
        e.preventDefault();
        onCancel();
      }}
      aria-labelledby="crop-title"
      className="m-auto w-[min(26rem,calc(100vw-2rem))] rounded-2xl border border-latte bg-white p-5 text-espresso backdrop:bg-espresso/50"
    >
      <h2 id="crop-title" className="font-display text-lg font-semibold">
        Crop image
      </h2>
      <p className="mt-1 text-xs text-mocha">
        Drag the image to reposition it, or focus it and use the arrow keys. Use the slider to zoom.
      </p>

      <div className="mt-3 flex gap-2" role="group" aria-label="Crop shape">
        {(Object.keys(CROP_ASPECTS) as CropAspect[]).map((k) => (
          <button
            key={k}
            type="button"
            aria-pressed={aspect === k}
            onClick={() => changeAspect(k)}
            className={`rounded-full border px-3 py-1 text-sm ${
              aspect === k
                ? "border-caramel-dark bg-caramel-dark text-white"
                : "border-latte bg-white hover:border-caramel"
            }`}
          >
            {CROP_ASPECTS[k].label}
          </button>
        ))}
      </div>

      <div className="mt-3 grid place-items-center">
        <div
          tabIndex={0}
          role="application"
          aria-label="Crop area"
          style={{ width: W, height: H, touchAction: "none" }}
          className="relative max-w-full cursor-grab overflow-hidden rounded-lg border border-latte bg-foam active:cursor-grabbing"
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            drag.current = { x: e.clientX, y: e.clientY, ox: off.x, oy: off.y };
          }}
          onPointerMove={(e) => {
            const d = drag.current;
            if (!d) return;
            setOff(clamp(d.ox + e.clientX - d.x, d.oy + e.clientY - d.y));
          }}
          onPointerUp={() => (drag.current = null)}
          onPointerCancel={() => (drag.current = null)}
          onKeyDown={(e) => {
            const move: Record<string, [number, number]> = {
              ArrowLeft: [step, 0],
              ArrowRight: [-step, 0],
              ArrowUp: [0, step],
              ArrowDown: [0, -step],
            };
            const m = move[e.key];
            if (!m) return;
            e.preventDefault();
            setOff((o) => clamp(o.x + m[0], o.y + m[1]));
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            ref={imgRef}
            src={src}
            alt=""
            draggable={false}
            onLoad={(e) =>
              setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
            }
            style={{
              position: "absolute",
              maxWidth: "none",
              width: dw || undefined,
              height: dh || undefined,
              left: W / 2 + off.x - dw / 2,
              top: H / 2 + off.y - dh / 2,
              userSelect: "none",
              visibility: natural ? "visible" : "hidden",
            }}
          />
        </div>
      </div>

      <label className="mt-4 grid gap-1 text-sm">
        <span>Zoom</span>
        <input
          type="range"
          min={1}
          max={4}
          step={0.01}
          value={zoom}
          onChange={(e) => changeZoom(Number(e.target.value))}
        />
      </label>

      <div className="mt-5 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-full border border-latte px-5 py-2 text-sm font-semibold hover:border-caramel"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={apply}
          disabled={!natural}
          className="rounded-full bg-caramel-dark px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          Use this crop
        </button>
      </div>
    </dialog>
  );
}
