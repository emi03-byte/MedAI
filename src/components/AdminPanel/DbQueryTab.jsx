import { useState } from 'react'
import { executeDbQuery } from '../../api/adminApi'
import '../MedicinesTable.css'

const DbQueryTab = ({ adminUserId }) => {
  const [query, setQuery] = useState('SELECT * FROM users LIMIT 10')
  const [queryType, setQueryType] = useState('all')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const exampleQueries = [
    { label: 'Toți utilizatorii (limitat)', sql: 'SELECT * FROM users LIMIT 10' },
    { label: 'Număr medicamente', sql: 'SELECT COUNT(*) as count FROM medications' },
    { label: 'Utilizatori aprobați', sql: "SELECT id, nume, email, status FROM users WHERE status = 'approved' LIMIT 20" },
    { label: 'Medicamente (primele 10)', sql: 'SELECT id, denumire_medicament, substanta_activa FROM medications LIMIT 10' },
    { label: 'Rețete (primele 10)', sql: 'SELECT id, user_id, nume_pacient, data_creare FROM retete LIMIT 10' },
    { label: 'Utilizatori cu rețete', sql: 'SELECT u.id, u.nume, u.email, COUNT(r.id) as numar_retete FROM users u LEFT JOIN retete r ON u.id = r.user_id GROUP BY u.id LIMIT 20' },
  ]

  const handleExecute = async () => {
    if (!query.trim()) {
      setError('Query-ul nu poate fi gol')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await executeDbQuery({
        adminUserId,
        query: query.trim(),
        type: queryType,
      })

      if (response.success) {
        setResult(response)
      } else {
        setError(response.error || 'Eroare necunoscută')
      }
    } catch (err) {
      setError(err?.message || 'Eroare la executarea query-ului')
      console.error('DB Query Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleExampleClick = (exampleSql) => {
    setQuery(exampleSql)
    setError(null)
    setResult(null)
  }

  const formatResult = (data) => {
    if (!data) return null

    if (Array.isArray(data)) {
      if (data.length === 0) {
        return <div className="db-query-empty">Nu s-au găsit rezultate</div>
      }

      // Obține coloanele din primul rând
      const columns = Object.keys(data[0])

      return (
        <div className="db-query-table-container">
          <table className="db-query-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col}>{col}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  {columns.map((col) => (
                    <td key={col}>
                      {row[col] === null || row[col] === undefined
                        ? 'NULL'
                        : typeof row[col] === 'object'
                        ? JSON.stringify(row[col])
                        : String(row[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )
    } else {
      // Single row result
      return (
        <div className="db-query-single-result">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="db-query-row">
              <strong>{key}:</strong>{' '}
              <span>
                {value === null || value === undefined
                  ? 'NULL'
                  : typeof value === 'object'
                  ? JSON.stringify(value)
                  : String(value)}
              </span>
            </div>
          ))}
        </div>
      )
    }
  }

  return (
    <div className="db-query-container">
      <div className="db-query-header">
        <h3>🔍 Query SQL Database</h3>
        <p className="db-query-subtitle">
          Execută query-uri SELECT pentru a interoga baza de date. Doar query-uri SELECT sunt permise pentru siguranță.
        </p>
      </div>

      <div className="db-query-examples">
        <div className="db-query-examples-label">Exemple rapide:</div>
        <div className="db-query-examples-buttons">
          {exampleQueries.map((example, idx) => (
            <button
              key={idx}
              type="button"
              className="db-query-example-btn"
              onClick={() => handleExampleClick(example.sql)}
              title={example.label}
            >
              {example.label}
            </button>
          ))}
        </div>
      </div>

      <div className="db-query-editor">
        <div className="db-query-editor-header">
          <label htmlFor="db-query-input">Query SQL:</label>
          <div className="db-query-type-selector">
            <label>
              <input
                type="radio"
                value="all"
                checked={queryType === 'all'}
                onChange={(e) => setQueryType(e.target.value)}
              />
              Toate rândurile
            </label>
            <label>
              <input
                type="radio"
                value="get"
                checked={queryType === 'get'}
                onChange={(e) => setQueryType(e.target.value)}
              />
              Un singur rând
            </label>
          </div>
        </div>
        <textarea
          id="db-query-input"
          className="db-query-textarea"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="SELECT * FROM users LIMIT 10"
          rows={8}
        />
        <button
          type="button"
          className="db-query-execute-btn"
          onClick={handleExecute}
          disabled={loading || !query.trim()}
        >
          {loading ? '⏳ Se execută...' : '▶️ Execută Query'}
        </button>
      </div>

      {error && (
        <div className="db-query-error">
          <strong>❌ Eroare:</strong> {error}
        </div>
      )}

      {result && (
        <div className="db-query-result">
          <div className="db-query-result-header">
            <h4>✅ Rezultate</h4>
            <div className="db-query-result-stats">
              <span>Rânduri: {result.count}</span>
              {result.executionTime && <span>Timp: {result.executionTime}</span>}
            </div>
          </div>
          {formatResult(result.result)}
        </div>
      )}
    </div>
  )
}

export default DbQueryTab
