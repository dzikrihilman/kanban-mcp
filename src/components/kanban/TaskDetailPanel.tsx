/**
 * Task Detail Panel
 * Full task view with tabs: Details, Comments, Activity, Sub-tasks
 */

"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  MessageSquare,
  Activity,
  ListChecks,
  Tag,
  Send,
  Trash2,
  Plus,
  ArrowRight,
  Clock,
  CheckCircle2,
  Circle,
  Save,
  X,
} from "lucide-react";
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/types";
import type { TaskWithLabels } from "@/types";

interface Comment {
  id: string;
  taskId: string;
  content: string;
  author: string;
  createdAt: string;
}

interface ActivityItem {
  id: string;
  action: string;
  details: string;
  actor: string;
  createdAt: string;
}

interface Label {
  id: string;
  projectId: string;
  name: string;
  color: string;
}

interface TaskDetailPanelProps {
  task: TaskWithLabels | null;
  open: boolean;
  onClose: () => void;
  onUpdate: (taskId: string, updates: Partial<TaskWithLabels>) => Promise<void>;
  onDelete: (taskId: string) => Promise<void>;
  projectId: string;
}

const ACTION_LABELS: Record<string, string> = {
  task_created: "Created",
  status_changed: "Status changed",
  priority_changed: "Priority changed",
  task_deleted: "Deleted",
};

export default function TaskDetailPanel({
  task,
  open,
  onClose,
  onUpdate,
  onDelete,
  projectId,
}: TaskDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [comments, setComments] = useState<Comment[]>([]);
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [subtasks, setSubtasks] = useState<TaskWithLabels[]>([]);
  const [labels, setLabels] = useState<Label[]>([]);
  const [newComment, setNewComment] = useState("");
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!task) return;
    const res = await fetch(`/api/comments?taskId=${task.id}`);
    if (res.ok) setComments(await res.json());
  }, [task]);

  const fetchActivities = useCallback(async () => {
    if (!task) return;
    const res = await fetch(`/api/activity?taskId=${task.id}&limit=20`);
    if (res.ok) setActivities(await res.json());
  }, [task]);

  const fetchSubtasks = useCallback(async () => {
    if (!task || !projectId) return;
    const res = await fetch(`/api/tasks?projectId=${projectId}`);
    if (res.ok) {
      const allTasks = await res.json();
      setSubtasks(
        allTasks.filter((t: TaskWithLabels) => t.parentTaskId === task.id),
      );
    }
  }, [task, projectId]);

  const fetchLabels = useCallback(async () => {
    if (!projectId) return;
    const res = await fetch(`/api/labels?projectId=${projectId}`);
    if (res.ok) setLabels(await res.json());
  }, [projectId]);

  useEffect(() => {
    if (task && open) {
      setEditTitle(task.title);
      setEditDescription(task.description || "");
      setIsEditing(false);
      fetchComments();
      fetchActivities();
      fetchSubtasks();
      fetchLabels();
    }
  }, [task, open, fetchComments, fetchActivities, fetchSubtasks, fetchLabels]);

  if (!task) return null;

  const handleSave = async () => {
    setIsSaving(true);
    await onUpdate(task.id, {
      title: editTitle,
      description: editDescription,
    });
    setIsEditing(false);
    setIsSaving(false);
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        taskId: task.id,
        content: newComment.trim(),
        author: "user",
      }),
    });
    setNewComment("");
    fetchComments();
  };

  const handleDeleteComment = async (commentId: string) => {
    await fetch(`/api/comments/${commentId}`, { method: "DELETE" });
    fetchComments();
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        projectId,
        title: newSubtaskTitle.trim(),
        parentTaskId: task.id,
        status: "todo",
        priority: "medium",
      }),
    });
    setNewSubtaskTitle("");
    fetchSubtasks();
  };

  const handleToggleSubtask = async (subtask: TaskWithLabels) => {
    const newStatus = subtask.status === "done" ? "todo" : "done";
    await fetch(`/api/tasks/${subtask.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchSubtasks();
  };

  const statusConfig =
    TASK_STATUS_CONFIG[task.status as keyof typeof TASK_STATUS_CONFIG];
  const priorityConfig =
    TASK_PRIORITY_CONFIG[task.priority as keyof typeof TASK_PRIORITY_CONFIG];
  const completedSubtasks = subtasks.filter((s) => s.status === "done").length;

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent className="w-full sm:max-w-xl p-0 flex flex-col">
        <SheetHeader className="px-6 pt-6 pb-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              {isEditing ? (
                <Input
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="text-lg font-bold"
                  autoFocus
                />
              ) : (
                <SheetTitle
                  className="cursor-pointer text-lg"
                  onClick={() => setIsEditing(true)}
                >
                  {task.title}
                </SheetTitle>
              )}
              <div className="flex items-center gap-2">
                <Badge variant="outline">{statusConfig?.label}</Badge>
                <Badge
                  variant="outline"
                  style={{
                    borderColor: priorityConfig?.color,
                    color: priorityConfig?.color,
                  }}
                >
                  {priorityConfig?.label}
                </Badge>
              </div>
            </div>
          </div>
        </SheetHeader>

        {/* Status and Priority selectors */}
        <div className="px-6 pb-3 space-y-3">
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Status
            </span>
            <div className="flex flex-wrap gap-1">
              {(
                Object.entries(TASK_STATUS_CONFIG) as [
                  string,
                  { label: string },
                ][]
              ).map(([key, config]) => (
                <Badge
                  key={key}
                  variant={task.status === key ? "default" : "outline"}
                  className="cursor-pointer text-xs transition-all"
                  onClick={() =>
                    onUpdate(task.id, {
                      status: key as TaskWithLabels["status"],
                    })
                  }
                >
                  {config.label}
                </Badge>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">
              Priority
            </span>
            <div className="flex flex-wrap gap-1">
              {(
                Object.entries(TASK_PRIORITY_CONFIG) as [
                  string,
                  { label: string; color: string },
                ][]
              ).map(([key, config]) => (
                <Badge
                  key={key}
                  variant={task.priority === key ? "default" : "outline"}
                  className="cursor-pointer text-xs transition-all"
                  style={
                    task.priority === key
                      ? {
                          backgroundColor: config.color,
                          borderColor: config.color,
                        }
                      : { borderColor: config.color, color: config.color }
                  }
                  onClick={() =>
                    onUpdate(task.id, {
                      priority: key as TaskWithLabels["priority"],
                    })
                  }
                >
                  {config.label}
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <Separator />

        <Tabs
          defaultValue="details"
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="mx-6 mt-2 w-fit">
            <TabsTrigger value="details" className="text-xs">
              <ListChecks className="mr-1 h-3.5 w-3.5" />
              Details
            </TabsTrigger>
            <TabsTrigger value="comments" className="text-xs">
              <MessageSquare className="mr-1 h-3.5 w-3.5" />
              Comments ({comments.length})
            </TabsTrigger>
            <TabsTrigger value="activity" className="text-xs">
              <Activity className="mr-1 h-3.5 w-3.5" />
              Activity
            </TabsTrigger>
          </TabsList>

          {/* Details + Sub-tasks Tab */}
          <TabsContent value="details" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full px-6 py-3">
              {/* Description */}
              <div className="space-y-2 mb-6">
                <span className="text-sm font-medium">Description</span>
                {isEditing ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      rows={5}
                      placeholder="Describe the task..."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving}
                      >
                        <Save className="mr-1 h-3.5 w-3.5" />
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                      >
                        <X className="mr-1 h-3.5 w-3.5" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p
                    className="text-sm text-muted-foreground cursor-pointer whitespace-pre-wrap rounded-md border border-transparent p-2 transition-colors hover:border-border"
                    onClick={() => setIsEditing(true)}
                  >
                    {task.description || "Click to add description..."}
                  </p>
                )}
              </div>

              {/* Labels */}
              <div className="space-y-2 mb-6">
                <span className="text-sm font-medium flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" />
                  Labels
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {task.labels?.map((label) => (
                    <Badge
                      key={label.id}
                      style={{ backgroundColor: label.color }}
                      className="text-white text-xs"
                    >
                      {label.name}
                    </Badge>
                  ))}
                  {labels
                    .filter((l) => !task.labels?.some((tl) => tl.id === l.id))
                    .map((label) => (
                      <Badge
                        key={label.id}
                        variant="outline"
                        className="cursor-pointer text-xs opacity-50 hover:opacity-100 transition-opacity"
                        style={{ borderColor: label.color, color: label.color }}
                        onClick={async () => {
                          await fetch("/api/task-labels", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              taskId: task.id,
                              labelId: label.id,
                            }),
                          });
                          // Refresh parent
                          fetchLabels();
                        }}
                      >
                        + {label.name}
                      </Badge>
                    ))}
                </div>
              </div>

              <Separator className="mb-4" />

              {/* Sub-tasks */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium flex items-center gap-1.5">
                    <ListChecks className="h-3.5 w-3.5" />
                    Sub-tasks
                    {subtasks.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        ({completedSubtasks}/{subtasks.length})
                      </span>
                    )}
                  </span>
                </div>

                {subtasks.length > 0 && (
                  <div className="h-1.5 rounded-full bg-muted mb-2">
                    <div
                      className="h-1.5 rounded-full bg-emerald-500 transition-all"
                      style={{
                        width: `${subtasks.length > 0 ? (completedSubtasks / subtasks.length) * 100 : 0}%`,
                      }}
                    />
                  </div>
                )}

                <div className="space-y-1">
                  {subtasks.map((subtask) => (
                    <div
                      key={subtask.id}
                      className="flex items-center gap-2 rounded-md p-1.5 hover:bg-muted/50 transition-colors"
                    >
                      <button
                        onClick={() => handleToggleSubtask(subtask)}
                        className="flex-shrink-0"
                      >
                        {subtask.status === "done" ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <Circle className="h-4 w-4 text-muted-foreground" />
                        )}
                      </button>
                      <span
                        className={`flex-1 text-sm ${
                          subtask.status === "done"
                            ? "line-through text-muted-foreground"
                            : ""
                        }`}
                      >
                        {subtask.title}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Input
                    placeholder="Add sub-task..."
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAddSubtask();
                    }}
                    className="h-8 text-sm"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleAddSubtask}
                    disabled={!newSubtaskTitle.trim()}
                    className="h-8 px-2"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Delete */}
              <Separator className="my-4" />
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete(task.id);
                  onClose();
                }}
                className="w-full"
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Delete Task
              </Button>
            </ScrollArea>
          </TabsContent>

          {/* Comments Tab */}
          <TabsContent
            value="comments"
            className="flex-1 overflow-hidden mt-0 flex flex-col"
          >
            <ScrollArea className="flex-1 px-6 py-3">
              {comments.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No comments yet
                </p>
              ) : (
                <div className="space-y-3">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="space-y-1 rounded-lg border border-border/50 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">
                          {comment.author}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.createdAt).toLocaleString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>
            <div className="border-t border-border px-6 py-3">
              <div className="flex items-center gap-2">
                <Input
                  placeholder="Add a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleAddComment();
                    }
                  }}
                  className="h-9"
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="h-9 px-3"
                >
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Activity Tab */}
          <TabsContent value="activity" className="flex-1 overflow-hidden mt-0">
            <ScrollArea className="h-full px-6 py-3">
              {activities.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-8">
                  No activity yet
                </p>
              ) : (
                <div className="space-y-3">
                  {activities.map((activity) => {
                    const details = activity.details
                      ? JSON.parse(activity.details)
                      : {};
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 text-sm"
                      >
                        <Clock className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1 space-y-0.5">
                          <p>
                            <span className="font-medium">
                              {ACTION_LABELS[activity.action] ||
                                activity.action}
                            </span>
                            {" by "}
                            <span className="text-muted-foreground">
                              {activity.actor}
                            </span>
                          </p>
                          {details.from && details.to && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Badge variant="outline" className="text-xs">
                                {details.from}
                              </Badge>
                              <ArrowRight className="h-3 w-3" />
                              <Badge variant="outline" className="text-xs">
                                {details.to}
                              </Badge>
                            </div>
                          )}
                          <span className="text-xs text-muted-foreground">
                            {new Date(activity.createdAt).toLocaleString(
                              "id-ID",
                              {
                                day: "numeric",
                                month: "short",
                                hour: "2-digit",
                                minute: "2-digit",
                              },
                            )}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
