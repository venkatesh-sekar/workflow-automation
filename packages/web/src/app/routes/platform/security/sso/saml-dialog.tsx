import {
  FlowFlagId,
  PlatformWithoutSensitiveData,
  UpdatePlatformRequestBody,
} from '@flow/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

import { platformApi } from '@/api/platforms-api';
import { FlowMarkdown } from '@/components/custom/markdown';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { flagsHooks } from '@/hooks/flags-hooks';

type ConfigureSamlDialogProps = {
  platform: PlatformWithoutSensitiveData;
  connected: boolean;
  refetch: () => Promise<void>;
};

const Saml2FormValues = z.object({
  idpMetadata: z.string().min(1),
  idpCertificate: z.string().min(1),
});
type Saml2FormValues = z.infer<typeof Saml2FormValues>;

export const ConfigureSamlDialog = ({
  platform,
  connected,
  refetch,
}: ConfigureSamlDialogProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<Saml2FormValues>({
    resolver: zodResolver(Saml2FormValues),
  });

  const { data: samlAcs } = flagsHooks.useFlag<string>(
    FlowFlagId.SAML_AUTH_ACS_URL,
  );
  const { mutate, isPending } = useMutation({
    mutationFn: async (request: UpdatePlatformRequestBody) => {
      await platformApi.update(request, platform.id);
      await refetch();
    },
    onSuccess: () => {
      toast.success('Single sign-on settings updated', {
        duration: 3000,
      });
      setOpen(false);
    },
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) {
          form.reset();
        }
        setOpen(open);
      }}
    >
      <DialogTrigger asChild>
        {connected ? (
          <Button
            size={'sm'}
            className="text-destructive"
            variant={'basic'}
            loading={isPending}
            onClick={(e) => {
              mutate({
                federatedAuthProviders: {
                  saml: null,
                },
              });
              e.preventDefault();
            }}
          >
            {'Disable'}
          </Button>
        ) : (
          <Button size={'sm'} variant={'basic'} onClick={() => setOpen(true)}>
            {'Enable'}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{'Configure SAML 2.0 SSO'}</DialogTitle>
        </DialogHeader>
        {samlAcs && (
          <div className="mb-4">
            <FlowMarkdown
              markdown={`
**Setup Instructions**:
Please check the SAML SSO documentation for setup instructions.

**Single sign-on URL**:
\`\`\`text
${samlAcs ?? ''}
\`\`\`
**Audience URI (SP Entity ID)**:
\`\`\`text
Flow
\`\`\`
`}
            />
          </div>
        )}

        <Form {...form}>
          <form
            className="grid space-y-4"
            onSubmit={form.handleSubmit((data) => {
              mutate({
                federatedAuthProviders: {
                  saml: data,
                },
              });
            })}
          >
            <FormField
              name="idpMetadata"
              render={({ field }) => (
                <FormItem className="grid space-y-4">
                  <Label htmlFor="idpMetadata">{'IDP Metadata'}</Label>
                  <Input
                    {...field}
                    required
                    id="idpMetadata"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="idpCertificate"
              render={({ field }) => (
                <FormItem className="grid space-y-4">
                  <Label htmlFor="idpCertificate">{'IDP Certificate'}</Label>
                  <Textarea
                    {...field}
                    required
                    id="idpCertificate"
                    className="rounded-sm"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            {form?.formState?.errors?.root?.serverError && (
              <FormMessage>
                {form.formState.errors.root.serverError.message}
              </FormMessage>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                {'Cancel'}
              </Button>
              <Button
                loading={isPending}
                disabled={!form.formState.isValid}
                type="submit"
              >
                {'Save'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
