
import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface VoiceAssistantProps {
  onCommand: (command: string) => void;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  isActive: boolean;
  onClose: () => void;
  transcript: string;
}

const VoiceAssistant = ({
  onCommand,
  isListening,
  startListening,
  stopListening,
  isActive,
  onClose,
  transcript
}: VoiceAssistantProps) => {
  const [showWaveAnimation, setShowWaveAnimation] = useState(false);
  const [assistantMessage, setAssistantMessage] = useState("How can I help you?");
  const [processingCommand, setProcessingCommand] = useState(false);
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
      setAssistantMessage("Listening...");
      speak("Listening...");
    } else {
      const timeout = setTimeout(() => {
        setShowWaveAnimation(false);
      }, 300);
      
      if (!processingCommand) {
        setAssistantMessage("How can I help you?");
      }
      
      return () => clearTimeout(timeout);
    }
  }, [isListening, processingCommand]);

  // Process transcript when listening
  useEffect(() => {
    if (isListening && transcript) {
      const lowerTranscript = transcript.toLowerCase();
      
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
          navigate("/sell-products");
          onClose();
          setProcessingCommand(false);
          toast.success("Sales page opened successfully");
        }, 2500);
      }
    }
  }, [transcript, isListening, stopListening, onCommand, navigate, onClose]);

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
              {isListening && (
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
                isListening ? "bg-assistant-purple scale-110" : "bg-gray-700 hover:scale-105"
              )}
            >
              {isListening ? (
                <MicOff className="h-8 w-8 text-white" />
              ) : (
                <Mic className="h-8 w-8 text-white" />
              )}
            </button>
          </div>
          
          {showWaveAnimation && (
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
              {transcript || "Try saying: 'Create bill' or 'Sell product'"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
