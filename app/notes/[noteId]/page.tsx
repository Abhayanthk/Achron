import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import NoteExcalidrawWrapper from "@/components/note-excalidraw-wrapper";

export default async function NotePage({
  params,
}: {
  params: Promise<{ noteId: string }>;
}) {
  const { userId } = await auth();
  const { noteId } = await params;

  if (!userId) {
    redirect("/sign-in");
  }

  const note = await prisma.note.findUnique({
    where: {
      id: noteId,
      userId: userId,
    },
    include: {
      parent: true,
    },
  });

  if (!note) {
    return (
      <div className="flex h-screen items-center justify-center text-zinc-500">
        Note not found
      </div>
    );
  }

  if (note.type === "FOLDER") {
    return (
      <div className="flex h-screen items-center justify-center text-zinc-500">
        Cannot open a folder in canvas view. Please use the graph or sidebar to
        navigate.
      </div>
    );
  }

  // Parse content safely
  let initialData = { elements: [], appState: {} };
  if (
    note.content &&
    typeof note.content === "object" &&
    !Array.isArray(note.content)
  ) {
    initialData = note.content as any;
  }

  // Determine breadcrumbs
  const breadcrumbs: { label: string; href?: string }[] = [
    { label: "Home", href: "/dashboard" },
    { label: "Notes", href: "/notes" },
  ];

  if (note.parent) {
    breadcrumbs.push({
      label: note.parent.title,
      href: `/notes?folderId=${note.parent.id}`,
    });
  }

  breadcrumbs.push({ label: note.title });

  return (
    <NoteExcalidrawWrapper
      initialData={initialData}
      noteId={noteId}
      breadcrumbs={breadcrumbs}
    />
  );
}
