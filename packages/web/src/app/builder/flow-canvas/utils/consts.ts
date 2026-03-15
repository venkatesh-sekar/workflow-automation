import {
  FLOW_CANVAS_ARC,
  FLOW_CANVAS_HSPACE,
  FLOW_CANVAS_LOOP_VOFFSET,
  FLOW_CANVAS_ROUTER_VOFFSET,
  FLOW_CANVAS_STEP_HEIGHT,
  FLOW_CANVAS_STEP_WIDTH,
  FLOW_CANVAS_VSPACE,
  NoteColorVariant,
} from '@flow/shared';

import { FlowLoopReturnLineCanvasEdge as FlowLoopReturnCanvasEdge } from '../edges/loop-return-edge';
import { FlowLoopStartLineCanvasEdge as FlowLoopStartCanvasEdge } from '../edges/loop-start-edge';
import { FlowRouterEndCanvasEdge } from '../edges/router-end-edge';
import { FlowRouterStartCanvasEdge } from '../edges/router-start-edge';
import { FlowStraightLineCanvasEdge } from '../edges/straight-line-edge';
import { FlowBigAddButtonCanvasNode } from '../nodes/big-add-button-node';
import FlowGraphEndWidgetNode from '../nodes/flow-end-widget-node';
import FlowLoopReturnCanvasNode from '../nodes/loop-return-node';
import { FlowNoteCanvasNode } from '../nodes/note-node';
import { FlowStepCanvasNode } from '../nodes/step-node';

import { FlowEdgeType, FlowNodeType } from './types';

const ARC_LENGTH = FLOW_CANVAS_ARC;
const ARC_LEFT = `a${ARC_LENGTH},${ARC_LENGTH} 0 0,0 -${ARC_LENGTH},${ARC_LENGTH}`;
const ARC_RIGHT = `a${ARC_LENGTH},${ARC_LENGTH} 0 0,1 ${ARC_LENGTH},${ARC_LENGTH}`;
const ARC_LEFT_DOWN = `a${ARC_LENGTH},${ARC_LENGTH} 0 0,1 -${ARC_LENGTH},${ARC_LENGTH}`;
const ARC_RIGHT_DOWN = `a${ARC_LENGTH},${ARC_LENGTH} 0 0,0 ${ARC_LENGTH},${ARC_LENGTH}`;
const ARC_RIGHT_UP = `a${ARC_LENGTH},${ARC_LENGTH} 0 0,1 -${ARC_LENGTH},-${ARC_LENGTH}`;
const ARC_LEFT_UP = `a-${ARC_LENGTH},-${ARC_LENGTH} 0 0,0 ${ARC_LENGTH},-${ARC_LENGTH}`;
const ARROW_DOWN = 'm6 -6 l-6 6 m-6 -6 l6 6';
const VERTICAL_SPACE_BETWEEN_STEP_AND_LINE = 7;
const VERTICAL_SPACE_BETWEEN_STEPS = FLOW_CANVAS_VSPACE;
const VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD = FLOW_CANVAS_LOOP_VOFFSET;
const LABEL_HEIGHT = 30;
const LABEL_VERTICAL_PADDING = 12;
const STEP_DRAG_OVERLAY_WIDTH = 75;
const STEP_DRAG_OVERLAY_HEIGHT = 75;
const NOTE_CREATION_OVERLAY_WIDTH = 150;
const NOTE_CREATION_OVERLAY_HEIGHT = 150;
const VERTICAL_OFFSET_BETWEEN_ROUTER_AND_CHILD = FLOW_CANVAS_ROUTER_VOFFSET;
const LINE_WIDTH = 1.5;
const DRAGGED_STEP_TAG = 'dragged-step';
const DRAGGED_NOTE_TAG = 'dragged-note';
const HORIZONTAL_SPACE_BETWEEN_NODES = FLOW_CANVAS_HSPACE;
const AP_NODE_SIZE: Record<
  Exclude<FlowNodeType, FlowNodeType.GRAPH_START_WIDGET | FlowNodeType.NOTE>,
  { height: number; width: number }
> = {
  [FlowNodeType.BIG_ADD_BUTTON]: {
    height: 50,
    width: 50,
  },
  [FlowNodeType.ADD_BUTTON]: {
    height: 20,
    width: 20,
  },
  [FlowNodeType.STEP]: {
    height: FLOW_CANVAS_STEP_HEIGHT,
    width: FLOW_CANVAS_STEP_WIDTH,
  },
  [FlowNodeType.LOOP_RETURN_NODE]: {
    height: FLOW_CANVAS_STEP_HEIGHT,
    width: FLOW_CANVAS_STEP_WIDTH,
  },
  [FlowNodeType.GRAPH_END_WIDGET]: {
    height: 0,
    width: 0,
  },
};

const doesNodeAffectBoundingBoxWidth: (
  type: FlowNodeType,
) => type is
  | FlowNodeType.BIG_ADD_BUTTON
  | FlowNodeType.STEP
  | FlowNodeType.LOOP_RETURN_NODE = (type) =>
  type === FlowNodeType.BIG_ADD_BUTTON ||
  type === FlowNodeType.STEP ||
  type === FlowNodeType.LOOP_RETURN_NODE;
export const flowCanvasConsts = {
  ARC_LENGTH,
  ARC_LEFT,
  ARC_RIGHT,
  ARC_LEFT_DOWN,
  ARC_RIGHT_DOWN,
  VERTICAL_OFFSET_BETWEEN_LOOP_AND_CHILD,
  AP_NODE_SIZE,
  VERTICAL_SPACE_BETWEEN_STEP_AND_LINE,
  ARROW_DOWN,
  VERTICAL_SPACE_BETWEEN_STEPS,
  ARC_RIGHT_UP,
  LINE_WIDTH,
  LABEL_HEIGHT,
  ARC_LEFT_UP,
  VERTICAL_OFFSET_BETWEEN_ROUTER_AND_CHILD,

  doesNodeAffectBoundingBox: doesNodeAffectBoundingBoxWidth,
  edgeTypes: {
    [FlowEdgeType.STRAIGHT_LINE]: FlowStraightLineCanvasEdge,
    [FlowEdgeType.LOOP_START_EDGE]: FlowLoopStartCanvasEdge,
    [FlowEdgeType.LOOP_RETURN_EDGE]: FlowLoopReturnCanvasEdge,
    [FlowEdgeType.ROUTER_START_EDGE]: FlowRouterStartCanvasEdge,
    [FlowEdgeType.ROUTER_END_EDGE]: FlowRouterEndCanvasEdge,
  },
  nodeTypes: {
    [FlowNodeType.STEP]: FlowStepCanvasNode,
    [FlowNodeType.LOOP_RETURN_NODE]: FlowLoopReturnCanvasNode,
    [FlowNodeType.BIG_ADD_BUTTON]: FlowBigAddButtonCanvasNode,
    [FlowNodeType.GRAPH_END_WIDGET]: FlowGraphEndWidgetNode,
    [FlowNodeType.NOTE]: FlowNoteCanvasNode,
  },
  DRAGGED_STEP_TAG,
  DRAGGED_NOTE_TAG,
  HORIZONTAL_SPACE_BETWEEN_NODES,
  HANDLE_STYLING: { opacity: 0, cursor: 'default' },
  LABEL_VERTICAL_PADDING,
  STEP_DRAG_OVERLAY_WIDTH,
  STEP_DRAG_OVERLAY_HEIGHT,
  NOTE_CREATION_OVERLAY_WIDTH,
  NOTE_CREATION_OVERLAY_HEIGHT,
  STEP_CONTEXT_MENU_ATTRIBUTE: 'step-context-menu',
  SELECTION_RECT_CHEVRON_ATTRIBUTE: 'selection-rect-chevron',
  NODE_SELECTION_RECT_CLASS_NAME: 'react-flow__nodesselection-rect',
  SIDEBAR_ANIMATION_DURATION: 200,
  DEFAULT_NOTE_CONTENT: '<br>',
  DEFAULT_NOTE_COLOR: NoteColorVariant.BLUE,
  BUILDER_HEADER_HEIGHT: 60,
};
