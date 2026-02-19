import { useEffect, useMemo, useState } from 'react'
import { createChatCompletion } from '../../api/chatApi'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import ChatButton from './ChatButton'
import ChatModal from './ChatModal'
import MessageInput from './MessageInput'
import MessageList from './MessageList'
import { buildSystemPrompt } from './prompt'

const DEFAULT_WELCOME_MESSAGE = {
  role: 'assistant',
  content:
    'Bună! 👋 Descrie-mi simptomele sau starea pacientului și îți voi recomanda medicamentele potrivite din lista CNAS. Cu ce te pot ajuta?',
}

const PENDING_APPROVAL_MESSAGE = {
  role: 'assistant',
  content:
    'Mulțumesc pentru interes! Contul tău este în curs de aprobare. Putem discuta imediat ce este aprobat.',
}

const REJECTED_ACCOUNT_MESSAGE = {
  role: 'assistant',
  content:
    'Ne pare rău, dar nu ai acces la chat-ul medical. Contul tău nu a fost aprobat în acest moment.\n\nPentru mai multe informații sau pentru a clarifica situația, te rugăm să contactezi administratorul aplicației.\n\nPoți verifica statusul contului în setări.',
}

const NO_ACCOUNT_MESSAGE = {
  role: 'assistant',
  content:
    'Pentru a folosi chat-ul medical, trebuie să te autentifici sau să-ți creezi un cont.\n\nDupă autentificare și aprobare, vei putea accesa toate funcționalitățile aplicației.',
}

const getInitialMessages = (currentUser) => {
  if (!currentUser) return [NO_ACCOUNT_MESSAGE]
  if (currentUser.status === 'rejected') return [REJECTED_ACCOUNT_MESSAGE]
  if (currentUser.status === 'pending') return [PENDING_APPROVAL_MESSAGE]
  return [DEFAULT_WELCOME_MESSAGE]
}

const ChatBot = ({ medicinesData = [], renderButtonInSidebar = false }) => {
  const currentUser = useCurrentUser()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState([DEFAULT_WELCOME_MESSAGE])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const isPendingApproval = currentUser?.status === 'pending'
  const isRejected = currentUser?.status === 'rejected'
  const hasNoAccount = !currentUser
  const cannotUseChat = isPendingApproval || isRejected || hasNoAccount

  const placeholder = useMemo(() => {
    if (isRejected) return 'Cont respins - nu ai acces la chat'
    if (hasNoAccount) return 'Autentificare necesară'
    if (isPendingApproval) return 'Cont în așteptare aprobare'
    return 'Scrie un mesaj...'
  }, [hasNoAccount, isPendingApproval, isRejected])

  // Reset messages on open/user status changes (behavior similar to previous component)
  useEffect(() => {
    if (!isOpen) return
    setMessages(getInitialMessages(currentUser))
  }, [isOpen, currentUser])

  // Ascultă pentru event-ul de deschidere chat din sidebar
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true)
    window.addEventListener('openChatBot', handleOpenChat)
    return () => window.removeEventListener('openChatBot', handleOpenChat)
  }, [])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading || cannotUseChat) return

    const userMessage = inputMessage.trim()
    setInputMessage('')

    const newMessages = [...messages, { role: 'user', content: userMessage }]
    setMessages(newMessages)
    setIsLoading(true)

    try {
      const systemPrompt = buildSystemPrompt({ medicinesData })
      const messagesWithContext = [{ role: 'system', content: systemPrompt }, ...newMessages]

      const data = await createChatCompletion({
        model: 'gpt-3.5-turbo',
        messages: messagesWithContext,
        temperature: 0.7,
        max_tokens: 800,
      })

      const assistantMessage = data?.choices?.[0]?.message?.content
      setMessages([...newMessages, { role: 'assistant', content: assistantMessage || '' }])
    } catch (error) {
      let errorMessage = 'Ne pare rău, a apărut o eroare la conectarea cu AI. '

      const msg = error?.message || ''
      if (msg.includes('401')) {
        errorMessage += 'Eroare de autentificare - API key invalid sau lipsă.'
      } else if (msg.includes('429')) {
        errorMessage += 'Prea multe cereri - încearcă din nou mai târziu.'
      } else if (msg.includes('500')) {
        errorMessage += 'Eroare de server OpenAI.'
      } else {
        errorMessage += `Detalii: ${msg}`
      }

      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: errorMessage,
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {!isOpen && (
        <ChatButton inSidebar={renderButtonInSidebar} onClick={() => setIsOpen(true)} />
      )}

      {isOpen && (
        <ChatModal variant="page" onClose={() => setIsOpen(false)}>
          <MessageList messages={messages} isLoading={isLoading} />
          <MessageInput
            value={inputMessage}
            onChange={setInputMessage}
            onSend={sendMessage}
            disabled={isLoading || cannotUseChat}
            placeholder={placeholder}
          />
        </ChatModal>
      )}
    </>
  )
}

export default ChatBot

