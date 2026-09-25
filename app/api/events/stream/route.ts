import { virtualCell } from '@/lib/backend/virtual-cell';

export const dynamic = 'force-dynamic';

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection event
      controller.enqueue(
        encoder.encode(`event: connected\ndata: ${JSON.stringify({ status: 'CONNECTED', timestamp: new Date().toISOString() })}\n\n`)
      );

      // Listen for cell events
      const unsubscribe = virtualCell.subscribe((event) => {
        try {
          controller.enqueue(
            encoder.encode(`event: telemetry\ndata: ${JSON.stringify(event)}\n\n`)
          );
        } catch {
          unsubscribe();
        }
      });

      // Periodic heartbeat ping every 5 seconds
      const pingInterval = setInterval(() => {
        try {
          controller.enqueue(
            encoder.encode(`event: ping\ndata: ${JSON.stringify({ ping: Date.now() })}\n\n`)
          );
        } catch {
          clearInterval(pingInterval);
          unsubscribe();
        }
      }, 5000);

      return () => {
        clearInterval(pingInterval);
        unsubscribe();
      };
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
