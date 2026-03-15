import { FlowFlagId } from '@flow/shared';

import { flagsHooks } from '@/hooks/flags-hooks';

type FlagGuardProps = {
  children: React.ReactNode;
  flag: FlowFlagId;
};
const FlagGuard = ({ children, flag }: FlagGuardProps) => {
  const { data: flagValue } = flagsHooks.useFlag<boolean>(flag);
  if (!flagValue) {
    return null;
  }
  return children;
};

FlagGuard.displayName = 'FlagGuard';
export { FlagGuard };
