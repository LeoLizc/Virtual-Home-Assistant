import { transcriptWhisper } from '@/services/speach-to-text';
import { isFile } from '@/utils';
import fs from 'fs';
import { NextRequest } from 'next/server';

const allowedFormats = ['audio/mp3', 'video/mp4', 'audio/webm', 'webm'];

export async function GET() {
  return new Response('hola mundo');
}

export async function POST(req: NextRequest) {
  req.headers.get('content-type');
  const formData = await req.formData();
  const audio = formData.get('audio');

  if (isFile(audio)) {
    if (allowedFormats.includes(audio.type)) {
      const path = `./audios/audio.${audio.type}`;
      fs.writeFileSync(path, Buffer.from(await audio.arrayBuffer()));
      const transcription = await transcriptWhisper(path);

      if (transcription == null) {
        return new Response('Error con la transcripción', {
          status: 500,
        });
      }
      return new Response(transcription);
    }
  }

  return new Response('Require an audio File', { status: 400 });
}
