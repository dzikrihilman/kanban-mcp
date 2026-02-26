/**
 * Seed script: Deletes all existing data and creates realistic dummy data
 * Run: npx tsx src/lib/db/seed.ts
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { v4 as uuid } from "uuid";
import path from "path";
import { fileURLToPath } from "url";
import * as schema from "./schema";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, "../../../kanban.db");

const sqlite = new Database(DB_PATH);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite, { schema });

function daysAgo(n: number): string {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

async function seed() {
  console.log("Clearing existing data...");
  db.delete(schema.activityLog).run();
  db.delete(schema.comments).run();
  db.delete(schema.taskLabels).run();
  db.delete(schema.labels).run();
  db.delete(schema.tasks).run();
  db.delete(schema.projects).run();

  console.log("Creating projects...");
  const projects = [
    { id: uuid(), name: "E-Commerce Platform", description: "Full-stack e-commerce app with payment integration", repoUrl: "https://github.com/user/ecommerce", createdAt: daysAgo(14), updatedAt: daysAgo(0) },
    { id: uuid(), name: "Mobile Banking App", description: "React Native banking application with biometric auth", repoUrl: "https://github.com/user/banking-app", createdAt: daysAgo(10), updatedAt: daysAgo(0) },
    { id: uuid(), name: "AI Chatbot Service", description: "LLM-powered customer support chatbot", repoUrl: "https://github.com/user/ai-chatbot", createdAt: daysAgo(7), updatedAt: daysAgo(0) },
  ];

  for (const p of projects) {
    db.insert(schema.projects).values(p).run();
  }

  console.log("Creating labels...");
  const labelDefs = [
    { projectId: projects[0].id, name: "Frontend", color: "#3b82f6" },
    { projectId: projects[0].id, name: "Backend", color: "#8b5cf6" },
    { projectId: projects[0].id, name: "Bug", color: "#ef4444" },
    { projectId: projects[0].id, name: "Feature", color: "#22c55e" },
    { projectId: projects[0].id, name: "Urgent", color: "#f97316" },
    { projectId: projects[1].id, name: "iOS", color: "#06b6d4" },
    { projectId: projects[1].id, name: "Android", color: "#22c55e" },
    { projectId: projects[1].id, name: "Security", color: "#ef4444" },
    { projectId: projects[2].id, name: "ML", color: "#a855f7" },
    { projectId: projects[2].id, name: "API", color: "#3b82f6" },
    { projectId: projects[2].id, name: "Infra", color: "#64748b" },
  ];

  const labelIds: Record<string, string> = {};
  for (const l of labelDefs) {
    const id = uuid();
    labelIds[`${l.projectId}-${l.name}`] = id;
    db.insert(schema.labels).values({ id, ...l, createdAt: daysAgo(14) }).run();
  }

  console.log("Creating tasks...");
  const taskData = [
    // E-Commerce — Done
    { projectId: projects[0].id, title: "Setup Next.js project with Tailwind", status: "done", priority: "critical", position: 0, createdAt: daysAgo(14), labels: ["Frontend"] },
    { projectId: projects[0].id, title: "Design database schema", status: "done", priority: "critical", position: 1, createdAt: daysAgo(13), labels: ["Backend"] },
    { projectId: projects[0].id, title: "Implement user authentication", status: "done", priority: "high", position: 2, createdAt: daysAgo(12), labels: ["Backend", "Feature"] },
    { projectId: projects[0].id, title: "Product listing page", status: "done", priority: "high", position: 3, createdAt: daysAgo(11), labels: ["Frontend", "Feature"] },
    { projectId: projects[0].id, title: "Shopping cart functionality", status: "done", priority: "high", position: 4, createdAt: daysAgo(10), labels: ["Frontend"] },
    // E-Commerce — In Review
    { projectId: projects[0].id, title: "Stripe payment integration", status: "in_review", priority: "critical", position: 0, createdAt: daysAgo(8), labels: ["Backend", "Feature"] },
    { projectId: projects[0].id, title: "Order confirmation email", status: "in_review", priority: "medium", position: 1, createdAt: daysAgo(7), labels: ["Backend"] },
    // E-Commerce — In Progress
    { projectId: projects[0].id, title: "Admin dashboard with analytics", status: "in_progress", priority: "high", position: 0, createdAt: daysAgo(5), labels: ["Frontend", "Feature"] },
    { projectId: projects[0].id, title: "Fix cart total calculation bug", status: "in_progress", priority: "critical", position: 1, createdAt: daysAgo(3), labels: ["Frontend", "Bug"] },
    // E-Commerce — Todo
    { projectId: projects[0].id, title: "Product search with filters", status: "todo", priority: "medium", position: 0, createdAt: daysAgo(4), labels: ["Frontend"] },
    { projectId: projects[0].id, title: "Inventory management system", status: "todo", priority: "medium", position: 1, createdAt: daysAgo(4), labels: ["Backend"] },
    { projectId: projects[0].id, title: "Customer review system", status: "todo", priority: "low", position: 2, createdAt: daysAgo(3), labels: ["Feature"] },
    // E-Commerce — Backlog
    { projectId: projects[0].id, title: "Multi-language support (i18n)", status: "backlog", priority: "low", position: 0, createdAt: daysAgo(2), labels: [] },
    { projectId: projects[0].id, title: "SEO optimization", status: "backlog", priority: "medium", position: 1, createdAt: daysAgo(1), labels: [] },

    // Mobile Banking — Done
    { projectId: projects[1].id, title: "Setup React Native with Expo", status: "done", priority: "critical", position: 0, createdAt: daysAgo(10), labels: ["iOS", "Android"] },
    { projectId: projects[1].id, title: "Biometric authentication (FaceID/Fingerprint)", status: "done", priority: "critical", position: 1, createdAt: daysAgo(9), labels: ["Security"] },
    { projectId: projects[1].id, title: "Account balance and transaction history", status: "done", priority: "high", position: 2, createdAt: daysAgo(8), labels: ["iOS", "Android"] },
    // Mobile Banking — In Progress
    { projectId: projects[1].id, title: "Fund transfer between accounts", status: "in_progress", priority: "high", position: 0, createdAt: daysAgo(5), labels: ["iOS", "Android"] },
    { projectId: projects[1].id, title: "Push notification service", status: "in_progress", priority: "medium", position: 1, createdAt: daysAgo(4), labels: [] },
    // Mobile Banking — Todo
    { projectId: projects[1].id, title: "Bill payment integration", status: "todo", priority: "high", position: 0, createdAt: daysAgo(3), labels: [] },
    { projectId: projects[1].id, title: "QR code payment scanner", status: "todo", priority: "medium", position: 1, createdAt: daysAgo(2), labels: ["iOS", "Android"] },
    // Mobile Banking — Backlog
    { projectId: projects[1].id, title: "Spending analytics with charts", status: "backlog", priority: "low", position: 0, createdAt: daysAgo(1), labels: [] },

    // AI Chatbot — Done
    { projectId: projects[2].id, title: "LangChain integration with GPT-4", status: "done", priority: "critical", position: 0, createdAt: daysAgo(7), labels: ["ML"] },
    { projectId: projects[2].id, title: "RAG pipeline with vector store", status: "done", priority: "high", position: 1, createdAt: daysAgo(6), labels: ["ML", "Infra"] },
    // AI Chatbot — In Progress
    { projectId: projects[2].id, title: "Multi-turn conversation memory", status: "in_progress", priority: "high", position: 0, createdAt: daysAgo(4), labels: ["ML"] },
    { projectId: projects[2].id, title: "REST API endpoints for chat", status: "in_progress", priority: "medium", position: 1, createdAt: daysAgo(3), labels: ["API"] },
    // AI Chatbot — Todo
    { projectId: projects[2].id, title: "Admin panel for knowledge base", status: "todo", priority: "medium", position: 0, createdAt: daysAgo(2), labels: ["API"] },
    { projectId: projects[2].id, title: "Rate limiting and usage tracking", status: "todo", priority: "high", position: 1, createdAt: daysAgo(1), labels: ["API", "Infra"] },
    // AI Chatbot — Backlog
    { projectId: projects[2].id, title: "Slack and Discord integration", status: "backlog", priority: "low", position: 0, createdAt: daysAgo(0), labels: ["API"] },
  ];

  const taskIds: string[] = [];
  for (const t of taskData) {
    const id = uuid();
    taskIds.push(id);
    const { labels: taskLabelNames, ...taskFields } = t;
    db.insert(schema.tasks).values({
      id,
      ...taskFields,
      updatedAt: t.status === "done" ? daysAgo(Math.max(0, parseInt(t.createdAt) || 1)) : t.createdAt,
    }).run();

    // Assign labels
    for (const labelName of taskLabelNames) {
      const labelId = labelIds[`${t.projectId}-${labelName}`];
      if (labelId) {
        db.insert(schema.taskLabels).values({ taskId: id, labelId }).run();
      }
    }

    // Activity log
    db.insert(schema.activityLog).values({
      id: uuid(),
      taskId: id,
      projectId: t.projectId,
      action: "task_created",
      details: JSON.stringify({ title: t.title }),
      actor: "mcp-agent",
      createdAt: t.createdAt,
    }).run();

    if (t.status === "done") {
      db.insert(schema.activityLog).values({
        id: uuid(),
        taskId: id,
        projectId: t.projectId,
        action: "status_changed",
        details: JSON.stringify({ from: "in_progress", to: "done", title: t.title }),
        actor: "mcp-agent",
        createdAt: daysAgo(Math.max(0, Math.floor(Math.random() * 5))),
      }).run();
    }
  }

  console.log("Adding comments...");
  const commentData = [
    { taskId: taskIds[5], content: "Stripe test keys configured. Need to switch to live keys before deploy.", author: "mcp-agent" },
    { taskId: taskIds[5], content: "Webhook endpoint for payment confirmation is ready at /api/webhooks/stripe", author: "user" },
    { taskId: taskIds[7], content: "Using Recharts for dashboard charts. Data fetching via SWR.", author: "mcp-agent" },
    { taskId: taskIds[8], content: "Root cause: floating point precision issue with discount calculation", author: "mcp-agent" },
    { taskId: taskIds[8], content: "Fixed by using integer cents instead of float dollars", author: "mcp-agent" },
    { taskId: taskIds[17], content: "Using Plaid API for account linking. Sandbox mode working.", author: "mcp-agent" },
    { taskId: taskIds[24], content: "Implemented sliding window context with max 10 turns. Using Redis for session storage.", author: "mcp-agent" },
  ];

  for (const c of commentData) {
    db.insert(schema.comments).values({
      id: uuid(),
      ...c,
      createdAt: daysAgo(Math.floor(Math.random() * 3)),
      updatedAt: daysAgo(0),
    }).run();
  }

  console.log("Seed complete!");
  console.log(`  Projects: ${projects.length}`);
  console.log(`  Tasks: ${taskData.length}`);
  console.log(`  Labels: ${labelDefs.length}`);
  console.log(`  Comments: ${commentData.length}`);

  sqlite.close();
}

seed().catch(console.error);
