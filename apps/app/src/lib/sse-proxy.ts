import { auth } from '@/auth';
import { api } from '@/config/config';

export async function proxySSE(path?: string) {
  const session = await auth();
  if (!session?.accessToken) return new Response('Unauthorized', { status: 401 });

  let url = `${api.baseUrl}/v1/sse`;
  if (path) url = `${url}/${path}`;
  const backendRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${session.accessToken}`,
      Accept: 'text/event-stream',
    },
  });

  if (!backendRes.ok || !backendRes.body) {
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
