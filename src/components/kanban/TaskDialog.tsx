/**
 * Task Dialog
 * Create/edit task with title, description, status, priority
 */

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/types";

interface TaskDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string) => Promise<void>;
  onDelete?: () => Promise<void>;
  onStatusChange?: (status: string) => Promise<void>;
  onPriorityChange?: (priority: string) => Promise<void>;
  mode: "create" | "edit";
  defaultTitle?: string;
  defaultDescription?: string;
  defaultStatus?: string;
  defaultPriority?: string;
}

export default function TaskDialog({
  open,
  onClose,
  onSubmit,
  onDelete,
  onStatusChange,
  onPriorityChange,
  mode,
  defaultTitle = "",
  defaultDescription = "",
  defaultStatus = "backlog",
  defaultPriority = "medium",
}: TaskDialogProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim()) return;
    setIsSubmitting(true);
    await onSubmit(title.trim(), description.trim());
    setIsSubmitting(false);
    if (mode === "create") {
      setTitle("");
      setDescription("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "New Task" : "Edit Task"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <label htmlFor="task-title" className="text-sm font-medium">
              Title
            </label>
            <Input
              id="task-title"
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="task-description" className="text-sm font-medium">
              Description
            </label>
            <Textarea
              id="task-description"
              placeholder="Describe the task..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
          </div>

          {mode === "edit" && (
            <>
              <div className="space-y-2">
                <label className="text-sm font-medium">Status</label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    Object.entries(TASK_STATUS_CONFIG) as [
                      string,
                      { label: string },
                    ][]
                  ).map(([key, config]) => (
                    <Badge
                      key={key}
                      variant={defaultStatus === key ? "default" : "outline"}
                      className="cursor-pointer transition-all"
                      onClick={() => onStatusChange?.(key)}
                    >
                      {config.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Priority</label>
                <div className="flex flex-wrap gap-1.5">
                  {(
                    Object.entries(TASK_PRIORITY_CONFIG) as [
                      string,
                      { label: string; color: string },
                    ][]
                  ).map(([key, config]) => (
                    <Badge
                      key={key}
                      variant={defaultPriority === key ? "default" : "outline"}
                      className="cursor-pointer transition-all"
                      style={
                        defaultPriority === key
                          ? {
                              backgroundColor: config.color,
                              borderColor: config.color,
                            }
                          : { borderColor: config.color, color: config.color }
                      }
                      onClick={() => onPriorityChange?.(key)}
                    >
                      {config.label}
                    </Badge>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        <DialogFooter className="flex items-center justify-between">
          {mode === "edit" && onDelete && (
            <Button
              variant="destructive"
              size="sm"
              onClick={onDelete}
              className="mr-auto"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Delete
            </Button>
          )}
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !title.trim()}
            >
              {mode === "create" ? "Create" : "Save"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
