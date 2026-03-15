import {
  FlowAction,
  FlowActionType,
  FlowOperationType,
  FlowRun,
  flowStructureUtil,
  FlowVersion,
  isNil,
  LoopOnItemsAction,
  RouterAction,
  StepLocationRelativeToParent,
  FlowTrigger,
  FlowTriggerType,
  Note,
} from '@flow/shared';
import { t } from 'i18next';

import { flowRunUtils } from '@/features/flow-runs';
import { NEW_FLOW_QUERY_PARAM } from '@/lib/route-utils';

import { flowCanvasConsts } from './consts';
import {
  FlowBigAddButtonNode,
  FlowButtonData,
  FlowEdge,
  FlowEdgeType,
  FlowGraph,
  FlowGraphEndNode,
  FlowLoopReturnNode,
  FlowNodeType,
  FlowStepNode,
  FlowStraightLineEdge,
} from './types';

const createBigAddButtonGraph: (
  parentStep: LoopOnItemsAction | RouterAction,
  nodeData: FlowBigAddButtonNode['data'],
) => FlowGraph = (parentStep, nodeData) => {
  const bigAddButtonNode: FlowBigAddButtonNode = {
    id: `${parentStep.name}-big-add-button-${nodeData.edgeId}`,
    type: FlowNodeType.BIG_ADD_BUTTON,
    position: { x: 0, y: 0 },
    data: nodeData,
    selectable: false,
    style: {
      pointerEvents: 'all',
    },
  };
  const graphEndNode: FlowGraphEndNode = {
    id: `${parentStep.name}-subgraph-end-${nodeData.edgeId}`,
    type: FlowNodeType.GRAPH_END_WIDGET as const,
    position: {
      x: flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2,
      y:
        flowCanvasConsts.AP_NODE_SIZE.STEP.height +
        flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS,
    },
    data: {},
    selectable: false,
  };

  const straightLineEdge: FlowStraightLineEdge = {
    id: `big-button-straight-line-for${nodeData.edgeId}`,
    source: `${parentStep.name}-big-add-button-${nodeData.edgeId}`,
    target: `${parentStep.name}-subgraph-end-${nodeData.edgeId}`,
    type: FlowEdgeType.STRAIGHT_LINE as const,
    data: {
      drawArrowHead: false,
      hideAddButton: true,
      parentStepName: parentStep.name,
    },
  };
  return {
    nodes: [bigAddButtonNode, graphEndNode],
    edges: [straightLineEdge],
  };
};

const createStepGraph: (
  step: FlowAction | FlowTrigger,
  graphHeight: number,
) => FlowGraph = (step, graphHeight) => {
  const stepNode: FlowStepNode = {
    id: step.name,
    type: FlowNodeType.STEP as const,
    position: { x: 0, y: 0 },
    data: {
      step,
    },
    selectable: step.name !== 'trigger',
    draggable: true,
    style: {
      pointerEvents: 'all',
    },
  };

  const graphEndNode: FlowGraphEndNode = {
    id: `${step.name}-subgraph-end`,
    type: FlowNodeType.GRAPH_END_WIDGET as const,
    position: {
      x: flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2,
      y: graphHeight,
    },
    data: {},
    selectable: false,
  };

  const straightLineEdge: FlowStraightLineEdge = {
    id: `${step.name}-${step.nextAction?.name ?? 'graph-end'}-edge`,
    source: step.name,
    target: `${step.name}-subgraph-end`,
    type: FlowEdgeType.STRAIGHT_LINE as const,
    data: {
      drawArrowHead: !isNil(step.nextAction),
      parentStepName: step.name,
    },
  };
  return {
    nodes: [stepNode, graphEndNode],
    edges:
      step.type !== FlowActionType.LOOP_ON_ITEMS &&
      step.type !== FlowActionType.ROUTER
        ? [straightLineEdge]
        : [],
  };
};

const buildFlowGraph: (
  step: FlowAction | FlowTrigger | undefined,
) => FlowGraph = (step) => {
  if (isNil(step)) {
    return {
      nodes: [],
      edges: [],
    };
  }

  const graph: FlowGraph = createStepGraph(
    step,
    flowCanvasConsts.AP_NODE_SIZE.STEP.height +
      flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS,
  );
  const childGraph =
    step.type === FlowActionType.LOOP_ON_ITEMS
      ? buildLoopChildGraph(step)
      : step.type === FlowActionType.ROUTER
      ? buildRouterChildGraph(step)
      : null;

  const graphWithChild = childGraph ? mergeGraph(graph, childGraph) : graph;
  const nextStepGraph = buildFlowGraph(step.nextAction);
  return mergeGraph(
    graphWithChild,
    offsetGraph(nextStepGraph, {
      x: 0,
      y: calculateGraphBoundingBox(graphWithChild).height,
    }),
  );
};

function offsetGraph(
  graph: FlowGraph,
  offset: { x: number; y: number },
): FlowGraph {
  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      position: {
        x: node.position.x + offset.x,
        y: node.position.y + offset.y,
      },
      zIndex: 50,
    })),
    edges: graph.edges.map((edge) => ({
      ...edge,
      zIndex: 50,
    })),
  };
}

function mergeGraph(graph1: FlowGraph, graph2: FlowGraph): FlowGraph {
  return {
    nodes: [...graph1.nodes, ...graph2.nodes],
    edges: [...graph1.edges, ...graph2.edges],
  };
}

function createFocusStepInGraphParams(stepName: string) {
  return {
    nodes: [{ id: stepName }],
    duration: 1000,
    maxZoom: 1.25,
    minZoom: 1.25,
  };
}

const calculateGraphBoundingBox = (graph: FlowGraph) => {
  const minX = Math.min(
    ...graph.nodes
      .filter((node) => flowCanvasConsts.doesNodeAffectBoundingBox(node.type))
      .map((node) => node.position.x),
  );
  const minY = Math.min(...graph.nodes.map((node) => node.position.y));
  const maxX = Math.max(
    ...graph.nodes
      .filter((node) => flowCanvasConsts.doesNodeAffectBoundingBox(node.type))
      .map(
        (node) => node.position.x + flowCanvasConsts.AP_NODE_SIZE.STEP.width,
      ),
  );
  const maxY = Math.max(...graph.nodes.map((node) => node.position.y));
  const width = maxX - minX;
  const height = maxY - minY;

  return {
    width,
    height,
    left: -minX + flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2,
    right: maxX - flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2,
    top: minY,
    bottom: maxY,
  };
};

const buildLoopChildGraph: (step: LoopOnItemsAction) => FlowGraph = (step) => {
  const childGraph = step.firstLoopAction
    ? buildFlowGraph(step.firstLoopAction)
    : createBigAddButtonGraph(step, {
        parentStepName: step.name,
        stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_LOOP,
        edgeId: `${step.name}-loop-start-edge`,
      });

  const childGraphBoundingBox = calculateGraphBoundingBox(childGraph);
  const deltaLeftX =
    -(
      childGraphBoundingBox.width +
      flowCanvasConsts.AP_NODE_SIZE.STEP.width +
      flowCanvasConsts.HORIZONTAL_SPACE_BETWEEN_NODES -
      flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2 -
      childGraphBoundingBox.right
    ) /
      2 -
    flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2;

  const loopReturnNode: FlowLoopReturnNode = {
    id: `${step.name}-loop-return-node`,
    type: FlowNodeType.LOOP_RETURN_NODE,
    position: {
      x: deltaLeftX + flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2,
      y:
        flowCanvasConsts.AP_NODE_SIZE.STEP.height +
        flowCanvasConsts.VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD +
        childGraphBoundingBox.height / 2,
    },
    data: {},
    selectable: false,
  };
  const childGraphAfterOffset = offsetGraph(childGraph, {
    x:
      deltaLeftX +
      flowCanvasConsts.AP_NODE_SIZE.STEP.width +
      flowCanvasConsts.HORIZONTAL_SPACE_BETWEEN_NODES +
      childGraphBoundingBox.left,
    y:
      flowCanvasConsts.VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD +
      flowCanvasConsts.AP_NODE_SIZE.STEP.height,
  });
  const edges: FlowEdge[] = [
    {
      id: `${step.name}-loop-start-edge`,
      source: step.name,
      target: `${childGraph.nodes[0].id}`,
      type: FlowEdgeType.LOOP_START_EDGE as const,
      data: {
        isLoopEmpty: isNil(step.firstLoopAction),
      },
    },
    {
      id: `${step.name}-loop-return-node`,
      source: `${childGraph.nodes[childGraph.nodes.length - 1].id}`,
      target: `${step.name}-loop-return-node`,
      type: FlowEdgeType.LOOP_RETURN_EDGE as const,
      data: {
        parentStepName: step.name,
        isLoopEmpty: isNil(step.firstLoopAction),
        drawArrowHeadAfterEnd: !isNil(step.nextAction),
        verticalSpaceBetweenReturnNodeStartAndEnd:
          childGraphBoundingBox.height +
          flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS,
      },
    },
  ];

  const subgraphEndSubNode: FlowGraphEndNode = {
    id: `${step.name}-loop-subgraph-end`,
    type: FlowNodeType.GRAPH_END_WIDGET,
    position: {
      x: flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2,
      y:
        flowCanvasConsts.AP_NODE_SIZE.STEP.height +
        flowCanvasConsts.VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD +
        childGraphBoundingBox.height +
        flowCanvasConsts.ARC_LENGTH +
        flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS,
    },
    data: {},
    selectable: false,
  };

  return {
    nodes: [loopReturnNode, ...childGraphAfterOffset.nodes, subgraphEndSubNode],
    edges: [...edges, ...childGraphAfterOffset.edges],
  };
};

const buildRouterChildGraph = (step: RouterAction) => {
  const childGraphs = step.children.map((branch, index) => {
    return branch
      ? buildFlowGraph(branch)
      : createBigAddButtonGraph(step, {
          parentStepName: step.name,
          stepLocationRelativeToParent:
            StepLocationRelativeToParent.INSIDE_BRANCH,
          branchIndex: index,
          edgeId: `${step.name}-branch-${index}-start-edge`,
        });
  });

  const childGraphsAfterOffset = offsetRouterChildSteps(childGraphs);

  const maxHeight = Math.max(
    ...childGraphsAfterOffset.map((cg) => calculateGraphBoundingBox(cg).height),
  );

  const subgraphEndSubNode: FlowGraphEndNode = {
    id: `${step.name}-branch-subgraph-end`,
    type: FlowNodeType.GRAPH_END_WIDGET,
    position: {
      x: flowCanvasConsts.AP_NODE_SIZE.STEP.width / 2,
      y:
        flowCanvasConsts.AP_NODE_SIZE.STEP.height +
        flowCanvasConsts.VERTICAL_OFFSET_BETWEEN_ROUTER_AND_CHILD +
        maxHeight +
        flowCanvasConsts.ARC_LENGTH +
        flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS,
    },
    data: {},
    selectable: false,
  };
  const edges: FlowEdge[] = childGraphsAfterOffset
    .map((childGraph, branchIndex) => {
      return [
        {
          id: `${step.name}-branch-${branchIndex}-start-edge`,
          source: step.name,
          target: `${childGraph.nodes[0].id}`,
          type: FlowEdgeType.ROUTER_START_EDGE as const,
          data: {
            isBranchEmpty: isNil(step.children[branchIndex]),
            label:
              step.settings.branches[branchIndex]?.branchName ??
              `${t('Branch')} ${branchIndex + 1} (missing branch)`,
            branchIndex,
            stepLocationRelativeToParent:
              StepLocationRelativeToParent.INSIDE_BRANCH as const,
            drawHorizontalLine:
              branchIndex === 0 ||
              branchIndex === childGraphsAfterOffset.length - 1,
            drawStartingVerticalLine: branchIndex === 0,
          },
        },
        {
          id: `${step.name}-branch-${branchIndex}-end-edge`,
          source: `${childGraph.nodes.at(-1)!.id}`,
          target: subgraphEndSubNode.id,
          type: FlowEdgeType.ROUTER_END_EDGE as const,
          data: {
            drawEndingVerticalLine: branchIndex === 0,
            verticalSpaceBetweenLastNodeInBranchAndEndLine:
              subgraphEndSubNode.position.y -
              childGraph.nodes.at(-1)!.position.y -
              flowCanvasConsts.VERTICAL_SPACE_BETWEEN_STEPS -
              flowCanvasConsts.ARC_LENGTH,
            drawHorizontalLine:
              branchIndex === 0 ||
              branchIndex === childGraphsAfterOffset.length - 1,
            routerOrBranchStepName: step.name,
            isNextStepEmpty: isNil(step.nextAction),
          },
        },
      ];
    })
    .flat();

  return {
    nodes: [
      ...childGraphsAfterOffset.map((cg) => cg.nodes).flat(),
      subgraphEndSubNode,
    ],
    edges: [...childGraphsAfterOffset.map((cg) => cg.edges).flat(), ...edges],
  };
};

const offsetRouterChildSteps = (childGraphs: FlowGraph[]) => {
  const childGraphsBoundingBoxes = childGraphs.map((childGraph) =>
    calculateGraphBoundingBox(childGraph),
  );
  const totalWidth =
    childGraphsBoundingBoxes.reduce((acc, current) => acc + current.width, 0) +
    flowCanvasConsts.HORIZONTAL_SPACE_BETWEEN_NODES * (childGraphs.length - 1);
  let deltaLeftX =
    -(
      totalWidth -
      childGraphsBoundingBoxes[0].left -
      childGraphsBoundingBoxes[childGraphs.length - 1].right
    ) /
      2 -
    childGraphsBoundingBoxes[0].left;

  return childGraphsBoundingBoxes.map((childGraphBoundingBox, index) => {
    const x = deltaLeftX + childGraphBoundingBox.left;
    deltaLeftX +=
      childGraphBoundingBox.width +
      flowCanvasConsts.HORIZONTAL_SPACE_BETWEEN_NODES;
    return offsetGraph(childGraphs[index], {
      x,
      y:
        flowCanvasConsts.AP_NODE_SIZE.STEP.height +
        flowCanvasConsts.VERTICAL_OFFSET_BETWEEN_ROUTER_AND_CHILD,
    });
  });
};

const createAddOperationFromAddButtonData = (data: FlowButtonData) => {
  if (
    data.stepLocationRelativeToParent ===
    StepLocationRelativeToParent.INSIDE_BRANCH
  ) {
    return {
      type: FlowOperationType.ADD_ACTION,
      actionLocation: {
        parentStep: data.parentStepName,
        stepLocationRelativeToParent: data.stepLocationRelativeToParent,
        branchIndex: data.branchIndex,
      },
    } as const;
  }
  return {
    type: FlowOperationType.ADD_ACTION,
    actionLocation: {
      parentStep: data.parentStepName,
      stepLocationRelativeToParent: data.stepLocationRelativeToParent,
    },
  } as const;
};

const isSkipped = (stepName: string, trigger: FlowTrigger) => {
  const step = flowStructureUtil.getStep(stepName, trigger);
  if (
    isNil(step) ||
    step.type === FlowTriggerType.EMPTY ||
    step.type === FlowTriggerType.PIECE
  ) {
    return false;
  }
  const skippedParents = flowStructureUtil
    .findPathToStep(trigger, stepName)
    .filter(
      (stepInPath) =>
        stepInPath.type === FlowActionType.LOOP_ON_ITEMS ||
        stepInPath.type === FlowActionType.ROUTER,
    )
    .filter((routerOrLoop) =>
      flowStructureUtil.isChildOf(routerOrLoop, stepName),
    )
    .filter((parent) => parent.skip);

  return skippedParents.length > 0 || !!step.skip;
};

const getStepStatus = (
  stepName: string | undefined,
  run: FlowRun | null,
  loopIndexes: Record<string, number>,
  flowVersion: FlowVersion,
) => {
  if (isNil(run) || isNil(stepName) || isNil(run.steps)) {
    return undefined;
  }
  const stepOutput = flowRunUtils.extractStepOutput(
    stepName,
    loopIndexes,
    run.steps,
  );
  return stepOutput?.status;
};
function buildNotesGraph(notes: Note[]): FlowGraph {
  return {
    nodes: notes.map((note) => ({
      id: note.id,
      type: FlowNodeType.NOTE,
      draggable: true,
      position: note.position,
      data: {
        content: note.content,
        creatorId: note.ownerId,
        color: note.color,
        size: note.size,
      },
    })),
    edges: [],
  };
}

function determineInitiallySelectedStep(
  failedStepNameInRun: string | null,
  flowVersion: FlowVersion,
): string | null {
  const firstInvalidStep = flowStructureUtil
    .getAllSteps(flowVersion.trigger)
    .find((s) => !s.valid);
  const isNewFlow = window.location.search.includes(NEW_FLOW_QUERY_PARAM);
  if (failedStepNameInRun) {
    return failedStepNameInRun;
  }
  if (isNewFlow) {
    return null;
  }
  return firstInvalidStep?.name ?? 'trigger';
}
const doesSelectionRectangleExist = () => {
  return (
    document.querySelector(
      `.${flowCanvasConsts.NODE_SELECTION_RECT_CLASS_NAME}`,
    ) !== null
  );
};
export const flowCanvasUtils = {
  createFlowGraph(version: FlowVersion, notes: Note[]): FlowGraph {
    const stepsGraph = buildFlowGraph(version.trigger);
    const notesGraph = buildNotesGraph(notes);
    const graphEndWidget = stepsGraph.nodes.findLast(
      (node) => node.type === FlowNodeType.GRAPH_END_WIDGET,
    ) as FlowGraphEndNode;
    if (graphEndWidget) {
      graphEndWidget.data.showWidget = true;
    } else {
      console.warn('Flow end widget not found');
    }
    return mergeGraph(stepsGraph, notesGraph);
  },
  createFocusStepInGraphParams,
  calculateGraphBoundingBox,
  createAddOperationFromAddButtonData,
  isSkipped,
  getStepStatus,
  determineInitiallySelectedStep,
  doesSelectionRectangleExist,
};
