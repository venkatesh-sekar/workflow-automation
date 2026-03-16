import { Trash } from 'lucide-react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

import { UserRowData } from '../index';

type DeleteUserActionProps = {
  row: UserRowData;
  isDeleting: boolean;
  onDelete: (id: string, isInvitation: boolean) => void;
};

export const DeleteUserAction = ({
  row,
  isDeleting,
  onDelete,
}: DeleteUserActionProps) => {
  const isInvitation = row.type === 'invitation';
  const email = row.data.email;
  const entityType = isInvitation ? 'Invitation' : 'User';

  return (
    <div className="flex items-end justify-end">
      <Tooltip>
        <TooltipTrigger>
          <ConfirmationDeleteDialog
            title={isInvitation ? 'Delete Invitation' : 'Delete User'}
            message={
              isInvitation
                ? 'This invitation will be permanently deleted.'
                : 'This user and all their data will be permanently deleted.'
            }
            entityName={`${entityType} ${email}`}
            buttonText={'Delete'}
            mutationFn={async () => {
              onDelete(isInvitation ? row.id : row.data.id, isInvitation);
            }}
          >
            <Button loading={isDeleting} variant="ghost" className="size-8 p-0">
              <Trash className="size-4 text-destructive" />
            </Button>
          </ConfirmationDeleteDialog>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          {isInvitation ? 'Delete invitation' : 'Delete user'}
        </TooltipContent>
      </Tooltip>
    </div>
  );
};
