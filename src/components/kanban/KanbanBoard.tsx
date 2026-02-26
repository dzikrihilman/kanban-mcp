/**
 * Kanban Board
 * Full board with drag-and-drop across status columns
 * Orchestrates DnD context, column rendering, and task detail panel
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import KanbanColumn from "./KanbanColumn";
import TaskCard from "./TaskCard";
import TaskDialog from "./TaskDialog";
import TaskDetailPanel from "./TaskDetailPanel";
import FilterBar from "./FilterBar";
import { useKanbanStore } from "@/hooks/useKanbanStore";
import { TASK_STATUS_CONFIG } from "@/types";
import type { TaskWithLabels } from "@/types";

export default function KanbanBoard() {
  const {
    tasks,
    activeProjectId,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    fetchTasks,
  } = useKanbanStore();
  const [activeTask, setActiveTask] = useState<TaskWithLabels | null>(null);
  const [selectedTask, setSelectedTask] = useState<TaskWithLabels | null>(null);
  const [newTaskStatus, setNewTaskStatus] = useState<
    TaskWithLabels["status"] | null
  >(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  );

  const columns = useMemo(() => {
    const statusKeys = Object.keys(
      TASK_STATUS_CONFIG,
    ) as TaskWithLabels["status"][];
    return statusKeys.map((status) => ({
      status,
      tasks: tasks
        .filter((t) => {
          if (t.status !== status) return false;
          if (t.parentTaskId) return false;
          if (
            searchQuery &&
            !t.title.toLowerCase().includes(searchQuery.toLowerCase())
          )
            return false;
          if (priorityFilter && t.priority !== priorityFilter) return false;
          return true;
        })
        .sort((a, b) => a.position - b.position),
    }));
  }, [tasks, searchQuery, priorityFilter]);

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const task = tasks.find((t) => t.id === event.active.id);
      if (task) setActiveTask(task);
    },
    [tasks],
  );

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Visual feedback handled by KanbanColumn's isOver
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveTask(null);
      const { active, over } = event;
      if (!over) return;

      const taskId = active.id as string;

      let newStatus: string;
      let newPosition: number;

      const statusKeys = Object.keys(TASK_STATUS_CONFIG);
      if (statusKeys.includes(over.id as string)) {
        newStatus = over.id as string;
        const columnTasks = tasks.filter((t) => t.status === newStatus);
        newPosition = columnTasks.length;
      } else {
        const overTask = tasks.find((t) => t.id === over.id);
        if (!overTask) return;
        newStatus = overTask.status;
        newPosition = overTask.position;
      }

      const currentTask = tasks.find((t) => t.id === taskId);
      if (
        currentTask &&
        (currentTask.status !== newStatus ||
          currentTask.position !== newPosition)
      ) {
        moveTask(taskId, newStatus, newPosition);
      }
    },
    [tasks, moveTask],
  );

  const handleAddTask = useCallback((status: TaskWithLabels["status"]) => {
    setNewTaskStatus(status);
  }, []);

  const handleCreateTask = useCallback(
    async (title: string, description: string) => {
      if (!activeProjectId || !newTaskStatus) return;
      await createTask({
        projectId: activeProjectId,
        title,
        description,
        status: newTaskStatus,
      });
      setNewTaskStatus(null);
    },
    [activeProjectId, newTaskStatus, createTask],
  );

  const handleUpdateTask = useCallback(
    async (taskId: string, updates: Partial<TaskWithLabels>) => {
      await updateTask(taskId, updates);
      // Refresh task in panel
      if (activeProjectId) {
        await fetchTasks(activeProjectId);
      }
      setSelectedTask((prev) => (prev ? { ...prev, ...updates } : null));
    },
    [updateTask, fetchTasks, activeProjectId],
  );

  const handleDeleteTask = useCallback(
    async (taskId: string) => {
      await deleteTask(taskId);
      setSelectedTask(null);
    },
    [deleteTask],
  );

  if (!activeProjectId) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        <p>Select or create a project to get started</p>
      </div>
    );
  }

  return (
    <>
      <FilterBar
        onSearchChange={setSearchQuery}
        onPriorityFilter={setPriorityFilter}
        activePriority={priorityFilter}
        projectId={activeProjectId}
      />
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-1 gap-4 overflow-x-auto p-4">
          {columns.map(({ status, tasks: columnTasks }) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={columnTasks}
              onAddTask={handleAddTask}
              onEditTask={setSelectedTask}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask && (
            <div className="w-72">
              <TaskCard task={activeTask} onEdit={() => {}} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* New task dialog */}
      <TaskDialog
        open={newTaskStatus !== null}
        onClose={() => setNewTaskStatus(null)}
        onSubmit={handleCreateTask}
        mode="create"
        defaultStatus={newTaskStatus || "backlog"}
      />

      {/* Task detail panel (side sheet) */}
      <TaskDetailPanel
        task={selectedTask}
        open={selectedTask !== null}
        onClose={() => setSelectedTask(null)}
        onUpdate={handleUpdateTask}
        onDelete={handleDeleteTask}
        projectId={activeProjectId}
      />
    </>
  );
}
