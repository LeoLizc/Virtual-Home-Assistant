'use client';

import { memo, useRef, useState } from 'react';
import { MicrophoneIcon } from './icons';
import Spiner from './spiner';

const enum MicrophoneStatus {
  loaded = 'loaded',
  recording = 'rec',
}

type RecorderProps = {
  disabled?: boolean;
  onRecord?: () => void;
  onRecording?: (blob: BlobEvent) => void;
  onStop?: (blob: Blob) => void;
  loading?: boolean;
};

export default memo(({
  disabled = false,
  onRecord = () => { },
  onStop = () => { },
  onRecording = () => { },
  loading = false,
}: RecorderProps) => {
  const [status, setStatus] = useState<MicrophoneStatus>(
    MicrophoneStatus.loaded,
  );
  const recorder = useRef<MediaRecorder | null>(null);

  const clickeable = !disabled && !loading;

  const startRecording = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recorder.current = new MediaRecorder(stream, { mimeType: 'audio/webm' });
    const chunks: Blob[] = [];

    recorder.current.ondataavailable = (e) => {
      chunks.push(e.data);
      onRecording(e);
    };

    recorder.current.onstop = () => {
      const blob = new Blob(chunks, { type: 'webm' });
      onStop(blob);
      stream.getTracks().forEach((track) => track.stop());
      setStatus(MicrophoneStatus.loaded);
    };

    recorder.current.start();
    setStatus(MicrophoneStatus.recording);
    onRecord();
  };

  const stopRecording = async () => {
    if (recorder.current == null) return;
    recorder.current.stop();
  };

  return (
    // <>
    <button
      type="button"
      id="mic"
      disabled={!clickeable}
      onClick={
        status === MicrophoneStatus.loaded ? startRecording : stopRecording
      }
      className={`p-0 w-[120px] h-[120px] rounded-full flex justify-center items-center bg-[#2e97ed] enabled:hover:scale-105 enabled:active:scale-90 enabled:transition-transform enabled:duration-100 ${disabled ? 'saturate-0 contrast-50 brightness-105' : ''}`}
    >
      {
        loading
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
    </button>
    // </>
  );
});
