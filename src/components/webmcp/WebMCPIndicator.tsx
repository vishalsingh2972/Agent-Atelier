'use client';

import React, { useState, useEffect, useRef } from 'react';
import { webmcpRegistry } from '@/webmcp/registry';
import { RegisteredToolInfo } from '@/webmcp/types';
import { useAuth } from '@/context/AuthContext';
import { Bot, CheckCircle, Lock, ChevronRight, X, Play, Code, Sparkles, Terminal } from 'lucide-react';

export default function WebMCPIndicator() {
  const { user } = useAuth();
  const [tools, setTools] = useState<RegisteredToolInfo[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTool, setSelectedTool] = useState<RegisteredToolInfo | null>(null);
  const [testInput, setTestInput] = useState<string>('{}');
  const [testResult, setTestResult] = useState<any>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastActivity, setLastActivity] = useState<{ toolName: string; time: string; success: boolean } | null>(null);
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Subscribe to registry updates
    const unsubscribe = webmcpRegistry.subscribe((registeredTools) => {
      setTools(registeredTools);
    });

    const unsubscribeExec = webmcpRegistry.onExecution((event) => {
      setLastActivity({
        toolName: event.toolName,
        time: new Date(event.timestamp).toLocaleTimeString(),
        success: event.result?.success !== false,
      });
    });

    return () => {
      unsubscribe();
      unsubscribeExec();
    };
  }, []);

  // Sync tools whenever auth user state changes
  useEffect(() => {
    setTools(webmcpRegistry.getRegisteredToolsInfo());
  }, [user]);

  // When selected tool changes, populate sample input
  useEffect(() => {
    if (selectedTool) {
      const sample: Record<string, any> = {};
      const properties = selectedTool.inputSchema?.properties || {};
      for (const [key, prop] of Object.entries(properties)) {
        if (prop.type === 'string') {
          if (key === 'query') sample[key] = 'silk';
          else if (key === 'gender') sample[key] = 'Women';
          else if (key === 'color') sample[key] = 'Red';
          else if (key === 'category') sample[key] = 'WomensTops';
          else if (key === 'productId') sample[key] = 'crimson-silk-charmeuse-blouse';
          else if (key === 'code') sample[key] = 'SAVE10';
          else sample[key] = 'sample';
        } else if (prop.type === 'number') {
          if (key === 'quantity') sample[key] = 1;
          else if (key === 'minPrice') sample[key] = 50;
          else if (key === 'maxPrice') sample[key] = 200;
          else sample[key] = 1;
        } else if (prop.type === 'array') {
          sample[key] = ['crimson-silk-charmeuse-blouse', 'royal-blue-silk-button-down'];
        } else if (prop.type === 'boolean') {
          sample[key] = true;
        }
      }
      setTestInput(JSON.stringify(sample, null, 2));
      setTestResult(null);
    }
  }, [selectedTool]);

  const handleRunTool = async () => {
    if (!selectedTool) return;
    setIsExecuting(true);
    setTestResult(null);

    let parsedInput = {};
    try {
      parsedInput = JSON.parse(testInput);
    } catch {
      setTestResult({ success: false, error: 'Invalid JSON input syntax' });
      setIsExecuting(false);
      return;
    }

    try {
      const result = await webmcpRegistry.executeTool(selectedTool.name, parsedInput);
      setTestResult(result);
    } catch (err: any) {
      setTestResult({ success: false, error: err?.message || 'Tool execution failure' });
    } finally {
      setIsExecuting(false);
    }
  };

  const activeCount = tools.filter((t) => t.status === 'AVAILABLE').length;

  const handleMouseEnter = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
  };

  const handleMouseLeave = () => {
    hoverTimeoutRef.current = setTimeout(() => {
      setIsExpanded(false);
      setSelectedTool(null);
    }, 400);
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '24px',
        left: '24px',
        zIndex: 900,
        fontFamily: 'var(--font-sans)',
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Collapsed Badge Indicator */}
      {!isExpanded && (
        <div
          onClick={() => setIsExpanded(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            padding: '7px 12px',
            boxShadow: 'var(--shadow-md)',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
          }}
        >
          <div
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              backgroundColor: user ? 'var(--success)' : 'var(--text-primary)',
            }}
          />
          <Bot size={15} color="var(--text-primary)" />
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
            WebMCP
          </span>
          <span
            style={{
              fontSize: '0.6875rem',
              backgroundColor: user ? 'var(--success-bg, #ecfdf5)' : 'var(--bg-surface)',
              color: user ? 'var(--success, #059669)' : 'var(--text-primary)',
              padding: '1px 6px',
              borderRadius: '2px',
              fontWeight: 600,
              transition: 'all 0.2s ease',
            }}
          >
            {activeCount}/{tools.length}
          </span>
        </div>
      )}

      {/* Expanded Tool Panel */}
      {isExpanded && (
        <div
          style={{
            width: selectedTool ? '680px' : '360px',
            maxWidth: '92vw',
            backgroundColor: '#ffffff',
            border: '1px solid var(--border-medium)',
            borderRadius: 'var(--radius-sm)',
            boxShadow: 'var(--shadow-lg)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            transition: 'width 0.2s ease',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: 'var(--bg-primary)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Bot size={16} color="var(--text-primary)" />
              <div>
                <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  WebMCP Protocol Layer
                </div>
                <div style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>
                  {activeCount} of {tools.length} Tools Available • {user ? `Active (${user.name})` : 'Guest Session'}
                </div>
              </div>
            </div>
            <button
              onClick={() => {
                setIsExpanded(false);
                setSelectedTool(null);
              }}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <X size={15} />
            </button>
          </div>

          {/* Body: Split View if Tool Selected */}
          <div style={{ display: 'flex', maxHeight: '460px', overflow: 'hidden' }}>
            {/* Tool List Column */}
            <div
              style={{
                width: selectedTool ? '320px' : '100%',
                flexShrink: 0,
                overflowY: 'auto',
                padding: '10px 12px',
                borderRight: selectedTool ? '1px solid var(--border-subtle)' : 'none',
              }}
            >
              <div style={{ fontSize: '0.6875rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', padding: '6px 8px' }}>
                Exposed Agent Tools ({tools.length})
              </div>

              {tools.map((t) => {
                const isSelected = selectedTool?.name === t.name;
                const isAvailable = t.status === 'AVAILABLE';

                return (
                  <div
                    key={t.name}
                    onClick={() => setSelectedTool(t)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      marginBottom: '4px',
                      borderRadius: 'var(--radius-sm)',
                      backgroundColor: isSelected ? 'var(--bg-surface)' : 'transparent',
                      border: isSelected ? '1px solid var(--border-medium)' : '1px solid transparent',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    <div style={{ overflow: 'hidden', paddingRight: '8px' }}>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 600,
                          color: isAvailable ? 'var(--text-primary)' : 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                        }}
                      >
                        {t.name}
                      </div>
                      <div
                        style={{
                          fontSize: '0.6875rem',
                          color: 'var(--text-muted)',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                        }}
                      >
                        {t.category}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      {isAvailable ? (
                        <span
                          style={{
                            fontSize: '0.625rem',
                            fontWeight: 600,
                            color: 'var(--success)',
                            backgroundColor: 'var(--success-bg)',
                            padding: '1px 5px',
                            borderRadius: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <CheckCircle size={9} />
                          ON
                        </span>
                      ) : (
                        <span
                          style={{
                            fontSize: '0.625rem',
                            fontWeight: 600,
                            color: 'var(--text-muted)',
                            backgroundColor: 'var(--bg-surface)',
                            padding: '1px 5px',
                            borderRadius: '2px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px',
                          }}
                        >
                          <Lock size={9} />
                          AUTH
                        </span>
                      )}
                      <ChevronRight size={13} color="var(--text-muted)" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Tool Detail & Test Inspector Column */}
            {selectedTool && (
              <div
                style={{
                  flex: 1,
                  padding: '14px 16px',
                  overflowY: 'auto',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  backgroundColor: 'var(--bg-primary)',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.875rem', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--text-primary)' }}>
                      {selectedTool.name}
                    </div>
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        padding: '2px 6px',
                        borderRadius: '2px',
                        backgroundColor: selectedTool.status === 'AVAILABLE' ? 'var(--success-bg)' : 'var(--warning-bg)',
                        color: selectedTool.status === 'AVAILABLE' ? 'var(--success)' : 'var(--warning)',
                      }}
                    >
                      {selectedTool.status === 'AVAILABLE' ? 'Available' : 'Login Required'}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {selectedTool.description}
                  </div>
                </div>

                {/* Input Schema & Live Test */}
                <div>
                  <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Code size={11} /> Tool Input (JSON)
                  </div>
                  <textarea
                    value={testInput}
                    onChange={(e) => setTestInput(e.target.value)}
                    style={{
                      width: '100%',
                      height: '80px',
                      backgroundColor: '#ffffff',
                      border: '1px solid var(--border-medium)',
                      borderRadius: 'var(--radius-sm)',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      padding: '8px',
                      resize: 'vertical',
                      outline: 'none',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={handleRunTool}
                    disabled={isExecuting}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, gap: '6px' }}
                  >
                    <Play size={11} />
                    {isExecuting ? 'Invoking...' : 'Invoke Tool'}
                  </button>
                  <button
                    onClick={() => setSelectedTool(null)}
                    className="btn btn-secondary btn-sm"
                  >
                    Close
                  </button>
                </div>

                {/* Result output */}
                {testResult && (
                  <div>
                    <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Terminal size={11} /> Tool Response
                    </div>
                    <pre
                      style={{
                        backgroundColor: '#ffffff',
                        border: testResult.success ? '1px solid var(--success)' : '1px solid var(--danger)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '8px',
                        fontSize: '0.6875rem',
                        fontFamily: 'var(--font-mono)',
                        color: testResult.success ? 'var(--success)' : 'var(--danger)',
                        maxHeight: '130px',
                        overflowY: 'auto',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {JSON.stringify(testResult, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer Bar */}
          {lastActivity && (
            <div
              style={{
                padding: '6px 14px',
                borderTop: '1px solid var(--border-subtle)',
                fontSize: '0.6875rem',
                color: 'var(--text-muted)',
                backgroundColor: 'var(--bg-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={11} color="var(--text-primary)" />
                <span>Last call: <strong style={{ color: 'var(--text-primary)' }}>{lastActivity.toolName}</strong> at {lastActivity.time}</span>
              </div>
              <span style={{ color: lastActivity.success ? 'var(--success)' : 'var(--danger)', fontWeight: 600 }}>
                {lastActivity.success ? 'SUCCESS' : 'ERR'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
