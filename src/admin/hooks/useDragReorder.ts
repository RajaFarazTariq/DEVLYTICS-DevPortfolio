import { useState, type DragEvent } from 'react';

/**
 * Native drag-and-drop reordering for a list. The up/down buttons stay as the
 * keyboard/touch fallback. Pass `enabled: false` while a list is filtered,
 * since indexes then don't match the full list.
 */
export function useDragReorder(onMove: (from: number, to: number) => void, enabled = true) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const reset = () => {
    setDragIndex(null);
    setOverIndex(null);
  };

  const itemProps = (index: number) =>
    enabled
      ? {
          draggable: true,
          onDragStart: (e: DragEvent) => {
            // Let text fields inside the item keep normal text selection.
            if ((e.target as HTMLElement).closest('input, textarea, select')) {
              e.preventDefault();
              return;
            }
            setDragIndex(index);
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/plain', String(index));
          },
          onDragOver: (e: DragEvent) => {
            if (dragIndex === null) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            if (overIndex !== index) setOverIndex(index);
          },
          onDrop: (e: DragEvent) => {
            e.preventDefault();
            if (dragIndex !== null && dragIndex !== index) onMove(dragIndex, index);
            reset();
          },
          onDragEnd: reset,
        }
      : {};

  /** Classes for the item being dragged / hovered as a drop target. */
  const stateClass = (index: number) =>
    dragIndex === index ? 'opacity-40' : overIndex === index && dragIndex !== null ? 'ring-2 ring-accent-400/60' : '';

  return { itemProps, stateClass, dragging: dragIndex !== null };
}
