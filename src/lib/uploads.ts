import { randomBytes } from "node:crypto";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
export const UPLOAD_NAME_RE = /^[a-f0-9]{32}\.(png|jpg|webp)$/;

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

/** Detect the real image type from magic bytes (never trust the client MIME type). */
export function sniffImageType(buf: Buffer): "png" | "jpg" | "webp" | null {
  if (
    buf.length >= 8 &&
    buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  ) {
    return "png";
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "jpg";
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString("ascii") === "RIFF" &&
    buf.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp";
  }
  return null;
}

/** Save an uploaded image. Returns a local URL like /api/uploads/<hex>.png */
export async function saveImage(file: File): Promise<UploadResult> {
  if (file.size === 0) return { ok: false, error: "The selected file is empty." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Image must be 2 MB or smaller." };
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniffImageType(buf);
  if (!type) return { ok: false, error: "Only PNG, JPEG or WebP images are allowed." };
  await mkdir(UPLOAD_DIR, { recursive: true });
  const name = `${randomBytes(16).toString("hex")}.${type}`;
  await writeFile(path.join(UPLOAD_DIR, name), buf);
  return { ok: true, url: `/api/uploads/${name}` };
}

export async function readUpload(
  name: string
): Promise<{ data: Buffer; type: string } | null> {
  if (!UPLOAD_NAME_RE.test(name)) return null;
  try {
    const data = await readFile(path.join(UPLOAD_DIR, name));
    const ext = name.split(".")[1];
    return { data, type: ext === "jpg" ? "image/jpeg" : `image/${ext}` };
  } catch {
    return null;
  }
}
