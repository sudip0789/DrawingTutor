import { useLetMeGuess } from "@/providers/let-me-guess-provider";
import { useState, useEffect } from "react";
import { useUserChoice } from '../context/UserChoiceContext'; // Import userChoice context

const TutorLLM = ({ onReceiveResponse, imageInterpretationProp }) => {
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

  // Generate a context-aware prompt that includes previous interactions
  const generatePrompt = () => {
    const context = getStoredContext();
    const previousMessages = context.length > 0 
      ? context.map((entry, index) => `Interaction ${index + 1}: ${entry}`).join('\n') 
      : "No prior interactions.";

    return `
      You are a helpful drawing tutor for kids. 
      The child is interacting with you and wants to draw: "${userChoice || "something"}".
      Their drawing was interpreted by the vision system as: "${imageInterpretation || "no specific drawing"}". 
      Previous interactions: ${previousMessages}.
      Based on this, provide feedback or suggest improvements for their drawing to make ${imageInterpretation} look more like ${userChoice}, or offer new ideas if the child is unsure.
      Encourage them, and keep the interaction child-friendly and engaging.
      If the ${userChoice} is the same as ${imageInterpretation}, congratulate them and ask if they want to draw something else.
      Keep the response under 250 characters.
    `;
  };

  const askLLM = async () => {
    if (!userChoice && !imageInterpretation) return; // Prevent API call if both are empty

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
          model: 'llama3-8b-8192', // Groq model ID
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
      } else {
        console.error('No message content found in the response');
      }
    } catch (error) {
      console.error('Error interacting with Groq API', error);
    } finally {
      setLoading(false);
    }
  };

  // Automatically call the API when either imageInterpretation or userChoice changes
  useEffect(() => {
    if (userChoice || imageInterpretation) {
      askLLM(); // Call the LLM when relevant data changes
    }
  }, [userChoice, imageInterpretation]);

  return (
    <div>
      <button 
        onClick={askLLM} 
        disabled={loading || (!imageInterpretation && !userChoice)} 
        className="button"
      >
        {loading ? "Asking LLM..." : "Ask Tutor for Feedback"}
      </button>
    </div>
  );
};

export default TutorLLM;
