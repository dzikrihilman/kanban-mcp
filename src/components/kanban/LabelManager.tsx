/**
 * Label Manager
 * Create and manage project labels inline
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Tag, Plus, Trash2 } from "lucide-react";

interface Label {
  id: string;
  projectId: string;
  name: string;
  color: string;
}

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#6366f1",
  "#a855f7",
  "#ec4899",
  "#64748b",
];

interface LabelManagerProps {
  projectId: string;
}

export default function LabelManager({ projectId }: LabelManagerProps) {
  const [labels, setLabels] = useState<Label[]>([]);
  const [newName, setNewName] = useState("");
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[6]);

  const fetchLabels = useCallback(async () => {
    const res = await fetch(`/api/labels?projectId=${projectId}`);
    if (res.ok) setLabels(await res.json());
  }, [projectId]);

  useEffect(() => {
    fetchLabels();
  }, [fetchLabels]);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    await fetch("/api/labels", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        name: newName.trim(),
        color: selectedColor,
      }),
    });
    setNewName("");
    fetchLabels();
  };

  const handleDelete = async (labelId: string) => {
    await fetch(`/api/labels/${labelId}`, { method: "DELETE" });
    fetchLabels();
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="h-8">
          <Tag className="mr-1.5 h-3.5 w-3.5" />
          Labels ({labels.length})
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72" align="end">
        <div className="space-y-3">
          <span className="text-sm font-medium">Project Labels</span>

          <div className="space-y-1.5">
            {labels.map((label) => (
              <div
                key={label.id}
                className="flex items-center justify-between rounded-md px-2 py-1 hover:bg-muted/50"
              >
                <Badge
                  style={{ backgroundColor: label.color }}
                  className="text-white text-xs"
                >
                  {label.name}
                </Badge>
                <button
                  onClick={() => handleDelete(label.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
            {labels.length === 0 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                No labels yet
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex gap-1.5">
              {PRESET_COLORS.map((color) => (
                <button
                  key={color}
                  className="h-5 w-5 rounded-full transition-transform"
                  style={{
                    backgroundColor: color,
                    outline:
                      selectedColor === color
                        ? "2px solid currentColor"
                        : "none",
                    outlineOffset: "2px",
                  }}
                  onClick={() => setSelectedColor(color)}
                />
              ))}
            </div>
            <div className="flex gap-1.5">
              <Input
                placeholder="Label name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
                className="h-8 text-sm"
              />
              <Button
                size="sm"
                onClick={handleCreate}
                disabled={!newName.trim()}
                className="h-8 px-2"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
