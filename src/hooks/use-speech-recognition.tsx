
import { useState, useEffect, useCallback } from "react";

interface SpeechRecognitionHook {
  transcript: string;
  isListening: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  hasRecognitionSupport: boolean;
}

// Define types for the Web Speech API
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
        confidence: number;
      };
      isFinal: boolean;
    };
  };
}

// Define window with the speech recognition properties
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition(): SpeechRecognitionHook {
  const [transcript, setTranscript] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [hasRecognitionSupport, setHasRecognitionSupport] = useState(false);

  useEffect(() => {
    // Check if browser supports SpeechRecognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (SpeechRecognition) {
      setHasRecognitionSupport(true);
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      
      recognitionInstance.onresult = (event: SpeechRecognitionEvent) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        const confidence = event.results[current][0].confidence;
        
        console.log("Speech recognized:", transcript, "Confidence:", confidence);
        
        if (event.results[current].isFinal || confidence > 0.7) {
          setTranscript(transcript);
        }
      };
      
      recognitionInstance.onerror = (event: any) => {
        console.error('Speech recognition error', event);
        if (event.error === 'no-speech') {
          console.log("No speech detected");
        }
        stopListening();
      };
      
      recognitionInstance.onend = () => {
        if (isListening) {
          console.log("Recognition ended but still listening, restarting...");
          recognitionInstance.start();
        } else {
          console.log("Recognition ended");
        }
      };
      
      setRecognition(recognitionInstance);
    } else {
      console.warn("Speech recognition not supported");
    }
    
    // Cleanup
    return () => {
      if (recognition) {
        recognition.stop();
      }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognition) {
      console.warn("Speech recognition not initialized");
      return;
    }
    
    setIsListening(true);
    setTranscript("");
    
    try {
      recognition.start();
      console.log("Speech recognition started");
    } catch (error) {
      console.error('Failed to start recognition:', error);
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (!recognition) {
      console.warn("Speech recognition not initialized");
      return;
    }
    
    setIsListening(false);
    
    try {
      recognition.stop();
      console.log("Speech recognition stopped");
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
