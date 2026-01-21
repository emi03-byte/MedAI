import { useState, useRef, useEffect } from 'react'

const getStoredCurrentUser = () => {
  try {
    const raw = localStorage.getItem('currentUser')
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const ChatBot = ({ medicinesData = [], renderButtonInSidebar = false }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState(() => getStoredCurrentUser())
  const defaultWelcomeMessage = {
    role: 'assistant',
    content: 'Bună! 👋 Descrie-mi simptomele sau starea pacientului și îți voi recomanda medicamentele potrivite din lista CNAS. Cu ce te pot ajuta?'
  }
  const pendingApprovalMessage = {
    role: 'assistant',
    content: 'Mulțumesc pentru interes! Contul tău este în curs de aprobare. Putem discuta imediat ce este aprobat.'
  }
  const rejectedAccountMessage = {
    role: 'assistant',
    content: 'Ne pare rău, dar nu ai acces la chat-ul medical. Contul tău nu a fost aprobat în acest moment.\n\nPentru mai multe informații sau pentru a clarifica situația, te rugăm să contactezi administratorul aplicației.\n\nPoți verifica statusul contului în setări.'
  }
  const noAccountMessage = {
    role: 'assistant',
    content: 'Pentru a folosi chat-ul medical, trebuie să te autentifici sau să-ți creezi un cont.\n\nDupă autentificare și aprobare, vei putea accesa toate funcționalitățile aplicației.'
  }
  const [messages, setMessages] = useState([defaultWelcomeMessage])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const isPendingApproval = currentUser?.status === 'pending'
  const isRejected = currentUser?.status === 'rejected'
  const hasNoAccount = !currentUser
  const cannotUseChat = isPendingApproval || isRejected || hasNoAccount

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  useEffect(() => {
    if (!isOpen) return
    setCurrentUser(getStoredCurrentUser())
    const intervalId = setInterval(() => {
      setCurrentUser(getStoredCurrentUser())
    }, 2000)
    return () => clearInterval(intervalId)
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    if (isRejected) {
      setMessages([rejectedAccountMessage])
      return
    }
    if (hasNoAccount) {
      setMessages([noAccountMessage])
      return
    }
    if (isPendingApproval) {
      setMessages([pendingApprovalMessage])
      return
    }
    setMessages([defaultWelcomeMessage])
  }, [isOpen, isPendingApproval, isRejected, hasNoAccount])

  // Ascultă pentru event-ul de deschidere chat din sidebar
  useEffect(() => {
    const handleOpenChat = () => {
      setIsOpen(true)
    }
    window.addEventListener('openChatBot', handleOpenChat)
    return () => {
      window.removeEventListener('openChatBot', handleOpenChat)
    }
  }, [])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || cannotUseChat) return

    const userMessage = inputMessage.trim()
    setInputMessage('')
    
    // Adaugă mesajul utilizatorului
    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      // Creează contextul cu informații despre medicamente și codurile de boală
      const medicinesContext = medicinesData.length > 0 
        ? `\n\nDate despre medicamente disponibile din baza de date CNAS (${medicinesData.length} medicamente):\n${JSON.stringify(medicinesData.slice(0, 20), null, 2)}\n\nFiecare medicament are asociate coduri de boală în coloana "Coduri_Boli" care indică pentru ce afecțiuni este indicat.`
        : ''

      // Adaugă contextul la primul mesaj sistem
      const messagesWithContext = [
        { 
          role: 'system', 
          content: `Ești un asistent medical inteligent specializat în recomandarea medicamentelor din lista CNAS (Casa Națională de Asigurări de Sănătate) din România. 

FUNCȚIONALITATEA TA:
1. Utilizatorul îți descrie simptomele sau starea unui pacient
2. Tu analizezi simptomele și identifici afecțiunile posibile
3. Găsești medicamentele din lista CNAS care au coduri de boală corespunzătoare acelor afecțiuni
4. Recomanzi medicamentele potrivite cu explicații

${medicinesContext}

IMPORTANT:
- Analizează simptomele descrise de utilizator
- Identifică afecțiunile medicale posibile
- Caută în datele furnizate medicamentele care au coduri de boală corespunzătoare
- Recomandă medicamentele potrivite cu explicații clare
- Menționează substanța activă și lista de compensare
- Răspunde întotdeauna în limba română, clar și concis
- Dacă nu găsești medicamente specifice, oferă sfaturi generale bazate pe cunoștințele tale medicale` 
        },
        ...newMessages
      ]

      console.log('Making request to OpenAI API through proxy...')
      const response = await fetch('/api/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: messagesWithContext,
          temperature: 0.7,
          max_tokens: 800
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('API Response Error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText
        })
        throw new Error(`API Error: ${response.status} - ${response.statusText} - ${errorText}`)
      }

      const data = await response.json()
      console.log('API Response:', data)
      const assistantMessage = data.choices[0].message.content

      setMessages([...newMessages, { role: 'assistant', content: assistantMessage }])
    } catch (error) {
      console.error('Error calling OpenAI:', error)
      console.error('Error type:', typeof error)
      console.error('Error name:', error.name)
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
      console.error('Error details:', {
        message: error.message,
        status: error.status,
        response: error.response
      })
      
      let errorMessage = 'Ne pare rău, a apărut o eroare la conectarea cu AI. '
      
      if (error.message.includes('401')) {
        errorMessage += 'Eroare de autentificare - API key invalid sau lipsă.'
      } else if (error.message.includes('429')) {
        errorMessage += 'Prea multe cereri - încearcă din nou mai târziu.'
      } else if (error.message.includes('500')) {
        errorMessage += 'Eroare de server OpenAI.'
      } else {
        errorMessage += `Detalii: ${error.message}`
      }
      
      setMessages([...newMessages, { 
        role: 'assistant', 
        content: errorMessage
      }])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <>
      {/* Buton Chat */}
      {!isOpen && (
        <button 
          className={`chat-button ${renderButtonInSidebar ? 'chat-button-sidebar' : ''}`}
          onClick={() => setIsOpen(true)}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            <line x1="9" y1="10" x2="15" y2="10"></line>
            <line x1="9" y1="14" x2="13" y2="14"></line>
          </svg>
        </button>
      )}

      {/* Modal Chat */}
      {isOpen && (
        <div className="chat-modal-overlay" onClick={() => setIsOpen(false)}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="chat-header">
              <h3>Asistent AI Medical</h3>
              <button 
                className="chat-close-button"
                onClick={() => setIsOpen(false)}
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            <div className="chat-messages">
              {messages.map((message, index) => (
                <div 
                  key={index} 
                  className={`chat-message ${message.role}`}
                >
                  <div className="message-content">
                    {message.content}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="chat-message assistant">
                  <div className="message-content loading">
                    <span className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="chat-input-container">
              <textarea
                className="chat-input"
                placeholder={
                  isRejected ? 'Cont respins - nu ai acces la chat' :
                  hasNoAccount ? 'Autentificare necesară' :
                  isPendingApproval ? 'Cont în așteptare aprobare' : 
                  'Scrie un mesaj...'
                }
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                disabled={isLoading || cannotUseChat}
                rows={1}
              />
              <button 
                className="chat-send-button"
                onClick={sendMessage}
                disabled={isLoading || cannotUseChat || !inputMessage.trim()}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="22" y1="2" x2="11" y2="13"></line>
                  <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ChatBot

