import { SearchX } from 'lucide-react';

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/custom/empty';

export const EmptyTemplatesView = () => {
  return (
    <Empty className="min-h-[300px]">
      <EmptyHeader className="max-w-xl">
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>{'No templates found'}</EmptyTitle>
        <EmptyDescription>
          {'No templates match your search criteria. Try adjusting your search terms.'}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
};
