import { useEffect, useState } from "react";
import { providerFactory } from "../lib/provider-factory";
import { useKeys } from "./keys-provider";
import { addBackground } from "@/lib/utils";
import { useLlamaVision } from "@/hooks/use-llama-vision";
import { useUserChoice } from '../app/context/UserChoiceContext';

const TIMER_GUESS_TICK = 2_000;

const [LetMeGuessProvider, useLetMeGuess] = providerFactory(() => {
  const { keys } = useKeys();
  const { userChoice } = useUserChoice(); // Get userChoice from context

  if (!keys) {
    throw new Error("No keys");
  }

  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [working, setWorking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [interpretation, setInterpretation] = useState<string>("");
  const [lastSpeed, setLastSpeed] = useState<number>(0);
  const [lastSubmit, setLastSubmit] = useState<number>(0);
  const { groqApiKey } = keys;
  const { callLlamaVision } = useLlamaVision("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");
  const [prompt, setPrompt] = useState("");

  // Update prompt whenever `userChoice` or `currentImage` changes
  useEffect(() => {
    if (userChoice && currentImage) {
      const updatedPrompt = `
        Describe the image in JUST ONE WORD. 
		`;
        // The first word should describe what the image represents.
        // The second word should describe how close the image is to an ideal ${userChoice} (use words like "accurate", "close", or "different").
      setPrompt(updatedPrompt);
    }
  }, [userChoice, currentImage]);

  console.log("Updated prompt:", prompt);

  async function submit() {
    if (!currentImage || working) {
      return;
    }

    setWorking(true);

    setMessages([...messages, { role: "user", content: prompt }]);
    const response = await callLlamaVision(
      prompt,
      await addBackground(currentImage),
    );

    console.log("Prompt and response:", prompt, response);

    const { role, content } = response.choices[0].message;

    // Process the response to include the two-word interpretation
    setMessages((m) => [...m, { role, content }]);
    setWorking(false);

    const lastOne = response.choices[0].message.content; // Ensure it grabs only two words
    setInterpretation(lastOne || "");
    console.log("lastOne", response);


    // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    setLastSpeed((response as any).usage?.total_time || 0);
    setLastSubmit(Date.now());
  }

  useEffect(() => {
    if (!currentImage) {
      setInterpretation("");
      setLastSpeed(0);
    }

    if (Date.now() - lastSubmit >= TIMER_GUESS_TICK) {
      submit();
    }
  }, [currentImage, submit, lastSubmit]);

  // Submit immediately if `currentImage` changes
  useEffect(() => {
    const timeSinceLastSubmit = Date.now() - lastSubmit;
    if (currentImage && timeSinceLastSubmit < TIMER_GUESS_TICK) {
      const delay = TIMER_GUESS_TICK - timeSinceLastSubmit;
      const timer = setTimeout(submit, delay);

      return () => clearTimeout(timer); // Clear timeout if component unmounts or re-renders
    }
  }, [currentImage]);

  return {
    currentImage,
    interpretation,
    lastSpeed,
    messages,
    setCurrentImage,
    setInterpretation,
    setMessages,
    working,
  };
});

export { LetMeGuessProvider, useLetMeGuess };