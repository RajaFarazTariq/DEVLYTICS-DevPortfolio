import {
  useEffect,
  useId,
  useRef,
  useState,
  type ComponentType,
  type ReactNode,
  type InputHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';
import { AlertCircle, AlertTriangle, ArrowDown, ArrowUp, Plus, Trash2, X } from 'lucide-react';
import { cn } from '@/utils/cn';

type IconComponent = ComponentType<{ className?: string }>;

// ── Form fields ──────────────────────────────────────────────────────────────

type FieldProps = {
  label: string;
  hint?: string;
  error?: string;
  count?: { value: string; max: number };
  children: (id: string) => ReactNode;
  className?: string;
  labelClassName?: string;
};

export function Field({ label, hint, error, count, children, className, labelClassName }: FieldProps) {
  const id = useId();
  const len = count?.value.trim().length ?? 0;
  return (
    <div className={className}>
      <label htmlFor={id} className={cn('adm-label', labelClassName)}>
        <span>{label}</span>
        {count && (
          <span className={cn('font-mono text-[10.5px] tabular-nums', len > count.max ? 'text-rose-300' : 'text-ink-500')}>
            {len}/{count.max}
          </span>
        )}
      </label>
      {children(id)}
      {error ? (
        <p className="adm-error">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="adm-hint">{hint}</p>
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
  labelClassName?: string;
  inputClassName?: string;
};

export function TextField({ label, value, onChange, hint, error, max, className, labelClassName, inputClassName, ...rest }: TextFieldProps) {
  return (
    <Field
      label={label}
      hint={hint}
      error={error}
      count={max ? { value, max } : undefined}
      className={className}
      labelClassName={labelClassName}
    >
      {(id) => (
        <input
          id={id}
          className={cn('adm-input', inputClassName)}
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
    <Field label={label} error={error} hint={hint ?? 'Press Enter or comma to add. Hover a tag to reorder it.'}>
      {(id) => (
        <div
          className={cn(
            'adm-input flex min-h-[44px] cursor-text flex-wrap items-center gap-1.5 px-2 py-1.5 focus-within:border-accent-400/70 focus-within:bg-ink-950 focus-within:ring-4 focus-within:ring-accent-400/15',
            error && 'border-rose-400/60',
          )}
        >
          {values.map((v, i) => (
            <span
              key={`${v}-${i}`}
              className="group inline-flex items-center gap-0.5 rounded-md border border-white/[0.08] bg-white/[0.06] py-0.5 pl-2 pr-0.5 text-xs font-medium text-ink-100"
            >
              <button type="button" onClick={() => move(i, -1)} className="hidden px-0.5 text-ink-500 hover:text-ink-100 group-hover:inline" aria-label={`Move ${v} left`}>
                ‹
              </button>
              {v}
              <button type="button" onClick={() => move(i, 1)} className="hidden px-0.5 text-ink-500 hover:text-ink-100 group-hover:inline" aria-label={`Move ${v} right`}>
                ›
              </button>
              <button
                type="button"
                onClick={() => onChange(values.filter((_, k) => k !== i))}
                className="grid h-5 w-5 place-items-center rounded text-ink-400 transition hover:bg-rose-500/15 hover:text-rose-300"
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
            placeholder={values.length ? 'Add more…' : placeholder}
            className="min-w-[8rem] flex-1 bg-transparent px-1.5 py-1 text-sm outline-none placeholder:text-ink-500"
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
        {values.length > 0 && <span className="font-mono text-[10.5px] text-ink-500">{values.length}</span>}
      </div>
      {values.length > 0 && (
        <div className="space-y-2">
          {values.map((v, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="mt-3 w-5 shrink-0 text-right font-mono text-[10.5px] text-ink-500">{String(i + 1).padStart(2, '0')}</span>
              <textarea
                rows={2}
                value={v}
                placeholder={placeholder}
                onChange={(e) => update(i, e.target.value)}
                className="adm-input resize-y leading-relaxed"
                aria-label={`${label} ${i + 1}`}
              />
              <div className="pt-1">
                <ReorderButtons
                  index={i}
                  length={values.length}
                  onMove={(from, to) => onChange(moveItem(values, from, to))}
                  onDelete={() => onChange(values.filter((_, k) => k !== i))}
                  label={`line ${i + 1}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}
      {error && (
        <p className="adm-error">
          <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
          {error}
        </p>
      )}
      <button type="button" className="adm-btn-secondary adm-btn-sm mt-2.5 border-dashed" onClick={() => onChange([...values, ''])}>
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
    <div className="flex shrink-0 items-center gap-1">
      <div className="inline-flex items-center rounded-lg border border-white/[0.06] bg-white/[0.02] p-0.5">
        <button type="button" className="adm-icon-btn h-7 w-7" disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label={`Move ${label} up`} title="Move up">
          <ArrowUp className="h-3.5 w-3.5" />
        </button>
        <button type="button" className="adm-icon-btn h-7 w-7" disabled={index === length - 1} onClick={() => onMove(index, index + 1)} aria-label={`Move ${label} down`} title="Move down">
          <ArrowDown className="h-3.5 w-3.5" />
        </button>
      </div>
      {onDelete && (
        <button type="button" className="adm-icon-btn hover:!bg-rose-500/10 hover:!text-rose-300" onClick={onDelete} aria-label={`Delete ${label}`} title="Delete">
          <Trash2 className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ── Layout helpers ───────────────────────────────────────────────────────────

export function SectionHeader({
  title,
  description,
  actions,
  eyebrow,
  meta,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  eyebrow?: string;
  meta?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:mb-8 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && <p className="adm-eyebrow mb-2">{eyebrow}</p>}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl font-bold tracking-tight text-ink-50 sm:text-[28px]">{title}</h1>
          {meta}
        </div>
        {description && <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-ink-400">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

/** Titled group of fields inside a form. */
export function FormSection({
  title,
  description,
  aside,
  children,
}: {
  title: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3 border-b border-white/[0.06] pb-2.5">
        <div>
          <h3 className="adm-eyebrow text-ink-300">{title}</h3>
          {description && <p className="mt-1 text-xs leading-relaxed text-ink-400">{description}</p>}
        </div>
        {aside}
      </div>
      {children}
    </section>
  );
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'warn' | 'danger' | 'success' }) {
  const tones = {
    neutral: 'border-white/[0.09] bg-white/[0.05] text-ink-300',
    accent: 'border-accent-400/25 bg-accent-500/10 text-accent-200',
    warn: 'border-amber-400/25 bg-amber-500/10 text-amber-200',
    danger: 'border-rose-400/25 bg-rose-500/10 text-rose-200',
    success: 'border-emerald-400/25 bg-emerald-500/10 text-emerald-200',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium leading-4', tones[tone])}>
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: IconComponent;
}) {
  return (
    <div className="grid place-items-center rounded-2xl border border-dashed border-white/[0.1] bg-white/[0.015] px-6 py-16 text-center">
      {Icon && (
        <span className="mb-4 grid h-12 w-12 place-items-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-ink-300">
          <Icon className="h-5 w-5" />
        </span>
      )}
      <p className="font-display text-lg font-semibold text-ink-100">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-ink-400">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function IssueList({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  return (
    <div className="rounded-xl border border-rose-400/20 bg-rose-500/[0.06] p-4 text-sm text-rose-200">
      <p className="flex items-center gap-2 font-medium">
        <AlertTriangle className="h-4 w-4" /> Fix {messages.length === 1 ? 'this issue' : `these ${messages.length} issues`} first
      </p>
      <ul className="mt-2 list-disc space-y-1 pl-6 leading-relaxed text-rose-200/90">
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
      <div className="adm-animate-fade absolute inset-0 bg-ink-950/70 backdrop-blur-sm" onClick={onClose} />
      <div className="adm-animate-drawer relative flex h-full w-full flex-col border-l border-white/[0.08] bg-ink-900 shadow-[0_0_80px_-20px_rgba(0,0,0,0.8)] sm:max-w-xl lg:max-w-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-white/[0.06] px-5 py-4 sm:px-6">
          <div className="min-w-0">
            <h2 className="font-display text-lg font-semibold text-ink-50">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-ink-400">{subtitle}</p>}
          </div>
          <button type="button" className="adm-icon-btn -mr-1.5" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="flex-1 space-y-8 overflow-y-auto px-5 py-6 sm:px-6">{children}</div>
        {footer && <div className="border-t border-white/[0.06] bg-ink-900/95 px-5 py-3.5 sm:px-6">{footer}</div>}
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
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="adm-animate-fade absolute inset-0 bg-ink-950/75 backdrop-blur-sm" onClick={onClose} />
      <div
        className={cn(
          'adm-animate-pop relative flex max-h-[92vh] w-full flex-col rounded-t-2xl border border-white/[0.08] bg-ink-900 shadow-2xl sm:rounded-2xl',
          wide ? 'sm:max-w-2xl' : 'sm:max-w-md',
        )}
      >
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] px-5 py-4">
          <h2 className="font-display text-base font-semibold text-ink-50">{title}</h2>
          <button type="button" className="adm-icon-btn -mr-1.5" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5 text-sm text-ink-300">{children}</div>
        {footer && (
          <div className="flex flex-col-reverse gap-2 border-t border-white/[0.06] px-5 py-3.5 sm:flex-row sm:justify-end">{footer}</div>
        )}
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
      <div className="flex gap-3">
        {request?.danger && (
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-rose-400/20 bg-rose-500/10 text-rose-300">
            <AlertTriangle className="h-4 w-4" />
          </span>
        )}
        <div className="pt-1.5 leading-relaxed">{request?.message}</div>
      </div>
    </Modal>
  );
}
