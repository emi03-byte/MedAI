import { useEffect, useRef } from 'react'

const MessageList = ({ messages, isLoading }) => {
  const endRef = useRef(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="chat-messages">
      {messages.map((message, index) => (
        <div key={index} className={`chat-message ${message.role}`}>
          <div className="message-content">{message.content}</div>
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

      <div ref={endRef} />
    </div>
  )
}

export default MessageList

