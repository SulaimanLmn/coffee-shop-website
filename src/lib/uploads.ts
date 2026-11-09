import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { prisma } from "@/lib/prisma";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
/** Where images were written before uploads moved into the database (local installs only). */
const LEGACY_UPLOAD_DIR = path.join(process.cwd(), "uploads");
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

function mimeFor(ext: string): string {
  return ext === "jpg" ? "image/jpeg" : `image/${ext}`;
}

/** Save an uploaded image in the database. Returns a URL like /api/uploads/<hex>.png */
export async function saveImage(file: File): Promise<UploadResult> {
  if (file.size === 0) return { ok: false, error: "The selected file is empty." };
  if (file.size > MAX_UPLOAD_BYTES) return { ok: false, error: "Image must be 2 MB or smaller." };
  const buf = Buffer.from(await file.arrayBuffer());
  const type = sniffImageType(buf);
  if (!type) return { ok: false, error: "Only PNG, JPEG or WebP images are allowed." };
  const name = `${randomBytes(16).toString("hex")}.${type}`;
  await prisma.upload.create({ data: { name, mimeType: mimeFor(type), data: buf } });
  return { ok: true, url: `/api/uploads/${name}` };
}

export async function readUpload(
  name: string
): Promise<{ data: Uint8Array; type: string } | null> {
  if (!UPLOAD_NAME_RE.test(name)) return null;
  const row = await prisma.upload.findUnique({ where: { name } });
  if (row) return { data: row.data, type: row.mimeType };
  // Images uploaded before they were stored in the database.
  try {
    const data = await readFile(path.join(LEGACY_UPLOAD_DIR, name));
    return { data, type: mimeFor(name.split(".")[1]) };
  } catch {
    return null;
  }
}
