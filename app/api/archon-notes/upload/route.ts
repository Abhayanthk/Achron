import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { PDFParse } from "pdf-parse";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return new NextResponse("No file provided", { status: 400 });
    }

    // Validate file is a PDF
    if (!file.type.includes("pdf") && !file.name.endsWith(".pdf")) {
      return new NextResponse("File must be a PDF", { status: 400 });
    }

    // Convert File to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse PDF and extract text
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    const text = result.text || "";

    if (!text.trim()) {
      return new NextResponse("No text could be extracted from PDF", { status: 400 });
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      textLength: text.length,
      pageCount: result.total,
      text: text,
    });
  } catch (error) {
    console.error("[ARCHON_NOTES_UPLOAD]", error);
    return new NextResponse(
      error instanceof Error ? error.message : "Failed to parse PDF",
      { status: 500 }
    );
  }
}
