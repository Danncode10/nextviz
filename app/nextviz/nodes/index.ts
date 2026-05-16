import ManualTriggerNode from "./manual-trigger/node";
import OnHttpNode from "./on-http";
import HttpRequestNode from "./http-request/node";
import LogDataNode from "./log-data";
import ScheduleTriggerNode from "./schedule-trigger/node";
import ChatTriggerNode from "./chat-trigger/node";
import AIAgentNode from "./ai-agent/node";
import ChatModelNode from "./chat-model-node/node";
import MemoryNode from "./memory-node/node";

export const nodeTypes = {
  manualTrigger: ManualTriggerNode,
  scheduleTrigger: ScheduleTriggerNode,
  chatTrigger: ChatTriggerNode,
  aiAgent: AIAgentNode,
  chatModelNode: ChatModelNode,
  memoryNode: MemoryNode,
  onHTTP: OnHttpNode,
  httpRequest: HttpRequestNode,
  logData: LogDataNode,
};
