import {
  FlowAction,
  StepLocationRelativeToParent,
  FlowTrigger,
  Note,
} from '@flow/shared';
import { Edge } from '@xyflow/react';

export enum FlowNodeType {
  STEP = 'STEP',
  ADD_BUTTON = 'ADD_BUTTON',
  BIG_ADD_BUTTON = 'BIG_ADD_BUTTON',
  GRAPH_END_WIDGET = 'GRAPH_END_WIDGET',
  GRAPH_START_WIDGET = 'GRAPH_START_WIDGET',
  /**Used for calculating the loop graph width */
  LOOP_RETURN_NODE = 'LOOP_RETURN_NODE',
  NOTE = 'NOTE',
}
export type FlowBoundingBox = {
  width: number;
  height: number;
  left: number;
  right: number;
};

export type FlowStepNode = {
  id: string;
  type: FlowNodeType.STEP;
  position: {
    x: number;
    y: number;
  };
  data: {
    step: FlowAction | FlowTrigger;
  };
  selectable?: boolean;
  style?: React.CSSProperties;
  draggable?: boolean;
};

export type FlowNoteNode = {
  id: string;
  type: FlowNodeType.NOTE;
  position: {
    x: number;
    y: number;
  };
  data: Pick<Note, 'content' | 'ownerId' | 'color' | 'size'>;
};

export type FlowLoopReturnNode = {
  id: string;
  type: FlowNodeType.LOOP_RETURN_NODE;
  position: {
    x: number;
    y: number;
  };
  data: Record<string, never>;
  selectable?: boolean;
};

export type FlowButtonData = {
  edgeId: string;
} & (
  | {
      parentStepName: string;
      stepLocationRelativeToParent:
        | StepLocationRelativeToParent.AFTER
        | StepLocationRelativeToParent.INSIDE_LOOP;
    }
  | {
      parentStepName: string;
      stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH;
      branchIndex: number;
    }
);

export type FlowBigAddButtonNode = {
  id: string;
  type: FlowNodeType.BIG_ADD_BUTTON;
  position: {
    x: number;
    y: number;
  };
  data: FlowButtonData;
  selectable?: boolean;
  style?: React.CSSProperties;
};

export type FlowGraphEndNode = {
  id: string;
  type: FlowNodeType.GRAPH_END_WIDGET;
  position: {
    x: number;
    y: number;
  };
  data: {
    showWidget?: boolean;
  };
  selectable?: boolean;
};

export type FlowNode =
  | FlowStepNode
  | FlowGraphEndNode
  | FlowBigAddButtonNode
  | FlowLoopReturnNode
  | FlowNoteNode;

export enum FlowEdgeType {
  STRAIGHT_LINE = 'FlowStraightLineEdge',
  LOOP_START_EDGE = 'FlowLoopStartEdge',
  LOOP_CLOSE_EDGE = 'FlowLoopCloseEdge',
  LOOP_RETURN_EDGE = 'FlowLoopReturnEdge',
  ROUTER_START_EDGE = 'FlowRouterStartEdge',
  ROUTER_END_EDGE = 'FlowRouterEndEdge',
}

export type FlowStraightLineEdge = Edge & {
  type: FlowEdgeType.STRAIGHT_LINE;
  data: {
    drawArrowHead: boolean;
    hideAddButton?: boolean;
    parentStepName: string;
  };
};

export type FlowLoopStartEdge = Edge & {
  type: FlowEdgeType.LOOP_START_EDGE;
  data: {
    isLoopEmpty: boolean;
  };
};

export type FlowLoopCloseEdge = Edge & {
  type: FlowEdgeType.LOOP_CLOSE_EDGE;
};

export type FlowLoopReturnEdge = Edge & {
  type: FlowEdgeType.LOOP_RETURN_EDGE;
  data: {
    parentStepName: string;
    isLoopEmpty: boolean;
    drawArrowHeadAfterEnd: boolean;
    verticalSpaceBetweenReturnNodeStartAndEnd: number;
  };
};

export type FlowRouterStartEdge = Edge & {
  type: FlowEdgeType.ROUTER_START_EDGE;
  data: {
    isBranchEmpty: boolean;
    label: string;
    drawHorizontalLine: boolean;
    drawStartingVerticalLine: boolean;
  } & {
    stepLocationRelativeToParent: StepLocationRelativeToParent.INSIDE_BRANCH;
    branchIndex: number;
  };
};

export type FlowRouterEndEdge = Edge & {
  type: FlowEdgeType.ROUTER_END_EDGE;
  data: {
    drawHorizontalLine: boolean;
    verticalSpaceBetweenLastNodeInBranchAndEndLine: number;
  } & (
    | {
        routerOrBranchStepName: string;
        drawEndingVerticalLine: true;
        isNextStepEmpty: boolean;
      }
    | {
        drawEndingVerticalLine: false;
      }
  );
};

export type FlowEdge =
  | FlowLoopStartEdge
  | FlowLoopReturnEdge
  | FlowStraightLineEdge
  | FlowRouterStartEdge
  | FlowRouterEndEdge;
export type FlowGraph = {
  nodes: FlowNode[];
  edges: FlowEdge[];
};
