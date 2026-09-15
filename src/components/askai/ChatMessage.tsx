'use client';

import React from 'react';
import type { ChatMessage as ChatMessageType, ConfirmationRequest } from '@/lib/askai/types';
import ToolActionBadge from './ToolActionBadge';

interface Props {
  message: ChatMessageType;
  onConfirm?: (confirmation: ConfirmationRequest) => void;
  onCancel?: () => void;
}

export default function ChatMessage({ message, onConfirm, onCancel }: Props) {
  const isUser = message.role === 'user';
  const isModel = message.role === 'model';

  return (
    <div className={`askai-msg ${isUser ? 'askai-msg--user' : 'askai-msg--model'}`}>
      {/* Tool action badges */}
      {isModel && message.toolActions && message.toolActions.length > 0 && (
        <div className="askai-tools">
          {message.toolActions.map((action) => (
            <ToolActionBadge key={action.id} action={action} />
          ))}
        </div>
      )}

      {/* Message bubble */}
      {message.content && (
        <div className="askai-msg-bubble">
          {renderContent(message.content)}
        </div>
      )}

      {/* Confirmation card */}
      {message.requiresConfirmation && onConfirm && onCancel && (
        <div className="askai-confirm">
          <div className="askai-confirm-text">
            {renderContent(message.requiresConfirmation.description)}
          </div>
          <div className="askai-confirm-actions">
            <button
              className="askai-confirm-btn askai-confirm-btn--yes"
              onClick={() => onConfirm(message.requiresConfirmation!)}
            >
              ✓ Confirm
            </button>
            <button
              className="askai-confirm-btn askai-confirm-btn--no"
              onClick={onCancel}
            >
              ✗ Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Simple markdown-like rendering: bold (**text**) and line breaks.
 */
function renderContent(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    // Convert newlines to <br />
    const lines = part.split('\n');
    return lines.map((line, j) => (
      <React.Fragment key={`${i}-${j}`}>
        {j > 0 && <br />}
        {line}
      </React.Fragment>
    ));
  });
}
