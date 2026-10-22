import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { TaskCard } from './TaskCard';
import { TASK_STATUSES } from '../../lib/constants';
import { Plus } from 'lucide-react';

export const TaskBoard = ({
  tasks = [],
  onTaskClick,
  onTaskMove,
  onQuickAdd,
}) => {
  const [activeTask, setActiveTask] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px movement required before drag begins
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event) => {
    const { active } = event;
    const task = tasks.find((t) => t._id === active.id);
    if (task) {
      setActiveTask(task);
    }
  };

  const handleDragOver = (event) => {
    // Optional live column styling
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    setActiveTask(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const sourceTask = tasks.find((t) => t._id === activeId);
    if (!sourceTask) return;

    // Is dropped over a column container or another task?
    let targetStatus = null;
    let targetOrder = 0;

    const isColumn = TASK_STATUSES.some((s) => s.key === overId);
    if (isColumn) {
      targetStatus = overId;
      const columnTasks = tasks.filter((t) => t.status === targetStatus && t._id !== activeId);
      targetOrder = columnTasks.length;
    } else {
      const overTask = tasks.find((t) => t._id === overId);
      if (overTask) {
        targetStatus = overTask.status;
        targetOrder = overTask.order;
      }
    }

    if (targetStatus) {
      if (sourceTask.status !== targetStatus || sourceTask.order !== targetOrder) {
        onTaskMove(sourceTask._id, { status: targetStatus, order: targetOrder });
      }
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 overflow-x-auto pb-4 scroll-smooth">
        {TASK_STATUSES.map((column) => {
          const columnTasks = tasks
            .filter((t) => t.status === column.key)
            .sort((a, b) => (a.order || 0) - (b.order || 0));

          return (
            <div
              key={column.key}
              id={column.key}
              className="flex flex-col rounded-2xl bg-surface-2/50 border border-border/80 min-h-[480px] h-[calc(100vh-270px)]"
            >
              {/* Column Header */}
              <div className="flex items-center justify-between p-3.5 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: column.color }}
                  />
                  <h3 className="text-xs font-bold text-text uppercase tracking-wider">
                    {column.label}
                  </h3>
                  <span className="px-1.5 py-0.2 rounded-full bg-surface border border-border text-[10px] font-semibold text-text-muted">
                    {columnTasks.length}
                  </span>
                </div>

                {onQuickAdd && (
                  <button
                    onClick={() => onQuickAdd(column.key)}
                    className="p-1 rounded-md text-text-muted hover:text-text hover:bg-surface transition-colors cursor-pointer"
                    title={`Add task to ${column.label}`}
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Tasks Droppable Column List */}
              <SortableContext
                id={column.key}
                items={columnTasks.map((t) => t._id)}
                strategy={verticalListSortingStrategy}
              >
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5">
                  {columnTasks.map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      onClick={() => onTaskClick?.(task)}
                    />
                  ))}

                  {columnTasks.length === 0 && (
                    <div className="h-32 flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/60 rounded-xl text-text-muted/60 text-xs">
                      <span>No tasks here</span>
                      <button
                        onClick={() => onQuickAdd?.(column.key)}
                        className="text-[11px] text-primary hover:underline mt-1 cursor-pointer font-medium"
                      >
                        + Add task
                      </button>
                    </div>
                  )}
                </div>
              </SortableContext>
            </div>
          );
        })}
      </div>

      {/* Drag Overlay for smooth preview */}
      <DragOverlay dropAnimation={null}>
        {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
};
