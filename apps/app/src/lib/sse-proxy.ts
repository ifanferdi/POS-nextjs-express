import { auth } from '@/auth';
import { api } from '@/config/config';

export async function proxySSE(path?: string) {
  const session = await auth();
  if (!session?.accessToken) return new Response('Unauthorized', { status: 401 });

  let url = `${api.baseUrl}/v1/sse`;
  if (path) url = `${url}/${path}`;
  let backendRes: Response;
  try {
    backendRes = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        Accept: 'text/event-stream',
      },
    });
  } catch {
    return new Response('Stream temporarily unavailable', { status: 503 });
  }

  if (!backendRes.ok) {
    return new Response('No stream', { status: backendRes.status });
  }
  if (!backendRes.body) {
    return new Response('No stream', { status: 502 });
  }

  // Pipe ReadableStream langsung — tidak nunggu response "selesai"
  return new Response(backendRes.body, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
