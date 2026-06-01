"use client";

import { useRef, useState, useTransition } from "react";
import { Upload } from "lucide-react";
import { bulkImportContacts } from "@/app/actions/contacts";

type Props = {
  onSuccess: (count: number) => void;
  onCancel: () => void;
};

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

export function CSVImport({ onSuccess, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Array<Record<string, string>>>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setError("No valid rows found. Ensure your CSV has a header row.");
      } else {
        setError(null);
        setPreview(rows.slice(0, 5));
      }
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (!inputRef.current?.files?.[0]) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      const rows = parseCSV(text);
      startTransition(async () => {
        try {
          const count = await bulkImportContacts(
            rows.map((r) => ({
              name: r.name ?? r.full_name ?? "",
              email: r.email ?? "",
              category: r.category ?? "",
              institution: r.institution ?? r.organization ?? "",
              notes: r.notes ?? "",
            }))
          );
          onSuccess(count);
        } catch (err: unknown) {
          setError(err instanceof Error ? err.message : "Import failed");
        }
      });
    };
    reader.readAsText(inputRef.current.files[0]);
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        CSV must have a header row. Recognised columns:{" "}
        <code className="font-mono text-xs bg-muted px-1 py-0.5 rounded">name, email, category, institution, notes</code>
      </p>

      <div
        className="border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer hover:border-cyan-500 transition-colors"
        onClick={() => inputRef.current?.click()}
      >
        <Upload className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          {fileName ? fileName : "Click to select a CSV file"}
        </p>
        <input ref={inputRef} type="file" accept=".csv" className="hidden" onChange={handleFile} />
      </div>

      {preview.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-border text-sm">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted">
                {Object.keys(preview[0]).map((h) => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {preview.map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className="px-3 py-2 truncate max-w-[150px]">{val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-3 py-2 text-xs text-muted-foreground">Showing first {preview.length} rows</p>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onCancel} disabled={isPending}>Cancel</button>
        <button
          className="btn-primary"
          onClick={handleImport}
          disabled={isPending || preview.length === 0}
        >
          {isPending ? "Importing…" : "Import contacts"}
        </button>
      </div>
    </div>
  );
}
