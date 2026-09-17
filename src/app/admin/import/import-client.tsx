"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { suggestMapping } from "@/lib/imports/mapping";
import { IMPORT_TARGET_FIELDS, ImportTargetField, ImportValidationResult } from "@/lib/imports/types";

type Step = "upload" | "mapping" | "preview" | "done";

export function ImportClient() {
  const [step, setStep] = useState<Step>("upload");
  const [filename, setFilename] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<Array<Record<string, string>>>([]);
  const [mapping, setMapping] = useState<Partial<Record<ImportTargetField, string>>>({});
  const [mode, setMode] = useState<"add" | "update">("add");
  const [validation, setValidation] = useState<ImportValidationResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [commitResult, setCommitResult] = useState<{ successCount: number; errorCount: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function onFileChange(file: File) {
    setError(null);
    setFilename(file.name);
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: "array" });
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const json = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: "", raw: false });
    if (json.length === 0) {
      setError("No rows found in file.");
      return;
    }
    const hdrs = Object.keys(json[0]);
    setHeaders(hdrs);
    setRows(json);
    setMapping(suggestMapping(hdrs));
    setStep("mapping");
  }

  async function runValidation() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/import/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, mapping, mode }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Validation failed.");
        return;
      }
      setValidation(json.result);
      setStep("preview");
    } finally {
      setBusy(false);
    }
  }

  async function commit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/import/commit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows, mapping, mode, filename }),
      });
      const json = await res.json();
      if (!json.ok) {
        setError(json.error ?? "Import failed.");
        return;
      }
      setCommitResult({ successCount: json.successCount, errorCount: json.errorCount });
      setStep("done");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-xl font-semibold">Import Participants</h1>

      {step === "upload" && (
        <Card>
          <CardBody className="space-y-4">
            <p className="text-sm text-muted">
              Upload a CSV or XLSX file with participant data. You&apos;ll map columns
              and preview validation before anything is committed.
            </p>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => e.target.files?.[0] && onFileChange(e.target.files[0])}
              className="block w-full text-sm text-muted file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-lg file:border-0 file:bg-gold file:px-4 file:py-2.5 file:text-sm file:font-medium file:text-gold-text"
            />
            {error && <p className="text-sm text-error">{error}</p>}
          </CardBody>
        </Card>
      )}

      {step === "mapping" && (
        <Card>
          <CardHeader>
            <CardTitle>Map Columns ({rows.length} rows found)</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              {IMPORT_TARGET_FIELDS.map((field) => (
                <div key={field} className="space-y-1">
                  <label className="text-xs text-muted">
                    {field}
                    {["name", "email", "team_id"].includes(field) && (
                      <span className="text-error"> *</span>
                    )}
                  </label>
                  <select
                    value={mapping[field] ?? ""}
                    onChange={(e) =>
                      setMapping((m) => ({ ...m, [field]: e.target.value || undefined }))
                    }
                    className="h-11 w-full rounded-lg border border-border bg-surface px-3 text-sm"
                  >
                    <option value="">— Not mapped —</option>
                    {headers.map((h) => (
                      <option key={h} value={h}>
                        {h}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
              <label className="flex items-center gap-2 py-1 text-sm">
                <input
                  type="radio"
                  className="h-5 w-5"
                  checked={mode === "add"}
                  onChange={() => setMode("add")}
                />
                Add only (skip existing emails)
              </label>
              <label className="flex items-center gap-2 py-1 text-sm">
                <input
                  type="radio"
                  className="h-5 w-5"
                  checked={mode === "update"}
                  onChange={() => setMode("update")}
                />
                Update matching email
              </label>
            </div>

            {error && <p className="text-sm text-error">{error}</p>}
            <Button onClick={runValidation} disabled={busy} className="w-full sm:w-auto">
              {busy ? "Validating…" : "Validate & Preview"}
            </Button>
          </CardBody>
        </Card>
      )}

      {step === "preview" && validation && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge tone="success">Valid rows: {validation.summary.valid}</Badge>
              <Badge tone="warning">Warnings: {validation.summary.warnings}</Badge>
              <Badge tone="error">Errors: {validation.summary.errors}</Badge>
            </div>

            {validation.errors.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-error/30 bg-error-bg p-3 text-sm">
                {validation.errors.slice(0, 50).map((e, i) => (
                  <p key={i}>
                    Row {e.row || "—"}: {e.message}
                  </p>
                ))}
              </div>
            )}
            {validation.warnings.length > 0 && (
              <div className="max-h-48 overflow-y-auto rounded-lg border border-warning/30 bg-warning-bg p-3 text-sm">
                {validation.warnings.slice(0, 50).map((w, i) => (
                  <p key={i}>
                    Row {w.row || "—"}: {w.message}
                  </p>
                ))}
              </div>
            )}

            {error && <p className="text-sm text-error">{error}</p>}
            <div className="flex flex-col-reverse sm:flex-row gap-2">
              <Button variant="ghost" onClick={() => setStep("mapping")} className="w-full sm:w-auto">
                Back
              </Button>
              <Button
                onClick={commit}
                disabled={busy || validation.summary.valid === 0}
                className="w-full sm:w-auto"
              >
                {busy ? "Importing…" : `Import ${validation.summary.valid} Rows`}
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {step === "done" && commitResult && (
        <Card>
          <CardBody className="space-y-3">
            <Badge tone="success">Import complete</Badge>
            <p className="text-sm">
              {commitResult.successCount} participants imported successfully.
              {commitResult.errorCount > 0 && ` ${commitResult.errorCount} rows failed.`}
            </p>
            <Button
              className="w-full sm:w-auto"
              onClick={() => {
                setStep("upload");
                setRows([]);
                setHeaders([]);
                setValidation(null);
                setCommitResult(null);
              }}
            >
              Import Another File
            </Button>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
