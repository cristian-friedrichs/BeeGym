'use client';

import { useState, useRef, useCallback } from 'react';

export function useAudioRecorder() {
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

    const mediaRecorder = useRef<MediaRecorder | null>(null);
    const timerInterval = useRef<NodeJS.Timeout | null>(null);
    const chunks = useRef<Blob[]>([]);

    const startRecording = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const recorder = new MediaRecorder(stream);

            mediaRecorder.current = recorder;
            chunks.current = [];

            recorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunks.current.push(e.data);
                }
            };

            recorder.onstop = () => {
                const blob = new Blob(chunks.current, { type: 'audio/webm' });
                setAudioBlob(blob);
                stream.getTracks().forEach(track => track.stop());
            };

            recorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerInterval.current = setInterval(() => {
                setRecordingTime((prev) => prev + 1);
            }, 1000);

        } catch (err) {
            console.error('Erro ao acessar microfone:', err);
            throw err;
        }
    }, []);

    const stopRecording = useCallback(() => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
            }
        }
    }, [isRecording]);

    const cancelRecording = useCallback(() => {
        if (mediaRecorder.current && isRecording) {
            mediaRecorder.current.stop();
            setIsRecording(false);
            setAudioBlob(null);
            if (timerInterval.current) {
                clearInterval(timerInterval.current);
            }
        }
    }, [isRecording]);

    const clearAudio = useCallback(() => {
        setAudioBlob(null);
        setRecordingTime(0);
    }, []);

    return {
        isRecording,
        recordingTime,
        audioBlob,
        startRecording,
        stopRecording,
        cancelRecording,
        clearAudio
    };
}
