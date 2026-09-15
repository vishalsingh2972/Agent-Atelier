'use client';

import React from 'react';
import type { ToolAction } from '@/lib/askai/types';

interface Props {
  action: ToolAction;
}

const STATUS_ICON: Record<ToolAction['status'], string> = {
  pending: '⏳',
  executing: '⟳',
  success: '✓',
  failed: '✗',
  'awaiting-confirmation': '⚠',
};

const STATUS_CLASS: Record<ToolAction['status'], string> = {
  pending: '',
  executing: 'askai-tool-badge--executing',
  success: 'askai-tool-badge--success',
  failed: 'askai-tool-badge--failed',
  'awaiting-confirmation': 'askai-tool-badge--awaiting',
};

export default function ToolActionBadge({ action }: Props) {
  return (
    <span className={`askai-tool-badge ${STATUS_CLASS[action.status]}`}>
      <span className="askai-tool-badge-icon">{STATUS_ICON[action.status]}</span>
      {action.name}
    </span>
  );
}
