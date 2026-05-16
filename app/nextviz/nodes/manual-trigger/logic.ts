import { NodeExecutorFn } from "@/lib/nextviz/types";

export const manualTrigger: NodeExecutorFn = async (_nodeData, _inputs, context) => {
  return {
    triggered: true,
    triggeredAt: new Date().toISOString(),
    payload: context.payload,
  };
};
