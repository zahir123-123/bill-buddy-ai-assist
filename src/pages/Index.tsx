
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Package, BarChart4, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import VoiceAssistant from "@/components/VoiceAssistant";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const [assistantActive, setAssistantActive] = useState(false);
  const navigate = useNavigate();
  
  const {
    transcript,
    interimTranscript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport
  } = useSpeechRecognition();

  // Handle command processing
  const handleCommandReceived = (command: string) => {
    if (command === "create_sale") {
      navigate("/sell-products");
    } else if (command === "generate_bill") {
      // This would be handled in the SellProducts page
      toast.success("Bill generation started");
    }
  };

  const handleActivateAssistant = () => {
    setAssistantActive(true);
    setTimeout(() => {
      if (hasRecognitionSupport) {
        startListening();
      } else {
        toast.error("Speech recognition is not supported in your browser");
      }
    }, 500);
  };

  const handleCloseAssistant = () => {
    stopListening();
    resetTranscript();
    setAssistantActive(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">Bill Buddy AI</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your intelligent sales assistant
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
            <Package className="h-12 w-12 mb-4 text-blue-500" />
            <h2 className="text-xl font-semibold mb-2">Products</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Manage your product inventory
            </p>
            <Button>View Products</Button>
          </Card>
          
          <Card className="p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate("/sell-products")}>
            <BarChart4 className="h-12 w-12 mb-4 text-green-500" />
            <h2 className="text-xl font-semibold mb-2">Sales</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Create new bills and manage sales
            </p>
            <Button>Create Bill</Button>
          </Card>
          
          <Card className="p-6 flex flex-col items-center justify-center text-center hover:shadow-md transition-shadow">
            <Settings className="h-12 w-12 mb-4 text-purple-500" />
            <h2 className="text-xl font-semibold mb-2">Settings</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Configure your application
            </p>
            <Button>Open Settings</Button>
          </Card>
        </div>

        <div className="text-center">
          <div 
            className={cn(
              "inline-flex items-center justify-center p-3 rounded-full cursor-pointer transition-all",
              "bg-assistant-purple text-white shadow-lg hover:shadow-xl",
              "hover:scale-105 active:scale-95"
            )}
            onClick={handleActivateAssistant}
          >
            <Mic className="h-6 w-6" />
            <span className="ml-2 font-medium">Ask Assistant</span>
          </div>
          
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            Try saying: "Create Bill" or "Sell Product" to create a new sale
          </p>
        </div>
      </div>

      <VoiceAssistant 
        isActive={assistantActive}
        isListening={isListening}
        startListening={startListening}
        stopListening={stopListening}
        onCommand={handleCommandReceived}
        onClose={handleCloseAssistant}
        transcript={transcript}
        interimTranscript={interimTranscript}
      />
    </div>
  );
};

export default Index;
