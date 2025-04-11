
import { useState, useEffect, useCallback } from "react";

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  hasRecognitionSupport: boolean;
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [hasRecognitionSupport, setHasRecognitionSupport] = useState(false);

  useEffect(() => {
    // Check if browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setHasRecognitionSupport(true);
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setTranscript(transcript);
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        stopListening();
      };
      
      recognitionInstance.onend = () => {
        if (isListening) {
          recognitionInstance.start();
        }
      };
      
      setRecognition(recognitionInstance);
    }
    
    // Cleanup
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognition) return;
    
    setIsListening(true);
    setTranscript("");
    
    try {
      recognition.start();
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (!recognition) return;
    
    setIsListening(false);
    
    try {
      recognition.stop();
    } catch (error) {
      console.error('Failed to stop recognition:', error);
    }
  }, [recognition]);

  const resetTranscript = useCallback(() => {
    setTranscript("");
  }, []);

  return {
    transcript,
    isListening,
    startListening,
    stopListening,
    resetTranscript,
    hasRecognitionSupport
  };
}
