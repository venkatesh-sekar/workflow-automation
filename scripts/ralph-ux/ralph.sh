#!/bin/bash
# Ralph UX - Frontend redesign agent loop
# Usage: ./ralph.sh [--model MODEL] [max_iterations]

set -e

TOOL="claude"
MODEL="sonnet"
MAX_ITERATIONS=200

while [[ $# -gt 0 ]]; do
  case $1 in
    --model)
      MODEL="$2"
      shift 2
      ;;
    --model=*)
      MODEL="${1#*=}"
      shift
      ;;
    *)
      if [[ "$1" =~ ^[0-9]+$ ]]; then
        MAX_ITERATIONS="$1"
      fi
      shift
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
PROGRESS_FILE="$SCRIPT_DIR/progress.txt"

cd "$PROJECT_ROOT"

MODEL_DISPLAY="${MODEL:-default}"
echo "Starting Ralph UX (Frontend Redesign) - Model: $MODEL_DISPLAY - Max iterations: $MAX_ITERATIONS"
echo "Working directory: $PROJECT_ROOT"

for i in $(seq 1 $MAX_ITERATIONS); do
  echo ""
  echo "==============================================================="
  echo "  Ralph UX Iteration $i of $MAX_ITERATIONS"
  echo "==============================================================="

  CLAUDE_CMD="claude --dangerously-skip-permissions --print"
  if [[ -n "$MODEL" ]]; then
    CLAUDE_CMD="$CLAUDE_CMD --model $MODEL"
  fi
  OUTPUT=$($CLAUDE_CMD < "$SCRIPT_DIR/CLAUDE.md" 2>&1 | tee /dev/stderr) || true

  echo "Iteration $i complete. Continuing..."
  sleep 2
done

echo ""
echo "Ralph UX completed $MAX_ITERATIONS iterations."
echo "Check $PROGRESS_FILE for status."
