import React, { createContext, useContext, useState } from 'react';
import { api } from '../services/dataService';
import type { AiLog } from '../types';

export type AIOrbState = 'idle' | 'thinking' | 'streaming' | 'completed';

interface AIContextType {
  orbState: AIOrbState;
  setOrbState: (state: AIOrbState) => void;
  aiLogs: Record<string, AiLog[]>; // mapped by enquiryId
  isLoadingLogs: boolean;
  
  // AI triggers
  runSummarizer: (enquiryId: string) => Promise<AiLog>;
  runLeadScoring: (enquiryId: string) => Promise<AiLog>;
  runSuggestions: (enquiryId: string) => Promise<AiLog>;
  runFollowUpGenerator: (enquiryId: string) => Promise<AiLog>;
  
  // Stream simulation helper
  streamText: (fullText: string, onUpdate: (text: string) => void) => Promise<void>;
}

const AIContext = createContext<AIContextType | undefined>(undefined);

export const AIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [orbState, setOrbState] = useState<AIOrbState>('idle');
  const [aiLogs, setAiLogs] = useState<Record<string, AiLog[]>>({});
  const [isLoadingLogs] = useState(false);


  // Helper to simulate typing streaming text
  const streamText = async (fullText: string, onUpdate: (text: string) => void) => {
    setOrbState('streaming');
    const words = fullText.split(' ');
    let currentText = '';
    
    for (let i = 0; i < words.length; i++) {
      currentText += words[i] + ' ';
      onUpdate(currentText);
      // spring speed curve for luxury feel
      const latency = Math.random() * 40 + 20; 
      await new Promise(resolve => setTimeout(resolve, latency));
    }
    
    setOrbState('completed');
    setTimeout(() => setOrbState('idle'), 2000);
  };

  const executeAiCall = async (enquiryId: string, type: AiLog['promptType']) => {
    setOrbState('thinking');
    try {
      const result = await api.generateAiResponse(enquiryId, type);
      
      // Update local logs state
      setAiLogs(prev => {
        const currentList = prev[enquiryId] || [];
        return {
          ...prev,
          [enquiryId]: [result, ...currentList]
        };
      });
      
      setOrbState('completed');
      setTimeout(() => setOrbState('idle'), 2000);
      return result;
    } catch (e) {
      setOrbState('idle');
      throw e;
    }
  };

  const runSummarizer = (enquiryId: string) => executeAiCall(enquiryId, 'summarizer');
  const runLeadScoring = (enquiryId: string) => executeAiCall(enquiryId, 'scoring');
  const runSuggestions = (enquiryId: string) => executeAiCall(enquiryId, 'suggestions');
  const runFollowUpGenerator = (enquiryId: string) => executeAiCall(enquiryId, 'follow_up');

  return (
    <AIContext.Provider value={{
      orbState,
      setOrbState,
      aiLogs,
      isLoadingLogs,
      runSummarizer,
      runLeadScoring,
      runSuggestions,
      runFollowUpGenerator,
      streamText
    }}>
      {children}
    </AIContext.Provider>
  );
};

export const useAI = () => {
  const context = useContext(AIContext);
  if (!context) throw new Error('useAI must be used within a AIProvider');
  return context;
};
