"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { Loader2, ZoomIn, ZoomOut, Maximize, RotateCcw } from "lucide-react";
import { useTheme } from "next-themes";

// Import ForceGraph2D dynamically as it relies on window/canvas
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
    </div>
  ),
});

interface BrainstormNode {
  id: string;
  name: string;
  type: "root" | "project" | "brainstorm";
  val: number;
  color?: string;
  parentId?: string;
  updatedAt?: string;
  // d3-force specific properties
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  index?: number;
}

interface GraphLink {
  source: string | BrainstormNode;
  target: string | BrainstormNode;
  color?: string;
}

interface ProjectData {
  id: string;
  title: string;
  color: string;
  brainstorms: {
    id: string;
    name: string;
    updatedAt: string;
  }[];
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

  const { data: projects, isLoading } = useQuery({
    queryKey: ["graph-data"],
    queryFn: async () => {
      const res = await axios.get("/api/graph");
      return res.data as ProjectData[];
    },
  });

  const graphData = useMemo(() => {
    const nodes: BrainstormNode[] = [
      { id: "root", name: "Universe", type: "root", val: 40, color: "#ffffff" },
    ];
    const links: GraphLink[] = [];

    // Helper to add mock data if fewer than 5 real projects exist
    const shouldAddDummyData = !projects || projects.length < 5;

    // Real Data
    if (projects) {
      projects.forEach((project) => {
        nodes.push({
          id: project.id,
          name: project.title,
          type: "project",
          val: 20,
          color: project.color || "#6366f1",
        });
        links.push({
          source: "root",
          target: project.id,
          color: "rgba(255,255,255,0.1)",
        });

        project.brainstorms.forEach((brainstorm) => {
          nodes.push({
            id: brainstorm.id,
            name: brainstorm.name,
            type: "brainstorm",
            val: 10,
            parentId: project.id,
            color: project.color,
            updatedAt: brainstorm.updatedAt,
          });
          links.push({
            source: project.id,
            target: brainstorm.id,
            color: `${project.color}40`,
          });
        });
      });
    }

    // Dummy Data Generation (for visual "sexiness")
    if (shouldAddDummyData || true) {
      // Force true as per user request to see "many nodes"
      const mockProjects = [
        { id: "mock-1", title: "Neural Interface", color: "#ef4444" },
        { id: "mock-2", title: "Mars Colony Base", color: "#f97316" },
        { id: "mock-3", title: "AI Core Logic", color: "#eab308" },
        { id: "mock-4", title: "Quantum Cryptography", color: "#22c55e" },
        { id: "mock-5", title: "Deep Sea Exploration", color: "#06b6d4" },
        { id: "mock-6", title: "Sky Citadal", color: "#3b82f6" },
        { id: "mock-7", title: "Holographic Display", color: "#a855f7" },
        { id: "mock-8", title: "Fusion Reactor", color: "#ec4899" },
      ];

      mockProjects.forEach((p) => {
        // Add Project Node
        nodes.push({
          id: p.id,
          name: p.title,
          type: "project",
          val: 20,
          color: p.color,
        });
        links.push({
          source: "root",
          target: p.id,
          color: "rgba(255,255,255,0.1)",
        });

        // Add 3-8 random brainstorm nodes per project
        const count = Math.floor(Math.random() * 6) + 3;
        for (let i = 0; i < count; i++) {
          const bId = `${p.id}-node-${i}`;
          nodes.push({
            id: bId,
            name: `${p.title} - Note ${i + 1}`,
            type: "brainstorm",
            val: 10,
            parentId: p.id,
            color: p.color,
          });
          links.push({ source: p.id, target: bId, color: `${p.color}40` });
        }
      });
    }

    return { nodes, links };
  }, [projects]);

  const handleNodeClick = (node: any) => {
    if (node.type === "brainstorm" && node.parentId) {
      router.push(`/projects/${node.parentId}/brainstorm/${node.id}`);
    } else if (node.type === "project") {
      // Focus on project or route to project page
      // For now, let's fly to the node
      graphRef.current?.centerAt(node.x, node.y, 1000);
      graphRef.current?.zoom(4, 1000);
    }
  };

  if (isLoading) {
    return (
      <div className="flex bg-zinc-950 h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col bg-zinc-950 overflow-hidden relative">
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

      {/* Legend / Title Overlay */}
      <div className="absolute top-6 left-6 z-50 pointer-events-none">
        <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
          Knowledge Graph
        </h1>
        <p className="text-zinc-500 text-sm mt-1 max-w-[250px]">
          Visualizing your projects and brainstorm connections in an infinite
          universe.
        </p>
        <div className="mt-4 p-2 bg-black/50 rounded text-xs text-white font-mono pointer-events-auto">
          Debug: Nodes={graphData.nodes.length}, Links={graphData.links.length}
          <br />
          Dims={dimensions.width.toFixed(0)}x{dimensions.height.toFixed(0)}
        </div>
      </div>

      {/* Graph Container */}
      <div ref={containerRef} className="flex-1 w-full relative">
        <ForceGraph2D
          ref={graphRef}
          width={dimensions.width || 800}
          height={dimensions.height || 600}
          graphData={graphData}
          nodeLabel="name"
          backgroundColor="#09090b"
          linkColor={(link: any) => link.color}
          linkWidth={1.5}
          nodeRelSize={6}
          onNodeClick={handleNodeClick}
          d3VelocityDecay={0.1}
          cooldownTicks={100}
          onEngineStop={() => graphRef.current?.zoomToFit(400)}
        />
      </div>
    </div>
  );
}
