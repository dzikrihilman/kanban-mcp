/**
 * Filter Bar
 * Priority, search, and sort controls for the kanban board
 */

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, X, Download } from "lucide-react";
import { TASK_PRIORITY_CONFIG } from "@/types";

interface FilterBarProps {
  onSearchChange: (query: string) => void;
  onPriorityFilter: (priority: string | null) => void;
  activePriority: string | null;
  projectId: string;
}

export default function FilterBar({
  onSearchChange,
  onPriorityFilter,
  activePriority,
  projectId,
}: FilterBarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    onSearchChange(value);
  };

  const handleExport = () => {
    window.open(`/api/export?projectId=${projectId}`, "_blank");
  };

  return (
    <div className="flex items-center gap-3 border-b border-border px-6 py-2">
      {/* Search */}
      <div className="relative flex-1 max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="h-8 pl-8 text-sm"
        />
        {searchQuery && (
          <button
            onClick={() => handleSearch("")}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Priority filter */}
      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground mr-1">Priority:</span>
        {(
          Object.entries(TASK_PRIORITY_CONFIG) as [
            string,
            { label: string; color: string },
          ][]
        ).map(([key, config]) => (
          <Badge
            key={key}
            variant={activePriority === key ? "default" : "outline"}
            className="cursor-pointer text-xs transition-all"
            style={
              activePriority === key
                ? { backgroundColor: config.color, borderColor: config.color }
                : { borderColor: config.color, color: config.color }
            }
            onClick={() =>
              onPriorityFilter(activePriority === key ? null : key)
            }
          >
            {config.label}
          </Badge>
        ))}
        {activePriority && (
          <button
            onClick={() => onPriorityFilter(null)}
            className="ml-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Export */}
      <Button variant="ghost" size="sm" className="h-8" onClick={handleExport}>
        <Download className="mr-1 h-3.5 w-3.5" />
        <span className="text-xs">CSV</span>
      </Button>
    </div>
  );
}
