/**
 * Dashboard Page (Enhanced)
 * Summary cards, donut charts for status/priority, bar chart for trends,
 * recent activity feed, and export button
 */

"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  FolderKanban,
  ListTodo,
  CheckCircle2,
  Clock,
  Activity,
  ArrowRight,
  Download,
  TrendingUp,
} from "lucide-react";
import { useKanbanStore } from "@/hooks/useKanbanStore";
import { TASK_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from "@/types";
import DonutChart from "@/components/charts/DonutChart";
import MiniBarChart from "@/components/charts/MiniBarChart";

const ACTION_LABELS: Record<string, string> = {
  task_created: "Created task",
  status_changed: "Changed status",
  priority_changed: "Changed priority",
  task_deleted: "Deleted task",
};

const STATUS_COLORS: Record<string, string> = {
  backlog: "#64748b",
  todo: "#3b82f6",
  in_progress: "#f59e0b",
  in_review: "#8b5cf6",
  done: "#22c55e",
};

interface AnalyticsData {
  createdTrend: { date: string; count: number }[];
  completedTrend: { date: string; count: number }[];
  tasksPerProject: {
    projectId: string;
    projectName: string | null;
    total: number;
    done: number;
    inProgress: number;
  }[];
}

export default function DashboardView() {
  const { dashboard, fetchDashboard, isLoading } = useKanbanStore();
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchDashboard();
    fetch("/api/analytics")
      .then((r) => r.json())
      .then(setAnalytics)
      .catch(console.error);
  }, [fetchDashboard]);

  const handleExport = () => {
    window.open("/api/export", "_blank");
  };

  if (isLoading && !dashboard) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        Loading dashboard...
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="flex flex-1 items-center justify-center text-muted-foreground">
        No data yet. Create a project to get started.
      </div>
    );
  }

  const inProgress = dashboard.tasksByStatus["in_progress"] || 0;
  const done = dashboard.tasksByStatus["done"] || 0;
  const inReview = dashboard.tasksByStatus["in_review"] || 0;

  const statusDonutData = Object.entries(TASK_STATUS_CONFIG).map(
    ([key, config]) => ({
      label: config.label,
      value: dashboard.tasksByStatus[key] || 0,
      color: STATUS_COLORS[key] || "#64748b",
    }),
  );

  const priorityDonutData = Object.entries(TASK_PRIORITY_CONFIG).map(
    ([key, config]) => ({
      label: config.label,
      value: dashboard.tasksByPriority[key] || 0,
      color: config.color,
    }),
  );

  const trendData =
    analytics?.createdTrend.map((d) => ({
      label: new Date(d.date).toLocaleDateString("id-ID", {
        day: "numeric",
        month: "short",
      }),
      value: d.count,
    })) || [];

  return (
    <div className="flex-1 space-y-6 overflow-y-auto p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Overview of all your projects and tasks
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={handleExport}>
          <Download className="mr-1.5 h-3.5 w-3.5" />
          Export CSV
        </Button>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Projects
            </CardTitle>
            <FolderKanban className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard.totalProjects}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Tasks
            </CardTitle>
            <ListTodo className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{dashboard.totalTasks}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              In Progress
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{inProgress + inReview}</div>
            <p className="text-xs text-muted-foreground">
              {inProgress} working, {inReview} in review
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Completed
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{done}</div>
            {dashboard.totalTasks > 0 && (
              <p className="text-xs text-muted-foreground">
                {Math.round((done / dashboard.totalTasks) * 100)}% completion
                rate
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={statusDonutData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Priority Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <DonutChart data={priorityDonutData} />
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              Tasks Created (14 days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <MiniBarChart data={trendData} color="#3b82f6" />
          </CardContent>
        </Card>
      </div>

      {/* Project breakdown + Activity */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Per-project breakdown */}
        {analytics && analytics.tasksPerProject.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {analytics.tasksPerProject.map((project) => {
                  const completionPct =
                    project.total > 0
                      ? Math.round((project.done / project.total) * 100)
                      : 0;
                  return (
                    <div key={project.projectId} className="space-y-1.5">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">
                          {project.projectName || "Unknown"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {project.done}/{project.total} done ({completionPct}%)
                        </span>
                      </div>
                      <div className="flex h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 transition-all"
                          style={{
                            width: `${(project.done / Math.max(project.total, 1)) * 100}%`,
                          }}
                        />
                        <div
                          className="h-full bg-amber-500 transition-all"
                          style={{
                            width: `${(project.inProgress / Math.max(project.total, 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="h-4 w-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-64">
              {dashboard.recentActivity.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground">
                  No activity yet
                </p>
              ) : (
                <div className="space-y-3">
                  {dashboard.recentActivity.map((activity) => {
                    const details = activity.details
                      ? JSON.parse(activity.details)
                      : {};
                    return (
                      <div
                        key={activity.id}
                        className="flex items-start gap-3 rounded-lg border border-border/50 p-3"
                      >
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              {ACTION_LABELS[activity.action] ||
                                activity.action}
                            </span>
                            {activity.projectName && (
                              <Badge variant="outline" className="text-xs">
                                {activity.projectName}
                              </Badge>
                            )}
                          </div>
                          {details.title && (
                            <p className="text-sm text-muted-foreground">
                              {details.title}
                            </p>
                          )}
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
                        </div>
                        <span className="whitespace-nowrap text-xs text-muted-foreground">
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
                    );
                  })}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
