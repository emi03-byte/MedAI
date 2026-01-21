const Tabs = ({ tabs, activeTab, onSelect }) => {
  return (
    <div className="admin-tabs">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onSelect(tab.id)}
          className={`admin-tab ${activeTab === tab.id ? 'active' : ''}`}
          type="button"
        >
          {tab.label} <span className="admin-tab-count">{tab.count}</span>
        </button>
      ))}
    </div>
  )
}

export default Tabs

