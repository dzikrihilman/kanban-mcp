/**
 * Kanban Task Card
 * Displays task info: title, priority badge, labels, subtask indicator, due date
 * Used inside the KanbanColumn as a draggable item
 */

"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  GripVertical,
  MessageSquare,
  ListChecks,
  Calendar,
} from "lucide-react";
import type { TaskWithLabels } from "@/types";
import { TASK_PRIORITY_CONFIG } from "@/types";

interface TaskCardProps {
  task: TaskWithLabels;
  onEdit: (task: TaskWithLabels) => void;
}

export default function TaskCard({ task, onEdit }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id, data: { task } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityConfig = TASK_PRIORITY_CONFIG[task.priority];

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className="group cursor-pointer border border-border/50 bg-card p-3 shadow-sm transition-all hover:border-border hover:shadow-md"
      onClick={() => onEdit(task)}
    >
      <div className="flex items-start gap-2">
        <button
          {...attributes}
          {...listeners}
          className="mt-0.5 shrink-0 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <div className="min-w-0 flex-1 space-y-2">
          <p className="text-sm font-medium leading-snug">{task.title}</p>

          <div className="flex flex-wrap items-center gap-1.5">
            <Badge
              variant="outline"
              className="text-xs"
              style={{
                borderColor: priorityConfig.color,
                color: priorityConfig.color,
              }}
            >
              {priorityConfig.label}
            </Badge>

            {task.labels.map((label) => (
              <Badge
                key={label.id}
                variant="secondary"
                className="text-xs"
                style={{
                  backgroundColor: `${label.color}20`,
                  color: label.color,
                }}
              >
                {label.name}
              </Badge>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            {task.subtaskCount > 0 && (
              <span className="flex items-center gap-1">
                <ListChecks className="h-3 w-3" />
                {task.subtaskDoneCount}/{task.subtaskCount}
              </span>
            )}
            {task.commentCount > 0 && (
              <span className="flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                {task.commentCount}
              </span>
            )}
            {task.dueDate && (
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                {new Date(task.dueDate).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
