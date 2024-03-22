'use client';

import { Button } from '@nextui-org/button';
import { Textarea } from '@nextui-org/input';
import { useEffect, useRef, useState } from 'react';
import Recorder from './ui/components/recorder';
import { ReloadIcon } from './ui/components/icons';

const enum MicrophoneStatus {
  unloaded = 'unloaded', // Can't press any button
  loaded = 'loaded', // Can press any button
  recording = 'rec', // Only can Press Micrphone button
  loading = 'load', // Can't press any button But show a loading
  failed = 'failed', // Can't press any button
}

export default function Home() {
  const [status, setStatus] = useState<MicrophoneStatus>(MicrophoneStatus.unloaded);
  const [response, setResponse] = useState<string>('');
  const threadId = useRef<string>('');

  const startRecording = async () => setStatus(MicrophoneStatus.recording);

  const stopRecording = async (blob: Blob) => {
    setStatus(MicrophoneStatus.loading);
    // const audio = document.createElement('audio');
    // audio.src = window.URL.createObjectURL(blob.current);
    // audio.hidden = true;
    // audio.play();
    const form = new FormData();
    form.append('audio', blob);

    form.append('threadId', threadId.current);
    const transc = await fetch('/api/query', {
      method: 'POST',
      body: form,
    });
    if (transc.status < 300) {
      setResponse(await transc.text());
      setStatus(MicrophoneStatus.loaded);
    }
  };

  const loadNewThread = async () => {
    setStatus(MicrophoneStatus.unloaded);
    try {
      const res = await fetch('/api/conversation', {
        method: 'POST',
        body: JSON.stringify({
          id: threadId.current,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (res.status < 300) {
        threadId.current = (await res.json()).threadId;
        localStorage.setItem('threadId', threadId.current);
        setStatus(MicrophoneStatus.loaded);
      }
    } catch {
      setStatus(MicrophoneStatus.failed);
    }
  };

  useEffect(() => {
    // *Look for ThreadId in localstorage
    const localThreadId = localStorage.getItem('threadId');
    if (localThreadId != null) {
      threadId.current = localThreadId;
      setStatus(MicrophoneStatus.loaded);
      return;
    }

    // *Else create a new thread
    loadNewThread();
  }, []);

  const reloadDisabled = !(status === MicrophoneStatus.loaded
    || status === MicrophoneStatus.failed);
  return (
    <main className="bg-gray-900 min-h-screen min-w-screen flex flex-col items-center p-[30px] gap-4">
      <div className="relative">
        <Recorder
          onStop={stopRecording}
          onRecord={startRecording}
          loading={status === MicrophoneStatus.loading}
          disabled={status !== MicrophoneStatus.loaded && status !== MicrophoneStatus.recording}
        />
        <Button
          color="secondary"
          radius="md"
          className={`absolute min-w-0 w-[35px] h-[35px] top-[40px] right-[-50px] p-0 ${reloadDisabled ? 'button-disabled data-[hover=true]:opacity-100' : ''}`}
          isIconOnly
          disabled={reloadDisabled}
          disableAnimation={reloadDisabled}
          onClick={loadNewThread}
        >
          <ReloadIcon />
        </Button>
      </div>
      {
        status === MicrophoneStatus.recording
        && <span>recording</span>
      }
      <Textarea label="Respuesta" placeholder="Respuesta del asistente" fullWidth={false} className="max-w-[400px]" isReadOnly value={response} />
    </main>
  );
}
