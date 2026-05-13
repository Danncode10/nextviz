import ManualTriggerNode from "./manual-trigger";
import OnHttpNode from "./on-http";
import HttpActionNode from "./http-action";
import LogDataNode from "./log-data";
import ScheduleTriggerNode from "./schedule-trigger/node";

export const nodeTypes = {
  manualTrigger: ManualTriggerNode,
  scheduleTrigger: ScheduleTriggerNode,
  onHTTP: OnHttpNode,
  httpAction: HttpActionNode,
  logData: LogDataNode,
};
