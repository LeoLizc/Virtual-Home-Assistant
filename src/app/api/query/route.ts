import { sendMessage } from '@/services/assistant';
import { transcriptWhisper } from '@/services/speach-to-text';
import { isFile } from '@/utils';
import fs from 'fs';
import { NextRequest } from 'next/server';

const allowedFormats = ['webm', 'audio/webm'];

export async function POST(req: NextRequest) {
  req.headers.get('content-type');
  const formData = await req.formData();
  const audio = formData.get('audio');
  const threadId = formData.get('threadId');

  if (!isFile(audio)) {
    return new Response('Se requiere un archivo', {
      status: 400,
    });
  }

  if (!allowedFormats.includes(audio.type)) {
    return new Response('Se requiere un formato de audio válido', {
      status: 400,
    });
  }

  if (typeof threadId !== 'string') {
    return new Response('se debe proveer un id de Thread', { status: 400 });
  }

  const path = `./audios/audio.${audio.type}`;
  fs.writeFileSync(path, Buffer.from(await audio.arrayBuffer()));
  const transcription = await transcriptWhisper(path);

  if (transcription == null) {
    return new Response('Error transcribiendo Audio', { status: 500 });
  }

  const response = await sendMessage({
    message: transcription,
    threadId,
  });

  return new Response(response);
}
