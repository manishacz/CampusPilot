import { TaskCard } from "./TaskCard.jsx";

export function TaskList({ tasks, variant = "default", onComplete, onViewSource }) {
  if (!tasks || tasks.length === 0) {
    return null;
  }

  return (
    <div className="rounded-lg border border-border overflow-hidden bg-card">
      {tasks.map((task, i) => (
        <div key={task.task_id}>
          {i > 0 && <div className="border-t border-border" />}
          <TaskCard
            task={task}
            variant={variant}
            onComplete={onComplete}
            onViewSource={onViewSource}
          />
        </div>
      ))}
    </div>
  );
}
