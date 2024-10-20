"use client";
import { LetMeGuess } from "./components/let-me-guess";
import { EnterKey } from "./components/enter-key";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useKeys } from "@/providers/keys-provider";
import { LetMeGuessProvider } from "@/providers/let-me-guess-provider";
import { createGridTile } from "@/lib/utils";
import { useEffect, useState, useRef } from "react";

import {
	LiveConnectionState,
	LiveTranscriptionEvent,
	LiveTranscriptionEvents,
	useDeepgram,
  } from "./context/DeepgramContextProvider";
  import {
	MicrophoneEvents,
	MicrophoneState,
	useMicrophone,
  } from "./context/MicrophoneContextProvider";

const GRID_TILE = createGridTile(10, 10);

export default function Home() {
	const { keys, setKeys } = useKeys();
	const [inited, setInited] = useState(false);
	const [isRecording, setIsRecording] = useState(false);
	const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
	const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
	const [recordingCompleted, setRecordingCompleted] = useState(false);
	const { connection, connectToDeepgram, connectionState } = useDeepgram();
	const { setupMicrophone, microphone, startMicrophone, microphoneState } =
	  useMicrophone();
	const captionTimeout = useRef<any>();

	useEffect(() => {
		if (inited) return;
		setInited(true);
	}, [inited]);

	useEffect(() => {
		setupMicrophone();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	useEffect(() => {
		if (microphoneState === MicrophoneState.Ready) {
		  connectToDeepgram({
			model: "nova-2",
			interim_results: true,
			smart_format: true,
			filler_words: true,
			utterance_end_ms: 3000,
		  });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [microphoneState]);

	const handleRecord = () => {
		setShowWelcomeMessage(false); // Hide the welcome message

        if (!isRecording) {
            navigator.mediaDevices.getUserMedia({ audio: true })
                .then(stream => {
                    const recorder = new MediaRecorder(stream);
                    recorder.start();
                    setMediaRecorder(recorder);
                    console.log('Recording started...');
                })
                .catch(err => {
                    console.error('Error accessing microphone:', err);
                });
        } else if (mediaRecorder) {
            mediaRecorder.stop();
            mediaRecorder.onstop = () => {
                console.log('Recording stopped.');
				setRecordingCompleted(true);
            };
        }
        setIsRecording(!isRecording);
    };


	if (!inited) {
		return (
			<main className="w-full h-svh flex items-center justify-center">
				Loading...
			</main>
		);
	}

	if (!keys) {
		return <EnterKey onSuccess={(k) => setKeys(k)} />;
	}

	return (
		<main className="h-svh" style={{ backgroundImage: `url(${GRID_TILE})` }}>

			{!recordingCompleted && showWelcomeMessage && (
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-center font-bold text-3xl mb-4">
                        Hey! How are you doing?
                    </div>
                    <div className="text-center font-bold text-2xl">
                        What would you like to draw today?
                    </div>
                </div>
            )}

			{recordingCompleted && (
				<div className="drawing-area">
					<LetMeGuessProvider>
					<LetMeGuess />
					</LetMeGuessProvider>
				</div>
			)}


			<Button
				className="fixed bottom-1 right-1"
				size={"icon"}
				variant={"ghost"}
				onClick={() => setKeys(null)}
			>
				<LogOut />
			</Button>

			<Button
                className="fixed bottom-20 left-1/2 transform -translate-x-1/2"
                onClick={handleRecord}
            >
                {isRecording ? 'Stop Recording' : 'Speak to Drawing Tutor'}
            </Button>


		</main>
	);
}
