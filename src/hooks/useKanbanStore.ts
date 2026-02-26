/**
 * Kanban Store (Zustand)
 * 1. Project state and CRUD operations
 * 2. Task state, filtering, and CRUD operations
 * 3. Dashboard summary state
 */

import { create } from "zustand";
import type { TaskWithLabels, DashboardSummary } from "@/types";

interface ProjectItem {
  id: string;
  name: string;
  description: string | null;
  repoUrl: string | null;
  createdAt: string;
  updatedAt: string;
  taskCount: number;
}

interface KanbanState {
  projects: ProjectItem[];
  activeProjectId: string | null;
  tasks: TaskWithLabels[];
  dashboard: DashboardSummary | null;
  isLoading: boolean;
  error: string | null;

  // Project actions
  fetchProjects: () => Promise<void>;
  setActiveProject: (id: string) => void;
  createProject: (data: { name: string; description?: string; repoUrl?: string }) => Promise<ProjectItem>;
  updateProject: (id: string, data: Partial<ProjectItem>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;

  // Task actions
  fetchTasks: (projectId: string) => Promise<void>;
  createTask: (data: {
    projectId: string;
    title: string;
    description?: string;
    status?: string;
    priority?: string;
  }) => Promise<void>;
  updateTask: (id: string, data: Partial<TaskWithLabels>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  moveTask: (taskId: string, newStatus: string, newPosition: number) => Promise<void>;

  // Dashboard
  fetchDashboard: () => Promise<void>;
}

export const useKanbanStore = create<KanbanState>((set, get) => ({
  projects: [],
  activeProjectId: null,
  tasks: [],
  dashboard: null,
  isLoading: false,
  error: null,

  fetchProjects: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/projects");
      const data = await res.json();
      set({ projects: data, isLoading: false });

      // Auto-select first project if none selected
      if (!get().activeProjectId && data.length > 0) {
        set({ activeProjectId: data[0].id });
        get().fetchTasks(data[0].id);
      }
    } catch {
      set({ error: "Failed to fetch projects", isLoading: false });
    }
  },

  setActiveProject: (id: string) => {
    set({ activeProjectId: id });
    get().fetchTasks(id);
  },

  createProject: async (data) => {
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const project = await res.json();
    set((state) => ({
      projects: [...state.projects, { ...project, taskCount: 0 }],
    }));
    return project;
  },

  updateProject: async (id, data) => {
    await fetch(`/api/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    set((state) => ({
      projects: state.projects.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
    }));
  },

  deleteProject: async (id) => {
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    set((state) => ({
      projects: state.projects.filter((p) => p.id !== id),
      activeProjectId:
        state.activeProjectId === id ? null : state.activeProjectId,
    }));
  },

  fetchTasks: async (projectId: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`/api/tasks?projectId=${projectId}`);
      const data = await res.json();
      set({ tasks: data, isLoading: false });
    } catch {
      set({ error: "Failed to fetch tasks", isLoading: false });
    }
  },

  createTask: async (data) => {
    const res = await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const task = await res.json();
    set((state) => ({ tasks: [...state.tasks, task] }));
  },

  updateTask: async (id, data) => {
    const res = await fetch(`/api/tasks/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    const updated = await res.json();
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, ...updated } : t
      ),
    }));
  },

  deleteTask: async (id) => {
    await fetch(`/api/tasks/${id}`, { method: "DELETE" });
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },

  moveTask: async (taskId, newStatus, newPosition) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === taskId
          ? {
              ...t,
              status: newStatus as TaskWithLabels["status"],
              position: newPosition,
            }
          : t
      ),
    }));

    await fetch("/api/tasks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ taskId, newStatus, newPosition }),
    });

    // Refetch to sync positions
    const projectId = get().activeProjectId;
    if (projectId) {
      get().fetchTasks(projectId);
    }
  },

  fetchDashboard: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      set({ dashboard: data, isLoading: false });
    } catch {
      set({ error: "Failed to fetch dashboard", isLoading: false });
    }
  },
}));
