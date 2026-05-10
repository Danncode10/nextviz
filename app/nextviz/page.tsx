import { CanvasClient } from "./_components/canvas-client";

export default async function NextVizPage({
  searchParams,
}: {
  searchParams: Promise<{ flowId?: string }>;
}) {
  const { flowId } = await searchParams;
  // key forces a full remount of the canvas when the active flow changes
  return <CanvasClient key={flowId} initialFlowId={flowId} />;
}
