const ChatModal = ({ title = 'Asistent AI Medical', onClose, children, variant = 'page' }) => {
  const isPage = variant === 'page'

  return (
    <div
      className={`chat-modal-overlay ${isPage ? 'chat-modal-overlay-page' : ''}`}
      onClick={isPage ? undefined : onClose}
    >
      <div
        className={`chat-modal ${isPage ? 'chat-modal-page' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
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

