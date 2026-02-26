/**
 * Kanban Column
 * A droppable column that holds task cards
 * Displays column header with task count and supports adding new tasks
 */

"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import TaskCard from "./TaskCard";
import type { TaskWithLabels } from "@/types";
import { TASK_STATUS_CONFIG } from "@/types";

interface KanbanColumnProps {
  status: TaskWithLabels["status"];
  tasks: TaskWithLabels[];
  onAddTask: (status: TaskWithLabels["status"]) => void;
  onEditTask: (task: TaskWithLabels) => void;
}

const STATUS_COLORS: Record<string, string> = {
  backlog: "bg-zinc-500",
  todo: "bg-blue-500",
  in_progress: "bg-amber-500",
  in_review: "bg-purple-500",
  done: "bg-emerald-500",
};

export default function KanbanColumn({
  status,
  tasks,
  onAddTask,
  onEditTask,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const config = TASK_STATUS_CONFIG[status];

  return (
    <div
      className={`flex w-72 shrink-0 flex-col rounded-lg border border-border/50 bg-muted/30 transition-colors ${
        isOver ? "border-primary/50 bg-primary/5" : ""
      }`}
    >
      <div className="flex items-center justify-between px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${STATUS_COLORS[status]}`} />
          <h3 className="text-sm font-semibold">{config.label}</h3>
          <span className="rounded-full bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
            {tasks.length}
          </span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => onAddTask(status)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2 pb-2">
        <div
          ref={setNodeRef}
          className="space-y-2 py-1"
          style={{ minHeight: 40 }}
        >
          <SortableContext
            items={tasks.map((t) => t.id)}
            strategy={verticalListSortingStrategy}
          >
            {tasks.map((task) => (
              <TaskCard key={task.id} task={task} onEdit={onEditTask} />
            ))}
          </SortableContext>
        </div>
      </ScrollArea>
    </div>
  );
}
