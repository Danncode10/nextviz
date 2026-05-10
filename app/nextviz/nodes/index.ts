import ManualTriggerNode from "./manual-trigger";
import OnHttpNode from "./on-http";
import HttpActionNode from "./http-action";
import LogDataNode from "./log-data";

export const nodeTypes = {
  manualTrigger: ManualTriggerNode,
  onHTTP: OnHttpNode,
  httpAction: HttpActionNode,
  logData: LogDataNode,
};
