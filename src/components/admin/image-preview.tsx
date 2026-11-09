"use client";

import { useEffect, useRef, useState } from "react";
import { inputClass } from "@/components/form-kit";
import { CROP_ASPECTS, ImageCropper, type CropAspect } from "./image-cropper";

/**
 * Product image fields: a URL input, a file upload (which takes priority on the
 * server) and a live preview of whichever the admin chose last. A picked file
 * opens a crop dialog; the cropped result replaces the file in the input, so
 * the server action receives the cropped image.
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
  const [aspect, setAspect] = useState<CropAspect>("4:3");
  // Original pick being cropped (kept so "Adjust crop" can start from the full image).
  const [original, setOriginal] = useState<{ file: File; url: string } | null>(null);
  const [cropping, setCropping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (fileUrl) URL.revokeObjectURL(fileUrl);
    };
  }, [fileUrl]);

  useEffect(() => {
    return () => {
      if (original) URL.revokeObjectURL(original.url);
    };
  }, [original]);

  function clearFile() {
    if (inputRef.current) inputRef.current.value = "";
    setFileUrl(null);
    setOriginal(null);
    setCropping(false);
  }

  const shown = fileUrl ?? (/^https?:\/\//.test(url) ? url : "");
  const { frameW, frameH } = CROP_ASPECTS[aspect];

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium text-espresso">Image</legend>
      <div
        style={{ aspectRatio: fileUrl ? frameW / frameH : undefined }}
        className={`grid place-items-center overflow-hidden rounded-xl border border-dashed border-latte bg-foam ${
          fileUrl ? "w-full max-w-xs" : "h-40"
        }`}
      >
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
            clearFile();
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
          ref={inputRef}
          name="image"
          type="file"
          accept="image/png,image/jpeg,image/webp"
          aria-describedby="image-help"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (!file) return clearFile();
            setFileUrl(null);
            setOriginal({ file, url: URL.createObjectURL(file) });
            setCropping(true);
          }}
          className="text-sm text-mocha file:mr-3 file:rounded-full file:border-0 file:bg-foam file:px-4 file:py-2 file:text-sm file:font-medium file:text-espresso hover:file:bg-latte"
        />
        <span id="image-help" className="text-xs text-mocha">
          PNG, JPEG or WebP, up to 2 MB. You can crop it after choosing. An uploaded file takes
          priority over the URL.
        </span>
      </label>
      {original && !cropping && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setCropping(true)}
            className="rounded-full border border-latte px-4 py-1.5 text-sm font-medium text-espresso hover:border-caramel"
          >
            Adjust crop
          </button>
          <button
            type="button"
            onClick={clearFile}
            className="rounded-full border border-latte px-4 py-1.5 text-sm font-medium text-espresso hover:border-caramel"
          >
            Remove upload
          </button>
        </div>
      )}
      {original && cropping && (
        <ImageCropper
          src={original.url}
          fileName={original.file.name}
          onCancel={() => {
            setCropping(false);
            // Cancelling before any crop was applied discards the pick.
            if (!fileUrl) clearFile();
          }}
          onDone={(cropped, a) => {
            const dt = new DataTransfer();
            dt.items.add(cropped);
            if (inputRef.current) inputRef.current.files = dt.files;
            setFileUrl(URL.createObjectURL(cropped));
            setAspect(a);
            setCropping(false);
          }}
        />
      )}
    </fieldset>
  );
}
