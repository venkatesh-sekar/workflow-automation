#!/bin/bash
# Ralph Flow - Activepieces to Flow fork agent loop
# Usage: ./ralph.sh [--model MODEL] [max_iterations]

set -e

TOOL="claude"
MODEL="opus"
MAX_ITERATIONS=300

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
DONE_FILE="$SCRIPT_DIR/DONE"
TRACKER="$SCRIPT_DIR/tracker.json"

cd "$PROJECT_ROOT"

echo "Starting Ralph Flow - Model: $MODEL - Max iterations: $MAX_ITERATIONS"
echo "Working directory: $PROJECT_ROOT"

for i in $(seq 1 $MAX_ITERATIONS); do
  # Dual stop condition: DONE file
  if [[ -f "$DONE_FILE" ]]; then
    echo ""
    echo "DONE file found. All phases complete."
    exit 0
  fi

  # Dual stop condition: tracker check
  if command -v jq &>/dev/null; then
    QUEUE_LEN=$(jq '.phase_queue | length' "$TRACKER" 2>/dev/null || echo "-1")
    CURRENT=$(jq -r '.current_phase' "$TRACKER" 2>/dev/null || echo "unknown")
    STATUS=$(jq -r ".phases[\"$CURRENT\"].status" "$TRACKER" 2>/dev/null || echo "unknown")
    if [[ "$QUEUE_LEN" == "0" && "$STATUS" == "complete" ]]; then
      echo ""
      echo "All phases complete per tracker."
      exit 0
    fi
  fi

  echo ""
  echo "==============================================================="
  echo "  Ralph Flow Iteration $i of $MAX_ITERATIONS"
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
echo "Ralph Flow completed $MAX_ITERATIONS iterations."
echo "Check scripts/ralph/tracker.json for status."
