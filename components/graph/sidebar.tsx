"use client";

import React, { useMemo, useRef, useState, useEffect, useCallback } from "react";
import {
  Tree,
  NodeApi,
  NodeRendererProps,
  CreateHandler,
  RenameHandler,
  MoveHandler,
  DeleteHandler,
  TreeApi,
} from "react-arborist";
import {
  Folder,
  FolderOpen,
  FileText,
  FolderPlus,
  FilePlus,
  ChevronRight,
  Trash2,
  PenLine,
  NotebookText,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { PdfUpload } from "@/components/archon-notes/pdf-upload";

interface Note {
  id: string;
  title: string;
  type: "FOLDER" | "CANVAS";
  parentId: string | null;
  updatedAt: string;
}

interface TreeNode {
  id: string;
  name: string;
  type: "FOLDER" | "CANVAS";
  children?: TreeNode[];
}

interface SidebarProps {
  data: Note[];
  isLoading: boolean;
}

// ─── Node Renderer ────────────────────────────────────────────────────────────

function NodeRenderer({ node, style, dragHandle, tree }: NodeRendererProps<TreeNode>) {
  const router = useRouter();
  const pathname = usePathname();
  const isActive = pathname === `/notes/${node.id}`;
  const isFolder = node.data.type === "FOLDER";

  return (
    <div style={style} className="px-1.5">
      <div
        ref={dragHandle}
        className={cn(
          "group relative flex items-center gap-1.5 h-[30px] rounded-lg px-2 cursor-pointer select-none transition-all duration-100",
          isActive
            ? "bg-indigo-500/10 text-white shadow-[inset_0_0_0_1px_rgba(99,102,241,0.15)]"
            : "text-zinc-400 hover:bg-white/[0.04] hover:text-zinc-200",
          node.state.isDragging && "opacity-30 scale-95",
        )}
        onClick={() => {
          if (node.isEditing) return;
          if (isFolder) node.toggle();
          else router.push(`/notes/${node.id}`);
        }}
      >
        {/* Active left bar */}
        {isActive && (
          <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-4 bg-indigo-400 rounded-full" />
        )}

        {/* Chevron */}
        <span className="shrink-0 w-3">
          {isFolder && (
            <ChevronRight
              className={cn(
                "h-3 w-3 transition-transform duration-150",
                node.isOpen ? "rotate-90 text-zinc-400" : "text-zinc-600",
              )}
            />
          )}
        </span>

        {/* Icon */}
        {isFolder ? (
          node.isOpen ? (
            <FolderOpen
              className={cn(
                "h-3.5 w-3.5 shrink-0 transition-colors",
                isActive ? "text-indigo-400" : "text-indigo-500/60 group-hover:text-indigo-400/80",
              )}
            />
          ) : (
            <Folder
              className={cn(
                "h-3.5 w-3.5 shrink-0 transition-colors",
                isActive ? "text-indigo-400" : "text-indigo-500/60 group-hover:text-indigo-400/80",
              )}
            />
          )
        ) : (
          <FileText
            className={cn(
              "h-3.5 w-3.5 shrink-0 transition-colors",
              isActive ? "text-rose-400" : "text-rose-500/50 group-hover:text-rose-400/70",
            )}
          />
        )}

        {/* Name / Edit input */}
        {node.isEditing ? (
          <input
            autoFocus
            defaultValue={node.data.name}
            className="flex-1 bg-transparent text-[13px] text-white outline-none border-b border-indigo-400/50 min-w-0 pb-px caret-indigo-400"
            onBlur={(e) => node.submit(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") node.submit(e.currentTarget.value);
              if (e.key === "Escape") node.reset();
            }}
            onClick={(e) => e.stopPropagation()}
          />
        ) : (
          <span
            className={cn(
              "text-[13px] truncate flex-1 leading-none",
              isActive && "text-white font-medium",
            )}
          >
            {node.data.name}
          </span>
        )}

        {/* Hover actions */}
        {!node.isEditing && (
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity duration-100 shrink-0 ml-auto pl-1">
            {isFolder && (
              <>
                <button
                  className="p-1 rounded hover:bg-white/10 text-zinc-600 hover:text-zinc-200 transition-colors"
                  title="New Folder"
                  onClick={(e) => {
                    e.stopPropagation();
                    node.open();
                    tree.create({ type: "internal", parentId: node.id });
                  }}
                >
                  <FolderPlus className="h-3 w-3" />
                </button>
                <button
                  className="p-1 rounded hover:bg-white/10 text-zinc-600 hover:text-zinc-200 transition-colors"
                  title="New Note"
                  onClick={(e) => {
                    e.stopPropagation();
                    node.open();
                    tree.create({ type: "leaf", parentId: node.id });
                  }}
                >
                  <FilePlus className="h-3 w-3" />
                </button>
              </>
            )}
            <button
              className="p-1 rounded hover:bg-white/10 text-zinc-600 hover:text-zinc-200 transition-colors"
              title="Rename"
              onClick={(e) => {
                e.stopPropagation();
                node.edit();
              }}
            >
              <PenLine className="h-3 w-3" />
            </button>
            <button
              className="p-1 rounded hover:bg-red-500/10 text-zinc-600 hover:text-red-400 transition-colors"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Delete this item? This cannot be undone.")) {
                  tree.delete(node);
                }
              }}
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  const rows = [
    { depth: 0, width: "55%" },
    { depth: 1, width: "70%" },
    { depth: 1, width: "45%" },
    { depth: 0, width: "65%" },
    { depth: 1, width: "80%" },
    { depth: 2, width: "50%" },
    { depth: 0, width: "40%" },
  ];
  return (
    <div className="px-2 py-2 flex flex-col gap-0.5 animate-pulse">
      {rows.map((r, i) => (
        <div
          key={i}
          className="flex items-center gap-2 h-[30px] px-2 rounded-lg"
          style={{ paddingLeft: `${r.depth * 16 + 8}px` }}
        >
          <div className="h-3 w-3 rounded bg-zinc-800/80 shrink-0" />
          <div className="h-2 rounded-full bg-zinc-800/80" style={{ width: r.width }} />
        </div>
      ))}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onNewFolder, onNewNote }: { onNewFolder: () => void; onNewNote: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
      <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/[0.06] flex items-center justify-center">
        <NotebookText className="h-5 w-5 text-zinc-600" />
      </div>
      <div>
        <p className="text-sm text-zinc-400 font-medium mb-1">No notes yet</p>
        <p className="text-xs text-zinc-600 leading-relaxed">
          Start by creating a folder or note
        </p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onNewFolder}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/[0.06] text-xs text-zinc-400 hover:text-zinc-200 hover:border-white/10 transition-all"
        >
          <FolderPlus className="h-3.5 w-3.5" />
          New Folder
        </button>
        <button
          onClick={onNewNote}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300 hover:bg-indigo-500/20 transition-all"
        >
          <FilePlus className="h-3.5 w-3.5" />
          New Note
        </button>
      </div>
    </div>
  );
}

// ─── GraphSidebar ─────────────────────────────────────────────────────────────

export function GraphSidebar({ data, isLoading }: SidebarProps) {
  const queryClient = useQueryClient();
  const treeRef = useRef<TreeApi<TreeNode>>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [treeHeight, setTreeHeight] = useState(500);
  const [activeTab, setActiveTab] = useState<"notes" | "upload">("notes");

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(([entry]) => setTreeHeight(entry.contentRect.height));
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  const treeData = useMemo((): TreeNode[] => {
    if (!data) return [];

    const map = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    data.forEach((note) => {
      map.set(note.id, {
        id: note.id,
        name: note.title,
        type: note.type,
        ...(note.type === "FOLDER" ? { children: [] } : {}),
      });
    });

    data.forEach((note) => {
      const node = map.get(note.id)!;
      if (note.parentId && map.has(note.parentId)) {
        map.get(note.parentId)!.children?.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [data]);

  const onCreate: CreateHandler<TreeNode> = useCallback(
    async ({ parentId, type }) => {
      const noteType = type === "internal" ? "FOLDER" : "CANVAS";
      try {
        const res = await axios.post("/api/notes", {
          title: noteType === "FOLDER" ? "New Folder" : "Untitled",
          type: noteType,
          parentId: parentId ?? null,
        });
        queryClient.invalidateQueries({ queryKey: ["graph-data"] });
        return {
          id: res.data.id,
          name: res.data.title,
          type: noteType,
          ...(noteType === "FOLDER" ? { children: [] } : {}),
        };
      } catch {
        toast.error("Failed to create");
        return null;
      }
    },
    [queryClient],
  );

  const onRename: RenameHandler<TreeNode> = useCallback(
    ({ id, name }) => {
      if (!name.trim()) return;
      axios
        .patch(`/api/notes/${id}`, { title: name.trim() })
        .then(() => queryClient.invalidateQueries({ queryKey: ["graph-data"] }))
        .catch(() => toast.error("Failed to rename"));
    },
    [queryClient],
  );

  const onMove: MoveHandler<TreeNode> = useCallback(
    ({ dragIds, parentId }) => {
      dragIds.forEach((id) => {
        axios
          .patch(`/api/notes/${id}`, { parentId: parentId ?? null })
          .then(() => queryClient.invalidateQueries({ queryKey: ["graph-data"] }))
          .catch(() => toast.error("Failed to move"));
      });
    },
    [queryClient],
  );

  const onDelete: DeleteHandler<TreeNode> = useCallback(
    ({ ids }) => {
      ids.forEach((id) => {
        axios
          .delete(`/api/notes/${id}`)
          .then(() => queryClient.invalidateQueries({ queryKey: ["graph-data"] }))
          .catch(() => toast.error("Failed to delete"));
      });
    },
    [queryClient],
  );

  const handleNewFolder = useCallback(() => treeRef.current?.createInternal(), []);
  const handleNewNote = useCallback(() => treeRef.current?.createLeaf(), []);

  const isEmpty = !isLoading && treeData.length === 0;

  return (
    <div className="w-[280px] h-full flex flex-col border-r border-white/[0.06] bg-zinc-950">
      {/* Header with Tabs */}
      <div className="border-b border-white/[0.06] shrink-0">
        <div className="px-4 h-14 flex items-center justify-between">
          <div className="flex gap-2 flex-1">
            <button
              onClick={() => setActiveTab("notes")}
              className={cn(
                "text-[10px] font-semibold tracking-[0.14em] uppercase px-2 py-1.5 rounded-md transition-colors",
                activeTab === "notes"
                  ? "text-indigo-300 bg-indigo-500/10"
                  : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              Notes
            </button>
            <button
              onClick={() => setActiveTab("upload")}
              className={cn(
                "text-[10px] font-semibold tracking-[0.14em] uppercase px-2 py-1.5 rounded-md transition-colors flex items-center gap-1",
                activeTab === "upload"
                  ? "text-indigo-300 bg-indigo-500/10"
                  : "text-zinc-600 hover:text-zinc-400"
              )}
            >
              <Upload className="h-3 w-3" />
              Upload
            </button>
          </div>
          {activeTab === "notes" && (
            <div className="flex gap-0.5">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-white/[0.06] text-zinc-600 hover:text-zinc-300 rounded-md transition-all"
                onClick={handleNewFolder}
                title="New Folder"
              >
                <FolderPlus className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 hover:bg-white/[0.06] text-zinc-600 hover:text-zinc-300 rounded-md transition-all"
                onClick={handleNewNote}
                title="New Note"
              >
                <FilePlus className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div ref={containerRef} className="flex-1 overflow-hidden flex flex-col">
        {activeTab === "notes" ? (
          isLoading ? (
            <LoadingSkeleton />
          ) : isEmpty ? (
            <EmptyState onNewFolder={handleNewFolder} onNewNote={handleNewNote} />
          ) : (
            <Tree
              ref={treeRef}
              data={treeData}
              onCreate={onCreate}
              onRename={onRename}
              onMove={onMove}
              onDelete={onDelete}
              width="100%"
              height={treeHeight}
              rowHeight={34}
              indent={14}
              paddingTop={8}
              paddingBottom={8}
              disableDrop={({ parentNode }) =>
                !!(parentNode && parentNode.data.type === "CANVAS")
              }
            >
              {NodeRenderer}
            </Tree>
          )
        ) : (
          <div className="flex-1 overflow-auto p-4">
            <PdfUpload
              onUploadSuccess={() => {
                // Future: handle successful upload
                // Maybe create a note node or update graph
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
