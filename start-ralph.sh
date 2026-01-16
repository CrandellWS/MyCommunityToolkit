#!/bin/bash
# Ralph Loop: MyPrize Streamer Toolkit Development
# Run from project root: ./start-ralph.sh

set -e
cd "$(dirname "$0")"

PROMPT_FILE="PROMPT.md"
MAX_ITERATIONS=50
COMPLETION_PROMISE="TASK COMPLETE"
LOG_DIR="ralph-logs"
LOG_FILE="$LOG_DIR/ralph-$(date +%Y%m%d-%H%M%S).log"

# Ensure log directory exists
mkdir -p "$LOG_DIR"

echo "=== Ralph Loop: MyPrize Streamer Toolkit ==="
echo "Prompt: $PROMPT_FILE"
echo "Max iterations: $MAX_ITERATIONS"
echo "Completion promise: $COMPLETION_PROMISE"
echo "Log: $LOG_FILE"
echo ""

# Allowed tools for autonomous operation
ALLOWED_TOOLS="Edit Write Read Glob Grep Bash(curl:*) Bash(ls:*) Bash(cat:*) Bash(mkdir:*) Bash(cp:*) Bash(mv:*) Bash(rm:*) Bash(git:*) Bash(npm:*) Bash(node:*) Bash(python*:*) WebFetch"

iteration=0
while [ $iteration -lt $MAX_ITERATIONS ]; do
    iteration=$((iteration + 1))
    echo "=== Iteration $iteration of $MAX_ITERATIONS ===" | tee -a "$LOG_FILE"
    echo "Started: $(date)" | tee -a "$LOG_FILE"

    # Run Claude with the prompt
    if [ $iteration -eq 1 ]; then
        # First iteration - start fresh
        output=$(cat "$PROMPT_FILE" | claude --print --allowedTools "$ALLOWED_TOOLS" 2>&1) || true
    else
        # Subsequent iterations - continue from previous conversation
        output=$(cat "$PROMPT_FILE" | claude --continue --print --allowedTools "$ALLOWED_TOOLS" 2>&1) || true
    fi

    echo "$output" | tee -a "$LOG_FILE"
    echo "Finished: $(date)" | tee -a "$LOG_FILE"

    # Check for completion promise
    if echo "$output" | grep -q "$COMPLETION_PROMISE"; then
        echo ""
        echo "=== COMPLETE ===" | tee -a "$LOG_FILE"
        echo "Completion promise found after $iteration iterations"
        exit 0
    fi

    echo ""
    sleep 2
done

echo "=== MAX ITERATIONS REACHED ===" | tee -a "$LOG_FILE"
echo "Stopped after $MAX_ITERATIONS iterations without completion"
exit 1
