import { useState, useRef, useEffect } from 'react'
import { marked } from 'marked'

const API_KEY = import.meta.env.VITE_OPENROUTER_KEY
const API_URL = 'https://openrouter.ai/api/v1/chat/completions'
const MODEL = 'nvidia/nemotron-3-super-120b-a12b:free'

marked.setOptions({ breaks: true, gfm: true })

const SUGGESTIONS = [
  '✨ Write a poem about the moon',
  '💡 Explain quantum computing simply',
  '🐍 Write a Python fibonacci function',
  '🌍 What are 5 facts about India?',
  '🎯 Give me productivity tips',
  '🍕 Best pizza recipe?',
]

function TypingIndicator() {
  return (
    <div className="msg-row ai">
      <div className="avatar ai-avatar">G</div>
      <div className="bubble ai-bubble typing-bubble">
        <span className="dot" /><span className="dot" /><span className="dot" />
      </div>
    </div>
  )
}

function Message({ msg }) {
  const isAI = msg.role === 'ai'
  return (
    <div className={`msg-row ${isAI ? 'ai' : 'user'}`}>
      {isAI && <div className="avatar ai-avatar">G</div>}
      <div
        className={`bubble ${isAI ? 'ai-bubble' : 'user-bubble'}`}
        dangerouslySetInnerHTML={{ __html: isAI ? marked.parse(msg.text) : escapeHtml(msg.text) }}
      />
      {!isAI && <div className="avatar user-avatar">U</div>}
    </div>
  )
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>')
}

export default function App() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const userText = (text || input).trim()
    if (!userText || loading) return
    if (!API_KEY) {
      setError('⚠️ No API key set. Add VITE_OPENROUTER_KEY to your .env.local file.')
      return
    }

    setInput('')
    setError('')
    const newMessages = [...messages, { role: 'user', text: userText }]
    setMessages(newMessages)
    setLoading(true)

    try {
      // Build conversation history — skip error messages
      const history = newMessages
        .filter(m => !m.text.startsWith('❌'))
        .map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.text,
        }))

      // Prepend system message
      const allMessages = [
        {
          role: 'system',
          content: 'You are GeminiChat, a helpful, friendly, and intelligent AI assistant. Respond clearly and concisely. Use markdown formatting for code, lists, and structure when helpful.',
        },
        ...history,
      ]

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://gemini-chat-buildbyabhi.vercel.app',
          'X-Title': 'GeminiChat',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: allMessages,
        }),
      })

      if (!response.ok) {
        const errData = await response.json()
        throw new Error(errData?.error?.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      const aiText = data.choices?.[0]?.message?.content ?? '...'
      setMessages(prev => [...prev, { role: 'ai', text: aiText }])
    } catch (err) {
      setMessages(prev => [...prev, {
        role: 'ai',
        text: `❌ **Error:** ${err.message || 'Something went wrong. Please try again.'}`
      }])
    } finally {
      setLoading(false)
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([])
    setError('')
    inputRef.current?.focus()
  }

  const isEmpty = messages.length === 0

  return (
    <div className="app">
      <div className="orb orb1" />
      <div className="orb orb2" />
      <div className="orb orb3" />

      {/* Header */}
      <header className="header">
        <div className="header-left">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" width="22" height="22">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="url(#grad)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <defs>
                <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a78bfa"/>
                  <stop offset="100%" stopColor="#60a5fa"/>
                </linearGradient>
              </defs>
            </svg>
          </div>
          <div>
            <h1 className="logo-title">GeminiChat</h1>
            <span className="logo-sub">Powered by Nvidia Nemotron 120B via OpenRouter</span>
          </div>
        </div>
        <div className="header-right">
          {messages.length > 0 && (
            <button className="clear-btn" onClick={clearChat} title="Clear chat">
              <svg viewBox="0 0 24 24" fill="none" width="16" height="16" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"/>
              </svg>
              Clear
            </button>
          )}
          <a href="https://buildbyabhi.github.io" target="_blank" rel="noopener" className="portfolio-link">
            buildbyabhi ↗
          </a>
        </div>
      </header>

      {/* Chat Area */}
      <main className="chat-area">
        {isEmpty ? (
          <div className="welcome">
            <div className="welcome-icon">
              <svg viewBox="0 0 24 24" fill="none" width="48" height="48">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="url(#grad2)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                <defs>
                  <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#a78bfa"/>
                    <stop offset="100%" stopColor="#60a5fa"/>
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <h2 className="welcome-title">How can I help you today?</h2>
            <p className="welcome-sub">Ask me anything — coding, writing, analysis, creative ideas, and more.</p>
            <div className="suggestions">
              {SUGGESTIONS.map((s, i) => (
                <button key={i} className="suggestion-chip" onClick={() => sendMessage(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="messages">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {loading && messages[messages.length - 1]?.role !== 'ai' && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>
        )}
      </main>

      {error && <div className="error-bar">{error}</div>}

      {/* Input */}
      <footer className="input-area">
        <div className="input-wrapper">
          <textarea
            ref={inputRef}
            className="chat-input"
            placeholder="Message GeminiChat... (Enter to send, Shift+Enter for new line)"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            rows={1}
            disabled={loading}
          />
          <button
            className={`send-btn ${(!input.trim() || loading) ? 'disabled' : ''}`}
            onClick={() => sendMessage()}
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2" className="spin">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" fill="none" width="18" height="18" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13M22 2L15 22 11 13 2 9l20-7z" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            )}
          </button>
        </div>
        <p className="disclaimer">GeminiChat can make mistakes. Verify important information.</p>
      </footer>
    </div>
  )
}
