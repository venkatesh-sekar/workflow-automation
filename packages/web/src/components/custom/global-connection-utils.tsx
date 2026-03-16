import { TriangleAlert } from 'lucide-react';

import { Alert, AlertDescription } from '../ui/alert';
export const DefaultTag = () => {
  return (
    <div className="text-xss flex items-center justify-center  rounded-lg border border-border px-2.5 py-0.5">
      {'Default'}
    </div>
  );
};

export const GlobalConnectionWarning = () => {
  return (
    <Alert variant="warning">
      <TriangleAlert className="h-4 w-4" />
      <AlertDescription>
        {'Deselecting a global connection from a project that has a flow using it, will break the flow.'}
      </AlertDescription>
    </Alert>
  );
};

export const DeleteConnectionWarning = () => {
  return (
    <div>
      {'Any flows currently using these connections'}{' '}
      <strong>{'will break immediately'}</strong>. <br />
    </div>
  );
};
