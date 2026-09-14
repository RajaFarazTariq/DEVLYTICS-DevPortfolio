import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AlertTriangle, ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/utils/cn';

// ── Form fields ──────────────────────────────────────────────────────────────

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  count?: { value: string; max: number };
  children: (id: string) => ReactNode;
  className?: string;
};

export function Field({ label, hint, error, count, children, className }: FieldProps) {
  const id = useId();
  const len = count?.value.trim().length ?? 0;
  return (
    <div className={className}>
      <label htmlFor={id} className="adm-label">
        <span>{label}</span>
        {count && (
          <span className={cn('font-mono text-[10px]', len > count.max ? 'text-rose-400' : 'text-ink-500')}>
            {len}/{count.max}
          </span>
        )}
      </label>
      {children(id)}
      {error ? (
        <p className="mt-1.5 text-xs text-rose-300">{error}</p>
      ) : hint ? (
        <p className="mt-1.5 text-xs text-ink-500">{hint}</p>
      ) : null}
    </div>
  );
}

type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  max?: number;
};

export function TextField({ label, value, onChange, hint, error, max, className, ...rest }: TextFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} count={max ? { value, max } : undefined} className={className}>
      {(id) => (
        <input
          id={id}
          className="adm-input"
          value={value}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        />
      )}
    </Field>
  );
}

type TextAreaFieldProps = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  error?: string;
  max?: number;
};

export function TextAreaField({ label, value, onChange, hint, error, max, className, rows = 4, ...rest }: TextAreaFieldProps) {
  return (
    <Field label={label} hint={hint} error={error} count={max ? { value, max } : undefined} className={className}>
      {(id) => (
        <textarea
          id={id}
          rows={rows}
          className="adm-input resize-y leading-relaxed"
          value={value}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value)}
          {...rest}
        />
      )}
    </Field>
  );
}

type SelectFieldProps<T extends string> = {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  error?: string;
  hint?: string;
  className?: string;
};

export function SelectField<T extends string>({ label, value, options, onChange, error, hint, className }: SelectFieldProps<T>) {
  return (
    <Field label={label} error={error} hint={hint} className={className}>
      {(id) => (
        <select
          id={id}
          className="adm-input appearance-none"
          value={value}
          aria-invalid={!!error}
          onChange={(e) => onChange(e.target.value as T)}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value} className="bg-ink-900">
              {o.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  );
}

/** Chip input for short tags (tech stack, roles). Enter or comma adds a tag. */
export function TagInput({
  label,
  values,
  onChange,
  placeholder = 'Type and press Enter',
  error,
  hint,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
}) {
  const [draft, setDraft] = useState('');

  const commit = () => {
    const parts = draft.split(',').map((p) => p.trim()).filter(Boolean);
    if (!parts.length) return;
    const next = [...values];
    for (const p of parts) if (!next.includes(p)) next.push(p);
    onChange(next);
    setDraft('');
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= values.length) return;
    const next = [...values];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <Field label={label} error={error} hint={hint ?? 'Press Enter or comma to add. Use the arrows to reorder.'}>
      {(id) => (
        <div
          className={cn(
            'adm-input flex min-h-[46px] flex-wrap items-center gap-1.5 py-2',
            error && 'border-rose-400/70',
          )}
        >
          {values.map((v, i) => (
            <span key={`${v}-${i}`} className="group inline-flex items-center gap-0.5 rounded-lg border border-white/10 bg-white/[0.06] py-0.5 pl-2 pr-0.5 text-xs text-ink-100">
              <button type="button" onClick={() => move(i, -1)} className="hidden text-ink-500 hover:text-ink-100 group-hover:inline" aria-label={`Move ${v} left`}>
                ‹
              </button>
              {v}
              <button type="button" onClick={() => move(i, 1)} className="hidden text-ink-500 hover:text-ink-100 group-hover:inline" aria-label={`Move ${v} right`}>
                ›
              </button>
              <button
                type="button"
                onClick={() => onChange(values.filter((_, k) => k !== i))}
                className="grid h-5 w-5 place-items-center rounded-md text-ink-400 hover:bg-white/10 hover:text-rose-300"
                aria-label={`Remove ${v}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <input
            id={id}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ',') {
                e.preventDefault();
                commit();
              } else if (e.key === 'Backspace' && !draft && values.length) {
                onChange(values.slice(0, -1));
              }
            }}
            onBlur={commit}
            placeholder={values.length ? '' : placeholder}
            className="min-w-[8rem] flex-1 bg-transparent py-1 text-sm outline-none placeholder:text-ink-500"
          />
        </div>
      )}
    </Field>
  );
}

/** Editable list of longer lines (bullet points). */
export function LineListEditor({
  label,
  values,
  onChange,
  addLabel = 'Add line',
  error,
  placeholder,
}: {
  label: string;
  values: string[];
  onChange: (values: string[]) => void;
  addLabel?: string;
  error?: string;
  placeholder?: string;
}) {
  const update = (i: number, v: string) => onChange(values.map((x, k) => (k === i ? v : x)));
  return (
    <div>
      <div className="adm-label">
        <span>{label}</span>
      </div>
      <div className="space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-start gap-2">
            <textarea
              rows={2}
              value={v}
              placeholder={placeholder}
              onChange={(e) => update(i, e.target.value)}
              className="adm-input resize-y leading-relaxed"
              aria-label={`${label} ${i + 1}`}
            />
            <ReorderButtons
              index={i}
              length={values.length}
              onMove={(from, to) => onChange(moveItem(values, from, to))}
              onDelete={() => onChange(values.filter((_, k) => k !== i))}
              label={`line ${i + 1}`}
            />
          </div>
        ))}
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-300">{error}</p>}
      <button type="button" className="adm-btn-ghost mt-2 px-2 text-xs" onClick={() => onChange([...values, ''])}>
        <Plus className="h-3.5 w-3.5" /> {addLabel}
      </button>
    </div>
  );
}

export function moveItem<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

export function ReorderButtons({
  index,
  length,
  onMove,
  onDelete,
  label,
}: {
  index: number;
  length: number;
  onMove: (from: number, to: number) => void;
  onDelete?: () => void;
  label: string;
}) {
  return (
    <div className="flex shrink-0 items-center">
      <button type="button" className="adm-icon-btn" disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label={`Move ${label} up`}>
        <ArrowUp className="h-4 w-4" />
      </button>
      <button type="button" className="adm-icon-btn" disabled={index === length - 1} onClick={() => onMove(index, index + 1)} aria-label={`Move ${label} down`}>
        <ArrowDown className="h-4 w-4" />
      </button>
      {onDelete && (
        <button type="button" className="adm-icon-btn hover:!text-rose-300" onClick={onDelete} aria-label={`Delete ${label}`}>
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ── Layout helpers ───────────────────────────────────────────────────────────

export function SectionHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-ink-50">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-ink-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'warn' | 'danger' | 'success' }) {
  const tones = {
    neutral: 'border-white/10 bg-white/[0.05] text-ink-300',
    accent: 'border-accent-400/30 bg-accent-500/10 text-accent-200',
    warn: 'border-amber-400/30 bg-amber-500/10 text-amber-200',
    danger: 'border-rose-400/30 bg-rose-500/10 text-rose-200',
    success: 'border-emerald-400/30 bg-emerald-500/10 text-emerald-200',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium', tones[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return (
    <div className="adm-card grid place-items-center px-6 py-14 text-center">
      <p className="font-display text-lg font-semibold text-ink-100">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function IssueList({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  return (
    <div className="rounded-xl border border-rose-400/25 bg-rose-500/[0.07] p-3 text-sm text-rose-200">
      <p className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4" /> Fix {messages.length === 1 ? 'this issue' : `these ${messages.length} issues`} first
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-6 text-rose-200/90">
        {messages.map((m, i) => (
          <li key={i}>{m}</li>
        ))}
      </ul>
    </div>
  );
}

// ── Overlays ─────────────────────────────────────────────────────────────────

function useEscape(onClose: () => void, active = true) {
  const ref = useRef(onClose);
  ref.current = onClose;
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && ref.current();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);
}

export function Drawer({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEscape(onClose, open);
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-40 flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-2xl flex-col border-l border-white/10 bg-ink-900 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.07] px-6 py-4">
          <div>
            <h2 className="font-display text-lg font-semibold text-ink-50">{title}</h2>
            {subtitle && <p className="text-xs text-ink-400">{subtitle}</p>}
          </div>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">{children}</div>
        {footer && <div className="border-t border-white/[0.07] px-6 py-4">{footer}</div>}
      </div>
    </div>
  );
}

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  wide,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEscape(onClose, open);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('adm-card relative flex max-h-[90vh] w-full flex-col bg-ink-900', wide ? 'max-w-2xl' : 'max-w-md')}>
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.07] px-5 py-4">
          <h2 className="font-display text-base font-semibold text-ink-50">{title}</h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4 text-sm text-ink-300">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-white/[0.07] px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

export type ConfirmRequest = {
  title: string;
  message: ReactNode;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
};

export function ConfirmDialog({ request, onClose }: { request: ConfirmRequest | null; onClose: () => void }) {
  return (
    <Modal
      open={!!request}
      title={request?.title ?? ''}
      onClose={onClose}
      footer={
        <>
          <button type="button" className="adm-btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            type="button"
            autoFocus
            className={request?.danger ? 'adm-btn-danger' : 'adm-btn-primary'}
            onClick={() => {
              request?.onConfirm();
              onClose();
            }}
          >
            {request?.confirmLabel}
          </button>
        </>
      }
    >
      {request?.message}
    </Modal>
  );
}
