/**
 * Workflow Page
 *
 * Kanban-style board for task/pipeline management.
 * Currently: static placeholder layout.
 * Step 3 → columns and tasks driven by Redux state.
 * Step 4 → tasks fetched/updated via API service layer.
 */
import React from 'react';

type TaskStatus = 'todo' | 'in-progress' | 'done';
type TaskPriority = 'high' | 'medium' | 'low';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  assignee: string;
  dueDate: string;
}

interface KanbanColumn {
  id: TaskStatus;
  label: string;
  tasks: Task[];
  accentClass: string;
}

const COLUMNS: KanbanColumn[] = [
  {
    id: 'todo',
    label: 'To Do',
    accentClass: 'kanban-column--todo',
    tasks: [
      { id: 't1', title: 'Design new onboarding flow',    description: 'Redesign the 4-step onboarding for new free-tier users.',  priority: 'high',   assignee: 'JD', dueDate: 'Apr 02' },
      { id: 't2', title: 'Set up CI/CD pipeline',         description: 'Configure GitHub Actions for all micro-frontend packages.', priority: 'high',   assignee: 'SM', dueDate: 'Apr 05' },
      { id: 't3', title: 'Write API documentation',       description: 'Document all REST endpoints in OpenAPI 3.0 format.',       priority: 'medium', assignee: 'JD', dueDate: 'Apr 10' },
    ],
  },
  {
    id: 'in-progress',
    label: 'In Progress',
    accentClass: 'kanban-column--in-progress',
    tasks: [
      { id: 't4', title: 'Implement Redux store',         description: 'Set up RTK with user and dashboard slices.',               priority: 'high',   assignee: 'AR', dueDate: 'Mar 30' },
      { id: 't5', title: 'Build data grid component',     description: 'Virtual scroll + sort + filter for large datasets.',       priority: 'medium', assignee: 'JD', dueDate: 'Apr 01' },
    ],
  },
  {
    id: 'done',
    label: 'Done',
    accentClass: 'kanban-column--done',
    tasks: [
      { id: 't6', title: 'Project scaffolding',           description: 'Monorepo setup with npm workspaces and Webpack 5.',        priority: 'high',   assignee: 'JD', dueDate: 'Mar 28' },
      { id: 't7', title: 'Routing setup',                 description: 'React Router v7 with AppShell layout and pages.',          priority: 'medium', assignee: 'JD', dueDate: 'Mar 28' },
    ],
  },
];

const PRIORITY_CLASS: Record<TaskPriority, string> = {
  high:   'task-card__priority--high',
  medium: 'task-card__priority--medium',
  low:    'task-card__priority--low',
};

const TaskCard: React.FC<Task> = ({ title, description, priority, assignee, dueDate }) => (
  <article className="task-card">
    <div className="task-card__header">
      <span className={`task-card__priority ${PRIORITY_CLASS[priority]}`}>
        {priority}
      </span>
      <span className="task-card__assignee" title={`Assigned to: ${assignee}`}>
        {assignee}
      </span>
    </div>
    <h3 className="task-card__title">{title}</h3>
    <p className="task-card__desc">{description}</p>
    <div className="task-card__footer">
      <span className="task-card__due">Due {dueDate}</span>
    </div>
  </article>
);

const Workflow: React.FC = () => {
  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Workflow</h1>
          <p className="page-subtitle">Track tasks across your team's pipeline.</p>
        </div>
        <button className="btn btn--primary" type="button">
          + New Task
        </button>
      </div>

      {/* Summary bar */}
      <div className="workflow-summary">
        {COLUMNS.map((col) => (
          <div key={col.id} className="workflow-summary__item">
            <span className="workflow-summary__count">{col.tasks.length}</span>
            <span className="workflow-summary__label">{col.label}</span>
          </div>
        ))}
      </div>

      {/* Kanban board */}
      <div className="kanban-board" role="list" aria-label="Kanban board">
        {COLUMNS.map((col) => (
          <div
            key={col.id}
            className={`kanban-column ${col.accentClass}`}
            role="listitem"
            aria-label={`${col.label} — ${col.tasks.length} tasks`}
          >
            <div className="kanban-column__header">
              <span className="kanban-column__title">{col.label}</span>
              <span className="kanban-column__count">{col.tasks.length}</span>
            </div>
            <div className="kanban-column__tasks">
              {col.tasks.map((task) => (
                <TaskCard key={task.id} {...task} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Workflow;
