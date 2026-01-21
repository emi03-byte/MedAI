const RequestsTable = ({
  requests,
  activeTab,
  formatDate,
  getStatusBadge,
  actionLoading,
  onChangeStatus,
  onDeleteUser,
  onRestoreUser,
}) => {
  return (
    <div className="admin-table-wrapper">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Nume</th>
            <th>Email</th>
            <th>Data înregistrării</th>
            <th>Status</th>
            {activeTab === 'istoric' && <th>Data ștergerii</th>}
            <th>Acțiuni</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id} className={activeTab === 'istoric' ? 'muted' : ''}>
              <td>{request.nume}</td>
              <td>{request.email}</td>
              <td>{formatDate(request.data_creare)}</td>
              <td>{getStatusBadge(request.status)}</td>
              {activeTab === 'istoric' && <td>{formatDate(request.deleted_at)}</td>}
              <td>
                <div className="admin-actions">
                  {activeTab === 'istoric' && request.deleted_at && (
                    <button
                      onClick={() => onRestoreUser(request.id)}
                      disabled={actionLoading === request.id}
                      className="admin-action-button info"
                      type="button"
                    >
                      {actionLoading === request.id ? '⏳' : 'Restaurează'}
                    </button>
                  )}

                  {request.status !== 'approved' && activeTab !== 'istoric' && (
                    <button
                      onClick={() => onChangeStatus(request.id, 'approved')}
                      disabled={actionLoading === request.id}
                      className="admin-action-button success"
                      type="button"
                    >
                      {actionLoading === request.id ? '⏳' : 'Aprobă'}
                    </button>
                  )}

                  {request.status !== 'rejected' && activeTab !== 'istoric' && (
                    <button
                      onClick={() => onChangeStatus(request.id, 'rejected')}
                      disabled={actionLoading === request.id}
                      className="admin-action-button danger"
                      type="button"
                    >
                      {actionLoading === request.id ? '⏳' : 'Respinge'}
                    </button>
                  )}

                  {request.status !== 'pending' && activeTab !== 'istoric' && (
                    <button
                      onClick={() => onChangeStatus(request.id, 'pending')}
                      disabled={actionLoading === request.id}
                      className="admin-action-button warning"
                      type="button"
                    >
                      {actionLoading === request.id ? '⏳' : 'În așteptare'}
                    </button>
                  )}

                  {activeTab !== 'istoric' && (
                    <button
                      onClick={() => onDeleteUser(request.id)}
                      disabled={actionLoading === request.id}
                      className="admin-action-button danger-outline"
                      type="button"
                    >
                      {actionLoading === request.id ? '⏳' : 'Șterge'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default RequestsTable

