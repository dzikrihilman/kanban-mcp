/**
 * Shared type definitions for Kanban MCP
 * 1. Task and Project types re-exported from schema
 * 2. API request/response types
 * 3. Kanban board types
 */

export type {
  Project,
  NewProject,
  Task,
  NewTask,
  Label,
  NewLabel,
  Comment,
  NewComment,
  ActivityLog,
  TaskStatus,
  TaskPriority,
} from "@/lib/db/schema";

export interface TaskWithLabels {
  id: string;
  projectId: string;
  parentTaskId: string | null;
  title: string;
  description: string | null;
  status: "backlog" | "todo" | "in_progress" | "in_review" | "done";
  priority: "critical" | "high" | "medium" | "low";
  assignee: string | null;
  dueDate: string | null;
  position: number;
  createdAt: string;
  updatedAt: string;
  labels: { id: string; name: string; color: string }[];
  subtaskCount: number;
  subtaskDoneCount: number;
  commentCount: number;
}

export interface KanbanColumn {
  id: TaskWithLabels["status"];
  title: string;
  tasks: TaskWithLabels[];
}

export interface DashboardSummary {
  totalProjects: number;
  totalTasks: number;
  tasksByStatus: Record<string, number>;
  tasksByPriority: Record<string, number>;
  recentActivity: {
    id: string;
    action: string;
    details: string | null;
    taskTitle?: string;
    projectName?: string;
    createdAt: string;
  }[];
}

export const TASK_STATUS_CONFIG = {
  backlog: { label: "Backlog", order: 0 },
  todo: { label: "Todo", order: 1 },
  in_progress: { label: "In Progress", order: 2 },
  in_review: { label: "In Review", order: 3 },
  done: { label: "Done", order: 4 },
} as const;

export const TASK_PRIORITY_CONFIG = {
  critical: { label: "Critical", color: "hsl(0, 84%, 60%)" },
  high: { label: "High", color: "hsl(25, 95%, 53%)" },
  medium: { label: "Medium", color: "hsl(48, 96%, 53%)" },
  low: { label: "Low", color: "hsl(142, 71%, 45%)" },
} as const;
