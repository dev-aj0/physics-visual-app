import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { randomUUID } from "node:crypto";

const UPLOADS_DIR = join(process.cwd(), "public", "uploads");
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

const MIME_TO_EXT = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

export async function POST(request) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let file;
    let mimeType = "image/jpeg";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      file = formData.get("file") || formData.get("image");
      if (!file || typeof file === "string") {
        return Response.json(
          { error: "No file provided in form data. Use 'file' or 'image' field." },
          { status: 400 }
        );
      }
      mimeType = file.type || mimeType;
    } else if (contentType.includes("application/json")) {
      const body = await request.json();
      const base64 = body.base64 || body.image;
      if (!base64) {
        return Response.json(
          { error: "No base64 or image data provided" },
          { status: 400 }
        );
      }
      const matches = base64.match(/^data:([^;]+);base64,(.+)$/);
      const base64Data = matches ? matches[2] : base64;
      mimeType = matches ? matches[1] : mimeType;
      const buffer = Buffer.from(base64Data, "base64");
      if (buffer.length > MAX_SIZE) {
        return Response.json(
          { error: "File too large. Max 10MB." },
          { status: 413 }
        );
      }
      file = { arrayBuffer: () => buffer };
    } else {
      return Response.json(
        { error: "Content-Type must be multipart/form-data or application/json" },
        { status: 400 }
      );
    }

    const ext = MIME_TO_EXT[mimeType] || ".jpg";
    const filename = `${randomUUID()}${ext}`;

    await mkdir(UPLOADS_DIR, { recursive: true });

    let buffer;
    if (file.arrayBuffer) {
      buffer = Buffer.from(await file.arrayBuffer());
    } else if (file.buffer) {
      buffer = file.buffer;
    } else {
      return Response.json({ error: "Invalid file input" }, { status: 400 });
    }

    if (buffer.length > MAX_SIZE) {
      return Response.json(
        { error: "File too large. Max 10MB." },
        { status: 413 }
      );
    }

    const filePath = join(UPLOADS_DIR, filename);
    await writeFile(filePath, buffer);

    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const fileUrl = `${baseUrl}/uploads/${filename}`;

    return Response.json({
      url: fileUrl,
      mimeType: mimeType,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return Response.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
