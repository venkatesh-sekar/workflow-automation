import { isNil } from '@flow/shared';
import {
  MutationCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import React from 'react';

import { EmbeddingProvider } from '@/components/providers/embed-provider';
import TelemetryProvider from '@/components/providers/telemetry-provider';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { internalErrorToast, Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { RefreshAnalyticsProvider } from '@/features/platform-admin';

import { EmbeddingFontLoader } from './components/embedding-font-loader';
import { InitialDataGuard } from './components/initial-data-guard';
import { FlowRouter } from './guards';

const queryClient = new QueryClient({
  mutationCache: new MutationCache({
    onError: (err: Error, _, __, mutation) => {
      if (isNil(mutation.options.onError)) {
        internalErrorToast();
      }
    },
  }),
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RefreshAnalyticsProvider>
        <EmbeddingProvider>
          <InitialDataGuard>
            <EmbeddingFontLoader>
              <TelemetryProvider>
                <TooltipProvider>
                  <ThemeProvider storageKey="vite-ui-theme">
                    <FlowRouter />
                    <Toaster position="bottom-right" />
                  </ThemeProvider>
                </TooltipProvider>
              </TelemetryProvider>
            </EmbeddingFontLoader>
          </InitialDataGuard>
        </EmbeddingProvider>
      </RefreshAnalyticsProvider>
    </QueryClientProvider>
  );
}

export default App;
