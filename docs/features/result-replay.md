# Result Replay — Execution Animation on Canvas

**Status:** ✅ Implemented  
**Version:** 1.0  
**Date:** 2026-05-16

---

## Overview

Result Replay animates the execution state of nodes on the canvas as a flow runs. When you click "Manual Trigger" (or run a flow via the API), each node shows a visual indicator of whether it's **running**, **succeeded**, or **failed**.

This provides immediate visual feedback that the flow is executing without needing to wait for the Console panel to fully load.

---

## Architecture

### 1. Engine-Level Event Tracking (lib/nextviz/engine.ts)

The engine now emits **execution events** as nodes execute:

```typescript
export type ExecutionEventType = "node-start" | "node-success" | "node-error";

export interface ExecutionEvent {
  type: ExecutionEventType;
  nodeId: string;
  timestamp: number; // ms since execution start
  error?: string;
}
```

For each node in the execution plan:
- **node-start**: Fired when the executor is invoked
- **node-success**: Fired when the executor returns successfully
- **node-error**: Fired if the executor throws

Events are timestamped relative to the start of execution (for future streaming support).

### 2. Flow Execution Result (lib/nextviz/types.ts)

The `FlowExecutionResult` now includes an `executionEvents` array:

```typescript
export interface FlowExecutionResult {
  success: boolean;
  flowId: string;
  executionId: string;
  startedAt: string;
  completedAt: string;
  nodeOutputs: Record<string, Record<string, unknown>>;
  executionEvents?: ExecutionEvent[]; // ← new field
  error?: string;
}
```

### 3. Canvas Replay (app/nextviz/_components/canvas-client.tsx)

When a flow execution completes, the canvas replays the events with visual delays:

```typescript
const replayExecutionEvents = useCallback(
  (events: ExecutionEvent[]) => {
    let delay = 0;
    for (const event of events) {
      if (event.type === "node-start") {
        setTimeout(() => updateNodeState(event.nodeId, "running"), delay);
        delay += 400; // Show running for 400ms
      } else if (event.type === "node-success") {
        setTimeout(() => updateNodeState(event.nodeId, "success"), delay);
        delay += 300; // Show success for 300ms
      } else if (event.type === "node-error") {
        setTimeout(() => updateNodeState(event.nodeId, "error"), delay);
        delay += 300; // Show error for 300ms
      }
    }
    // Clear all states after sequence
    setTimeout(() => clearNodeStates(), delay + 500);
  },
  []
);
```

Each event updates the node's `data.executionState` field, which `BaseNode` reads to apply visual styles.

---

## Visual Feedback

### Running State
- **Border:** `border-primary` (emerald-500)
- **Animation:** `animate-pulse`
- **Badge:** `Loader2` icon spinning
- **Duration:** ~400ms per node

### Success State
- **Border:** `border-green-500`
- **Badge:** `CheckCircle2` icon (✅)
- **Duration:** ~300ms per node

### Error State
- **Border:** `border-destructive` (red-500)
- **Badge:** `XCircle` icon (❌)
- **Duration:** ~300ms per node

---

## User Experience Flow

### Step 1: Click Manual Trigger
```
User clicks "Execute" button on Manual Trigger node panel
```

### Step 2: Manual Trigger Shows Running
```
├─ Manual Trigger border pulses (primary color)
└─ Spinner badge appears
   Duration: ~400ms
```

### Step 3: Manual Trigger Shows Success
```
├─ Manual Trigger border turns green
└─ Checkmark badge appears
   Duration: ~300ms
```

### Step 4: HTTP Request Shows Running
```
├─ HTTP Request border pulses
└─ Spinner badge appears
   Duration: depends on actual network time
```

### Step 5: HTTP Request Shows Success (or Error)
```
├─ HTTP Request border turns green (or red)
└─ Checkmark (or X) badge appears
   Duration: ~300ms
```

### Step 6: All States Clear
```
All nodes return to default appearance
Console panel shows full result
```

---

## Implementation Details

### Event Timing

Events are recorded with millisecond timestamps relative to execution start:

```json
[
  { "type": "node-start", "nodeId": "node-123", "timestamp": 0 },
  { "type": "node-success", "nodeId": "node-123", "timestamp": 450 },
  { "type": "node-start", "nodeId": "node-456", "timestamp": 451 },
  { "type": "node-success", "nodeId": "node-456", "timestamp": 850 }
]
```

This allows for:
1. Accurate replay on the canvas (current use)
2. Future streaming support (SSE or WebSocket)
3. Execution timeline visualization

### State Updates

The replay function uses `setNodes()` to update each node's `data.executionState`:

```typescript
setNodes((nds) =>
  nds.map((n) =>
    n.id === nodeId
      ? { ...n, data: { ...n.data, executionState: state } }
      : n
  )
);
```

This triggers a re-render of `BaseNode` for that node only.

### Timing Strategy

- **400ms running state**: Long enough to see the animation, short enough not to feel sluggish
- **300ms success/error state**: Brief confirmation, then clear for next execution
- **500ms final delay**: Gives user time to see the last node state before clearing

Adjust these values in `replayExecutionEvents()` if needed for different timing preferences.

---

## Future Enhancements

### 1. Server-Sent Events (SSE)
Emit events in real-time via a streaming API endpoint:
```typescript
// In Next.js API route
export async function GET(req: Request) {
  const { flowId } = req.nextUrl.searchParams;
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      const result = await executeFlow(flowId);
      for (const event of result.executionEvents ?? []) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
        );
        await delay(100);
      }
      controller.close();
    },
  });
}
```

Canvas would subscribe with `EventSource`:
```typescript
const eventSource = new EventSource(`/api/flow/${flowId}/execute`);
eventSource.onmessage = (e) => {
  const event = JSON.parse(e.data);
  updateNodeState(event.nodeId, stateFromEvent(event.type));
};
```

### 2. Execution Timeline
Display a scrollable timeline showing when each node ran:
```
[0ms]    Manual Trigger: 0–450ms
[451ms]  HTTP Request:   451–1200ms
[1201ms] Success ✅
```

### 3. Performance Profiling
Show execution duration per node in the Console:
```json
{
  "node-123": { "duration": 450, "state": "success" },
  "node-456": { "duration": 749, "state": "success" }
}
```

---

## Testing

### Manual Test
1. Open http://localhost:3000
2. Load or create a flow with Manual Trigger + HTTP Request
3. Click the Manual Trigger node → "Execute" button
4. **Expected:** See the node states animate in sequence:
   - Manual Trigger: running → success → clear
   - HTTP Request: running → success → clear
   - Console shows response data

### Automated Test (Future)
```typescript
it("replays execution events on canvas nodes", async () => {
  const { getByText, getAllByRole } = render(<CanvasClient />);
  
  // Trigger execution
  fireEvent.click(getByText("Execute"));
  
  // Wait for first node to show running
  await waitFor(() => {
    expect(getByTestId("node-trigger")).toHaveClass("border-primary");
  });
  
  // Wait for success state
  await waitFor(() => {
    expect(getByTestId("node-http")).toHaveClass("border-green-500");
  });
});
```

---

## Code Changes Summary

| File | Change |
|---|---|
| `lib/nextviz/types.ts` | Added `ExecutionEvent` type and `executionEvents` field to `FlowExecutionResult` |
| `lib/nextviz/engine.ts` | Added event tracking in `executeFlow()` loop |
| `app/nextviz/_components/canvas-client.tsx` | Added `replayExecutionEvents()` function and replay trigger in handlers |
| `app/nextviz/nodes/_base/base-node.tsx` | Already reads `data.executionState` for visual feedback (no changes) |

---

## Related Features

- **Execution State Visual Feedback** (in BaseNode)
  - Running: pulse animation + spinner badge
  - Success: green border + checkmark badge
  - Error: red border + X badge

- **Console Output Panel**
  - Shows full execution result after replay completes
  - Displays error details if a node failed

- **Manual Trigger Node**
  - Click "Execute" to trigger the flow
  - Execution events are replayed on the canvas
