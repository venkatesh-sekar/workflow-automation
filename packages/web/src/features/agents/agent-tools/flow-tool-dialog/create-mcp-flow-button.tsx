import { Button } from '@/components/ui/button';
import { flowHooks } from '@/features/flows/hooks/flow-hooks';

export const CreateMcpFlowButton = () => {
  const { mutate: createMcpFlow, isPending } = flowHooks.useCreateMcpFlow();

  return (
    <Button
      onClick={() => createMcpFlow()}
      variant="outline"
      className="mr-auto"
    >
      {isPending ? 'Creating...' : 'New MCP Flow'}
    </Button>
  );
};
