//page.tsx

"use client";
import { LetMeGuess } from "./components/let-me-guess";
import { EnterKey } from "./components/enter-key";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useKeys } from "@/providers/keys-provider";
import { LetMeGuessProvider, useLetMeGuess } from "@/providers/let-me-guess-provider"; // Import useLetMeGuess
import { createGridTile } from "@/lib/utils";
import { useEffect, useState } from "react";
import TutorButton from "./components/TutorButton";
import TutorLLM from "./components/TutorLLM"; // Import the new component
import { UserChoiceProvider } from './context/UserChoiceContext';

const GRID_TILE = createGridTile(10, 10);

export default function Home() {
	const { keys, setKeys } = useKeys();
	const [inited, setInited] = useState<boolean>(false);
	const [llmResponse, setLlmResponse] = useState<string>("");
	const [llmGuessInput, setLlmGuessInput] = useState<string>("");
	const [userTranscript, setUserTranscript] = useState("")
  
	const { interpretation } = useLetMeGuess();
  
	useEffect(() => {
	  if (inited) return;
	  setInited(true);
	}, [inited]);
  
	useEffect(() => {
	  console.log("interpretation updated:", interpretation);
	}, [interpretation]);
  
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
		<UserChoiceProvider>
			<main className="h-svh" style={{ backgroundImage: `url(${GRID_TILE})` }}>
				<LetMeGuessProvider >
				<LetMeGuess />
				<TutorButton setUserTranscript={setUserTranscript} />
				<TutorLLM onReceiveResponse={setLlmResponse} imageInterpretationProp={llmGuessInput}  />
				<p className="hint-message">{llmResponse || "LLM RESPONSE AREA"}</p>
				</LetMeGuessProvider>
				<Button
				className="fixed bottom-1 right-1"
				size={"icon"}
				variant={"ghost"}
				onClick={() => setKeys(null)}
				>
				<LogOut />
				</Button>

			</main>
		</UserChoiceProvider>
	);
  }
  