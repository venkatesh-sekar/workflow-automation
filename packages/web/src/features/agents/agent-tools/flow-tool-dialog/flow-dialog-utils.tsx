import { PopulatedFlow, FlowVersionState } from '@flow/shared';
const isFlowSelectable = (flow: PopulatedFlow) => {
  return (
    flow.version.state === FlowVersionState.LOCKED && flow.status === 'ENABLED'
  );
};

const getFlowTooltip = (flow: PopulatedFlow) => {
  if (flow.version.state !== FlowVersionState.LOCKED) {
    return 'Flow must be published to be selected';
  }
  if (flow.status !== 'ENABLED') {
    return 'Flow must be enabled to be selected';
  }
  return '';
};

export const flowDialogUtils = {
  isFlowSelectable,
  getFlowTooltip,
};
