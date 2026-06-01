"use client";

import { useState, useTransition, useRef } from "react";
import { Upload, Trash2, Download, FileText, FileImage, File, FileSpreadsheet } from "lucide-react";
import { uploadAttachment, deleteAttachment, type Attachment } from "@/app/actions/attachments";
import { cn } from "@/lib/utils";

function FileIcon({ mime }: { mime: string | null }) {
  if (!mime) return <File className="h-5 w-5 text-muted-foreground" />;
  if (mime.startsWith("image/")) return <FileImage className="h-5 w-5 text-blue-500" />;
  if (mime === "application/pdf") return <FileText className="h-5 w-5 text-red-500" />;
  if (mime.includes("spreadsheet") || mime.includes("excel") || mime.includes("csv"))
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  return <FileText className="h-5 w-5 text-muted-foreground" />;
}

function formatSize(bytes: number | null) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function AttachmentsList({ initialAttachments }: { initialAttachments: Attachment[] }) {
  const [attachments, setAttachments] = useState(initialAttachments);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [isUploading, setIsUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function handleUpload(files: FileList | null) {
    if (!files || files.length === 0) return;
    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        await uploadAttachment(fd);
      }
      showToast(`${files.length} file${files.length > 1 ? "s" : ""} uploaded`);
      window.location.reload();
    } catch (err: unknown) {
      showToast(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    handleUpload(e.dataTransfer.files);
  }

  function handleDelete(id: string, fileUrl: string) {
    startTransition(async () => {
      try {
        await deleteAttachment(id, fileUrl);
        setAttachments((prev) => prev.filter((a) => a.id !== id));
        setDeleteId(null);
        showToast("Attachment deleted");
      } catch (err: unknown) {
        showToast(err instanceof Error ? err.message : "Delete failed");
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-medium font-heading">Attachments</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{attachments.length} file{attachments.length !== 1 ? "s" : ""}</p>
        </div>
        <button className="btn-primary gap-2" onClick={() => inputRef.current?.click()} disabled={isUploading}>
          <Upload className="h-4 w-4" />
          {isUploading ? "Uploading…" : "Upload file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleUpload(e.target.files)}
        />
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-2 cursor-pointer transition-colors",
          isDragging ? "border-orange-500 bg-orange-50/30 dark:bg-orange-500/5" : "border-border hover:border-orange-500"
        )}
      >
        <Upload className={cn("h-6 w-6", isDragging ? "text-orange-500" : "text-muted-foreground")} />
        <p className="text-sm text-muted-foreground">
          Drag & drop files here, or <span className="text-orange-500">browse</span>
        </p>
        <p className="text-xs text-muted-foreground">PDF, images, Word, Excel — any file type</p>
      </div>

      {/* List */}
      {attachments.length > 0 && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">File</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Size</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Uploaded</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attachments.map((a) => (
                <tr key={a.id} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileIcon mime={a.mime_type} />
                      <span className="font-medium truncate max-w-[260px]">{a.file_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatSize(a.file_size)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(a.created_at)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <a
                        href={a.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-ghost p-2 h-8 w-8"
                        title="Download"
                      >
                        <Download className="h-3.5 w-3.5" />
                      </a>
                      <button
                        className="btn-ghost p-2 h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => setDeleteId(a.id)}
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setDeleteId(null)} />
          <div className="relative bg-card border border-border rounded-2xl shadow-lg w-full max-w-sm p-6 flex flex-col gap-4">
            <h2 className="text-lg font-medium font-heading">Delete attachment?</h2>
            <p className="text-sm text-muted-foreground">This will remove the file from storage. Campaigns using it will lose the attachment.</p>
            <div className="flex justify-end gap-2">
              <button className="btn-secondary" onClick={() => setDeleteId(null)} disabled={isPending}>Cancel</button>
              <button
                className="btn-destructive"
                onClick={() => {
                  const a = attachments.find((x) => x.id === deleteId);
                  if (a) handleDelete(a.id, a.file_url);
                }}
                disabled={isPending}
              >
                {isPending ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-foreground text-background text-sm font-medium px-4 py-2.5 rounded-lg shadow-lg animate-in fade-in slide-in-from-bottom-2">
          {toast}
        </div>
      )}
    </div>
  );
}
