'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import '@/styles/askai.css';
import ChatMessage from './ChatMessage';
import { useAskAI } from '@/context/AskAIContext';
import {
  Sparkles,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Settings,
  Trash2,
  X,
  Radio,
  HelpCircle,
  Square,
} from 'lucide-react';
import type {
  ChatMessage as ChatMessageType,
  AgentConfig,
  ConfirmationRequest,
  ToolAction,
} from '@/lib/askai/types';
import {
  runAgentTurn,
  executeConfirmedAction,
  chatMessagesToGeminiContents,
} from '@/lib/askai/agentController';

export default function AskAIPanel() {
  const { isPanelOpen, closePanel } = useAskAI();

  const [showSettings, setShowSettings] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('https://generativelanguage.googleapis.com/v1beta');
  const [model, setModel] = useState('gemini-2.0-flash');
  const [messages, setMessages] = useState<ChatMessageType[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('Thinking...');
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmationRequest | null>(null);

  // Voice & Speech States
  const [isListening, setIsListening] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(true);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [voiceReply, setVoiceReply] = useState(false);
  const [autoSendVoice, setAutoSendVoice] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Persistent ref to avoid stale closure issues during async turn execution
  const voiceReplyRef = useRef(false);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load saved API key & preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedKey = localStorage.getItem('agentbridge_gemini_api_key');
      if (savedKey) setApiKey(savedKey);

      const savedModel = localStorage.getItem('agentbridge_gemini_model');
      if (savedModel) setModel(savedModel);

      const savedVoiceReply = localStorage.getItem('agentbridge_voice_reply');
      if (savedVoiceReply !== null) {
        const val = savedVoiceReply === 'true';
        setVoiceReply(val);
        voiceReplyRef.current = val;
      }

      // Check SpeechRecognition support
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
        setVoiceSupported(false);
      }
    }
  }, []);

  // Synchronize ref whenever state updates
  useEffect(() => {
    voiceReplyRef.current = voiceReply;
  }, [voiceReply]);

  // Stop any active SpeechSynthesis immediately
  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  }, []);

  // Save API key to localStorage when updated
  const handleApiKeyChange = (key: string) => {
    setApiKey(key);
    setError(null);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agentbridge_gemini_api_key', key);
    }
  };

  const handleModelChange = (m: string) => {
    setModel(m);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agentbridge_gemini_model', m);
    }
  };

  // Toggle voice replies on/off and immediately silence active speech if turned off
  const handleToggleVoiceReply = () => {
    const next = !voiceReply;
    setVoiceReply(next);
    voiceReplyRef.current = next;

    if (typeof window !== 'undefined') {
      localStorage.setItem('agentbridge_voice_reply', String(next));
      // If muting or speech is currently active, cancel speech immediately!
      if (!next || isSpeaking) {
        stopSpeaking();
      }
    }
  };

  // Safe Close Handler: closes drawer and silences any active speech synthesis
  const handleClose = useCallback(() => {
    stopSpeaking();
    if (recognitionRef.current && isListening) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore
      }
      setIsListening(false);
    }
    closePanel();
  }, [stopSpeaking, closePanel, isListening]);

  // Stop speaking whenever the panel is closed or on unmount
  useEffect(() => {
    if (!isPanelOpen) {
      stopSpeaking();
    }
  }, [isPanelOpen, stopSpeaking]);

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, [stopSpeaking]);

  // Close sidebar on Escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isPanelOpen) {
        handleClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isPanelOpen, handleClose]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Auto-focus input when panel opens
  useEffect(() => {
    if (isPanelOpen && apiKey) {
      setTimeout(() => inputRef.current?.focus(), 250);
    }
  }, [isPanelOpen, apiKey]);

  // Show settings on first open if no API key
  useEffect(() => {
    if (isPanelOpen && !apiKey) setShowSettings(true);
  }, [isPanelOpen, apiKey]);

  const getConfig = useCallback((): AgentConfig => ({
    apiKey,
    model,
    baseUrl,
  }), [apiKey, model, baseUrl]);

  const handleToolAction = useCallback((action: ToolAction) => {
    setLoadingText(
      action.status === 'executing'
        ? `Running ${action.name}...`
        : action.status === 'awaiting-confirmation'
          ? `Awaiting confirmation...`
          : 'Thinking...',
    );
  }, []);

  // Text-To-Speech function with strict check on voiceReplyRef to avoid stale closures
  const speakResponse = useCallback((text: string) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    // Check ref directly: if user muted or turned off voice replies, do NOT speak!
    if (!voiceReplyRef.current) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    try {
      window.speechSynthesis.cancel();

      // Strip markdown syntax, URLs, brackets for natural audio playback
      const clean = text
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/`{1,3}.*?`{1,3}/gs, '')
        .replace(/#+\s/g, '')
        .replace(/-{3,}/g, '')
        .replace(/•\s/g, '')
        .replace(/\n+/g, '. ')
        .trim();

      if (!clean) {
        setIsSpeaking(false);
        return;
      }

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };
      utterance.onend = () => {
        setIsSpeaking(false);
      };
      utterance.onerror = () => {
        setIsSpeaking(false);
      };

      // Slight timeout to ensure previous cancel queue settled in browser
      setTimeout(() => {
        if (voiceReplyRef.current && window.speechSynthesis) {
          window.speechSynthesis.speak(utterance);
        } else {
          setIsSpeaking(false);
        }
      }, 50);
    } catch {
      setIsSpeaking(false);
    }
  }, []);

  const executeTurn = async (userPrompt: string) => {
    const text = userPrompt.trim();
    if (!text || isLoading) return;
    if (!apiKey) {
      setShowSettings(true);
      setError('Please enter your Gemini API key in settings.');
      return;
    }

    // Silence any ongoing speech when sending a new prompt
    stopSpeaking();

    setError(null);
    setInput('');
    setPendingConfirmation(null);

    // Add user message
    const userMsg: ChatMessageType = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);
    setLoadingText('Thinking...');

    try {
      const history = chatMessagesToGeminiContents(messages);
      const response = await runAgentTurn(text, history, getConfig(), handleToolAction);

      const modelMsg: ChatMessageType = {
        id: `msg-${Date.now()}`,
        role: 'model',
        content: response.message,
        toolActions: response.toolActions,
        requiresConfirmation: response.requiresConfirmation,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, modelMsg]);

      // Only speak if voiceReply is still enabled
      if (response.message && voiceReplyRef.current) {
        speakResponse(response.message);
      }

      if (response.requiresConfirmation) {
        setPendingConfirmation(response.requiresConfirmation);
      }
    } catch (err: any) {
      const errorMessage = err?.message || 'An error occurred';
      if (errorMessage.includes('API key') || errorMessage.includes('401') || errorMessage.includes('403')) {
        setError('Invalid API key. Please check your Gemini API key in settings.');
        setShowSettings(true);
      } else {
        setError(errorMessage);
      }
    } finally {
      setIsLoading(false);
      setLoadingText('Thinking...');
    }
  };

  const handleSend = () => {
    executeTurn(input);
  };

  // Web Speech API: Voice Command Recognition
  const toggleVoiceRecording = () => {
    if (!voiceSupported) {
      setVoiceError('Voice input is not supported in this browser. Please use Chrome, Edge, or Safari.');
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // Ignore
        }
      }
      setIsListening(false);
      return;
    }

    stopSpeaking();
    setVoiceError(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;

    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';

    recognition.onstart = () => {
      setIsListening(true);
      setVoiceError(null);
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      const current = finalTranscript || interim;
      setInput(current);
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      if (event.error !== 'no-speech' && event.error !== 'aborted') {
        setVoiceError(`Voice error: ${event.error}`);
      }
    };

    recognition.onend = () => {
      setIsListening(false);
      if (finalTranscript.trim() && autoSendVoice) {
        executeTurn(finalTranscript);
      }
    };

    try {
      recognition.start();
    } catch (err: any) {
      setIsListening(false);
      setVoiceError(err?.message || 'Could not start voice recognition');
    }
  };

  const handleConfirm = async (confirmation: ConfirmationRequest) => {
    stopSpeaking();
    setPendingConfirmation(null);
    setIsLoading(true);
    setLoadingText(`Executing ${confirmation.toolName}...`);
    setError(null);

    try {
      const history = chatMessagesToGeminiContents(messages);
      const response = await executeConfirmedAction(confirmation, history, getConfig(), handleToolAction);

      const modelMsg: ChatMessageType = {
        id: `msg-${Date.now()}`,
        role: 'model',
        content: response.message,
        toolActions: response.toolActions,
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, modelMsg]);

      if (response.message && voiceReplyRef.current) {
        speakResponse(response.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to execute action');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelConfirmation = () => {
    stopSpeaking();
    setPendingConfirmation(null);
    const cancelMsg: ChatMessageType = {
      id: `msg-${Date.now()}`,
      role: 'model',
      content: 'Action cancelled. How else may I assist you with our atelier collection?',
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, cancelMsg]);
  };

  const handleClearChat = () => {
    stopSpeaking();
    setMessages([]);
    setPendingConfirmation(null);
    setError(null);
    setVoiceError(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (text: string) => {
    stopSpeaking();
    setInput(text);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const SUGGESTIONS = [
    'Show red tops for women',
    'Find blue t-shirts for men',
    'Compare luxury tops side-by-side',
    'What size fits a 36-inch bust?',
  ];

  if (!isPanelOpen) return null;

  return (
    <div className="askai-backdrop" onClick={handleClose}>
      <div
        className="askai-sidebar"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Ask AI Assistant Drawer"
      >
        {/* Header */}
        <div className="askai-header">
          <div className="askai-header-left">
            <div className="askai-header-icon">✦</div>
            <div>
              <div className="askai-header-title">
                Ask AI Assistant
                <span style={{ fontSize: '10px', background: 'var(--bg-surface)', color: 'var(--text-primary)', padding: '1px 6px', borderRadius: '2px', border: '1px solid var(--border-medium)' }}>
                  WebMCP
                </span>
              </div>
              <div className="askai-header-subtitle">Voice &amp; Native WebMCP Engine</div>
            </div>
          </div>

          <div className="askai-header-actions">
            {/* Voice Reply Mute / Unmute / Stop Button */}
            <button
              className={`askai-header-btn ${isSpeaking ? 'askai-header-btn--speaking' : voiceReply ? 'askai-header-btn--active' : ''}`}
              onClick={isSpeaking ? stopSpeaking : handleToggleVoiceReply}
              title={
                isSpeaking
                  ? 'Speaking now — click to silence audio immediately'
                  : voiceReply
                  ? 'Voice replies ON — click to mute'
                  : 'Voice replies MUTED — click to unmute'
              }
              aria-label={
                isSpeaking
                  ? 'Stop speaking'
                  : voiceReply
                  ? 'Mute voice audio'
                  : 'Unmute voice audio'
              }
            >
              {isSpeaking ? (
                <Volume2 size={16} />
              ) : voiceReply ? (
                <Volume2 size={16} color="var(--text-primary)" />
              ) : (
                <VolumeX size={16} color="var(--text-muted)" />
              )}
            </button>

            {/* Settings Button */}
            <button
              className={`askai-header-btn ${showSettings ? 'askai-header-btn--active' : ''}`}
              onClick={() => setShowSettings(!showSettings)}
              title="Settings"
            >
              <Settings size={16} />
            </button>

            {/* Clear Chat Button */}
            <button className="askai-header-btn" onClick={handleClearChat} title="Clear conversation">
              <Trash2 size={15} />
            </button>

            {/* Close Sidebar Button */}
            <button className="askai-header-btn" onClick={handleClose} title="Close sidebar (Esc)">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Settings / API Key Drawer */}
        {showSettings && (
          <div className="askai-settings">
            <div className="askai-settings-row">
              <label>Gemini API Key</label>
              <input
                className="askai-settings-input"
                type="password"
                placeholder="Enter Gemini API key..."
                value={apiKey}
                onChange={(e) => handleApiKeyChange(e.target.value)}
              />
            </div>
            <div className="askai-settings-row">
              <label>Model</label>
              <input
                className="askai-settings-input"
                type="text"
                placeholder="gemini-2.0-flash"
                value={model}
                onChange={(e) => handleModelChange(e.target.value)}
              />
            </div>
            <div className="askai-settings-row">
              <label>Base URL</label>
              <input
                className="askai-settings-input"
                type="text"
                placeholder="https://generativelanguage.googleapis.com/v1beta"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
            {/* Audio Replies Toggle in Settings */}
            <div className="askai-settings-row" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: '4px' }}>
              <label style={{ cursor: 'pointer' }} htmlFor="settings-voice-reply">
                Read AI responses aloud (Text-to-Speech)
              </label>
              <input
                id="settings-voice-reply"
                type="checkbox"
                checked={voiceReply}
                onChange={handleToggleVoiceReply}
                style={{ cursor: 'pointer', accentColor: 'var(--text-primary)' }}
              />
            </div>
            <div className="askai-settings-row" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <label style={{ cursor: 'pointer' }} htmlFor="auto-send-voice">
                Auto-send voice commands
              </label>
              <input
                id="auto-send-voice"
                type="checkbox"
                checked={autoSendVoice}
                onChange={(e) => setAutoSendVoice(e.target.checked)}
                style={{ cursor: 'pointer', accentColor: 'var(--text-primary)' }}
              />
            </div>
            <div className="askai-settings-hint">
              Get a free API key from{' '}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--text-primary)', fontWeight: 600, textDecoration: 'underline' }}>
                Google AI Studio
              </a>
              . Stored locally in your browser.
            </div>
          </div>
        )}

        {/* Messages List */}
        <div className="askai-messages">
          {messages.length === 0 && !isLoading ? (
            <div className="askai-empty">
              <div className="askai-empty-icon">✦</div>
              <div className="askai-empty-title">Atelier AI Stylist</div>
              <p className="askai-empty-text">
                Speak or type naturally. The assistant navigates our collections, sizing charts, comparisons, and cart via WebMCP.
              </p>

              <div className="askai-suggestions">
                <div className="askai-suggestions-label">Try asking:</div>
                {SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    className="askai-suggestion-btn"
                    onClick={() => handleSuggestion(s)}
                  >
                    <span>{s}</span>
                    <span style={{ color: 'var(--text-primary)', fontSize: '12px' }}>→</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  onConfirm={msg.requiresConfirmation && pendingConfirmation ? handleConfirm : undefined}
                  onCancel={msg.requiresConfirmation && pendingConfirmation ? handleCancelConfirmation : undefined}
                />
              ))}
            </>
          )}

          {/* Typing indicator */}
          {isLoading && (
            <div className="askai-typing">
              <div className="askai-typing-dots">
                <span className="askai-typing-dot" />
                <span className="askai-typing-dot" />
                <span className="askai-typing-dot" />
              </div>
              <span className="askai-typing-text">{loadingText}</span>
            </div>
          )}

          {/* Error message */}
          {error && <div className="askai-error">{error}</div>}
          {voiceError && <div className="askai-error">{voiceError}</div>}

          <div ref={messagesEndRef} />
        </div>

        {/* Voice Speaking Active Bar */}
        {isSpeaking && (
          <div className="askai-voice-bar" style={{ backgroundColor: 'var(--bg-surface)' }}>
            <div className="askai-voice-indicator">
              <Volume2 size={15} color="var(--text-primary)" />
              <div className="askai-voice-waves">
                <div className="askai-voice-wave" />
                <div className="askai-voice-wave" />
                <div className="askai-voice-wave" />
                <div className="askai-voice-wave" />
              </div>
              <span className="askai-voice-text">Assistant speaking...</span>
            </div>
            <button
              className="askai-voice-stop-btn"
              onClick={stopSpeaking}
              style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Square size={10} fill="currentColor" /> Stop Audio
            </button>
          </div>
        )}

        {/* Voice Listening Active Bar */}
        {isListening && (
          <div className="askai-voice-bar">
            <div className="askai-voice-indicator">
              <div className="askai-voice-waves">
                <div className="askai-voice-wave" />
                <div className="askai-voice-wave" />
                <div className="askai-voice-wave" />
                <div className="askai-voice-wave" />
              </div>
              <span className="askai-voice-text">Listening... speak your request now</span>
            </div>
            <button className="askai-voice-stop-btn" onClick={toggleVoiceRecording}>
              Stop
            </button>
          </div>
        )}

        {/* Input area */}
        <div className="askai-input-area">
          <textarea
            ref={inputRef}
            className="askai-input"
            placeholder={
              isListening
                ? 'Listening to your speech...'
                : isSpeaking
                ? 'Speaking response (click Stop Audio to silence)...'
                : apiKey
                ? 'Ask or speak (e.g. "Show red tops for women")...'
                : 'Enter Gemini API key in settings...'
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
          />

          {/* Microphone button */}
          <button
            className={`askai-voice-btn ${isListening ? 'askai-voice-btn--recording' : ''}`}
            onClick={toggleVoiceRecording}
            title={isListening ? 'Stop listening' : 'Start voice command'}
            disabled={!voiceSupported || isLoading}
            aria-label="Voice input"
          >
            {isListening ? <Radio size={16} /> : <Mic size={16} />}
          </button>

          {/* Send button */}
          <button
            className="askai-send-btn"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            title="Send request"
            aria-label="Send message"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
