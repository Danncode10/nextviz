"use client";

import { Node } from "reactflow";
import { Plus, X } from "lucide-react";

interface Tool {
  id: string;
  type: "web_search" | "code_exec" | "api_call" | "calculator" | "file_ops";
  description?: string;
  config?: Record<string, unknown>;
}

interface ToolConfigProps {
  node: Node;
  onNodeChange?: (node: Node) => void;
}

const TOOL_TYPES = [
  { value: "web_search", label: "Web Search", description: "Search the internet" },
  { value: "code_exec", label: "Code Execution", description: "Run JavaScript/Python" },
  { value: "api_call", label: "API Call", description: "Make HTTP requests" },
  { value: "calculator", label: "Calculator", description: "Math operations" },
  { value: "file_ops", label: "File Operations", description: "Read/write files" },
];

export function ToolConfig({ node, onNodeChange }: ToolConfigProps) {
  const tools = (node.data?.tools as Tool[]) ?? [];

  const addTool = () => {
    const newTool: Tool = {
      id: `tool-${Date.now()}`,
      type: "web_search",
      description: "",
    };
    onNodeChange?.({
      ...node,
      data: { ...node.data, tools: [...tools, newTool] },
    });
  };

  const removeTool = (id: string) => {
    onNodeChange?.({
      ...node,
      data: { ...node.data, tools: tools.filter((t) => t.id !== id) },
    });
  };

  const updateTool = (id: string, updates: Partial<Tool>) => {
    onNodeChange?.({
      ...node,
      data: {
        ...node.data,
        tools: tools.map((t) => (t.id === id ? { ...t, ...updates } : t)),
      },
    });
  };

  return (
    <div className="space-y-3">
      {/* Tool list */}
      {tools.length === 0 ? (
        <div className="bg-zinc-900/50 border border-dashed border-zinc-700 rounded-lg p-4 text-center">
          <p className="text-xs text-zinc-600 mb-3">No tools configured. Agent will respond without tool calls.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tools.map((tool) => (
            <div key={tool.id} className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-3">
              <div className="flex items-start justify-between gap-2 mb-2">
                <select
                  value={tool.type}
                  onChange={(e) => updateTool(tool.id, { type: e.target.value as Tool["type"] })}
                  className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-300 text-sm rounded px-2 py-1 focus:outline-none focus:border-zinc-600 appearance-none cursor-pointer"
                >
                  {TOOL_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeTool(tool.id)}
                  className="p-1 text-zinc-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                  title="Remove tool"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Tool description */}
              <input
                type="text"
                value={tool.description ?? ""}
                onChange={(e) => updateTool(tool.id, { description: e.target.value })}
                placeholder="Optional description"
                className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-xs rounded px-2 py-1 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-600"
              />
            </div>
          ))}
        </div>
      )}

      {/* Add tool button */}
      <button
        onClick={addTool}
        className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-dashed border-zinc-700 text-zinc-400 text-sm rounded-lg px-3 py-2.5 hover:border-zinc-500 hover:text-zinc-300 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Tool
      </button>

      <p className="text-[11px] text-zinc-600">
        Tools allow the agent to take actions. Enable tools that match your workflow.
      </p>
    </div>
  );
}
