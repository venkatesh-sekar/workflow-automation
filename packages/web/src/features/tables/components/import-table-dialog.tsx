import { FlowFlagId, SharedTemplate, TableTemplate, TemplateScope } from '@flow/shared';
import { useMutation } from '@tanstack/react-query';
import { Import } from 'lucide-react';
import { parse } from 'papaparse';
import { useState } from 'react';
import { FieldErrors, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { CopyButton } from '@/components/custom/clipboard/copy-button';
import { FlowMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { flagsHooks } from '@/hooks/flags-hooks';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';

import { recordsApi } from '../api/records-api';
import { tableHooks } from '../hooks/table-hooks';
import { FieldsMapping, fileUtils, SupportedFileType } from '../utils/utils';

import { useOptionalTableStore } from './flow-table-state-provider';
import { FieldsMappingControl } from './fields-mapping';

type ImportTableDialogProps = {
  open?: boolean;
  setIsOpen?: (open: boolean) => void;
  showTrigger?: boolean;
  tableId?: string;
  onImportSuccess?: () => void;
  allowedFileTypes?: SupportedFileType[];
};

const ImportTableDialog = ({
  open,
  setIsOpen,
  showTrigger = true,
  tableId,
  onImportSuccess,
  allowedFileTypes = ['json'],
}: ImportTableDialogProps) => {
  const navigate = useNavigate();
  const projectId = authenticationSession.getProjectId() ?? '';
  const [serverError, setServerError] = useState<string | null>(null);
  const [csvColumns, setCsvColumns] = useState<string[]>([]);
  const [csvRecords, setCsvRecords] = useState<string[][]>([]);
  const [fileType, setFileType] = useState<SupportedFileType | null>(null);
  const { data: maxFileSize } = flagsHooks.useFlag<number>(
    FlowFlagId.MAX_FILE_SIZE_MB,
  );
  const { data: maxRecords } = flagsHooks.useFlag<number>(
    FlowFlagId.MAX_RECORDS_PER_TABLE,
  );

  const tableStore = useOptionalTableStore();

  const getTableState = () => {
    if (!tableStore) return null;
    const state = tableStore.getState();
    return {
      serverFields: state.serverFields,
      serverRecords: state.serverRecords,
      recordsCount: state.records.length,
      setRecords: state.setRecords,
    };
  };

  const resetState = () => {
    form.reset();
    setCsvColumns([]);
    setCsvRecords([]);
    setFileType(null);
    setServerError(null);
  };

  const form = useForm<{
    file: File;
    fieldsMapping: FieldsMapping;
  }>({
    defaultValues: {
      fieldsMapping: [],
    },
    resolver: (values) => {
      const errors: FieldErrors<{
        file: File | null;
        fieldsMapping: FieldsMapping;
      }> = {};

      if (!values.file) {
        errors.file = {
          message: 'Please select a JSON or CSV file',
          type: 'required',
        };
        return { values: {}, errors };
      }

      const validation = fileUtils.validateFile(
        values.file,
        maxFileSize ?? undefined,
      );
      if (!validation.valid) {
        errors.file = {
          message: validation.error!,
          type: 'invalid',
        };
        return { values: {}, errors };
      }

      return {
        values: Object.keys(errors).length === 0 ? values : {},
        errors,
      };
    },
  });

  const handleCsvImport = async (data: { fieldsMapping: FieldsMapping }) => {
    const tableState = getTableState();
    if (!tableId || !tableState) {
      throw new Error('CSV import is only available for existing tables');
    }

    const records = await recordsApi.importCsv({
      csvRecords,
      tableId,
      fieldsMapping: data.fieldsMapping,
      maxRecordsLimit: (maxRecords ?? 1000) - tableState.recordsCount,
    });

    tableState.setRecords([...tableState.serverRecords, ...records]);
    return null;
  };

  const handleJsonImport = async (data: { file: File }) => {
    const fileContent = await data.file.text();
    const parsedContent = JSON.parse(fileContent);

    let template: SharedTemplate;
    if ('tables' in parsedContent && Array.isArray(parsedContent.tables)) {
      template = parsedContent as SharedTemplate;
    } else {
      const singleTableTemplate = parsedContent as TableTemplate;
      template = {
        name: singleTableTemplate.name,
        type: parsedContent.type,
        summary: '',
        description: '',
        tags: [],
        blogUrl: null,
        metadata: null,
        author: '',
        categories: [],
        pieces: [],
        scope: TemplateScope.TEAM,
        tables: [singleTableTemplate],
        status: parsedContent.status,
      };
    }

    if (!template.tables || template.tables.length === 0) {
      throw new Error('No tables found in template');
    }

    if (tableId) {
      return await tableHooks.importTableIntoExisting({
        template,
        existingTableId: tableId,
        maxRecords: maxRecords ?? 1000,
      });
    } else {
      const tables = await tableHooks.importTablesFromTemplates({
        templates: [template],
        projectId,
        maxRecords: maxRecords ?? 1000,
      });
      return tables[0];
    }
  };

  const { mutate: importFile, isPending: isLoading } = useMutation({
    mutationFn: async (data: { file: File; fieldsMapping: FieldsMapping }) => {
      setServerError(null);

      if (fileType === 'csv') {
        return await handleCsvImport(data);
      } else {
        return await handleJsonImport(data);
      }
    },
    onSuccess: async (table) => {
      setIsOpen?.(false);
      onImportSuccess?.();
      if (!tableId && table) {
        navigate(`/projects/${projectId}/tables/${table.id}`);
      }
    },
    onError: (error) => {
      const errorMessage =
        api.isError(error) && error.response?.data
          ? JSON.stringify(error.response.data)
          : error.message;
      setServerError(errorMessage);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        setIsOpen?.(value);
        if (!value) resetState();
      }}
    >
      {showTrigger && (
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex gap-2 items-center"
          >
            <Import className="w-4 h-4 shrink-0" />
            {'Import'}
          </Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{'Import Table'}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit((data) => importFile(data))}
            className="space-y-4"
          >
            <FlowMarkdown
              className="text-left"
              markdown={(() => {
                if (fileType === 'csv') {
                  return [
                    'Import records from a CSV file',
                    'Records will be added to the bottom of the table',
                    `Any records after the limit (${maxRecords ?? 0} records) will be ignored`,
                  ].join('\n\n');
                }

                if (fileType === 'json' && tableId) {
                  return [
                    '⚠️ **Warning:** This will completely replace the current table',
                    'All existing fields and records will be deleted',
                    `Any records after the limit (${maxRecords ?? 0} records) will be ignored`,
                  ].join('\n\n');
                }

                if (!allowedFileTypes.includes('csv')) {
                  return [
                    'Import a table from JSON template',
                    tableId
                      ? '⚠️ This will completely replace the current table with the template structure and data'
                      : 'The table will be created with all its fields and data',
                    `Any records after the limit (${maxRecords ?? 0} records) will be ignored`,
                  ].join('\n\n');
                }

                return [
                  'Import a table from JSON or add records from CSV',
                  '**JSON:** Creates a new table with fields and data',
                  '**CSV:** Adds records to an existing table',
                  `Any records after the limit (${maxRecords ?? 0} records) will be ignored`,
                ].join('\n\n');
              })()}
            />
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {allowedFileTypes
                        .map((t) => t.toUpperCase())
                        .join(' or ') + ' file'}
                  </FormLabel>
                  <FormControl>
                    <Input
                      type="file"
                      accept={allowedFileTypes.map((t) => `.${t}`).join(',')}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        field.onChange(file);
                        setServerError(null);

                        const validation = fileUtils.validateFile(
                          file,
                          maxFileSize ?? undefined,
                        );
                        if (!validation.valid) {
                          setServerError(validation.error!);
                          return;
                        }

                        const extension = fileUtils.getExtension(file.name);
                        if (!fileUtils.isValidType(extension)) {
                          setServerError('Invalid file type');
                          return;
                        }

                        if (!allowedFileTypes.includes(extension)) {
                          setServerError(
                            `Only ${allowedFileTypes
                                .map((t) => t.toUpperCase())
                                .join(', ')} files are allowed`,
                          );
                          return;
                        }

                        setFileType(extension);

                        if (extension === 'csv') {
                          if (!tableId) {
                            setServerError(
                              'CSV import is only available for existing tables',
                            );
                            return;
                          }

                          if (!tableStore) {
                            setServerError(
                              'CSV import is only available from the table editor.',
                            );
                            return;
                          }

                          try {
                            const parsedCsvRecords = await new Promise<
                              string[][]
                            >((resolve, reject) => {
                              parse(file, {
                                header: false,
                                skipEmptyLines: 'greedy',
                                worker: true,
                                complete: (results) =>
                                  resolve(results.data as string[][]),
                                error: (error) => reject(error),
                              });
                            });
                            setCsvColumns(parsedCsvRecords[0] ?? []);
                            setCsvRecords(parsedCsvRecords.slice(1));
                          } catch (error) {
                            setServerError('Failed to parse CSV file');
                          }
                        } else {
                          setCsvColumns([]);
                          setCsvRecords([]);
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {fileType === 'csv' && csvColumns.length > 0 && tableStore && (
              <ScrollArea className="max-h-[calc(100vh-500px)] overflow-y-auto flex-1">
                <FormField
                  control={form.control}
                  name="fieldsMapping"
                  key={form.watch('file')?.name}
                  render={({ field }) => (
                    <FormItem>
                      <FieldsMappingControl
                        fields={tableStore.getState().serverFields}
                        csvColumns={csvColumns}
                        onChange={field.onChange}
                      />
                    </FormItem>
                  )}
                />
              </ScrollArea>
            )}

            {serverError && (
              <div className=" flex items-center justify-between">
                <div className="text-destructive">
                  {'An unexpected error occurred while importing the file, please hit the copy error and send it to support'}
                </div>
                <div className="min-w-4">
                  <CopyButton
                    variant="ghost"
                    withoutTooltip={true}
                    textToCopy={serverError}
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" size="sm" disabled={isLoading}>
                  {'Cancel'}
                </Button>
              </DialogClose>
              <Button type="submit" size="sm" loading={isLoading}>
                {'Import'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

ImportTableDialog.displayName = 'ImportTableDialog';
export { ImportTableDialog };
