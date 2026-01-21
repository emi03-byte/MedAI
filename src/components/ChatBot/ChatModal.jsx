const ChatModal = ({ title = 'Asistent AI Medical', onClose, children }) => {
  return (
    <div className="chat-modal-overlay" onClick={onClose}>
      <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
        <div className="chat-header">
          <h3>{title}</h3>
          <button className="chat-close-button" onClick={onClose} type="button">
            ✕
          </button>
        </div>

        {children}
      </div>
    </div>
  )
}

export default ChatModal

