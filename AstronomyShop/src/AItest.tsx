import { GoogleGenAI } from '@google/genai';
import React, { useEffect, useMemo, useRef, useState } from 'react';

// Simple chat types matching Google Gen AI SDK
export type Part = { text: string };
export type ChatMsg = { role: 'user' | 'model'; parts: Part[] };

type Props = {
  defaultModel?: string;
  starter?: string;
};

export default function AItest({
  defaultModel = 'gemini-2.5-flash',
  starter = '',
}: Props) {
  const [model] = useState<string>(defaultModel);
  const [history, setHistory] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const listRef = useRef<HTMLDivElement | null>(null);

  // Zenith constellation calculator states
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [dateTime, setDateTime] = useState('');
  const [zenithResult, setZenithResult] = useState('');
  const [calculatingZenith, setCalculatingZenith] = useState(false);

  // Load key from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('gemini_api_key');
    if (saved) setApiKey(saved);
  }, []);

  // Add CSS animation for stars
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const styleSheet = document.createElement('style');
      styleSheet.textContent = `
        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
      `;
      document.head.appendChild(styleSheet);

      return () => {
        document.head.removeChild(styleSheet);
      };
    }
  }, []);

  // Warm welcome
  useEffect(() => {
    setHistory([
      {
        role: 'model',
        parts: [
          {
            text: '🌟 歡迎來到天文小舖！\n\n我是你的天文知識小幫手，你可以向我詢問任何關於天文的問題：星座、行星、恆星、星系、黑洞、宇宙學等等。\n\n也別忘了試試右方的「天頂星座計算器」，輸入時間和地點，就能知道當時天頂的星座喔！✨',
          },
        ],
      },
    ]);
    if (starter) setInput(starter);
  }, [starter]);

  // auto-scroll to bottom
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [history, loading]);

  const ai = useMemo(() => {
    try {
      return apiKey ? new GoogleGenAI({ apiKey }) : null;
    } catch {
      return null;
    }
  }, [apiKey]);

  async function sendMessage(message?: string) {
    const content = (message ?? input).trim();
    if (!content || loading) return;
    if (!ai) {
      setError('請先輸入有效的 Gemini API Key');
      return;
    }

    setError('');
    setLoading(true);

    const systemPrompt = `你是「天文小舖」的天文知識專家助手。請用友善、專業的方式回答使用者關於天文學的問題，包括但不限於：星座、行星、恆星、星系、黑洞、宇宙學、天文觀測等。請盡量提供準確且易懂的資訊。`;

    const newHistory: ChatMsg[] = [
      ...history,
      { role: 'user', parts: [{ text: content }] },
    ];
    setHistory(newHistory);
    setInput('');

    try {
      const resp = await ai.models.generateContent({
        model,
        contents: [
          { role: 'user', parts: [{ text: systemPrompt }] },
          ...newHistory,
        ],
      });

      const reply = resp.text || '[No content]';
      setHistory((h) => [...h, { role: 'model', parts: [{ text: reply }] }]);
    } catch (err: any) {
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  }

  async function calculateZenith() {
    if (!latitude || !longitude || !dateTime) {
      setZenithResult('請填寫完整的經緯度和時間');
      return;
    }
    if (!ai) {
      setZenithResult('請先輸入有效的 Gemini API Key');
      return;
    }

    setCalculatingZenith(true);
    setZenithResult('計算中...');

    try {
      const prompt = `請根據以下資訊，計算該時間點、該地點的天頂星座（zenith constellation）：

經度：${longitude}
緯度：${latitude}
時間：${dateTime}

請計算該時間點天頂（正上方，天球坐標系統中的頂點）所在的星座。請提供：
1. 天頂星座名稱（中文和拉丁文）
2. 簡短的說明
3. 該星座的特色

請用簡潔清楚的方式回答。`;

      const resp = await ai.models.generateContent({
        model,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
      });

      const reply = resp.text || '無法計算';
      setZenithResult(reply);
    } catch (err: any) {
      setZenithResult(`錯誤：${err?.message || String(err)}`);
    } finally {
      setCalculatingZenith(false);
    }
  }

  function renderMarkdownLike(text: string) {
    const lines = text.split(/\n/);
    return (
      <>
        {lines.map((ln, i) => (
          <div
            key={i}
            style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}
          >
            {ln}
          </div>
        ))}
      </>
    );
  }

  return (
    <div style={styles.wrap}>
      {/* Starry background */}
      <div style={styles.starsBackground}>
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            style={{
              ...styles.star,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.mainHeader}>
          <h1 style={styles.title}> 💫 天文小舖 Astronomy Shop</h1>
          <p style={styles.subtitle}>
            探索宇宙的奧秘，發現星空的美麗
          </p>
        </div>

        {/* API Key input */}
        <div style={styles.apiKeySection}>
          <label style={styles.apiKeyLabel}>
            <span style={{ color: '#fbbf24' }}>🔑 Gemini API Key</span>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                const v = e.target.value;
                setApiKey(v);
                localStorage.setItem('gemini_api_key', v);
              }}
              placeholder="請輸入你的 Gemini API Key"
              style={styles.apiKeyInput}
            />
          </label>
        </div>

        {/* Two column layout */}
        <div style={styles.twoColumnGrid}>
          {/* Left: Chat interface */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>💬</span>
              <span>天文知識問答</span>
            </div>

            {/* Messages */}
            <div ref={listRef} style={styles.messages}>
              {history.map((m, idx) => (
                <div
                  key={idx}
                  style={{
                    ...styles.msg,
                    ...(m.role === 'user' ? styles.userMsg : styles.aiMsg),
                  }}
                >
                  <div style={styles.msgRole}>
                    {m.role === 'user' ? '🧑 您' : '🤖 AI 助手'}
                  </div>
                  <div style={styles.msgBody}>
                    {renderMarkdownLike(m.parts.map((p) => p.text).join('\n'))}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ ...styles.msg, ...styles.aiMsg }}>
                  <div style={styles.msgRole}>🤖 AI 助手</div>
                  <div style={styles.msgBody}>思考中...</div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && <div style={styles.errorBox}>⚠ {error}</div>}

            {/* Composer */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              style={styles.composer}
            >
              <input
                placeholder="問我任何天文問題..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                style={styles.textInput}
              />
              <button
                type="submit"
                disabled={loading || !input.trim() || !apiKey}
                style={{
                  ...styles.sendBtn,
                  opacity: loading || !input.trim() || !apiKey ? 0.5 : 1,
                }}
              >
                送出
              </button>
            </form>

            {/* Quick examples */}
            <div style={styles.suggestions}>
              {[
                '什麼是黑洞？',
                '如何觀測銀河系？',
                '北極星為什麼不會動？',
                '火星上有水嗎？',
              ].map((q) => (
                <button
                  key={q}
                  type="button"
                  style={styles.suggestionBtn}
                  onClick={() => sendMessage(q)}
                  disabled={loading || !apiKey}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Zenith constellation calculator */}
          <div style={styles.card}>
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>🔭</span>
              <span>天頂星座計算器</span>
            </div>

            <div style={styles.calculatorContent}>
              <p style={styles.calculatorDesc}>
                輸入觀測地點的經緯度和時間，查詢當時天頂的星座
              </p>

              <div style={styles.inputGroup}>
                <label style={styles.inputLabel}>
                  📍 緯度 (Latitude)
                  <input
                    type="text"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    placeholder="例如：25.0330 (台北)"
                    style={styles.calcInput}
                  />
                </label>

                <label style={styles.inputLabel}>
                  📍 經度 (Longitude)
                  <input
                    type="text"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    placeholder="例如：121.5654 (台北)"
                    style={styles.calcInput}
                  />
                </label>

                <label style={styles.inputLabel}>
                  🕐 日期與時間
                  <input
                    type="datetime-local"
                    value={dateTime}
                    onChange={(e) => setDateTime(e.target.value)}
                    style={styles.calcInput}
                  />
                </label>

                <button
                  onClick={calculateZenith}
                  disabled={calculatingZenith || !apiKey}
                  style={{
                    ...styles.calculateBtn,
                    opacity: calculatingZenith || !apiKey ? 0.5 : 1,
                  }}
                >
                  {calculatingZenith ? '計算中...' : '🔍 計算天頂星座'}
                </button>
              </div>

              {zenithResult && (
                <div style={styles.resultBox}>
                  <div style={styles.resultHeader}>✨ 計算結果</div>
                  <div style={styles.resultContent}>
                    {renderMarkdownLike(zenithResult)}
                  </div>
                </div>
              )}

              {/* Example buttons */}
              <div style={styles.exampleSection}>
                <div style={styles.exampleTitle}>快速範例：</div>
                <button
                  style={styles.exampleBtn}
                  onClick={() => {
                    setLatitude('25.0330');
                    setLongitude('121.5654');
                    const now = new Date();
                    const formatted = new Date(
                      now.getTime() - now.getTimezoneOffset() * 60000
                    )
                      .toISOString()
                      .slice(0, 16);
                    setDateTime(formatted);
                  }}
                >
                  台北現在
                </button>
                <button
                  style={styles.exampleBtn}
                  onClick={() => {
                    setLatitude('40.7128');
                    setLongitude('-74.0060');
                    const now = new Date();
                    const formatted = new Date(
                      now.getTime() - now.getTimezoneOffset() * 60000
                    )
                      .toISOString()
                      .slice(0, 16);
                    setDateTime(formatted);
                  }}
                >
                  紐約現在
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={styles.footer}>
          <p style={styles.footerText}>
            ⭐ 天文小舖 - 讓我們一起探索浩瀚宇宙 ⭐
          </p>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    minHeight: '100vh',
    background: 'linear-gradient(to bottom, #0a0e27, #1a1f3a, #0f1729)',
    position: 'relative',
    overflow: 'auto',
    padding: '20px',
  },
  starsBackground: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    pointerEvents: 'none',
    zIndex: 0,
  },
  star: {
    position: 'absolute',
    width: '2px',
    height: '2px',
    background: 'white',
    borderRadius: '50%',
    boxShadow: '0 0 3px #fff',
    animation: 'twinkle 3s infinite',
  },
  container: {
    maxWidth: '1400px',
    margin: '0 auto',
    position: 'relative',
    zIndex: 1,
  },
  mainHeader: {
    textAlign: 'center',
    marginBottom: '30px',
    background: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    padding: '30px',
    border: '2px solid rgba(139, 92, 246, 0.3)',
    boxShadow: '0 0 30px rgba(139, 92, 246, 0.2)',
  },
  title: {
    fontSize: '42px',
    fontWeight: 'bold',
    background: 'linear-gradient(135deg, #a78bfa, #fbbf24, #60a5fa)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    margin: '0 0 10px 0',
    textShadow: '0 0 30px rgba(167, 139, 250, 0.5)',
  },
  subtitle: {
    fontSize: '18px',
    color: '#cbd5e1',
    margin: 0,
  },
  apiKeySection: {
    marginBottom: '20px',
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '15px',
    padding: '20px',
    border: '1px solid rgba(251, 191, 36, 0.3)',
  },
  apiKeyLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontSize: '14px',
    fontWeight: 600,
  },
  apiKeyInput: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '2px solid rgba(251, 191, 36, 0.3)',
    background: 'rgba(30, 41, 59, 0.8)',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
    marginBottom: '20px',
  },
  card: {
    background: 'rgba(15, 23, 42, 0.8)',
    backdropFilter: 'blur(10px)',
    border: '2px solid rgba(139, 92, 246, 0.3)',
    borderRadius: '20px',
    overflow: 'hidden',
    boxShadow: '0 0 30px rgba(139, 92, 246, 0.15)',
    display: 'flex',
    flexDirection: 'column',
  },
  cardHeader: {
    padding: '16px 20px',
    fontWeight: 700,
    fontSize: '18px',
    borderBottom: '2px solid rgba(139, 92, 246, 0.3)',
    background: 'rgba(139, 92, 246, 0.1)',
    color: '#e2e8f0',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  cardIcon: {
    fontSize: '24px',
  },
  messages: {
    padding: '16px',
    display: 'grid',
    gap: '12px',
    height: '400px',
    overflowY: 'auto',
    overflowX: 'hidden',
  },
  msg: {
    borderRadius: '12px',
    padding: '12px 16px',
    border: '1px solid',
  },
  userMsg: {
    background: 'rgba(96, 165, 250, 0.15)',
    borderColor: 'rgba(96, 165, 250, 0.4)',
  },
  aiMsg: {
    background: 'rgba(167, 139, 250, 0.15)',
    borderColor: 'rgba(167, 139, 250, 0.4)',
  },
  msgRole: {
    fontSize: '12px',
    fontWeight: 700,
    color: '#cbd5e1',
    marginBottom: '6px',
  },
  msgBody: {
    fontSize: '14px',
    lineHeight: 1.6,
    color: '#e2e8f0',
  },
  errorBox: {
    color: '#fca5a5',
    padding: '8px 16px',
    background: 'rgba(239, 68, 68, 0.1)',
    borderRadius: '8px',
    margin: '0 16px',
    border: '1px solid rgba(239, 68, 68, 0.3)',
  },
  composer: {
    padding: '16px',
    display: 'grid',
    gridTemplateColumns: '1fr auto',
    gap: '10px',
    borderTop: '2px solid rgba(139, 92, 246, 0.3)',
    background: 'rgba(30, 41, 59, 0.3)',
  },
  textInput: {
    padding: '12px 16px',
    borderRadius: '10px',
    border: '2px solid rgba(139, 92, 246, 0.3)',
    background: 'rgba(30, 41, 59, 0.8)',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
  },
  sendBtn: {
    padding: '12px 24px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'transform 0.2s',
  },
  suggestions: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    padding: '12px 16px',
    background: 'rgba(30, 41, 59, 0.3)',
  },
  suggestionBtn: {
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid rgba(139, 92, 246, 0.4)',
    background: 'rgba(139, 92, 246, 0.1)',
    color: '#c4b5fd',
    cursor: 'pointer',
    fontSize: '12px',
    transition: 'all 0.2s',
  },
  calculatorContent: {
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    flex: 1,
  },
  calculatorDesc: {
    fontSize: '14px',
    color: '#cbd5e1',
    margin: 0,
    lineHeight: 1.6,
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  inputLabel: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    fontSize: '13px',
    fontWeight: 600,
    color: '#cbd5e1',
  },
  calcInput: {
    padding: '10px 14px',
    borderRadius: '8px',
    border: '2px solid rgba(96, 165, 250, 0.3)',
    background: 'rgba(30, 41, 59, 0.8)',
    color: '#e2e8f0',
    fontSize: '14px',
    outline: 'none',
  },
  calculateBtn: {
    padding: '14px 20px',
    borderRadius: '10px',
    border: 'none',
    background: 'linear-gradient(135deg, #60a5fa, #3b82f6)',
    color: '#fff',
    fontSize: '15px',
    fontWeight: 600,
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'transform 0.2s',
  },
  resultBox: {
    marginTop: '16px',
    background: 'rgba(167, 139, 250, 0.1)',
    border: '2px solid rgba(167, 139, 250, 0.4)',
    borderRadius: '12px',
    overflow: 'hidden',
  },
  resultHeader: {
    padding: '10px 14px',
    background: 'rgba(167, 139, 250, 0.2)',
    color: '#e2e8f0',
    fontWeight: 700,
    fontSize: '14px',
    borderBottom: '1px solid rgba(167, 139, 250, 0.3)',
  },
  resultContent: {
    padding: '14px',
    color: '#e2e8f0',
    fontSize: '14px',
    lineHeight: 1.6,
    maxHeight: '300px',
    overflowY: 'auto',
  },
  exampleSection: {
    marginTop: '12px',
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  exampleTitle: {
    fontSize: '12px',
    color: '#94a3b8',
    fontWeight: 600,
  },
  exampleBtn: {
    padding: '6px 12px',
    borderRadius: '20px',
    border: '1px solid rgba(96, 165, 250, 0.4)',
    background: 'rgba(96, 165, 250, 0.1)',
    color: '#93c5fd',
    cursor: 'pointer',
    fontSize: '12px',
  },
  footer: {
    textAlign: 'center',
    padding: '20px',
    background: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(10px)',
    borderRadius: '15px',
    border: '1px solid rgba(251, 191, 36, 0.3)',
  },
  footerText: {
    margin: 0,
    color: '#fbbf24',
    fontSize: '14px',
    fontWeight: 600,
  },
};
