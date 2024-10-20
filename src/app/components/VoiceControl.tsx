// components/VoiceControl.tsx
import { useState } from 'react';

// Extend the window interface to support SpeechRecognition
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export default function VoiceControl() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // Initialize Web Speech API
  const startRecording = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.interimResults = true;
    recognition.continuous = false;  // We will handle the pausing behavior manually

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcriptResult = Array.from(event.results)
        .map((result) => result[0])
        .map((result) => result.transcript)
        .join('');
      setTranscript(transcriptResult);

      // Clear the timeout if there was speech detected
      if (timeoutId) {
        clearTimeout(timeoutId);
        setTimeoutId(null);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      // Set a timeout to stop recording after a longer pause
      const newTimeoutId = setTimeout(() => {
        stopRecording();
      }, 5000); // 3-second pause detection
      setTimeoutId(newTimeoutId);
    };

    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    setIsRecording(false);
    if (timeoutId) {
      clearTimeout(timeoutId);  // Clear any pending timeout
    }
  };

  // Text-to-Speech
  const speak = () => {
    const utterance = new SpeechSynthesisUtterance(transcript);
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div style={{ textAlign: 'center', margin: '20px' }}>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? 'Stop Recording' : 'Start Recording'}
      </button>
      <p>{transcript}</p>
      <button onClick={speak}>Speak Text</button>
    </div>
  );
}
