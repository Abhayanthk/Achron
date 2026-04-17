"use client";

import React, { useCallback, useRef, useState } from "react";
import { Upload, Loader2, FileText, AlertCircle, CheckCircle2 } from "lucide-react";
import axios from "axios";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadResponse {
  success: boolean;
  fileName: string;
  textLength: number;
  pageCount: number;
  text: string;
}

interface PdfUploadProps {
  onUploadSuccess?: (data: UploadResponse) => void;
}

export function PdfUpload({ onUploadSuccess }: PdfUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePdfUpload = useCallback(async (file: File) => {
    if (!file.type.includes("pdf") && !file.name.endsWith(".pdf")) {
      setError("Please select a PDF file");
      toast.error("Only PDF files are supported");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axios.post<UploadResponse>(
        "/api/archon-notes/upload",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setUploadedFile(response.data);
      toast.success(`Extracted ${response.data.pageCount} pages from PDF`);
      onUploadSuccess?.(response.data);
    } catch (err) {
      const errorMessage =
        err instanceof axios.AxiosError
          ? err.response?.data || err.message
          : "Failed to upload PDF";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [onUploadSuccess]);

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(true);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handlePdfUpload(files[0]);
      }
    },
    [handlePdfUpload]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.currentTarget.files;
      if (files && files.length > 0) {
        handlePdfUpload(files[0]);
      }
    },
    [handlePdfUpload]
  );

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleReset = useCallback(() => {
    setUploadedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  return (
    <div className="flex flex-col gap-3 w-full">
      {/* Upload Area */}
      {!uploadedFile ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "relative rounded-lg border-2 border-dashed transition-all cursor-pointer",
            isDragging
              ? "border-indigo-500 bg-indigo-500/5"
              : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04]"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={handleFileSelect}
            className="hidden"
          />

          <button
            onClick={handleClick}
            disabled={isLoading}
            className="w-full px-4 py-6 flex flex-col items-center gap-2 text-center disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-6 w-6 text-zinc-400 animate-spin" />
                <p className="text-xs text-zinc-500">Parsing PDF...</p>
              </>
            ) : (
              <>
                <Upload className="h-6 w-6 text-zinc-500" />
                <div>
                  <p className="text-xs text-zinc-300 font-medium">
                    Drop PDF or click to upload
                  </p>
                  <p className="text-[11px] text-zinc-600 mt-0.5">
                    Max 50MB
                  </p>
                </div>
              </>
            )}
          </button>
        </div>
      ) : (
        /* Success State */
        <div className="flex flex-col gap-2">
          <div className="rounded-lg bg-emerald-500/5 border border-emerald-500/20 p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-emerald-300">
                  {uploadedFile.fileName}
                </p>
                <p className="text-[11px] text-emerald-400/70 mt-0.5">
                  {uploadedFile.pageCount} pages • {(uploadedFile.textLength / 1000).toFixed(1)}K characters
                </p>
              </div>
              <button
                onClick={handleReset}
                className="text-[11px] text-emerald-400/50 hover:text-emerald-400 transition-colors shrink-0 font-medium"
              >
                Clear
              </button>
            </div>
          </div>

          {/* Text Preview */}
          <div className="rounded-lg bg-white/[0.02] border border-white/10 overflow-hidden flex flex-col">
            <div className="px-3 py-2 border-b border-white/10">
              <p className="text-[11px] font-medium text-zinc-400">Extracted Text</p>
            </div>
            <div className="flex-1 max-h-[150px] overflow-y-auto p-3">
              <p className="text-[11px] text-zinc-400 leading-relaxed whitespace-pre-wrap break-words">
                {uploadedFile.text.slice(0, 500)}
                {uploadedFile.text.length > 500 && "..."}
              </p>
            </div>
          </div>

          {/* Placeholder for Graph Nodes */}
          <div className="rounded-lg bg-zinc-900/50 border border-white/[0.06] p-3 text-center">
            <p className="text-[11px] text-zinc-600">
              📊 Graph nodes will appear here
            </p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-500/20">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
