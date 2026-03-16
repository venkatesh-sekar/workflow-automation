import { EventDestination } from '@flow/shared';
import { MoreVertical, Pencil, Trash } from 'lucide-react';
import { useState } from 'react';

import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { eventDestinationsCollectionUtils } from '../lib/event-destinations-collection';

import { EventDestinationDialog } from './event-destination-dialog';

const EventDestinationActions = ({
  destination,
}: {
  destination: EventDestination;
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  return (
    <div className="flex justify-end">
      <DropdownMenu
        modal={true}
        open={dropdownOpen}
        onOpenChange={setDropdownOpen}
      >
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <EventDestinationDialog destination={destination}>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              {'Edit'}
            </DropdownMenuItem>
          </EventDestinationDialog>

          <ConfirmationDeleteDialog
            title={'Delete Destination'}
            message={'Deleting this destination will stop all event notifications to this endpoint.'}
            entityName="destination"
            buttonText={'Delete'}
            showToast
            mutationFn={async () => {
              if (destination) {
                eventDestinationsCollectionUtils.delete([destination.id]);
              }
            }}
            isDanger
          >
            <DropdownMenuItem
              variant="destructive"
              onSelect={(e) => {
                e.preventDefault();
              }}
            >
              <Trash className="h-4 w-4 mr-2" />
              {'Delete'}
            </DropdownMenuItem>
          </ConfirmationDeleteDialog>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default EventDestinationActions;
