const allowedExtensions = new Set(["png", "jpg", "jpeg", "gif", "webp", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt", "csv", "zip"]);
const defaultMaxUploadMb = Number(import.meta.env.VITE_MAX_UPLOAD_MB ?? 25);

export interface FilePolicyResult {
  ok: boolean;
  reason?: string;
}

export function validateUploadFile(file: Pick<File, "name" | "size">, maxMb = defaultMaxUploadMb): FilePolicyResult {
  const extension = file.name.split(".").at(-1)?.toLowerCase();
  if (!extension || !allowedExtensions.has(extension)) {
    return { ok: false, reason: "This file type is not allowed." };
  }
  if (file.size > maxMb * 1024 * 1024) {
    return { ok: false, reason: `File size exceeds ${maxMb} MB.` };
  }
  return { ok: true };
}
