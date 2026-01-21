const ChatButton = ({ onClick, inSidebar = false }) => {
  return (
    <button
      className={`chat-button ${inSidebar ? 'chat-button-sidebar' : ''}`}
      onClick={onClick}
      type="button"
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        <line x1="9" y1="10" x2="15" y2="10"></line>
        <line x1="9" y1="14" x2="13" y2="14"></line>
      </svg>
    </button>
  )
}

export default ChatButton

