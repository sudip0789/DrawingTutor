import { createContext, useContext, useState } from "react";

// Create the context for userChoice
const UserChoiceContext = createContext<any>(null);

// Create a custom hook to use the context
export const useUserChoice = () => {
  const context = useContext(UserChoiceContext);
  if (!context) {
    throw new Error("useUserChoice must be used within a UserChoiceProvider");
  }
  return context;
};

// Create the provider component
export const UserChoiceProvider = ({ children }: { children: React.ReactNode }) => {
  const [userChoice, setUserChoice] = useState<string>("");

  return (
    <UserChoiceContext.Provider value={{ userChoice, setUserChoice }}>
      {children}
    </UserChoiceContext.Provider>
  );
};
