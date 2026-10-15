"use client";

import { useEffect, useState } from "react";
import { inputClass } from "@/components/form-kit";

/**
 * Product image fields: a URL input, a file upload (which takes priority on the
 * server) and a live preview of whichever the admin chose last.
 */
export function ImagePreview({
  initialUrl = "",
  invalid,
  describedBy,
}: {
  initialUrl?: string;
  invalid?: boolean;
  describedBy?: string;
}) {
  const [url, setUrl] = useState(initialUrl);
  const [fileUrl, setFileUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  const shown = fileUrl ?? (/^https?:\/\//.test(url) ? url : "");

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium text-espresso">Image</legend>
      <div className="grid h-40 place-items-center overflow-hidden rounded-xl border border-dashed border-latte bg-foam">
        {shown ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={shown} alt="Product preview" className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm text-mocha">No image yet</span>
        )}
      </div>
      <label className="grid gap-1.5">
        <span className="text-sm text-espresso">Image URL</span>
        <input
          name="imageUrl"
          type="text"
          inputMode="url"
          maxLength={500}
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setFileUrl(null);
          }}
          placeholder="https://…"
          aria-invalid={invalid || undefined}
          aria-describedby={describedBy}
          className={inputClass}
        />
      </label>
      <label className="grid gap-1.5">
        <span className="text-sm text-espresso">Or upload a file</span>
        <input
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-describedby="image-help"
          onChange={(e) => {
            const file = e.target.files?.[0];
            setFileUrl(file ? URL.createObjectURL(file) : null);
          }}
          className="text-sm text-mocha file:mr-3 file:rounded-full file:border-0 file:bg-foam file:px-4 file:py-2 file:text-sm file:font-medium file:text-espresso hover:file:bg-latte"
        />
        <span id="image-help" className="text-xs text-mocha">
          PNG, JPEG or WebP, up to 2 MB. An uploaded file takes priority over the URL.
        </span>
      </label>
    </fieldset>
  );
}
