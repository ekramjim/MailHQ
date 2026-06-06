"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, Download, FileText, FileSpreadsheet } from "lucide-react";
import { cn } from "@/lib/utils";

type ImportRow = { name: string; email: string; institution?: string; notes?: string };

type Props = {
  onImport: (rows: ImportRow[]) => Promise<number>;
  onSuccess: (count: number) => void;
  onCancel: () => void;
};

const HEADERS = ["name", "email", "institution", "notes"];

const SAMPLE_ROWS = [
  ["Jane Smith", "jane@mit.edu", "professor", "MIT", "Interested in ML research"],
  ["John Doe", "john@google.com", "industry", "Google", ""],
  ["Sarah Lee", "sarah@stanford.edu", "researcher", "Stanford", "Works on NLP"],
];

function downloadCSVTemplate() {
  const rows = [HEADERS, ...SAMPLE_ROWS];
  const csv = rows.map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mailhq-contacts-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadXLSXTemplate() {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet([HEADERS, ...SAMPLE_ROWS]);
  ws["!cols"] = HEADERS.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Contacts");
  XLSX.writeFile(wb, "mailhq-contacts-template.xlsx");
}

function parseRows(raw: Array<Record<string, string>>) {
  return raw
    .filter((r) => r.name && r.email)
    .map((r) => ({
      name: r.name?.trim() ?? "",
      email: r.email?.trim().toLowerCase() ?? "",
      institution: (r.institution ?? r.organization ?? "").trim(),
      notes: r.notes?.trim() ?? "",
    }));
}

function parseCSV(text: string): Array<Record<string, string>> {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase().replace(/"/g, ""));
  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim().replace(/"/g, ""));
    return Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]));
  });
}

async function parseXLSX(buffer: ArrayBuffer): Promise<Array<Record<string, string>>> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buffer, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, { defval: "" });
  return rows.map((r) =>
    Object.fromEntries(Object.entries(r).map(([k, v]) => [k.trim().toLowerCase(), String(v).trim()]))
  );
}

export function CSVImport({ onImport, onSuccess, onCancel }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<Array<Record<string, string>>>([]);
  const [allRows, setAllRows] = useState<Array<Record<string, string>>>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setError(null);

    const isXLSX = file.name.endsWith(".xlsx") || file.name.endsWith(".xls");

    if (isXLSX) {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const buffer = ev.target?.result as ArrayBuffer;
        try {
          const rows = await parseXLSX(buffer);
          if (rows.length === 0) {
            setError("No valid rows found. Make sure the first sheet has a header row.");
            return;
          }
          setAllRows(rows);
          setPreview(rows.slice(0, 5));
        } catch {
          setError("Failed to parse Excel file.");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const rows = parseCSV(text);
        if (rows.length === 0) {
          setError("No valid rows found. Ensure your CSV has a header row.");
          return;
        }
        setAllRows(rows);
        setPreview(rows.slice(0, 5));
      };
      reader.readAsText(file);
    }
  }

  function handleImport() {
    const parsed = parseRows(allRows);
    if (parsed.length === 0) {
      setError("No valid contacts found. Each row needs at least a name and email.");
      return;
    }
    startTransition(async () => {
      try {
        const count = await onImport(parsed);
        onSuccess(count);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Import failed");
      }
    });
  }

  const previewHeaders = preview.length > 0 ? Object.keys(preview[0]) : [];

  return (
    <div className="flex flex-col gap-5">
      {/* Templates */}
      <div className="flex flex-col gap-2">
        <p className="text-sm font-medium">Download a template first</p>
        <div className="flex gap-2">
          <button
            type="button"
            className="btn-secondary gap-2 flex-1 text-xs"
            onClick={downloadCSVTemplate}
          >
            <FileText className="h-3.5 w-3.5 text-orange-500" />
            CSV template
            <Download className="h-3 w-3 ml-auto text-muted-foreground" />
          </button>
          <button
            type="button"
            className="btn-secondary gap-2 flex-1 text-xs"
            onClick={downloadXLSXTemplate}
          >
            <FileSpreadsheet className="h-3.5 w-3.5 text-green-500" />
            Excel template
            <Download className="h-3 w-3 ml-auto text-muted-foreground" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Columns: <code className="font-mono bg-muted px-1 py-0.5 rounded">name, email, institution, notes</code>
        </p>
      </div>

      <div className="border-t border-border" />

      {/* Drop zone */}
      <div
        className={cn(
          "border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-3 cursor-pointer transition-colors",
          fileName ? "border-orange-500 bg-orange-50/30 dark:bg-orange-500/5" : "border-border hover:border-orange-500"
        )}
        onClick={() => inputRef.current?.click()}
      >
        <Upload className={cn("h-6 w-6", fileName ? "text-orange-500" : "text-muted-foreground")} />
        <div className="text-center">
          <p className="text-sm font-medium">
            {fileName ? fileName : "Click to select a file"}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">CSV or Excel (.xlsx, .xls)</p>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {/* Preview table */}
      {preview.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <p className="text-xs text-muted-foreground">
            Preview — {allRows.length} row{allRows.length !== 1 ? "s" : ""} detected
          </p>
          <div className="overflow-x-auto rounded-lg border border-border text-xs">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {previewHeaders.map((h) => (
                    <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground capitalize">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-b border-border last:border-0">
                    {previewHeaders.map((h, j) => (
                      <td key={j} className="px-3 py-2 truncate max-w-[130px]">{row[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {allRows.length > 5 && (
              <p className="px-3 py-2 text-muted-foreground">…and {allRows.length - 5} more rows</p>
            )}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex justify-end gap-2">
        <button className="btn-secondary" onClick={onCancel} disabled={isPending}>Cancel</button>
        <button
          className="btn-primary"
          onClick={handleImport}
          disabled={isPending || allRows.length === 0}
        >
          {isPending ? "Importing…" : `Import ${allRows.length > 0 ? allRows.length : ""} contacts`}
        </button>
      </div>
    </div>
  );
}
