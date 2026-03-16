import { SigningKey } from '@flow/shared';
import { ExternalLink, Key, MoreHorizontal, Trash } from 'lucide-react';

import { CenteredPage } from '@/app/components/centered-page';
import LockedFeatureGuard from '@/app/components/locked-feature-guard';
import { AnimatedIconButton } from '@/components/custom/animated-icon-button';
import { ConfirmationDeleteDialog } from '@/components/custom/delete-dialog';
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/custom/item';
import { PlusIcon } from '@/components/icons/plus';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SkeletonList } from '@/components/ui/skeleton';
import { internalErrorToast } from '@/components/ui/sonner';
import {
  signingKeyApi,
  NewSigningKeyDialog,
  signingKeyQueries,
} from '@/features/platform-admin';
import { platformHooks } from '@/hooks/platform-hooks';
import { formatUtils } from '@/lib/format-utils';

const SigningKeysPage = () => {
  const { platform } = platformHooks.useCurrentPlatform();

  const { data, isLoading, refetch } = signingKeyQueries.useSigningKeys();

  const signingKeys: SigningKey[] = data?.data ?? [];

  return (
    <LockedFeatureGuard
      locked={!platform.plan.embeddingEnabled}
      lockTitle={'Unlock Embedding Through JS SDK'}
      lockDescription={'Enable signing keys to access embedding functionalities.'}
    >
      <CenteredPage
        title={'Embedding'}
        description={
          <>
            {"Show your product's automations inside your own UI."}
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 mt-0.5"
              asChild
            >
              <a
                href=""
                target="_blank"
                rel="noopener noreferrer"
              >
                {'Read more'}
                <ExternalLink className="size-3" />
              </a>
            </Button>
          </>
        }
        actions={
          <NewSigningKeyDialog onCreate={() => refetch()}>
            <AnimatedIconButton icon={PlusIcon} iconSize={16} size="sm">
              {'New Signing Key'}
            </AnimatedIconButton>
          </NewSigningKeyDialog>
        }
      >
        {isLoading && (
          <SkeletonList numberOfItems={3} className="w-full h-[72px]" />
        )}

        {!isLoading && signingKeys.length === 0 && (
          <div className="flex flex-col items-center gap-3 py-12 text-muted-foreground">
            <Key className="size-10" />
            <p className="text-sm">{'No signing keys found'}</p>
          </div>
        )}

        {!isLoading && signingKeys.length > 0 && (
          <ItemGroup className="gap-2">
            {signingKeys.map((signingKey) => (
              <Item
                key={signingKey.id}
                variant="outline"
                size="sm"
                className="items-center"
              >
                <ItemMedia variant="icon">
                  <Key />
                </ItemMedia>
                <ItemContent className="gap-0">
                  <ItemTitle className="flex items-center gap-2">
                    {signingKey.displayName}{' '}
                  </ItemTitle>
                  <ItemDescription className="text-xs">
                    {' ' + 'Created'}{' '}
                    {formatUtils.formatDateToAgo(new Date(signingKey.created))}
                    <br />
                    <span className="text-xs text-muted-foreground">
                      kid: {signingKey.id}
                    </span>
                  </ItemDescription>
                </ItemContent>
                <ItemActions>
                  <DropdownMenu modal={true}>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="size-8 p-0">
                        <MoreHorizontal className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <ConfirmationDeleteDialog
                        title={'Delete Signing Key'}
                        message={'Deleting this signing key will invalidate any tokens signed with it.'}
                        entityName={'Signing Key'}
                        buttonText={'Delete'}
                        mutationFn={async () => {
                          await signingKeyApi.delete(signingKey.id);
                          refetch();
                        }}
                        onError={() => internalErrorToast()}
                      >
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onSelect={(e) => e.preventDefault()}
                        >
                          <Trash className="size-4 mr-2 text-destructive" />
                          {'Delete Signing Key'}
                        </DropdownMenuItem>
                      </ConfirmationDeleteDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </CenteredPage>
    </LockedFeatureGuard>
  );
};

SigningKeysPage.displayName = 'SigningKeysPage';
export { SigningKeysPage };
