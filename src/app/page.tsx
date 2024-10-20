"use client";

import React, { useState, useEffect } from 'react';
import { createClient, LiveTranscriptionEvents, ListenLiveClient } from '@deepgram/sdk';
import { Button } from "@/components/ui/button";
import SiriWaveComponent from "@/components/ui/siriwave";
import { LogOut } from "lucide-react";
import { useKeys } from "@/providers/keys-provider";
import { LetMeGuessProvider, useLetMeGuess } from "@/providers/let-me-guess-provider";
import { LetMeGuess } from "./components/let-me-guess";
import { EnterKey } from "./components/enter-key";
import { createGridTile } from "@/lib/utils";
import TutorLLM from "./components/TutorLLM"; // Import the new component
import { UserChoiceProvider, useUserChoice } from './context/UserChoiceContext';

const GRID_TILE = createGridTile(10, 10);

export default function Home() {
    const { keys, setKeys } = useKeys();
    const [inited, setInited] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
    const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
    const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
    const [recordingCompleted, setRecordingCompleted] = useState(false);
    const [transcript, setTranscript] = useState(''); // To store the transcript in real-time
    const [deepgramClient, setDeepgramClient] = useState<ListenLiveClient | null>(null);
    const [isDeepgramReady, setIsDeepgramReady] = useState(false); // To track if Deepgram is ready

	const [llmResponse, setLlmResponse] = useState<string>("");
	const [llmGuessInput, setLlmGuessInput] = useState<string>("");


	const { interpretation } = useLetMeGuess();
    let setUserChoice: any;

    // Ensure that useUserChoice is called only within UserChoiceProvider
    try {
        ({ setUserChoice } = useUserChoice());
    } catch (error) {
        console.warn("UserChoiceProvider is not yet initialized.");
    }

    const deepgramApiKey = 'c434b0088f0bc7ce618113749139d8c413d9317d'; // Replace with your Deepgram API key

    useEffect(() => {
        if (isRecording) {
            initializeDeepgram();
        }
    }, [isRecording]);

    useEffect(() => {
        if (inited) return;
        setInited(true);
    }, [inited]);

	useEffect(() => {
		if (setUserChoice) {
			console.log("setUserChoice presenttttttttttt")
			setUserChoice(transcript); 
			console.log("setting usechoice", transcript);
			// Ensure setUserChoice is called only if it's available
        }
	}, [transcript]);

    const initializeDeepgram = () => {
        const deepgram = createClient(deepgramApiKey);

        const connection = deepgram.listen.live({
            smart_format: true,
            model: 'nova',
            language: 'en-US',
        });

        // Handle Deepgram events
        connection.on(LiveTranscriptionEvents.Open, () => {
            console.log('Deepgram connection opened.');
            setIsDeepgramReady(true); // Set the connection as ready
        });

        connection.on(LiveTranscriptionEvents.Transcript, (data) => {
            if (data.channel.alternatives[0].transcript) {
                console.log('Transcription received:', data.channel.alternatives[0].transcript); // Debugging
                setTranscript((prevTranscript) => prevTranscript + ' ' + data.channel.alternatives[0].transcript);
            } else {
                console.log('No transcription received'); // Debugging
            }
        });

        connection.on(LiveTranscriptionEvents.Close, () => {
            console.log('Deepgram connection closed.');
            setIsDeepgramReady(false); // Mark as no longer ready
        });

        connection.on(LiveTranscriptionEvents.Error, (error) => {
            console.error('Deepgram connection error:', error);
        });

        setDeepgramClient(connection); // Store the connection
    };

    const handleRecord = () => {
        setShowWelcomeMessage(false); // Hide the welcome message

        if (!isRecording) {
            //initializeDeepgram(); // Initialize Deepgram before starting the recording

            navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
                const recorder = new MediaRecorder(stream);
                //const chunks: Blob[] = [];

                recorder.ondataavailable = (event) => {
                    //chunks.push(event.data);

                    // Send the audio data to Deepgram in real-time only if the connection is ready
                    if ( deepgramClient && deepgramClient.getReadyState() === 1) {
                        console.log('Sending audio data to Deepgram'); // Debugging
                        deepgramClient.send(event.data); // Send the audio data to Deepgram
                    } else {
                        console.log('Deepgram connection not ready'); // Debugging
                    }
                };

                recorder.start(250); // Send audio every 250ms for real-time transcription
                setMediaRecorder(recorder);
                //setAudioChunks(chunks); // Save the chunks
                console.log('Recording started...');
            }).catch(err => {
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
		<UserChoiceProvider> {/* Ensure UserChoiceProvider is wrapping the whole component */}
            <LetMeGuessProvider>
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
                            <LetMeGuess />
                            <TutorLLM onReceiveResponse={setLlmResponse} imageInterpretationProp={llmGuessInput} transcript = {transcript} />
                            <p className="hint-message">{llmResponse || "LLM RESPONSE AREA"}</p>
                        </div>
                    )}

                    {isRecording && (
                        <div className="fixed bottom-40 left-1/2 transform -translate-x-1/2 w-full h-20">
                            <SiriWaveComponent />
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
                    <div className="fixed bottom-0 left-0 right-0 p-4 bg-gray-100 text-center">
                        <h3 className="text-xl font-bold">Live Transcription:</h3>
                        <p>{transcript}</p>
                    </div>
                </main>
            </LetMeGuessProvider>
		</UserChoiceProvider>
    );
}
