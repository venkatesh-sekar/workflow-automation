import {
  FlowTriggerType,
  FlowVersionState,
  StepOutputStatus,
  flowStructureUtil,
  isNil,
} from '@flow/shared';
import { RouteOff, TriangleAlert } from 'lucide-react';
import React, { useMemo } from 'react';

import { InvalidStepIcon } from '@/components/custom/alert-icon';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '@/components/ui/tooltip';
import { StepStatusIcon, flowRunUtils } from '@/features/flow-runs';
import { pieceSelectorUtils } from '@/features/pieces';

import { useBuilderStateContext } from '../../../builder-hooks';
import { flowCanvasUtils } from '../../utils/flow-canvas-utils';

type DraftStepStatus =
  | 'skipped'
  | 'invalid'
  | 'testing'
  | 'failed'
  | 'needs-test'
  | 'tested'
  | 'untested';

const FlowStepNodeStatusInDraft = ({ stepName }: { stepName: string }) => {
  const [
    run,
    isBeingTested,
    hasError,
    lastTestDate,
    lastUpdatedDate,
    stepType,
    isInDraft,
    isStepValid,
    isSkipped,
    isManualTrigger,
  ] = useBuilderStateContext((state) => {
    const step = flowStructureUtil.getStep(stepName, state.flowVersion.trigger);
    const isManualTrigger =
      step?.type === FlowTriggerType.PIECE &&
      pieceSelectorUtils.isManualTrigger({
        pieceName: step?.settings.pieceName,
        triggerName: step?.settings.triggerName ?? '',
      });
    return [
      state.run,
      state.isStepBeingTested(stepName),
      !isNil(state.errorLogs[stepName]),
      step?.settings?.sampleData?.lastTestDate as string | undefined,
      step?.lastUpdatedDate ?? '',
      step?.type,
      state.flowVersion.state === FlowVersionState.DRAFT,
      !!step?.valid,
      flowCanvasUtils.isSkipped(stepName, state.flowVersion.trigger),
      isManualTrigger,
    ];
  });

  const draftStatusConfig: Record<
    DraftStepStatus,
    {
      variant: 'default' | 'success' | 'error' | 'warning';
      text: string;
      icon: React.ReactNode;
    }
  > = {
    skipped: {
      variant: 'default',
      text: 'Skipped',
      icon: <RouteOff className="size-3" />,
    },
    invalid: {
      variant: 'warning',
      text: 'Incomplete',
      icon: <InvalidStepIcon className="size-3" />,
    },
    testing: {
      variant: 'default',
      text: 'Testing...',
      icon: (
        <StepStatusIcon
          status={StepOutputStatus.RUNNING}
          size="3"
          hideTooltip={true}
        />
      ),
    },
    failed: {
      variant: 'error',
      text: 'Failed',
      icon: (
        <StepStatusIcon
          status={StepOutputStatus.FAILED}
          size="3"
          hideTooltip={true}
        />
      ),
    },
    'needs-test': {
      variant: 'default',
      text: 'Test me',
      icon: <TriangleAlert className="size-3" />,
    },
    untested: {
      variant: 'default',
      text: 'Test me',
      icon: <TriangleAlert className="size-3" />,
    },
    tested: {
      variant: 'success',
      text: 'Tested',
      icon: (
        <StepStatusIcon
          status={StepOutputStatus.SUCCEEDED}
          size="3"
          hideTooltip={true}
        />
      ),
    },
  };
  const status: DraftStepStatus = useMemo(() => {
    if (isSkipped) return 'skipped';
    if (!isStepValid) return 'invalid';
    if (isBeingTested) return 'testing';

    if (isNil(lastTestDate)) {
      return 'untested';
    }
    if (lastUpdatedDate > lastTestDate) {
      return 'needs-test';
    }
    if (hasError) return 'failed';

    return 'tested';
  }, [
    isSkipped,
    isStepValid,
    isBeingTested,
    hasError,
    lastTestDate,
    lastUpdatedDate,
  ]);

  if (
    !isNil(run) ||
    stepType === FlowTriggerType.EMPTY ||
    !isInDraft ||
    isManualTrigger
  ) {
    return null;
  }

  const config = draftStatusConfig[status];

  return (
    <div className="absolute right-[1px] h-[20px] -top-[28px]">
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={flowRunUtils.getStatusContainerClassName(
              config.variant,
              true,
            )}
          >
            {config.icon}
            <div>{config.text}</div>
          </div>
        </TooltipTrigger>
        {status === 'untested' && (
          <TooltipContent>
            {'This step has not been tested yet'}
          </TooltipContent>
        )}
        {status === 'needs-test' && (
          <TooltipContent>
            {'This step has been updated since the last test'}
          </TooltipContent>
        )}
      </Tooltip>
    </div>
  );
};

FlowStepNodeStatusInDraft.displayName = 'FlowStepNodeStatusInDraft';
export { FlowStepNodeStatusInDraft };
