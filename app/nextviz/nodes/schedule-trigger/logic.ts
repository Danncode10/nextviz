if (process.env.NODE_ENV !== "development") {
  throw new Error("ScheduleTrigger logic must only run in development.");
}

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

function ruleToCron(rule: TriggerRule): string {
  const min  = rule.minute ?? 0;
  const hour = rule.hour ?? 0;

  switch (rule.interval) {
    case "minutes": return `*/${rule.every ?? 1} * * * *`;
    case "hours":   return `0 */${rule.every ?? 1} * * *`;
    case "days":    return `${min} ${hour} */${rule.daysBetween ?? 1} * *`;
    case "weeks":   return `${min} ${hour} * * ${rule.weekday ?? 1}`;
    case "months":  return `${min} ${hour} ${rule.dayOfMonth ?? 1} * *`;
    case "cron":    return rule.cronExpression ?? "* * * * *";
    default:        return "* * * * *";
  }
}

export interface ScheduleTriggerData {
  triggerRules?: TriggerRule[];
  [key: string]: unknown;
}

export async function executeScheduleTrigger(
  nodeData: ScheduleTriggerData
): Promise<Record<string, unknown>> {
  const rules = nodeData.triggerRules ?? [];
  const schedules = rules.map((r) => ({ ruleId: r.id, cron: ruleToCron(r), interval: r.interval }));

  return {
    triggeredAt: new Date().toISOString(),
    schedules,
  };
}
