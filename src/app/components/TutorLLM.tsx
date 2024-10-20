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
    return [];
    return storedContext ? JSON.parse(storedContext) : [];
  };

  // Function to store context in sessionStorage
  const storeContext = (newEntry) => {
    const currentContext = getStoredContext();
    currentContext.push(newEntry);
    sessionStorage.setItem('llmContext', JSON.stringify(currentContext));
  };
  //disable drawing when speaking
  //extra condition/context for llm when no drawing was made

  // Generate a context-aware prompt that includes previous interactions
  const generatePrompt = () => {
    const context = getStoredContext();
    const previousMessages = context.length > 0 
      ? context.map((entry, index) => `Interaction ${index + 1}: ${entry}`).join('\n') 
      : "No prior interactions.";

      console.log("userChoicennnnnnnnnnn", transcript)

    return  `Refer to following transcript "${transcript}" to figure out what the user wants to draw and consider it as userchoice.
    note below values for reference prevmessages = ${previousMessages}, interpretation = ${imageInterpretation}.
    Using the previous conversation context provided in "prevmessages," review the child's drawing of a shape based on what they intended to draw ("userchoice") and how it was captured ("interpretation"). Your response should be encouraging, highlighting both the similarities and any differences between the child's drawing and the intended shape. Provide suggestions for improvement in a fun and light-hearted way, while being careful not to sound too strict or critical. The goal is to inspire the child to try again with enthusiasm.

Instructions:
Begin by acknowledging and praising the child's effort, mentioning parts of the drawing that are close to "userchoice."
Mention the differences between the drawing ("interpretation") and the intended shape, but keep it playful and supportive.
Offer one or two friendly suggestions for improvement, focusing on making the drawing more similar to the intended shape in an easy-to-follow way.
Use language thats positive, fun, and motivating to keep the child engaged.
Example:

"You've drawn a {userchoice}, and it looks so creative! I can see you really tried to get the shape right. The top part looks almost exactly like a {userchoice}—great job! Its a little different down here, where the line is more wavy than usual. But guess what? Thats okay! To make it even more like a {userchoice}, we could try making this part a little smoother. You're doing such a fantastic job—keep going, and lets see how you can make it even better!"


         ` ;
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

    if (transcript || imageInterpretation) {
      askLLM(); // Call the LLM when relevant data changes
    }
  }, [transcript, imageInterpretation]);

  return (
    <div>
      <button 
        onClick={askLLM} 
        disabled={loading || (!imageInterpretation && !transcript)} 
        className="button"
      >
        {loading ? "Asking LLM..." : ""}
      </button>
    </div>
  );
};

export default TutorLLM;