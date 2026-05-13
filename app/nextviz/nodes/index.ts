import ManualTriggerNode from "./manual-trigger";
import OnHttpNode from "./on-http";
import HttpActionNode from "./http-action";
import LogDataNode from "./log-data";
import ScheduleTriggerNode from "./schedule-trigger/node";
import ChatTriggerNode from "./chat-trigger/node";

export const nodeTypes = {
  manualTrigger: ManualTriggerNode,
  scheduleTrigger: ScheduleTriggerNode,
  chatTrigger: ChatTriggerNode,
  onHTTP: OnHttpNode,
  httpAction: HttpActionNode,
  logData: LogDataNode,
};
