import {
  FlowFlagId,
  FlowRunStatus,
  isFlowRunStateTerminal,
} from '@flow/shared';
import { CircleHelp } from 'lucide-react';

import { flowRunUtils } from '@/features/flow-runs';
import { flagsHooks } from '@/hooks/flags-hooks';
import { formatUtils } from '@/lib/format-utils';
import { cn } from '@/lib/utils';

import { EditFlowOrViewDraftButton } from '../../builder-header/flow-status/view-draft-or-edit-flow-button';
import { useBuilderStateContext } from '../../builder-hooks';

import LargeWidgetWrapper from './large-widget-wrapper';

function getStatusText({
  status,
  timeout,
  memoryLimit,
}: {
  status: FlowRunStatus;
  timeout: number;
  memoryLimit: number;
}) {
  switch (status) {
    case FlowRunStatus.SUCCEEDED:
      return 'Run Succeeded';
    case FlowRunStatus.FAILED:
      return 'Run Failed';
    case FlowRunStatus.PAUSED:
      return 'Run Paused';
    case FlowRunStatus.QUOTA_EXCEEDED:
      return 'Quota Exceeded';
    case FlowRunStatus.LOG_SIZE_EXCEEDED:
      return 'Run failed due to output of steps exceeding the log size limit';
    case FlowRunStatus.MEMORY_LIMIT_EXCEEDED:
      return `Run failed due to exceeding the memory limit of ${Math.floor(memoryLimit / 1024)} MB`;
    case FlowRunStatus.QUEUED:
      return 'Queued';
    case FlowRunStatus.RUNNING:
      return 'Running';
    case FlowRunStatus.TIMEOUT:
      return `Run exceeded ${timeout} seconds, try to optimize your steps.`;
    case FlowRunStatus.INTERNAL_ERROR:
      return 'Run failed for an unknown reason, contact support.';
    case FlowRunStatus.CANCELED:
      return 'Run Cancelled';
  }
}

const RunInfoWidget = () => {
  const [run] = useBuilderStateContext((state) => [state.run]);
  const { variant, Icon } = run
    ? flowRunUtils.getStatusIcon(run.status)
    : { variant: 'default' as const, Icon: CircleHelp };
  const { data: timeoutSeconds } = flagsHooks.useFlag<number>(
    FlowFlagId.FLOW_RUN_TIME_SECONDS,
  );
  const { data: memoryLimit } = flagsHooks.useFlag<number>(
    FlowFlagId.FLOW_RUN_MEMORY_LIMIT_KB,
  );
  if (!run) {
    return null;
  }
  const isRunTerminal = isFlowRunStateTerminal({
    status: run.status,
    ignoreInternalError: false,
  });
  return (
    <LargeWidgetWrapper
      containerClassName={cn(
        flowRunUtils.getStatusContainerClassName(variant),
        'bg-background border border-border dark:bg-background dark:border-border',
      )}
      key={run.id + run.status}
    >
      <div className="flex items-center justify-between w-full flex-wrap">
        <div className="flex items-center text-sm shrink-0">
          <Icon className="size-5 mr-2" />
          <span className="text-foreground dark:text-foreground font-medium">
            {getStatusText({
              status: run.status,
              timeout: timeoutSeconds ?? -1,
              memoryLimit: memoryLimit ?? -1,
            })}
          </span>

          <div className="shrink-0 text-foreground dark:text-foreground">
            {isRunTerminal && (
              <>
                &nbsp;-&nbsp;
                {run.startTime && (
                  <DateSection
                    text={'Started'}
                    dateOrDuration={formatUtils.formatDateWithTime(
                      new Date(run.startTime),
                      true,
                    )}
                  />
                )}
                {', '}
                {run.finishTime && run.startTime && (
                  <DateSection
                    text={'Took'}
                    dateOrDuration={formatUtils.formatDuration(
                      new Date(run.finishTime).getTime() -
                        new Date(run.startTime).getTime(),
                    )}
                  />
                )}
              </>
            )}
          </div>
        </div>

        <EditFlowOrViewDraftButton onCanvas={false}></EditFlowOrViewDraftButton>
      </div>
    </LargeWidgetWrapper>
  );
};
RunInfoWidget.displayName = 'RunInfoWidget';
export { RunInfoWidget };

const DateSection = ({
  text,
  dateOrDuration,
}: {
  text: string;
  dateOrDuration: string;
}) => {
  return (
    <>
      <span>{`${text}: `}</span>
      <span>{`${dateOrDuration}`}</span>
    </>
  );
};
