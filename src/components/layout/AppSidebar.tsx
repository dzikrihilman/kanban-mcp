/**
 * App Sidebar
 * Project list, project creation, and navigation
 */

"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FolderKanban,
  Plus,
  Settings,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useKanbanStore } from "@/hooks/useKanbanStore";

export default function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const {
    projects,
    activeProjectId,
    fetchProjects,
    setActiveProject,
    createProject,
  } = useKanbanStore();

  const [showNewProject, setShowNewProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleCreateProject = async () => {
    if (!newProjectName.trim()) return;
    const project = await createProject({ name: newProjectName.trim() });
    setNewProjectName("");
    setShowNewProject(false);
    setActiveProject(project.id);
    router.push(`/projects/${project.id}`);
  };

  return (
    <aside className="flex w-60 flex-col border-r border-border bg-card">
      <div className="flex items-center gap-2 px-4 py-4">
        <FolderKanban className="h-5 w-5 text-primary" />
        <span className="text-base font-bold tracking-tight">Kanban MCP</span>
      </div>

      <Separator />

      <nav className="flex flex-col gap-1 px-2 py-3">
        <Button
          variant={pathname === "/" ? "secondary" : "ghost"}
          className="justify-start"
          onClick={() => router.push("/")}
        >
          <LayoutDashboard className="mr-2 h-4 w-4" />
          Dashboard
        </Button>
      </nav>

      <Separator />

      <div className="flex items-center justify-between px-4 py-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Projects
        </span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setShowNewProject(true)}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="space-y-0.5">
          {projects.map((project) => (
            <Button
              key={project.id}
              variant={activeProjectId === project.id ? "secondary" : "ghost"}
              className="w-full justify-between text-sm"
              onClick={() => {
                setActiveProject(project.id);
                router.push(`/projects/${project.id}`);
              }}
            >
              <span className="truncate">{project.name}</span>
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <span className="text-xs">{project.taskCount}</span>
                <ChevronRight className="h-3 w-3" />
              </div>
            </Button>
          ))}

          {projects.length === 0 && (
            <p className="px-2 py-4 text-center text-xs text-muted-foreground">
              No projects yet
            </p>
          )}
        </div>
      </ScrollArea>

      {/* New project dialog */}
      <Dialog open={showNewProject} onOpenChange={setShowNewProject}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label htmlFor="project-name" className="text-sm font-medium">
              Project Name
            </label>
            <Input
              id="project-name"
              placeholder="My awesome project"
              value={newProjectName}
              onChange={(e) => setNewProjectName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateProject();
              }}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewProject(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleCreateProject}
              disabled={!newProjectName.trim()}
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
