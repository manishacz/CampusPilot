import { api } from "../lib/api.js";
import { supabase } from "../lib/supabase.js";
import { demoTasks } from "../data/demoTasks.js";

// Fallback in-memory state used when the backend is unreachable
let demoCopy = demoTasks.map((t) => ({ ...t }));

function isDemoMode() {
  return !import.meta.env.VITE_API_BASE_URL;
}

async function getSessionId() {
  const { data } = await supabase.auth.getSession();
  const uid = data.session?.user?.id;
  if (!uid) throw new Error("Not authenticated");
  return uid;
}

export const taskService = {
  async getTasks(userId) {
    if (isDemoMode()) {
      return [...demoCopy];
    }
    const session_id = await getSessionId();
    return api.get(`/tasks?session_id=${session_id}`).then((r) => r.tasks);
  },

  async getTask(taskId) {
    if (isDemoMode()) {
      const task = demoCopy.find((t) => t.task_id === taskId);
      if (!task) throw new Error("Task not found");
      return { ...task };
    }
    return api.get(`/tasks/${taskId}`);
  },

  async updateTask(taskId, updates) {
    if (isDemoMode()) {
      demoCopy = demoCopy.map((t) => (t.task_id === taskId ? { ...t, ...updates } : t));
      return demoCopy.find((t) => t.task_id === taskId);
    }
    const session_id = await getSessionId();
    return api.patch(`/tasks/${taskId}?session_id=${session_id}`, updates);
  },

  async completeTask(taskId) {
    if (isDemoMode()) {
      demoCopy = demoCopy.map((t) =>
        t.task_id === taskId ? { ...t, status: "completed" } : t
      );
      return demoCopy.find((t) => t.task_id === taskId);
    }
    return api.post(`/tasks/${taskId}/complete`);
  },

  async rankTasks() {
    if (isDemoMode()) {
      return demoCopy
        .filter((t) => t.status !== "completed")
        .sort((a, b) => {
          const pOrder = { high: 0, medium: 1, low: 2 };
          return (pOrder[a.priority] ?? 2) - (pOrder[b.priority] ?? 2);
        });
    }
    return api.post(`/tasks/rank`);
  },
};
