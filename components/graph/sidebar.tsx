"use client";

import React, { useState, useMemo } from "react";
import {
  Folder,
  File,
  ChevronRight,
  ChevronDown,
  Plus,
  MoreHorizontal,
  FolderPlus,
  Trash,
  FilePlus,
  Edit2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface Note {
  id: string;
  title: string;
  type: "FOLDER" | "CANVAS";
  parentId: string | null;
  updatedAt: string;
}

interface SidebarProps {
  data: Note[];
  isLoading: boolean;
}

interface TreeNode {
  item: Note;
  children: TreeNode[];
}

export function GraphSidebar({ data, isLoading }: SidebarProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    root: true,
  });

  // State for creating new items
  const [createType, setCreateType] = useState<"FOLDER" | "CANVAS" | null>(
    null,
  );
  const [targetParentId, setTargetParentId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const createNoteMutation = useMutation({
    mutationFn: async ({
      title,
      type,
      parentId,
    }: {
      title: string;
      type: "FOLDER" | "CANVAS";
      parentId?: string | null;
    }) => {
      return axios.post("/api/notes", { title, type, parentId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph-data"] });
      setIsCreateOpen(false);
      setNewName("");
      toast.success(
        createType === "FOLDER" ? "Folder created" : "Note created",
      );
    },
    onError: () => {
      toast.error("Failed to create item");
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: string) => {
      return axios.delete(`/api/notes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["graph-data"] });
      toast.success("Item deleted");
    },
    onError: () => {
      toast.error("Failed to delete item");
    },
  });

  const handleCreateMetadata = (
    type: "FOLDER" | "CANVAS",
    parentId: string | null,
  ) => {
    setCreateType(type);
    setTargetParentId(parentId);
    setNewName("");
    setIsCreateOpen(true);
  };

  const handleCreateSubmit = () => {
    if (!newName.trim() || !createType) return;
    createNoteMutation.mutate({
      title: newName,
      type: createType,
      parentId: targetParentId,
    });
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure? This action cannot be undone.")) {
      deleteNoteMutation.mutate(id);
    }
  };

  const navigateToNote = (id: string) => {
    router.push(`/notes/${id}`);
  };

  // Build Tree
  const tree = useMemo(() => {
    if (!data) return [];

    const nodeMap = new Map<string, TreeNode>();
    const roots: TreeNode[] = [];

    // First pass: create nodes
    data.forEach((item) => {
      nodeMap.set(item.id, { item, children: [] });
    });

    // Second pass: attach children
    data.forEach((item) => {
      const node = nodeMap.get(item.id)!;
      if (item.parentId && nodeMap.has(item.parentId)) {
        const parent = nodeMap.get(item.parentId)!;
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    return roots;
  }, [data]);

  const renderNode = (node: TreeNode, depth: number = 0) => {
    const isFolder = node.item.type === "FOLDER";
    const isExpanded = expanded[node.item.id];
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.item.id} className="flex flex-col">
        <div
          className={cn(
            "group flex items-center justify-between px-2 py-1.5 rounded-md hover:bg-white/5 cursor-pointer select-none transition-colors",
            isFolder
              ? "text-zinc-400 hover:text-zinc-200"
              : "text-zinc-500 hover:text-zinc-300",
          )}
          style={{ paddingLeft: `${depth * 12 + 8}px` }}
          onClick={(e) => {
            if (isFolder) {
              toggleExpand(node.item.id, e);
            } else {
              navigateToNote(node.item.id);
            }
          }}
        >
          <div className="flex items-center gap-2 overflow-hidden flex-1">
            {isFolder && (
              <div className="text-zinc-600">
                {isExpanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </div>
            )}
            {isFolder ? (
              <Folder className="h-3.5 w-3.5 text-blue-500/80 shrink-0" />
            ) : (
              <File className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="text-sm truncate">{node.item.title}</span>
          </div>

          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            {isFolder && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-white/10 text-zinc-500 hover:text-zinc-200"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCreateMetadata("CANVAS", node.item.id);
                  }}
                  title="New Note"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 hover:bg-white/10 text-zinc-500 hover:text-zinc-200"
                >
                  <MoreHorizontal className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-40 bg-zinc-900 border-zinc-800 text-zinc-300"
              >
                {isFolder && (
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCreateMetadata("FOLDER", node.item.id);
                    }}
                    className="cursor-pointer"
                  >
                    <FolderPlus className="mr-2 h-3.5 w-3.5" />
                    New Folder
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={(e) => handleDelete(node.item.id, e)}
                  className="text-red-400 focus:text-red-300 focus:bg-red-900/20 cursor-pointer"
                >
                  <Trash className="mr-2 h-3.5 w-3.5" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {isFolder && isExpanded && (
          <div className="flex flex-col gap-0.5">
            {node.children.length > 0 ? (
              node.children.map((child) => renderNode(child, depth + 1))
            ) : (
              <div
                className="py-1 text-xs text-zinc-600 italic select-none"
                style={{ paddingLeft: `${(depth + 1) * 12 + 28}px` }}
              >
                Empty
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-[300px] h-full flex flex-col border-r border-white/10 bg-zinc-950/50 backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <div className="flex items-center gap-2 text-zinc-100 font-semibold">
          <Folder className="w-5 h-5 text-indigo-400" />
          <span>Notes</span>
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/10 text-zinc-400 hover:text-white"
            onClick={() => handleCreateMetadata("FOLDER", null)}
            title="New Root Folder"
          >
            <FolderPlus className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-white/10 text-zinc-400 hover:text-white"
            onClick={() => handleCreateMetadata("CANVAS", null)}
            title="New Root Note"
          >
            <FilePlus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <div className="p-4 text-xs text-zinc-500 animate-pulse">
            Loading files...
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {tree.length > 0 ? (
              tree.map((rootNode) => renderNode(rootNode))
            ) : (
              <div className="p-4 text-sm text-zinc-500 italic text-center">
                No notes found. Create one to get started.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="bg-zinc-950 border-zinc-800 text-zinc-100">
          <DialogHeader>
            <DialogTitle>
              Create {createType === "FOLDER" ? "Folder" : "Note"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder={
                createType === "FOLDER" ? "Folder Name" : "Note Name"
              }
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="bg-zinc-900 border-zinc-800 text-zinc-100"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateSubmit();
              }}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(false)}
              className="border-zinc-800 hover:bg-zinc-900 text-zinc-300"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateSubmit}
              disabled={createNoteMutation.isPending}
              className="bg-indigo-600 hover:bg-indigo-700 text-white"
            >
              {createNoteMutation.isPending ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
