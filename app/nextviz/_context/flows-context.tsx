"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { listFlows } from "@/lib/nextviz/actions";
import { WorkflowJSON } from "@/lib/nextviz/types";

interface FlowsContextType {
  flows: WorkflowJSON[];
  activeFlowId: string | null;
  setActiveFlowId: (id: string | null) => void;
  refreshFlows: () => Promise<void>;
}

const FlowsContext = createContext<FlowsContextType>({
  flows: [],
  activeFlowId: null,
  setActiveFlowId: () => {},
  refreshFlows: async () => {},
});

export function FlowsProvider({ children }: { children: React.ReactNode }) {
  const [flows, setFlows] = useState<WorkflowJSON[]>([]);
  const [activeFlowId, setActiveFlowId] = useState<string | null>(null);

  const refreshFlows = useCallback(async () => {
    const data = await listFlows();
    setFlows(data);
  }, []);

  useEffect(() => {
    refreshFlows();
  }, [refreshFlows]);

  return (
    <FlowsContext.Provider
      value={{ flows, activeFlowId, setActiveFlowId, refreshFlows }}
    >
      {children}
    </FlowsContext.Provider>
  );
}

export const useFlows = () => useContext(FlowsContext);
