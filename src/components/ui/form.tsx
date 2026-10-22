"use client";

import { Check, ChevronDown, type LucideIcon } from "lucide-react";
import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/cn";

interface FieldShellProps {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  required?: boolean;
  counter?: { value: number; max: number };
  htmlFor?: string;
  className?: string;
  children: ReactNode;
}

export function Field({ label, hint, error, required, counter, htmlFor, className, children }: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <div className="flex items-center justify-between gap-2">
          <label htmlFor={htmlFor} className="text-sm font-medium text-gray-700">
            {label}
            {required ? <span className="ml-0.5 text-brand-600">*</span> : null}
          </label>
          {counter ? (
            <span className={cn("text-xs tabular-nums", counter.value > counter.max ? "text-error-600" : "text-gray-400")}>
              {counter.value}/{counter.max}
            </span>
          ) : null}
        </div>
      ) : null}
      {children}
      {error ? <p className="text-sm text-error-600">{error}</p> : hint ? <p className="text-sm text-gray-500">{hint}</p> : null}
    </div>
  );
}

const inputBase =
  "w-full rounded-lg border bg-white text-gray-900 shadow-xs placeholder:text-gray-400 outline-none transition-shadow disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500";

function inputState(error?: string) {
  return error
    ? "border-error-300 focus:border-error-300 focus:shadow-[0_0_0_4px_var(--color-error-100)]"
    : "border-gray-300 focus:border-brand-300 focus:shadow-[0_0_0_4px_var(--color-brand-100)]";
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  icon?: LucideIcon;
  maxCount?: number;
  wrapperClassName?: string;
  inputSize?: "sm" | "md";
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, icon: Icon, maxCount, className, wrapperClassName, required, inputSize = "md", ...rest },
  ref,
) {
  const id = useId();
  const value = typeof rest.value === "string" ? rest.value : "";
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={wrapperClassName} counter={maxCount ? { value: value.length, max: maxCount } : undefined}>
      <div className="relative">
        {Icon ? <Icon size={18} className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-gray-400" /> : null}
        <input
          ref={ref}
          id={id}
          className={cn(inputBase, inputState(error), inputSize === "sm" ? "h-9 px-3 text-sm" : "h-10 px-3.5 text-[15px]", Icon && "pl-10", className)}
          {...rest}
        />
      </div>
    </Field>
  );
});

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  maxCount?: number;
  wrapperClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, maxCount, className, wrapperClassName, required, rows = 4, ...rest },
  ref,
) {
  const id = useId();
  const value = typeof rest.value === "string" ? rest.value : "";
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={wrapperClassName} counter={maxCount ? { value: value.length, max: maxCount } : undefined}>
      <textarea ref={ref} id={id} rows={rows} className={cn(inputBase, inputState(error), "resize-none px-3.5 py-2.5 text-[15px] leading-6", className)} {...rest} />
    </Field>
  );
});

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  wrapperClassName?: string;
  selectSize?: "sm" | "md";
}

export function Select({ label, hint, error, options, placeholder, className, wrapperClassName, required, selectSize = "md", ...rest }: SelectProps) {
  const id = useId();
  return (
    <Field label={label} hint={hint} error={error} required={required} htmlFor={id} className={wrapperClassName}>
      <div className="relative">
        <select
          id={id}
          className={cn(inputBase, inputState(error), "appearance-none pr-9", selectSize === "sm" ? "h-9 px-3 text-sm" : "h-10 px-3.5 text-[15px]", className)}
          {...rest}
        >
          {placeholder ? (
            <option value="" disabled>
              {placeholder}
            </option>
          ) : null}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown size={18} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-gray-500" />
      </div>
    </Field>
  );
}

export function Checkbox({ checked, onChange, label, hint, disabled }: { checked: boolean; onChange: (v: boolean) => void; label: ReactNode; hint?: ReactNode; disabled?: boolean }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", disabled && "cursor-not-allowed opacity-60")}>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors focus-visible:focus-ring",
          checked ? "border-brand-600 bg-brand-600 text-white" : "border-gray-300 bg-white",
        )}
      >
        {checked ? <Check size={14} strokeWidth={3} /> : null}
      </button>
      <span className="flex flex-col">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        {hint ? <span className="text-sm text-gray-500">{hint}</span> : null}
      </span>
    </label>
  );
}

export function Toggle({ checked, onChange, label, hint, disabled, size = "md" }: { checked: boolean; onChange: (v: boolean) => void; label?: ReactNode; hint?: ReactNode; disabled?: boolean; size?: "sm" | "md" }) {
  return (
    <label className={cn("flex cursor-pointer items-start gap-3", disabled && "cursor-not-allowed opacity-60")}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative shrink-0 rounded-full transition-colors focus-visible:focus-ring",
          size === "sm" ? "h-5 w-9" : "h-6 w-11",
          checked ? "bg-brand-600" : "bg-gray-200",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 left-0.5 rounded-full bg-white shadow-sm transition-transform",
            size === "sm" ? "h-4 w-4" : "h-5 w-5",
            checked && (size === "sm" ? "translate-x-4" : "translate-x-5"),
          )}
        />
      </button>
      {label || hint ? (
        <span className="flex flex-col">
          {label ? <span className="text-sm font-medium text-gray-700">{label}</span> : null}
          {hint ? <span className="text-sm text-gray-500">{hint}</span> : null}
        </span>
      ) : null}
    </label>
  );
}

/** 标签式单选/多选（Untitled UI 的 tag 选择器风格）。 */
export function ChipSelect({
  options,
  value,
  onChange,
  multiple,
  size = "md",
}: {
  options: readonly string[] | { value: string; label: string }[];
  value: string[];
  onChange: (v: string[]) => void;
  multiple?: boolean;
  size?: "sm" | "md";
}) {
  const opts = (options as (string | { value: string; label: string })[]).map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  return (
    <div className="flex flex-wrap gap-2">
      {opts.map((o) => {
        const on = value.includes(o.value);
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => {
              if (multiple) onChange(on ? value.filter((v) => v !== o.value) : [...value, o.value]);
              else onChange(on ? [] : [o.value]);
            }}
            className={cn(
              "inline-flex items-center gap-1 rounded-lg border font-medium transition-colors focus-visible:focus-ring",
              size === "sm" ? "h-8 px-2.5 text-xs" : "h-9 px-3 text-sm",
              on ? "border-brand-300 bg-brand-50 text-brand-700" : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50",
            )}
          >
            {on ? <Check size={14} strokeWidth={2.5} /> : null}
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/** 大号单选卡片：用于身份选择、意向类型等关键决策。 */
export function RadioCards<T extends string>({
  options,
  value,
  onChange,
  columns = 2,
}: {
  options: { value: T; title: ReactNode; desc?: ReactNode; icon?: LucideIcon; disabled?: boolean }[];
  value: T | null;
  onChange: (v: T) => void;
  columns?: 1 | 2 | 3 | 4;
}) {
  const grid = { 1: "grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-2 lg:grid-cols-4" }[columns];
  return (
    <div className={cn("grid grid-cols-1 gap-3", grid)}>
      {options.map((o) => {
        const on = value === o.value;
        const Icon = o.icon;
        return (
          <button
            key={o.value}
            type="button"
            disabled={o.disabled}
            onClick={() => onChange(o.value)}
            className={cn(
              "relative flex items-start gap-3 rounded-xl border bg-white p-4 text-left transition-all focus-visible:focus-ring disabled:opacity-50",
              on ? "border-brand-600 shadow-[0_0_0_1px_var(--color-brand-600)]" : "border-gray-200 hover:border-gray-300",
            )}
          >
            {Icon ? (
              <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border", on ? "border-brand-200 bg-brand-50 text-brand-600" : "border-gray-200 text-gray-600")}>
                <Icon size={20} />
              </span>
            ) : null}
            <span className="flex min-w-0 flex-1 flex-col gap-0.5 pr-6">
              <span className={cn("text-sm font-semibold", on ? "text-brand-800" : "text-gray-800")}>{o.title}</span>
              {o.desc ? <span className={cn("text-sm", on ? "text-brand-700" : "text-gray-500")}>{o.desc}</span> : null}
            </span>
            <span
              className={cn(
                "absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full border",
                on ? "border-brand-600 bg-brand-600 text-white" : "border-gray-300 bg-white",
              )}
            >
              {on ? <Check size={12} strokeWidth={3} /> : null}
            </span>
          </button>
        );
      })}
    </div>
  );
}
