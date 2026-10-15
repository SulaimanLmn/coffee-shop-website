"use client";

import { useEffect, useState } from "react";

/**
 * Round profile picture with a "Change Picture" button. The real file input is
 * visually hidden but still focusable, so the button shows a focus ring and
 * works from the keyboard. Picking a file previews it immediately.
 */
export function AvatarPicker({
  name,
  currentUrl,
  initial,
  invalid,
  describedBy,
}: {
  name: string;
  currentUrl: string | null;
  initial: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const shown = preview ?? currentUrl;

  return (
    <div className="flex items-center gap-5">
      <div className="h-24 w-24 shrink-0 overflow-hidden rounded-full border border-latte bg-foam">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Profile picture" className="h-full w-full object-cover" />
        ) : (
          <span
            aria-hidden="true"
            className="grid h-full w-full place-items-center font-display text-3xl text-mocha"
          >
            {initial}
          </span>
        )}
      </div>
      <div className="grid gap-1.5">
        <label className="relative inline-flex w-fit cursor-pointer items-center justify-center rounded-full border border-latte bg-white px-5 py-2 text-sm font-semibold text-espresso transition-colors hover:border-caramel has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-caramel-dark">
          Change Picture
          <input
            name={name}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            aria-invalid={invalid || undefined}
            aria-describedby={`avatar-help${describedBy ? ` ${describedBy}` : ""}`}
            onChange={(e) => {
              const file = e.target.files?.[0];
              setPreview(file ? URL.createObjectURL(file) : null);
              setFileName(file?.name ?? "");
            }}
            className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
          />
        </label>
        <p id="avatar-help" className="text-xs text-mocha">
          {fileName
            ? `${fileName} selected. Save changes to apply it.`
            : "PNG, JPEG or WebP, up to 2 MB."}
        </p>
      </div>
    </div>
  );
}
