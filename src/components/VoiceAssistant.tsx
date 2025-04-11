
import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Form field types for the conversation flow
type FormField = "customer_name" | "vehicle_info" | "product_search" | "add_product" | "confirm_bill";

interface VoiceAssistantProps {
  onCommand: (command: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  isActive: boolean;
  onClose: () => void;
  transcript: string;
  interimTranscript?: string;
  // New props for form filling
  onFieldUpdate?: (field: FormField, value: string) => void;
  onProductSearch?: (query: string) => void;
  onProductSelect?: (index: number) => void;
  searchResults?: any[];
}

const VoiceAssistant = ({
  onCommand,
  isListening,
  startListening,
  stopListening,
  isActive,
  onClose,
  transcript,
  interimTranscript = "",
  onFieldUpdate,
  onProductSearch,
  onProductSelect,
  searchResults = []
}: VoiceAssistantProps) => {
  const [showWaveAnimation, setShowWaveAnimation] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState("How can I help you?");
  const [processingCommand, setProcessingCommand] = useState(false);
  const [activeField, setActiveField] = useState<FormField | null>(null);
  const [conversationStep, setConversationStep] = useState<number>(0);
  const [isThinking, setIsThinking] = useState(false);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const navigate = useNavigate();
  
  // Initialize speech synthesis
  useEffect(() => {
    if (typeof window !== "undefined") {
      synthRef.current = window.speechSynthesis;
      utteranceRef.current = new SpeechSynthesisUtterance();
      utteranceRef.current.rate = 1;
      utteranceRef.current.pitch = 1;
      utteranceRef.current.volume = 1;
    }

    return () => {
      if (synthRef.current && synthRef.current.speaking) {
        synthRef.current.cancel();
      }
    };
  }, []);

  // Speak messages
  const speak = (text: string) => {
    if (!synthRef.current || !utteranceRef.current) return;
    
    // Cancel any ongoing speech
    if (synthRef.current.speaking) {
      synthRef.current.cancel();
    }

    utteranceRef.current.text = text;
    synthRef.current.speak(utteranceRef.current);
  };

  // Update UI when listening state changes
  useEffect(() => {
    if (isListening) {
      setShowWaveAnimation(true);
      if (!activeField) {
        setAssistantMessage("Listening...");
      }
    } else {
      const timeout = setTimeout(() => {
        setShowWaveAnimation(false);
      }, 300);
      
      if (!processingCommand && !activeField) {
        setAssistantMessage("How can I help you?");
      }
      
      return () => clearTimeout(timeout);
    }
  }, [isListening, processingCommand, activeField]);

  // Process transcript when listening
  useEffect(() => {
    if (!isListening || !transcript) return;
    
    const lowerTranscript = transcript.toLowerCase();
    
    // If we're in conversation mode
    if (activeField) {
      handleConversationInput(lowerTranscript);
      return;
    }
    
    // Check for bill creation commands
    if (lowerTranscript.includes("bill banao") || 
        lowerTranscript.includes("create bill") || 
        lowerTranscript.includes("sell product") ||
        lowerTranscript.includes("create a sell bill") ||
        lowerTranscript.includes("sell bill")) {
      
      stopListening();
      setProcessingCommand(true);
      setAssistantMessage("Creating a new bill. Let me take you to the sales page.");
      speak("Creating a new bill. Let me take you to the sales page.");
      
      setTimeout(() => {
        navigate("/sell-products?assistant=true");
        setProcessingCommand(false);
      }, 2500);
    }
  }, [transcript, isListening, stopListening, onCommand, navigate, onClose, activeField]);

  const startConversationFlow = () => {
    setActiveField("customer_name");
    setConversationStep(1);
    setAssistantMessage("What is the customer's name?");
    speak("What is the customer's name?");
    startListening();
  };

  const handleConversationInput = (input: string) => {
    if (!activeField) return;
    
    setIsThinking(true);
    stopListening();
    
    setTimeout(() => {
      setIsThinking(false);
      
      switch (activeField) {
        case "customer_name":
          handleCustomerName(input);
          break;
        case "vehicle_info":
          handleVehicleInfo(input);
          break;
        case "product_search":
          handleProductSearch(input);
          break;
        case "add_product":
          handleProductSelection(input);
          break;
        case "confirm_bill":
          handleBillConfirmation(input);
          break;
      }
    }, 1000);
  };

  const handleCustomerName = (name: string) => {
    // Skip prefix words if any
    const cleanName = name.replace(/^(name is|this is|it's|its|the name is|customer name is|customer is|customer|name|my name is)\s+/i, "");
    
    if (onFieldUpdate) {
      onFieldUpdate("customer_name", cleanName);
    }
    
    setAssistantMessage(`Customer name set to ${cleanName}. What is the vehicle information?`);
    speak(`Customer name set to ${cleanName}. What is the vehicle information?`);
    setActiveField("vehicle_info");
    setConversationStep(2);
    startListening();
  };

  const handleVehicleInfo = (info: string) => {
    // Skip prefix words if any
    const cleanInfo = info.replace(/^(vehicle is|it's|its|the vehicle is|vehicle info is|vehicle information is|vehicle|info|information)\s+/i, "");
    
    if (onFieldUpdate) {
      onFieldUpdate("vehicle_info", cleanInfo);
    }
    
    setAssistantMessage(`Vehicle information set to ${cleanInfo}. What product would you like to add?`);
    speak(`Vehicle information set to ${cleanInfo}. What product would you like to add?`);
    setActiveField("product_search");
    setConversationStep(3);
    startListening();
  };

  const handleProductSearch = (product: string) => {
    // Skip prefix words if any
    const cleanProduct = product.replace(/^(product is|it's|its|the product is|product name is|name is|search for|find|look for|product)\s+/i, "");
    
    if (onProductSearch) {
      onProductSearch(cleanProduct);
    }
    
    setAssistantMessage(`Searching for ${cleanProduct}...`);
    speak(`Searching for ${cleanProduct}`);
    
    // After search results are available (handled by parent component)
    setTimeout(() => {
      if (searchResults && searchResults.length > 0) {
        setActiveField("add_product");
        setAssistantMessage("I found some products. Which one would you like to add?");
        speak("I found some products. Which one would you like to add?");
        startListening();
      } else {
        setAssistantMessage("I couldn't find any products matching that description. Please try another search.");
        speak("I couldn't find any products matching that description. Please try another search.");
        setActiveField("product_search");
        startListening();
      }
    }, 1500);
  };

  const handleProductSelection = (selection: string) => {
    let selectedIndex = -1;
    
    // Try to extract a number from the selection
    const numberMatch = selection.match(/\b(first|1st|one|second|2nd|two|third|3rd|three|fourth|4th|four|fifth|5th|five)\b|(\d+)/i);
    
    if (numberMatch) {
      const match = numberMatch[0].toLowerCase();
      switch (match) {
        case "first":
        case "1st":
        case "one":
          selectedIndex = 0;
          break;
        case "second":
        case "2nd":
        case "two":
          selectedIndex = 1;
          break;
        case "third":
        case "3rd":
        case "three":
          selectedIndex = 2;
          break;
        case "fourth":
        case "4th":
        case "four":
          selectedIndex = 3;
          break;
        case "fifth":
        case "5th":
        case "five":
          selectedIndex = 4;
          break;
        default:
          // Try to parse direct number
          const num = parseInt(match, 10);
          if (!isNaN(num) && num > 0 && num <= searchResults.length) {
            selectedIndex = num - 1; // Convert to 0-based index
          }
      }
    }
    
    if (selectedIndex >= 0 && selectedIndex < searchResults.length) {
      if (onProductSelect) {
        onProductSelect(selectedIndex);
      }
      
      const productName = searchResults[selectedIndex]?.product_name || "product";
      
      setAssistantMessage(`Added ${productName} to the cart. Would you like to add another product?`);
      speak(`Added ${productName} to the cart. Would you like to add another product?`);
      setActiveField("confirm_bill");
      setConversationStep(4);
      startListening();
    } else {
      setAssistantMessage("I'm not sure which product you meant. Please try again, saying first, second, etc.");
      speak("I'm not sure which product you meant. Please try again, saying first, second, etc.");
      startListening();
    }
  };

  const handleBillConfirmation = (response: string) => {
    if (response.match(/\b(yes|yeah|yep|sure|ok|okay|of course|certainly|add|more)\b/i)) {
      setAssistantMessage("What product would you like to add next?");
      speak("What product would you like to add next?");
      setActiveField("product_search");
      setConversationStep(3);
      startListening();
    } else if (response.match(/\b(no|nope|done|finish|complete|generate|create bill)\b/i)) {
      setAssistantMessage("Generating the bill now...");
      speak("Generating the bill now");
      // Trigger bill generation
      if (onCommand) {
        onCommand("generate_bill");
      }
      // Reset conversation
      setActiveField(null);
      setConversationStep(0);
      setTimeout(() => {
        setAssistantMessage("How can I help you?");
      }, 2000);
    } else {
      setAssistantMessage("Please say yes to add more products or no to generate the bill.");
      speak("Please say yes to add more products or no to generate the bill.");
      startListening();
    }
  };

  // Add this effect to automatically start the conversation flow when opened from a URL param
  useEffect(() => {
    if (isActive && conversationStep === 0 && !activeField) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('assistant') === 'true') {
        // Give a small delay before starting the conversation
        setTimeout(() => {
          startConversationFlow();
        }, 1000);
      }
    }
  }, [isActive, conversationStep, activeField]);

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
      <div className="bg-assistant-darkPurple rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        <div className="flex justify-end p-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-white hover:bg-white/10"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="px-6 pb-8 pt-2 flex flex-col items-center">
          <div className="relative flex justify-center my-8">
            {/* Siri-like animation */}
            <div className="absolute inset-0 flex items-center justify-center">
              {(isListening || isThinking) && (
                <>
                  <div className="absolute w-28 h-28 rounded-full bg-assistant-purple/20 animate-pulse"></div>
                  <div className="absolute w-24 h-24 rounded-full bg-assistant-purple/30 animate-pulse-ring" style={{ animationDelay: "0.2s" }}></div>
                </>
              )}
            </div>
            
            {/* Center button */}
            <button
              onClick={isListening ? stopListening : startListening}
              className={cn(
                "relative z-10 w-20 h-20 rounded-full flex items-center justify-center shadow-lg transform transition-transform duration-300",
                (isListening || isThinking) ? "bg-assistant-purple scale-110" : "bg-gray-700 hover:scale-105"
              )}
            >
              {isListening ? (
                <MicOff className="h-8 w-8 text-white" />
              ) : (
                <Mic className="h-8 w-8 text-white" />
              )}
            </button>
          </div>
          
          {(showWaveAnimation || isThinking) && (
            <div className="flex justify-center space-x-1 h-12 items-center my-2">
              {[1, 2, 3, 4, 5, 6, 7].map((num) => (
                <div
                  key={num}
                  className="w-1.5 bg-assistant-purple rounded-full animate-bounce"
                  style={{ 
                    height: `${Math.max(8, Math.min(32, 10 + num * 3))}px`,
                    animationDelay: `${num * 0.1}s`,
                    animationDuration: "0.8s"
                  }}
                />
              ))}
            </div>
          )}
          
          <div className="text-center mt-2">
            <h3 className="text-xl font-medium text-white mb-2">
              {assistantMessage}
            </h3>
            <p className="text-white/70 text-sm min-h-[48px]">
              {conversationStep > 0 ? 
                (isListening ? (interimTranscript || "Listening...") : 
                  (transcript || "Waiting for your response...")) 
                : "Try saying: 'Create bill' or 'Sell product'"}
            </p>
            
            {/* Display search results if available */}
            {activeField === "add_product" && searchResults.length > 0 && (
              <div className="mt-4 space-y-2 text-left max-h-60 overflow-y-auto">
                {searchResults.map((product, index) => (
                  <div 
                    key={index}
                    className="flex items-center p-2 rounded bg-white/10 text-white"
                  >
                    <span className="font-bold mr-2">{index + 1}.</span>
                    <div className="flex-1">
                      <p className="font-medium">{product.product_name}</p>
                      <p className="text-xs opacity-70">{product.product_model}</p>
                    </div>
                    <span className="font-semibold">₹{product.selling_price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
