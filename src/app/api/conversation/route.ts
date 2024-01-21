import { startConversation, deleteConversation } from '@/services/assistant';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  const { id: lastId } = await req.json();

  // await new Promise((resolve) => { setTimeout(resolve, 3000); });
  // return new Response(`${lastId}`);

  if (
    lastId != null
    && typeof lastId === 'string'
    && lastId.length > 0
  ) {
    try {
      await deleteConversation(lastId);
    } catch {
      console.error(`No se pudo borrar el thread: ${lastId}`);
    }
  }

  const id = await startConversation();
  return new Response(JSON.stringify(id), {
    headers: {
      'content-type': 'application/json',
    },
  });
}
