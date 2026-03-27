import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSpeechRecognitionProps {
  onResult: (text: string) => void;
  lang?: string;
  continuous?: boolean;
}

export const useSpeechRecognition = ({ onResult, lang = 'en-US', continuous = false }: UseSpeechRecognitionProps) => {
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recognition, setRecognition] = useState<any>(null);
  const onResultRef = useRef(onResult);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setError('Speech recognition is not supported in this browser.');
      return;
    }

    const recognitionInstance = new SpeechRecognition();

    recognitionInstance.continuous = continuous;
    recognitionInstance.interimResults = true;
    recognitionInstance.lang = lang;

    recognitionInstance.onstart = () => {
      setIsListening(true);
      setError(null);
    };

    recognitionInstance.onend = () => {
      setIsListening(false);
    };

    recognitionInstance.onerror = (event: any) => {
      setError(event.error);
      setIsListening(false);
    };

    recognitionInstance.onresult = (event: any) => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        onResultRef.current(finalTranscript);
      }
    };

    setRecognition(recognitionInstance);
  }, [continuous, lang]);

  const startListening = useCallback(() => {
    if (recognition) {
      try {
        recognition.start();
      } catch (e) {
        console.error("Speech recognition already started");
      }
    }
  }, [recognition]);

  const stopListening = useCallback(() => {
    if (recognition) {
      recognition.stop();
    }
  }, [recognition]);

  return { isListening, error, startListening, stopListening };
};
