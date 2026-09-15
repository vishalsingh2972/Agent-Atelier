'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AskAIContextType {
  isPanelOpen: boolean;
  openPanel: () => void;
  closePanel: () => void;
  togglePanel: () => void;
}

const AskAIContext = createContext<AskAIContextType | undefined>(undefined);

export function AskAIProvider({ children }: { children: React.ReactNode }) {
  const [isPanelOpen, setIsPanelOpen] = useState(false);

  const openPanel = useCallback(() => setIsPanelOpen(true), []);
  const closePanel = useCallback(() => setIsPanelOpen(false), []);
  const togglePanel = useCallback(() => setIsPanelOpen((prev) => !prev), []);

  // Listen to global CustomEvents so anything (tools, buttons, hotkeys) can trigger it
  useEffect(() => {
    const handleOpen = () => setIsPanelOpen(true);
    const handleClose = () => setIsPanelOpen(false);
    const handleToggle = () => setIsPanelOpen((prev) => !prev);

    window.addEventListener('open-ask-ai', handleOpen);
    window.addEventListener('close-ask-ai', handleClose);
    window.addEventListener('toggle-ask-ai', handleToggle);

    return () => {
      window.removeEventListener('open-ask-ai', handleOpen);
      window.removeEventListener('close-ask-ai', handleClose);
      window.removeEventListener('toggle-ask-ai', handleToggle);
    };
  }, []);

  return (
    <AskAIContext.Provider value={{ isPanelOpen, openPanel, closePanel, togglePanel }}>
      {children}
    </AskAIContext.Provider>
  );
}

export function useAskAI() {
  const context = useContext(AskAIContext);
  if (!context) {
    throw new Error('useAskAI must be used within an AskAIProvider');
  }
  return context;
}
