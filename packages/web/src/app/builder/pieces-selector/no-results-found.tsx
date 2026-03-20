import { SearchX } from 'lucide-react';

const NoResultsFound = () => {
  return (
    <div className="flex flex-col gap-2 items-center justify-center h-full ">
      <SearchX className="w-14 h-14" />
      <div className="text-sm ">{'No pieces found'}</div>
      <div className="text-sm ">{'Try adjusting your search'}</div>
    </div>
  );
};

export { NoResultsFound };
