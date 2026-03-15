import {
  Template,
  TemplateTelemetryEventType,
  UncategorizedFolderId,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Plus } from 'lucide-react';
import { useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '@/components/custom/page-header';
import { SearchInput } from '@/components/custom/search-input';
import { Button } from '@/components/ui/button';
import { flowHooks } from '@/features/flows';
import { templatesTelemetryApi, templatesHooks } from '@/features/templates';
import { DASHBOARD_CONTENT_PADDING_X } from '@/lib/utils';

import { EmptyTemplatesView } from './empty-templates-view';
import { SelectedCategoryView } from './selected-category-view';

const TemplatesPage = () => {
  const navigate = useNavigate();
  const { templates, isLoading, search, setSearch, category, setCategory } =
    templatesHooks.useTemplates();
  const selectedCategory = category as string;
  const { mutate: createFlow, isPending: isCreateFlowPending } =
    flowHooks.useStartFromScratch(UncategorizedFolderId);

  const handleSearchChange = (value: string) => {
    setSearch(value);
  };

  const handleTemplateSelect = useCallback(
    (template: Template) => {
      navigate(`/templates/${template.id}`);
      templatesTelemetryApi.sendEvent({
        eventType: TemplateTelemetryEventType.VIEW,
        templateId: template.id,
      });
    },
    [navigate],
  );

  const selectedCategoryTemplates = useMemo(() => {
    if (selectedCategory === 'All') {
      return templates || [];
    }
    return (
      templates?.filter((t) => t.categories?.includes(selectedCategory)) || []
    );
  }, [selectedCategory, templates]);

  const hasTemplates = templates && templates.length > 0;

  return (
    <div>
      <div>
        <div className="sticky top-0 z-10 bg-background mb-6 ">
          <PageHeader
            showSidebarToggle={true}
            title={
              <>
                <div className="flex flex-row w-full justify-between gap-1">
                  <SearchInput
                    value={search}
                    onChange={handleSearchChange}
                    placeholder={t('Search templates by name or description')}
                  ></SearchInput>
                  <div className="flex flex-row justify-end w-[50%]">
                    <Button
                      variant="outline"
                      className="gap-2 h-full"
                      onClick={() => createFlow()}
                      disabled={isCreateFlowPending}
                    >
                      <Plus className="w-4 h-4" />
                      {t('Start from scratch')}
                    </Button>
                  </div>
                </div>
              </>
            }
          ></PageHeader>
        </div>
        <div className={DASHBOARD_CONTENT_PADDING_X}>
          {!hasTemplates && !isLoading ? (
            <EmptyTemplatesView />
          ) : (
            <SelectedCategoryView
              category={selectedCategory}
              templates={selectedCategoryTemplates}
              onTemplateSelect={handleTemplateSelect}
              isLoading={isLoading}
              showCategoryTitle={false}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export { TemplatesPage };
