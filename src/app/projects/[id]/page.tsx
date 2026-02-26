/**
 * Kanban Board Page
 * Shows the kanban board for a specific project
 */

"use client";

import { useEffect, use } from "react";
import KanbanBoard from "@/components/kanban/KanbanBoard";
import LabelManager from "@/components/kanban/LabelManager";
import { useKanbanStore } from "@/hooks/useKanbanStore";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function ProjectPage({ params }: PageProps) {
  const { id } = use(params);
  const { setActiveProject, projects, fetchProjects } = useKanbanStore();

  useEffect(() => {
    if (projects.length === 0) {
      fetchProjects();
    }
  }, [projects.length, fetchProjects]);

  useEffect(() => {
    if (id) {
      setActiveProject(id);
    }
  }, [id, setActiveProject]);

  const project = projects.find((p) => p.id === id);

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-border px-6 py-3">
        <div>
          <h1 className="text-lg font-bold">{project?.name || "Loading..."}</h1>
          {project?.description && (
            <p className="text-xs text-muted-foreground">
              {project.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <LabelManager projectId={id} />
        </div>
      </div>
      <KanbanBoard />
    </div>
  );
}
