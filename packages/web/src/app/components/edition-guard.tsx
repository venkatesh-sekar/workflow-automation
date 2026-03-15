import { FlowEdition, FlowFlagId } from '@flow/shared';

import { flagsHooks } from '@/hooks/flags-hooks';

type EditionGuardProps = {
  children: React.ReactNode;
  allowedEditions: FlowEdition[];
};

const EditionGuard = ({ children, allowedEditions }: EditionGuardProps) => {
  const { data: edition } = flagsHooks.useFlag<FlowEdition>(FlowFlagId.EDITION);

  if (!edition || !allowedEditions.includes(edition)) {
    return null;
  }
  return children;
};

EditionGuard.displayName = 'EditionGuard';
export { EditionGuard };
