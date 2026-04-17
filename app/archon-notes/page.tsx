"use client";

import React, { useState } from "react";
import { PdfUpload } from "@/components/archon-notes/pdf-upload";

interface UploadResponse {
  success: boolean;
  fileName: string;
  textLength: number;
  pageCount: number;
  text: string;
}

export default function ArchonNotesPage() {
  const [uploadedData, setUploadedData] = useState<UploadResponse | null>(null);

  const handleUploadSuccess = (data: UploadResponse) => {
    setUploadedData(data);
    console.log("Upload successful:", data);
  };

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Archon Notes Test</h1>
          <p className="text-zinc-400">Test PDF upload and processing</p>
        </div>

        <div className="bg-zinc-900/50 border border-white/10 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Upload PDF</h2>
          <PdfUpload onUploadSuccess={handleUploadSuccess} />
        </div>

        {uploadedData && (
          <div className="mt-6 bg-zinc-900/50 border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Upload Details</h2>
            <div className="space-y-2 text-sm text-zinc-300">
              <p><span className="text-zinc-400">File Name:</span> {uploadedData.fileName}</p>
              <p><span className="text-zinc-400">Pages:</span> {uploadedData.pageCount}</p>
              <p><span className="text-zinc-400">Characters:</span> {uploadedData.textLength.toLocaleString()}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
