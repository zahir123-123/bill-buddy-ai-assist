
import { useState, useEffect, useRef } from "react";
import { Mic, MicOff, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

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

  useEffect(() => {
    if (isListening) {
      setShowWaveAnimation(true);
    } else {
      const timeout = setTimeout(() => {
        setShowWaveAnimation(false);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isListening]);

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
            {/* Pulsating ring animation */}
            <div className={cn(
              "absolute w-28 h-28 rounded-full",
              isListening ? "bg-assistant-purple/30 animate-pulse-ring" : "bg-gray-600/20"
            )} />
            
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
              {[1, 2, 3, 4, 5].map((num) => (
                <div
                  key={num}
                  className={`w-1.5 bg-assistant-purple rounded-full animate-wave-${num} h-8`}
                  style={{ transformOrigin: "bottom" }}
                />
              ))}
            </div>
          )}
          
          <div className="text-center mt-2">
            <h3 className="text-xl font-medium text-white mb-2">
              {isListening ? "Listening..." : "How can I help you?"}
            </h3>
            <p className="text-white/70 text-sm min-h-[48px]">
              {transcript || "Try saying: 'Sell bill' to create a new sale"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
