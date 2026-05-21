# /new-node

Scaffold the three-file folder structure for a new NextViz node with boilerplate stubs.

**Usage:** `/new-node <node-name>`
**Example:** `/new-node supabase-db`

---

## Protocol

Create the following files with minimal correct boilerplate. Do not implement logic yet — just the structure so the node compiles without errors.

### `app/nextviz/nodes/$ARGUMENTS/node.tsx`
```tsx
"use client";
import { memo } from "react";
import { NodeProps } from "reactflow";
import { BaseNode } from "../_base/base-node";

function $NodeNameNode(props: NodeProps) {
  return (
    <BaseNode {...props} label="$Node Name" category="data" />
  );
}

export default memo($NodeNameNode);
```

### `app/nextviz/nodes/$ARGUMENTS/panel.tsx`
```tsx
"use client";
import { Node } from "reactflow";

interface Props {
  node: Node;
  onChange: (data: Record<string, unknown>) => void;
}

export function $NodeNamePanel({ node, onChange }: Props) {
  return (
    <div className="p-4 text-sm text-muted-foreground">
      Configure $Node Name
    </div>
  );
}
```

### `app/nextviz/nodes/$ARGUMENTS/logic.ts`
```ts
import { NodeExecutorFn } from "@/lib/nextviz/types";

export const execute: NodeExecutorFn = async (nodeData, inputs, context) => {
  // TODO: implement
  return {};
};
```

After scaffolding:
1. Show the user the three files created
2. Remind them to run `/build-node $ARGUMENTS` to implement the node fully
