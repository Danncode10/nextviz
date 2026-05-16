# Testing Result Replay — Quick Start Guide

## What to Test
When you execute a flow, each node should animate through execution states. This provides visual feedback of the flow's progress without waiting for the console panel.

## Manual Test Steps

### Setup
1. Open http://localhost:3000 in your browser
2. You should already have the "HTTP request Example" flow loaded (or create a new one with Manual Trigger → HTTP Request)
3. Make sure the HTTP Request node has a valid URL (e.g., `https://jsonplaceholder.typicode.com/posts/1`)

### Test Execution
1. **Click the Manual Trigger node** to open its properties panel
2. **Click the "Execute" button** (bottom of the panel)
3. **Immediately watch the canvas** — you should see:

### Expected Behavior

#### Phase 1: Manual Trigger (0–400ms)
```
├─ Border turns emerald (primary color)
├─ Spinner badge (⚙️) appears in top-right corner
├─ Border pulses with animation
└─ Duration: ~400ms
```

#### Phase 2: Manual Trigger Success (400–700ms)
```
├─ Border turns green (green-500)
├─ Checkmark badge (✅) appears
└─ Duration: ~300ms
```

#### Phase 3: HTTP Request Running (700–1100ms)
```
├─ Border turns emerald (primary color)
├─ Spinner badge appears
├─ Border pulses
└─ Duration: depends on network latency
```

#### Phase 4: HTTP Request Success (1100–1400ms)
```
├─ Border turns green
├─ Checkmark badge appears
└─ Duration: ~300ms
```

#### Phase 5: Clear States (1400ms+)
```
├─ All borders return to default (zinc-700)
├─ All badges disappear
├─ Console panel shows response data
└─ Ready for next execution
```

---

## Visual Checklist

### ✅ Running State Indicators
- [ ] Node border pulses with primary color (emerald)
- [ ] Spinner icon (⚙️) appears in top-right corner
- [ ] Icon rotates/spins
- [ ] Effect lasts ~400ms

### ✅ Success State Indicators
- [ ] Node border turns green (green-500)
- [ ] Checkmark icon (✅) appears in top-right corner
- [ ] Effect lasts ~300ms

### ✅ Sequence & Timing
- [ ] Manual Trigger executes first
- [ ] HTTP Request executes second
- [ ] States clear smoothly
- [ ] No overlapping animations
- [ ] Total sequence is ~1-2 seconds

### ✅ Console Integration
- [ ] Console panel appears during execution
- [ ] Response data is shown after replay completes
- [ ] Status code and duration are displayed

---

## Timing Reference

If you want to measure timing precisely:

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run this before executing:
   ```javascript
   window._testStart = performance.now();
   ```
4. Execute the flow and watch the nodes
5. Check timestamps in the console for each state change

### Expected Timeline
```
0ms     Manual Trigger starts (running state)
400ms   Manual Trigger success state
700ms   Manual Trigger states clear
700ms   HTTP Request starts (running state)
1100ms  HTTP Request success state (actual time depends on network)
1400ms  HTTP Request states clear
1500ms  All animations complete
```

---

## Troubleshooting

### Nodes Don't Show Animation
- Check browser console (F12) for JavaScript errors
- Verify BaseNode component is imported correctly
- Confirm execution completed (check Console panel for results)

### Animation Happens But Disappears Too Fast
- This is expected — the states are designed to be brief notifications
- Check the timing in replayExecutionEvents() function
- Current: 400ms running, 300ms success, 500ms delay before clear

### Animation Doesn't Match Node Activity
- The replay is based on server-side execution events
- If network is very slow, running state may clear before request completes
- This is normal — replay timing is client-side, network timing is server-side

### Console Panel Doesn't Show Results
- Console should appear automatically when flow executes
- If it doesn't, check if `showExecutionOutput` is being set in canvas-client.tsx
- Verify executeFlowAction is returning results correctly

---

## Advanced: Inspecting Events

To see the raw execution events that drive the animation:

1. Open browser DevTools Console
2. Execute a flow
3. Check the Network tab → (find the executeFlowAction request)
4. Click the response and look for `executionEvents` array
5. You should see:
   ```json
   {
     "success": true,
     "result": {
       "flowId": "flow-xxx",
       "executionId": "xxx",
       "startedAt": "2026-05-16T...",
       "completedAt": "2026-05-16T...",
       "nodeOutputs": { "node-123": {...}, "node-456": {...} },
       "executionEvents": [
         { "type": "node-start", "nodeId": "node-123", "timestamp": 0 },
         { "type": "node-success", "nodeId": "node-123", "timestamp": 450 },
         { "type": "node-start", "nodeId": "node-456", "timestamp": 451 },
         { "type": "node-success", "nodeId": "node-456", "timestamp": 1200 }
       ]
     }
   }
   ```

---

## Success Criteria

✅ **Result Replay is working if:**
1. Nodes visibly animate as flow executes
2. Running state shows before each node completes
3. Success/error state shows after execution
4. All states clear when replay sequence finishes
5. Console shows final results
6. Can execute multiple times without residual state

---

## Next: Testing Other Nodes

Once Result Replay works for HTTP Request:

- Test with **Schedule Trigger** (should show animation)
- Test with **AI Agent** (should animate multiple nodes)
- Test with **Filter/Logic nodes** (should show quick success if no delay)
- Test with **failing HTTP requests** (should show error state)

---

## Files Modified

| File | Purpose |
|---|---|
| `lib/nextviz/types.ts` | ExecutionEvent types |
| `lib/nextviz/engine.ts` | Event tracking during execution |
| `app/nextviz/_components/canvas-client.tsx` | Replay function + handler integration |
| `app/nextviz/nodes/_base/base-node.tsx` | Already had visual feedback (no changes) |

See `docs/features/result-replay.md` for detailed architecture documentation.
