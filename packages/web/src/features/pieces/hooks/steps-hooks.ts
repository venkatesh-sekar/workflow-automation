import {
  FlowAction,
  FlowActionType,
  FlowTriggerType,
  SuggestionType,
  FlowTrigger,
} from '@flow/shared';
import { useQueries, useQuery } from '@tanstack/react-query';

import { authenticationSession } from '@/lib/authentication-session';

import { piecesApi } from '../api/pieces-api';
import {
  StepMetadataWithActionOrTriggerOrAgentDisplayName,
  StepMetadataWithSuggestions,
} from '../types';
import {
  CORE_ACTIONS_METADATA,
  CORE_STEP_METADATA,
  stepUtils,
} from '../utils/step-utils';

export const stepsHooks = {
  useStepMetadata: ({ step }: UseStepMetadata) => {
    const query = useQuery<
      StepMetadataWithActionOrTriggerOrAgentDisplayName,
      Error
    >({
      queryKey: getQueryKeyForStepMetadata(step),
      queryFn: () => stepUtils.getMetadata(step),
    });
    return {
      stepMetadata: query.data,
      isLoading: query.isLoading,
    };
  },
  useStepsMetadata: (props: (FlowAction | FlowTrigger)[]) => {
    return useQueries({
      queries: props.map((step) => {
        return {
          queryKey: getQueryKeyForStepMetadata(step),
          queryFn: () =>
            stepUtils.getMetadata(step),
          staleTime: Infinity,
        };
      }),
    });
  },
  useAllStepsMetadata: ({ searchQuery, type, enabled }: UseMetadataProps) => {
    const query = useQuery<StepMetadataWithSuggestions[], Error>({
      queryKey: ['pieces-metadata', searchQuery, type],
      queryFn: async () => {
        const pieces = await piecesApi.list({
          projectId: authenticationSession.getProjectId()!,
          searchQuery,
          suggestionType:
            type === 'action' ? SuggestionType.ACTION : SuggestionType.TRIGGER,
        });

        const filteredPiecesBySuggestionType = pieces.filter(
          (piece) =>
            (type === 'action' && piece.actions > 0) ||
            (type === 'trigger' && piece.triggers > 0),
        );

        const piecesMetadata = filteredPiecesBySuggestionType.map((piece) => {
          const metadata = stepUtils.mapPieceToMetadata({
            piece,
            type,
          });
          return {
            ...metadata,
            suggestedActions: piece.suggestedActions,
            suggestedTriggers: piece.suggestedTriggers,
          };
        });

        switch (type) {
          case 'action': {
            const filteredCoreActions = CORE_ACTIONS_METADATA.filter((step) =>
              passSearch(searchQuery, step),
            );
            return [...filteredCoreActions, ...piecesMetadata];
          }
          case 'trigger':
            return [...piecesMetadata];
        }
      },
      enabled,
      staleTime: searchQuery ? 0 : Infinity,
    });
    return {
      refetch: query.refetch,
      metadata: query.data,
      isLoading: query.isLoading,
    };
  },
};
function passSearch(
  searchQuery: string | undefined,
  data: (typeof CORE_STEP_METADATA)[keyof typeof CORE_STEP_METADATA],
) {
  if (!searchQuery) {
    return true;
  }
  return JSON.stringify({ data })
    .toLowerCase()
    .includes(searchQuery?.toLowerCase());
}

type UseStepMetadata = {
  step: FlowAction | FlowTrigger;
};

type UseMetadataProps = {
  searchQuery: string;
  enabled?: boolean;
  type: 'action' | 'trigger';
};

const getQueryKeyForStepMetadata = (
  step: FlowAction | FlowTrigger,
): (string | undefined)[] => {
  const isPieceStep =
    step.type === FlowActionType.PIECE || step.type === FlowTriggerType.PIECE;
  const pieceName = isPieceStep ? step.settings.pieceName : undefined;
  const pieceVersion = isPieceStep ? step.settings.pieceVersion : undefined;
  const customLogoUrl =
    'customLogoUrl' in step ? (step.customLogoUrl as string) : undefined;
  const actionName =
    step.type === FlowActionType.PIECE ? step.settings.actionName : undefined;
  const triggerName =
    step.type === FlowTriggerType.PIECE ? step.settings.triggerName : undefined;
  return [
    actionName,
    triggerName,
    pieceName,
    pieceVersion,
    customLogoUrl,
    step.type,
  ];
};
