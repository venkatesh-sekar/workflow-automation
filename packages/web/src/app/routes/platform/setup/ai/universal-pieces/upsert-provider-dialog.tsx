import {
  AIProviderConfig,
  AIProviderName,
  CreateAIProviderRequest,
  isNil,
  OpenAIProviderAuthConfig,
  OpenAIProviderConfig,
  UpdateAIProviderRequest,
} from '@flow/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { t } from 'i18next';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormMessage,
  FormLabel,
  FormControl,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SUPPORTED_AI_PROVIDERS } from '@/features/agents';
import { aiProviderApi } from '@/features/platform-admin';

import { FlowMarkdown } from '../../../../../../components/custom/markdown';

type UpsertAIProviderDialogProps = {
  provider: AIProviderName;
  providerId?: string;
  config?: AIProviderConfig;
  children: React.ReactNode;
  onSave: () => void;
  defaultDisplayName?: string;
};

export const UpsertAIProviderDialog = (params: UpsertAIProviderDialogProps) => {
  const [open, setOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setOpen(val);
      }}
    >
      <UpsertAIProviderDialogContent
        key={open ? 'opened' : 'closed'}
        {...params}
        setOpen={setOpen}
      />
    </Dialog>
  );
};

export const UpsertAIProviderDialogContent = ({
  children,
  onSave,
  config,
  provider,
  providerId,
  defaultDisplayName = '',
  setOpen,
}: UpsertAIProviderDialogProps & { setOpen: (val: boolean) => void }) => {
  const currentProviderDef = useMemo(
    () => SUPPORTED_AI_PROVIDERS.find((p) => p.provider === provider)!,
    [provider],
  );

  const form = useForm<CreateAIProviderRequest>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(createFormSchema(!isNil(providerId))) as any,
    defaultValues: {
      provider,
      displayName: defaultDisplayName,
      config: config,
    } as CreateAIProviderRequest,
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: CreateAIProviderRequest): Promise<void> => {
      if (providerId) {
        const updateData: UpdateAIProviderRequest = {
          displayName: data.displayName,
          config: data.config,
          ...(data.auth?.apiKey?.length > 0 ? { auth: data.auth } : {}),
        };
        return aiProviderApi.update(providerId, updateData);
      } else {
        return aiProviderApi.upsert(data);
      }
    },
    onSuccess: () => {
      setOpen(false);
      onSave();
    },
    onError: (
      error: AxiosError<{ message?: string; params?: { message: string } }>,
    ) => {
      const data = error.response?.data;

      form.setError('root.serverError', {
        type: 'manual',
        message:
          data?.message ?? data?.params?.message ?? JSON.stringify(error),
      });
    },
  });

  const handleSave = (data: CreateAIProviderRequest) => {
    mutate(data);
  };

  return (
    <>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {providerId ? t('Update AI Provider') : t('Add AI Provider')}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form
            className="grid space-y-4"
            onSubmit={form.handleSubmit(handleSave)}
          >
            <ScrollArea viewPortClassName="max-h-[calc(70vh)] p-px">
              {currentProviderDef.markdown && (
                <div className="mb-4 text-sm text-muted-foreground">
                  <FlowMarkdown
                    markdown={currentProviderDef.markdown}
                  ></FlowMarkdown>
                </div>
              )}

              <FormField
                control={form.control}
                name="auth.apiKey"
                render={({ field }) => (
                  <FormItem className="grid space-y-3">
                    <FormLabel htmlFor="apiKey">{t('API Key')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        required={!config}
                        id="apiKey"
                        placeholder={'sk_************************'}
                        disabled={isPending}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {form.formState.errors.root?.serverError && (
                <FormMessage className="mt-2">
                  {form.formState.errors.root.serverError.message}
                </FormMessage>
              )}
            </ScrollArea>

            <DialogFooter>
              <Button
                variant={'outline'}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  setOpen(false);
                }}
                disabled={isPending}
              >
                {t('Cancel')}
              </Button>
              <Button disabled={isPending} loading={isPending} type="submit">
                {t('Save')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </>
  );
};

const OptionalAuthSchema = z
  .object({
    apiKey: z.string().optional(),
  })
  .optional();

const createFormSchema = (editMode: boolean) => {
  return z.object({
    displayName: z.string().min(1),
    provider: z.literal(AIProviderName.OPENAI),
    auth: editMode ? OptionalAuthSchema : OpenAIProviderAuthConfig,
    config: OpenAIProviderConfig,
  });
};
