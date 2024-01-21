'use client';

import { MicrophoneIcon, ReloadIcon } from '@/app/ui/components/icons';
import Spiner from '@/app/ui/components/spiner';
import { Button } from '@nextui-org/button';
import { Textarea } from '@nextui-org/input';
import { useEffect, useRef, useState } from 'react';

const enum MicrophoneStatus {
  unloaded = 'unloaded',
  loaded = 'loaded',
  recording = 'rec',
  loading = 'load',
  failed = 'failed',
}

export default function Home() {
  const [status, setStatus] = useState<MicrophoneStatus>(MicrophoneStatus.unloaded);
  const [response, setResponse] = useState<string>('');
  const threadId = useRef<string>('');
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const blob = useRef<Blob | null>(null);

  const onStopRecording = () => {
    blob.current = new Blob(chunks.current, { type: 'webm' });
    chunks.current = [];

    // const audio = document.createElement('audio');
    // audio.src = window.URL.createObjectURL(blob.current);
    // audio.hidden = true;
    // audio.play();
    setStatus(MicrophoneStatus.loading);
  };

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    recorder.current.ondataavailable = (e) => {
      chunks.current.push(e.data);
      // console.log(e.data);
    };

    recorder.current.onstop = () => {
      onStopRecording();
      stream.getTracks().forEach((track) => track.stop());
    };

    recorder.current.start();
    setStatus(MicrophoneStatus.recording);
  };

  const stopRecording = async () => {
    if (recorder.current == null) return;
    await new Promise((res) => {
      const currentOnStop = recorder.current?.onstop;
      recorder.current!.onstop = (ev) => {
        if (currentOnStop != null) {
          currentOnStop.call(recorder.current!, ev);
        }
        res(true);
      };
      recorder.current?.stop();
    });
    if (blob.current == null) {
      console.log('No hay blobios ::c');
    } else {
      // const audio = document.createElement('audio');
      // audio.src = window.URL.createObjectURL(blob.current);
      // audio.hidden = true;
      // audio.play();
      const form = new FormData();
      form.append('audio', blob.current);

      // const transc = await fetch('/api/transcript', {
      //   method: 'POST',
      //   body: form,
      // });
      // if (transc.status < 300) {
      //   setResponse(await transc.text());
      //   setStatus(MicrophoneStatus.default);
      // }
      // const transc = await fetch('/api/conversation', {
      //   method: 'POST',
      // });
      // if (transc.status < 300) {
      //   setResponse((await transc.json()).threadId);
      //   setStatus(MicrophoneStatus.loaded);
      // }

      form.append('threadId', threadId.current);
      const transc = await fetch('/api/query', {
        method: 'POST',
        body: form,
      });
      if (transc.status < 300) {
        setResponse(await transc.text());
        setStatus(MicrophoneStatus.loaded);
      }
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

  const microphoneDisabled = !(status === MicrophoneStatus.loaded
    || status === MicrophoneStatus.recording);

  const reloadDisabled = !(status === MicrophoneStatus.loaded
    || status === MicrophoneStatus.failed);

  return (
    <main className="bg-gray-900 min-h-screen min-w-screen flex flex-col items-center p-[30px] gap-4">
      <div className="relative">
        <Button
          color="primary"
          radius="full"
          className={`p-0 w-[120px] h-[120px] ${microphoneDisabled ? 'button-disabled data-[hover=true]:opacity-100' : ''}`}
          onClick={
            status === MicrophoneStatus.loaded ? startRecording : stopRecording
          }
          disabled={microphoneDisabled}
          disableAnimation={microphoneDisabled}
        >
          {
            status === MicrophoneStatus.loading
              ? (
                <Spiner style={{
                  width: '70%',
                  height: '70%',
                }}
                />
              )
              : (
                <MicrophoneIcon
                  style={{ maxWidth: 'none', ...(status === MicrophoneStatus.recording && { fill: 'red' }) }}
                  className="w-[70%]"
                />
              )
          }
        </Button>
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
