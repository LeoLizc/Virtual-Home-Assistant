import openConfig from '@/openai-config';
import fs from 'fs';

export async function transcriptWhisper(path: string) {
  const openai = openConfig.value;
  if (openai == null) {
    return null;
  }

  try {
    const audio = fs.createReadStream(path);
    const transcription = await openai.audio.transcriptions.create({
      model: 'whisper-1',
      file: audio,
      language: 'es',
    });

    return transcription.text;
  } catch (er) {
    console.error(er);
  }
  return null;
}
