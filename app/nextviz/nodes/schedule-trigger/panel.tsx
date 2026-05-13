"use client";

import { useState, useCallback } from "react";
import { Node } from "reactflow";
import { Clock, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { NodeModalShell } from "../_base/node-modal-shell";

// ── Types ─────────────────────────────────────────────────────────────────────

type TriggerInterval = "minutes" | "hours" | "days" | "weeks" | "months" | "cron";

interface TriggerRule {
  id: string;
  interval: TriggerInterval;
  every?: number;
  daysBetween?: number;
  hour?: number;
  minute?: number;
  weekday?: number;
  dayOfMonth?: number;
  cronExpression?: string;
}

const INTERVAL_OPTIONS: { value: TriggerInterval; label: string }[] = [
  { value: "minutes",  label: "Minutes" },
  { value: "hours",    label: "Hours" },
  { value: "days",     label: "Days" },
  { value: "weeks",    label: "Weeks" },
  { value: "months",   label: "Months" },
  { value: "cron",     label: "Custom (Cron)" },
];

const HOUR_OPTIONS = [
  { value: 0,  label: "Midnight" },
  { value: 1,  label: "1 AM" },
  { value: 2,  label: "2 AM" },
  { value: 3,  label: "3 AM" },
  { value: 4,  label: "4 AM" },
  { value: 5,  label: "5 AM" },
  { value: 6,  label: "6 AM" },
  { value: 7,  label: "7 AM" },
  { value: 8,  label: "8 AM" },
  { value: 9,  label: "9 AM" },
  { value: 10, label: "10 AM" },
  { value: 11, label: "11 AM" },
  { value: 12, label: "Noon" },
  { value: 13, label: "1 PM" },
  { value: 14, label: "2 PM" },
  { value: 15, label: "3 PM" },
  { value: 16, label: "4 PM" },
  { value: 17, label: "5 PM" },
  { value: 18, label: "6 PM" },
  { value: 19, label: "7 PM" },
  { value: 20, label: "8 PM" },
  { value: 21, label: "9 PM" },
  { value: 22, label: "10 PM" },
  { value: 23, label: "11 PM" },
];

const WEEKDAY_OPTIONS = [
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
  { value: 0, label: "Sunday" },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeDefaultRule(): TriggerRule {
  return {
    id: `rule-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    interval: "days",
    daysBetween: 1,
    hour: 0,
    minute: 0,
  };
}

function buildCronPreview(rule: TriggerRule): string {
  switch (rule.interval) {
    case "minutes": return `Every ${rule.every ?? 1} minute(s)`;
    case "hours":   return `Every ${rule.every ?? 1} hour(s)`;
    case "days":    return `Every ${rule.daysBetween ?? 1} day(s) at ${HOUR_OPTIONS.find((h) => h.value === (rule.hour ?? 0))?.label ?? "Midnight"}:${String(rule.minute ?? 0).padStart(2, "0")}`;
    case "weeks":   return `Every week on ${WEEKDAY_OPTIONS.find((d) => d.value === (rule.weekday ?? 1))?.label ?? "Monday"} at ${HOUR_OPTIONS.find((h) => h.value === (rule.hour ?? 0))?.label ?? "Midnight"}`;
    case "months":  return `Monthly on day ${rule.dayOfMonth ?? 1} at ${HOUR_OPTIONS.find((h) => h.value === (rule.hour ?? 0))?.label ?? "Midnight"}`;
    case "cron":    return rule.cronExpression ? `Cron: ${rule.cronExpression}` : "Enter cron expression";
    default:        return "";
  }
}

// ── Select / Input primitives ─────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-xs font-medium text-zinc-500 mb-1.5">{children}</p>;
}

function StyledSelect({ value, onChange, children }: { value: string | number; onChange: (v: string) => void; children: React.ReactNode }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 appearance-none focus:outline-none focus:border-zinc-700 cursor-pointer transition-colors"
      >
        {children}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">▾</div>
    </div>
  );
}

function NumberInput({ value, onChange, min, max, hint }: { value: number; onChange: (v: number) => void; min?: number; max?: number; hint?: string }) {
  return (
    <div>
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-700 transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      {hint && <p className="text-[11px] text-zinc-600 mt-1">{hint}</p>}
    </div>
  );
}

// ── Rule editor ───────────────────────────────────────────────────────────────

function RuleEditor({
  rule,
  onChange,
  onRemove,
  canRemove,
}: {
  rule: TriggerRule;
  onChange: (updated: TriggerRule) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const patch = (patch: Partial<TriggerRule>) => onChange({ ...rule, ...patch });

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-3">
      {/* Interval selector + remove */}
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <FieldLabel>Trigger Interval</FieldLabel>
          <StyledSelect
            value={rule.interval}
            onChange={(v) => {
              const defaults: Partial<TriggerRule> = { interval: v as TriggerInterval };
              if (v === "minutes" || v === "hours") defaults.every = 1;
              if (v === "days")   { defaults.daysBetween = 1; defaults.hour = 0; defaults.minute = 0; }
              if (v === "weeks")  { defaults.weekday = 1; defaults.hour = 0; defaults.minute = 0; }
              if (v === "months") { defaults.dayOfMonth = 1; defaults.hour = 0; defaults.minute = 0; }
              if (v === "cron")   defaults.cronExpression = "";
              patch(defaults);
            }}
          >
            {INTERVAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </StyledSelect>
        </div>
        {canRemove && (
          <button
            onClick={onRemove}
            className="mb-0.5 p-2.5 rounded-lg hover:bg-red-500/10 border border-zinc-800 transition-colors group"
            title="Remove rule"
          >
            <Trash2 className="w-4 h-4 text-zinc-500 group-hover:text-red-500 transition-colors" />
          </button>
        )}
      </div>

      {/* Every X (minutes / hours) */}
      {(rule.interval === "minutes" || rule.interval === "hours") && (
        <div>
          <FieldLabel>{rule.interval === "minutes" ? "Every (minutes)" : "Every (hours)"}</FieldLabel>
          <NumberInput
            value={rule.every ?? 1}
            min={1}
            max={rule.interval === "minutes" ? 59 : 23}
            onChange={(v) => patch({ every: v })}
            hint={rule.interval === "minutes" ? "Must be in range 1–59" : "Must be in range 1–23"}
          />
        </div>
      )}

      {/* Days Between */}
      {rule.interval === "days" && (
        <div>
          <FieldLabel>Days Between Triggers</FieldLabel>
          <NumberInput
            value={rule.daysBetween ?? 1}
            min={1}
            max={31}
            onChange={(v) => patch({ daysBetween: v })}
            hint="Must be in range 1–31"
          />
        </div>
      )}

      {/* Weekday */}
      {rule.interval === "weeks" && (
        <div>
          <FieldLabel>Day of Week</FieldLabel>
          <StyledSelect value={rule.weekday ?? 1} onChange={(v) => patch({ weekday: Number(v) })}>
            {WEEKDAY_OPTIONS.map((d) => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </StyledSelect>
        </div>
      )}

      {/* Day of Month */}
      {rule.interval === "months" && (
        <div>
          <FieldLabel>Day of Month</FieldLabel>
          <NumberInput
            value={rule.dayOfMonth ?? 1}
            min={1}
            max={31}
            onChange={(v) => patch({ dayOfMonth: v })}
            hint="Must be in range 1–31"
          />
        </div>
      )}

      {/* Trigger at Hour + Minute (days / weeks / months) */}
      {(rule.interval === "days" || rule.interval === "weeks" || rule.interval === "months") && (
        <div className="grid grid-cols-2 gap-3">
          <div>
            <FieldLabel>Trigger at Hour</FieldLabel>
            <StyledSelect value={rule.hour ?? 0} onChange={(v) => patch({ hour: Number(v) })}>
              {HOUR_OPTIONS.map((h) => (
                <option key={h.value} value={h.value}>{h.label}</option>
              ))}
            </StyledSelect>
          </div>
          <div>
            <FieldLabel>Trigger at Minute</FieldLabel>
            <NumberInput
              value={rule.minute ?? 0}
              min={0}
              max={59}
              onChange={(v) => patch({ minute: v })}
            />
          </div>
        </div>
      )}

      {/* Cron expression */}
      {rule.interval === "cron" && (
        <div>
          <FieldLabel>Cron Expression</FieldLabel>
          <input
            type="text"
            value={rule.cronExpression ?? ""}
            onChange={(e) => patch({ cronExpression: e.target.value })}
            placeholder="e.g. 0 9 * * 1-5"
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg px-3 py-2.5 focus:outline-none focus:border-zinc-700 placeholder:text-zinc-600 transition-colors font-mono"
          />
          <p className="text-[11px] text-zinc-600 mt-1">min hour day month weekday</p>
        </div>
      )}

      {/* Preview */}
      <div className="rounded-lg bg-zinc-950/60 border border-zinc-800/60 px-3 py-2">
        <p className="text-[11px] text-zinc-500">
          <span className="text-zinc-600 mr-1.5">Preview:</span>
          {buildCronPreview(rule)}
        </p>
      </div>
    </div>
  );
}

// ── Parameters tab content ────────────────────────────────────────────────────

function ScheduleParameters({
  rules,
  onChange,
}: {
  rules: TriggerRule[];
  onChange: (rules: TriggerRule[]) => void;
}) {
  const updateRule = useCallback(
    (id: string, updated: TriggerRule) =>
      onChange(rules.map((r) => (r.id === id ? updated : r))),
    [rules, onChange]
  );

  const removeRule = useCallback(
    (id: string) => onChange(rules.filter((r) => r.id !== id)),
    [rules, onChange]
  );

  const addRule = () => onChange([...rules, makeDefaultRule()]);

  return (
    <div className="space-y-5 max-w-lg">
      {/* Info callout */}
      <div className="rounded-xl bg-zinc-900 border border-zinc-800 p-4 text-sm text-zinc-400 leading-relaxed">
        This workflow will run on the schedule you define here once you publish it.
        For testing, you can also trigger it manually by going back to the canvas
        and clicking <span className="text-orange-400 font-medium">&apos;execute workflow&apos;</span>.
      </div>

      {/* Rules */}
      <div>
        <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">Trigger Rules</p>
        <div className="space-y-3">
          {rules.map((rule) => (
            <RuleEditor
              key={rule.id}
              rule={rule}
              onChange={(updated) => updateRule(rule.id, updated)}
              onRemove={() => removeRule(rule.id)}
              canRemove={rules.length > 1}
            />
          ))}
        </div>
      </div>

      {/* Add rule */}
      <button
        onClick={addRule}
        className={cn(
          "w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-zinc-800",
          "text-sm text-zinc-500 hover:text-zinc-300 hover:border-zinc-700 transition-colors"
        )}
      >
        <Plus className="w-4 h-4" />
        Add Rule
      </button>
    </div>
  );
}

// ── Panel export ──────────────────────────────────────────────────────────────

interface ScheduleTriggerPanelProps {
  node: Node;
  onClose: () => void;
  onExecuteStep?: (nodeId: string) => Promise<Record<string, unknown>>;
  onNodeChange?: (node: Node) => void;
}

export function ScheduleTriggerPanel({ node, onClose, onExecuteStep, onNodeChange }: ScheduleTriggerPanelProps) {
  const [rules, setRules] = useState<TriggerRule[]>(
    node.data?.triggerRules?.length ? node.data.triggerRules : [makeDefaultRule()]
  );

  const handleRulesChange = (updated: TriggerRule[]) => {
    setRules(updated);
    onNodeChange?.({ ...node, data: { ...node.data, triggerRules: updated } });
  };

  return (
    <NodeModalShell
      node={node}
      icon={<Clock className="w-4 h-4 text-zinc-400" strokeWidth={2} />}
      title="Schedule Trigger"
      version="1.3"
      onClose={onClose}
      onExecuteStep={onExecuteStep}
      onNodeChange={onNodeChange}
      executeButtonLabel="Execute step"
      parametersContent={
        <ScheduleParameters rules={rules} onChange={handleRulesChange} />
      }
    />
  );
}
