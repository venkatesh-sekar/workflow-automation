import React from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export const MessageTooltip = React.forwardRef<
  HTMLButtonElement,
  { children: React.ReactNode; isDisabled: boolean; message: string }
>(({ children, isDisabled, message }, ref) => {
  return (
    <Tooltip delayDuration={100}>
      <TooltipTrigger ref={ref} asChild>
        <div>{children}</div>
      </TooltipTrigger>
      {isDisabled && (
        <TooltipContent side="bottom">{message}</TooltipContent>
      )}
    </Tooltip>
  );
});

MessageTooltip.displayName = 'MessageTooltip';
