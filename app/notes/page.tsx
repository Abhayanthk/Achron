"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { useTheme } from "next-themes";
import { GraphSidebar } from "@/components/graph/sidebar";

// Import ForceGraph2D dynamically as it relies on window/canvas
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
    </div>
  ),
});

interface NodeData {
  id: string;
  title: string;
  type: "FOLDER" | "CANVAS";
  parentId: string | null;
  updatedAt: string;
}

interface GraphNode {
  id: string;
  name: string;
  type: "FOLDER" | "CANVAS" | "root";
  val: number;
  color?: string;
  parentId?: string | null;
  // d3-force specific properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  index?: number;
}

interface GraphLink {
  source: string | GraphNode;
  target: string | GraphNode;
  color?: string;
}

export default function GraphPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const graphRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });

    resizeObserver.observe(containerRef.current);

    return () => resizeObserver.disconnect();
  }, []);

  const { data: notes, isLoading } = useQuery({
    queryKey: ["graph-data"],
    queryFn: async () => {
      const res = await axios.get("/api/graph");
      return res.data as NodeData[];
    },
  });

  const graphData = useMemo(() => {
    const graphNodes: GraphNode[] = [];
    const links: GraphLink[] = [];

    // Add Root Node - REMOVED based on user request ("I don't want a brain")
    // If we need to keep things tethered, we can rely on standard d3 forces or add an invisible center point if needed.
    // For now, we'll let multiple trees exist if they are disconnected.

    if (notes) {
      notes.forEach((note) => {
        graphNodes.push({
          id: note.id,
          name: note.title,
          type: note.type,
          val: note.type === "FOLDER" ? 20 : 10,
          color: note.type === "FOLDER" ? "#6366f1" : "#f472b6", // Blue for folders, Pink for canvas
          parentId: note.parentId,
        });

        // Link to parent
        if (note.parentId) {
          links.push({
            source: note.parentId,
            target: note.id,
            color:
              note.type === "FOLDER"
                ? "rgba(99, 102, 241, 0.2)"
                : "rgba(244, 114, 182, 0.2)",
          });
        }
      });
    }

    return { nodes: graphNodes, links };
  }, [notes]);

  // Hover interaction state
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);

  // Apply custom forces
  useEffect(() => {
    if (graphRef.current) {
      // Use distanceMax to limit repulsion to local nodes only, allowing clusters to float closer
      graphRef.current.d3Force("charge").strength(-200).distanceMax(250);
      graphRef.current.d3Force("link").distance(50);
      graphRef.current.d3Force("center").strength(0.8);
    }
  }, [graphData]);

  const handleNodeClick = (node: GraphNode) => {
    // NOTE: We don't want to fly to the node if it's just a folder, maybe we do nothing or expand?
    // User requested minimal animation.
    if (node.type === "CANVAS") {
      router.push(`/notes/${node.id}`);
    } else if (node.type === "FOLDER") {
      // Optional: Focus or expand. For now, just centering gently.
      graphRef.current?.centerAt(node.x, node.y, 1000);
      graphRef.current?.zoom(4, 1000);
    }
  };

  const isNodeRelated = (node: GraphNode, hover: GraphNode | null) => {
    if (!hover) return true;
    if (node.id === hover.id) return true;
    if (node.parentId === hover.id) return true;
    if (hover.parentId === node.id) return true;
    return false;
  };

  const isLinkRelated = (link: any, hover: GraphNode | null) => {
    if (!hover) return true;
    const sourceId =
      typeof link.source === "object" ? link.source.id : link.source;
    const targetId =
      typeof link.target === "object" ? link.target.id : link.target;
    if (sourceId === hover.id || targetId === hover.id) return true;
    return false;
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 overflow-hidden">
      {/* Sidebar */}
      <GraphSidebar data={notes || []} isLoading={isLoading} />

      <div className="flex-1 flex flex-col relative h-full">
        {/* Controls Overlay */}
        <div className="absolute top-6 right-6 z-50 flex flex-col gap-2 bg-zinc-900/80 backdrop-blur-md p-2 rounded-xl border border-white/10 shadow-xl">
          <button
            onClick={() => {
              graphRef.current?.zoomToFit(400);
            }}
            className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Reset View"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const current = graphRef.current?.zoom();
              graphRef.current?.zoom(current * 1.2, 400);
            }}
            className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Zoom In"
          >
            <ZoomIn className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              const current = graphRef.current?.zoom();
              graphRef.current?.zoom(current / 1.2, 400);
            }}
            className="p-2 hover:bg-white/10 rounded-lg text-zinc-400 hover:text-white transition-colors"
            title="Zoom Out"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
        </div>

        {/* Graph Container */}
        <div ref={containerRef} className="flex-1 w-full relative h-full">
          <ForceGraph2D
            ref={graphRef}
            width={dimensions.width}
            height={dimensions.height}
            graphData={graphData}
            nodeLabel="name"
            backgroundColor="#09090b"
            linkColor={(link: any) =>
              isLinkRelated(link, hoverNode)
                ? link.color
                : "rgba(255,255,255,0.02)"
            }
            linkWidth={(link: any) =>
              isLinkRelated(link, hoverNode) ? 2 : 0.5
            }
            nodeRelSize={6}
            onNodeClick={(node: any) => handleNodeClick(node)}
            onNodeHover={(node: any) => setHoverNode(node || null)}
            // Physics / Layout Tuning
            d3VelocityDecay={0.3} // Higher friction for stability
            cooldownTicks={100}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.005}
            linkDirectionalParticleWidth={2}
            onEngineStop={() => graphRef.current?.zoomToFit(400, 100)}
            nodeCanvasObject={(node: any, ctx, globalScale) => {
              if (!Number.isFinite(node.x) || !Number.isFinite(node.y)) return;

              const isDimmed = !isNodeRelated(node, hoverNode);
              const label = node.name;
              const fontSize = 12 / globalScale;
              const radius =
                node.type === "root" ? 12 : node.type === "FOLDER" ? 8 : 5;

              const opacity = isDimmed ? 0.1 : 1;
              ctx.globalAlpha = opacity;

              if (node.type !== "root" && !isDimmed) {
                const glowRadius = radius * 2.5; // Reduced from 4
                const gradient = ctx.createRadialGradient(
                  node.x,
                  node.y,
                  radius,
                  node.x,
                  node.y,
                  glowRadius,
                );
                gradient.addColorStop(0, `${node.color}20`); // Reduced opacity from 60
                gradient.addColorStop(1, "transparent");
                ctx.beginPath();
                ctx.arc(node.x, node.y, glowRadius, 0, 2 * Math.PI, false);
                ctx.fillStyle = gradient;
                ctx.fill();
              }

              ctx.beginPath();
              ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI, false);
              ctx.fillStyle = node.color || "#fff";
              ctx.shadowColor = !isDimmed
                ? node.color || "#fff"
                : "transparent";
              ctx.shadowBlur = !isDimmed ? (node.type === "root" ? 20 : 15) : 0;
              ctx.fill();
              ctx.shadowBlur = 0;

              if (!isDimmed || hoverNode === null) {
                ctx.font = `${fontSize}px Sans-Serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = `rgba(255, 255, 255, ${isDimmed ? 0.3 : 0.9})`;
                ctx.fillText(label, node.x, node.y + radius + fontSize);
              }

              ctx.globalAlpha = 1;
            }}
          />
        </div>
      </div>
    </div>
  );
}
