import { useLetMeGuess } from "@/providers/let-me-guess-provider";
import { useState, useEffect } from "react";
import { useUserChoice } from '../context/UserChoiceContext'; // Import userChoice context

const TutorLLM = ({ onReceiveResponse, imageInterpretationProp, transcript }) => {
  const [loading, setLoading] = useState(false);
  const { interpretation: imageInterpretation } = useLetMeGuess();
  const { userChoice } = useUserChoice(); // Get userChoice from context
  
  // Function to get stored context from sessionStorage
  const getStoredContext = () => {
    const storedContext = sessionStorage.getItem('llmContext');
    return storedContext ? JSON.parse(storedContext) : [];
  };

  // Function to store context in sessionStorage
  const storeContext = (newEntry) => {
    const currentContext = getStoredContext();
    currentContext.push(newEntry);
    sessionStorage.setItem('llmContext', JSON.stringify(currentContext));
  };

  // Function to synthesize speech using LMNT API
  const synthesizeSpeech = async (text) => {
    try {
      const response = await fetch('https://api.lmnt.com/v1/speech/synthesize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer 49b28702d914443b9f4ea86a181621d7`, // Replace with your LMNT API key
        },
        body: JSON.stringify({
          voice: "lily", // Specify the desired voice
          text: text,
        }),
      });

      const data = await response.json();
      if (data.audio_url) {
        const audio = new Audio(data.audio_url); // Create an audio object with the returned URL
        audio.play(); // Play the synthesized speech
      } else {
        console.error('No audio URL found in the response');
      }
    } catch (error) {
      console.error('Error interacting with LMNT API for speech synthesis', error);
    }
  };

  useEffect(() => {
    if (transcript || imageInterpretation) {
        askLLM(); // Call the LLM when relevant data changes
    }
  }, [transcript, imageInterpretation]);

  // Generate a context-aware prompt that includes previous interactions
  const generatePrompt = () => {
    const context = getStoredContext();
    const previousMessages = context.length > 0 
      ? context.map((entry, index) => `Interaction ${index + 1}: ${entry}`).join('\n') 
      : "No prior interactions.";
  
    // Add an instruction for the LLM to deduce what the user wants to draw
    let prompt = `The user is a child learning to draw basic stick diagrams and shapes. You dont know colors and cant distinguish them. Respond with a friendly, supportive tone. Use the provided transcript to deduce what the user wants to draw, even if the transcript is a sentence. Provide feedback based on the drawing analysis or the inferred object. Your response is limited to 250 characters maximum`;
  
    if (transcript && !imageInterpretation) {
      // Only transcript is provided, LLM must deduce what the user wants to draw
      prompt += `
  1. The user said: "${transcript}". Based on this, deduce what the user wants to draw and encourage them to start drawing. Example: "It sounds like you want to draw a [inferred object]. Let's get started by making the first line, and I’ll help you from there!"`;
    } else if (!transcript && imageInterpretation) {
      // Only drawing is provided
      prompt += `
  2. Wow, this drawing looks fantastic! The ${imageInterpretation} shows great effort. Can you tell me what you're drawing? I'd love to help you improve it even more!`;
    } else if (transcript && imageInterpretation) {
      // Both transcript and drawing are provided, LLM deduces intent from transcript
      prompt += `
  3. The user said: "${transcript}" and submitted a drawing. Deduce what the user wants to draw and provide feedback based on both the drawing and the inferred object. Example: "It looks like you’re drawing a [inferred object] based on what you said. The drawing shows great effort! The ${imageInterpretation} shows a few areas to improve—let's smooth out this part to make it look even more like a [inferred object]. Keep going, you're doing fantastic!"`;
    } else {
      // Neither transcript nor drawing is provided
      prompt += `
  4. What would you like to draw today? You can tell me or start drawing, and I’ll help you along the way. Let’s create something amazing together!`;
    }
  
    return prompt;
  };

  const askLLM = async () => {
    if (!transcript && !imageInterpretation) return; // Prevent API call if both are empty

    setLoading(true);
    try {
      const prompt = generatePrompt(); // Generate a single prompt based on available data
      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer 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`, // API key
        },
        body: JSON.stringify({
          model: 'llama3-groq-70b-8192-tool-use-preview', // Groq model ID
          messages: [
            { role: 'system', content: 'You are a helpful and encouraging drawing tutor for kids.' },
            { role: 'user', content: prompt }, // Send the context-aware prompt
          ],
          max_tokens: 150, // Adjust max_tokens if needed
          temperature: 0.7, // Controls randomness
        }),
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        const llmResponse = data.choices[0].message.content;
        onReceiveResponse(llmResponse); // Send response back
        storeContext(llmResponse); // Store the response in sessionStorage for future context
        
        // Now synthesize speech with the LLM response
        synthesizeSpeech(llmResponse);
      } else {
        console.error('No message content found in the response');
      }
    } catch (error) {
      console.error('Error interacting with Groq API', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button 
        onClick={askLLM} 
        disabled={loading || (!imageInterpretation && !transcript)} 
        className="button"
      >
        {loading ? "Asking LLM..." : "Ask Tutor"}
      </button>
    </div>
  );
};

export default TutorLLM;
