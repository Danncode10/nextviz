import { NextRequest, NextResponse } from "next/server";
import { executeFlow } from "@/lib/nextviz/engine";

type Params = { params: Promise<{ flowId: string }> };

function buildPayload(req: NextRequest, body: unknown): Record<string, unknown> {
  return {
    method: req.method,
    headers: Object.fromEntries(req.headers.entries()),
    body: body ?? {},
    params: Object.fromEntries(new URL(req.url).searchParams.entries()),
  };
}

export async function POST(req: NextRequest, { params }: Params) {
  const { flowId } = await params;
  const body = await req.json().catch(() => ({})) as Record<string, unknown>;
  // If caller passes { payload: {...} }, use that directly as execution payload
  // (manual trigger / testing). Otherwise wrap full HTTP request for webhook nodes.
  const executionPayload =
    body.payload !== undefined && typeof body.payload === "object"
      ? (body.payload as Record<string, unknown>)
      : buildPayload(req, body);
  const result = await executeFlow(flowId, executionPayload);
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}

export async function GET(req: NextRequest, { params }: Params) {
  const { flowId } = await params;
  const result = await executeFlow(flowId, buildPayload(req, {}));
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
