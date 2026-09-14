import { useState } from 'react';
import type { Confirm } from '@/admin/types';
import { fieldErrors, type Issue } from '@/admin/lib/validate';

type Editing<T> = { index: number | null; item: T; snapshot: string };

/**
 * Edits one list item in a local copy. Changes reach the draft only when the
 * item passes validation ("Apply"); closing with unapplied edits asks first.
 */
export function useItemEditor<T>({
  list,
  onChange,
  validate,
  confirm,
}: {
  list: T[];
  onChange: (list: T[]) => void;
  validate: (item: T, index: number, others: T[]) => Issue[];
  confirm: Confirm;
}) {
  const [editing, setEditing] = useState<Editing<T> | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  const index = editing ? (editing.index ?? list.length) : -1;
  const others = editing ? list.filter((_, k) => k !== editing.index) : [];
  const issues = editing ? validate(editing.item, index, others) : [];

  const open = (itemIndex: number | null, item: T, withErrors = false) => {
    setShowErrors(withErrors);
    setEditing({ index: itemIndex, item, snapshot: JSON.stringify(item) });
  };

  const set = (item: T) => setEditing((e) => (e ? { ...e, item } : e));

  const forceClose = () => {
    setEditing(null);
    setShowErrors(false);
  };

  const close = () => {
    if (editing && JSON.stringify(editing.item) !== editing.snapshot) {
      confirm({
        title: 'Discard these edits?',
        message: 'The changes in this form have not been applied yet.',
        confirmLabel: 'Discard',
        danger: true,
        onConfirm: forceClose,
      });
    } else {
      forceClose();
    }
  };

  const apply = () => {
    if (!editing) return;
    if (issues.length) {
      setShowErrors(true);
      return;
    }
    const next = [...list];
    if (editing.index === null) next.push(editing.item);
    else next[editing.index] = editing.item;
    onChange(next);
    forceClose();
  };

  return {
    editing: editing?.item ?? null,
    isNew: editing?.index === null,
    open,
    set,
    close,
    apply,
    issues: showErrors ? issues : [],
    errors: showErrors ? fieldErrors(issues) : ({} as Record<string, string>),
  };
}
