"use client";

import React from "react";
import Editor from "@monaco-editor/react";
import {
  Control,
  Controller,
  UseFormRegister,
  UseFormWatch,
} from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Code2 } from "lucide-react";

interface CodeEditorProps {
  control: Control<any>;
  register: UseFormRegister<any>;
  watch: UseFormWatch<any>;
  disabled?: boolean;
}

export function CodeEditor({
  control,
  register,
  watch,
  disabled,
}: CodeEditorProps) {
  return (
    <div className="flex flex-col h-full bg-black rounded-xl overflow-hidden border border-white/5 shadow-2xl">
      {/* Editor Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 backdrop-blur-sm border-b border-white/5 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="h-4 w-4 text-indigo-400" />
            <Input
              {...register(`code_snippets.0.name`)}
              placeholder="Snippet Name"
              disabled={disabled}
              className="bg-transparent border-none text-zinc-300 placeholder:text-zinc-600 focus-visible:ring-0 h-auto p-0 text-sm font-medium w-32"
            />
          </div>
          <div className="h-4 w-px bg-white/10" />
          <Controller
            control={control}
            name={`code_snippets.0.language`}
            defaultValue={watch("code_snippets.0.language") || "cpp"}
            render={({ field: langField }) => (
              <Select
                onValueChange={langField.onChange}
                value={langField.value}
                disabled={disabled}
              >
                <SelectTrigger className="h-7 w-[90px] bg-zinc-800/50 border-white/5 text-xs text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors">
                  <SelectValue placeholder="Lang" />
                </SelectTrigger>
                <SelectContent className="bg-[#252526] border-white/10">
                  <SelectItem value="cpp">C++</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="javascript">JS</SelectItem>
                </SelectContent>
              </Select>
            )}
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500">Tries:</span>
          <Input
            type="number"
            {...register(`code_snippets.0.tries`)}
            disabled={disabled}
            className="bg-zinc-800/50 border-white/5 text-zinc-300 text-center h-7 w-12 text-xs focus-visible:ring-0"
          />
        </div>
      </div>

      {/* Monaco Editor */}
      <div className="flex-1 relative group/editor min-h-0 bg-black">
        <Controller
          control={control}
          name={`code_snippets.0.code`}
          render={({ field: codeField }) => (
            <Editor
              height="100%"
              defaultLanguage="cpp"
              language={watch(`code_snippets.0.language`) || "cpp"}
              theme="archon-dark"
              beforeMount={(monaco) => {
                monaco.editor.defineTheme("archon-dark", {
                  base: "vs-dark",
                  inherit: true,
                  rules: [],
                  colors: {
                    "editor.background": "#000000", // Pure Black
                  },
                });
              }}
              value={codeField.value}
              onChange={codeField.onChange}
              options={{
                readOnly: disabled,
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                fontFamily: "'JetBrains Mono', monospace",
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                smoothScrolling: true,
              }}
              className="bg-transparent"
            />
          )}
        />
      </div>
    </div>
  );
}
