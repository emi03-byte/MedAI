import { useAuthFlow } from './useAuthFlow'

const AuthModals = ({
  API_BASE_URL,
  currentUser,
  accountStatusTitle,
  accountStatusMessage,
  showAccountStatusMessage,
  showStatsModal,
  setShowStatsModal,
  showAccountStatusModal,
  setShowAccountStatusModal,
  showLoginModal,
  setShowLoginModal,
  showLoginRequiredModal,
  setShowLoginRequiredModal,
  showSignUpModal,
  setShowSignUpModal,
  showRecoverModal,
  setShowRecoverModal,
  recoverError,
  setRecoverError,
  recoverLoading,
  handleRecoverAccount,
  handleDeleteAccount,
  onHistoryPageChange,
  setShowHistoryPage,
  setLoadingHistory,
  setPrescriptionHistory,
  setStoredCurrentUser,
  setCurrentUser,
  loadUserData,
  loginEmail,
  setLoginEmail,
  loginPassword,
  setLoginPassword,
  loginError,
  setLoginError,
  showLoginPassword,
  setShowLoginPassword,
  signUpName,
  setSignUpName,
  signUpEmail,
  setSignUpEmail,
  signUpPassword,
  setSignUpPassword,
  signUpConfirmPassword,
  setSignUpConfirmPassword,
  signUpError,
  setSignUpError,
  showSignUpPassword,
  setShowSignUpPassword,
  showSignUpConfirmPassword,
  setShowSignUpConfirmPassword,
}) => {
  const { closeLoginModal, closeSignUpModal, closeRecoverModal } = useAuthFlow({
    setShowLoginModal,
    setLoginEmail,
    setLoginPassword,
    setLoginError,
    setShowLoginPassword,
    setShowSignUpModal,
    setSignUpName,
    setSignUpEmail,
    setSignUpPassword,
    setSignUpConfirmPassword,
    setSignUpError,
    setShowSignUpPassword,
    setShowSignUpConfirmPassword,
    setShowRecoverModal,
    setRecoverError,
  })

  return (
    <>
      {/* Modal pentru Stări */}
      {showStatsModal && (
        <div className="new-patient-modal-overlay" onClick={() => setShowStatsModal(false)}>
          <div className="new-patient-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="new-patient-modal-header">
              <div className="new-patient-modal-icon new-patient-modal-icon--plain" aria-hidden="true" />
              <h3>Setări</h3>
              <button className="new-patient-modal-close" onClick={() => setShowStatsModal(false)} type="button">
                ✕
              </button>
            </div>

            <div className="new-patient-modal-body">
              <div className="settings-modal-body-content">
                {/* Status cont */}
                {currentUser && (
                  <div className="settings-status-card">
                    <h4 style={{ marginBottom: '10px', color: 'var(--text-primary)' }}>Status cont</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      {currentUser.status === 'pending' && (
                        <span className="status-badge status-pending">În așteptare</span>
                      )}
                      {currentUser.status === 'approved' && (
                        <span className="status-badge status-approved">Aprobat</span>
                      )}
                      {currentUser.status === 'rejected' && (
                        <span className="status-badge status-rejected">Respins</span>
                      )}
                    </div>
                    {currentUser.status === 'pending' && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                        Contul tău este în așteptare aprobare. Vei primi acces la toate funcțiile după aprobare.
                      </p>
                    )}
                    {currentUser.status === 'approved' && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                        Contul tău a fost aprobat. Ai acces la toate funcțiile aplicației.
                      </p>
                    )}
                    {currentUser.status === 'rejected' && (
                      <p style={{ color: 'var(--text-secondary)', fontSize: '13px', margin: 0 }}>
                        Contul tău a fost respins. Contactează administratorul pentru mai multe informații.
                      </p>
                    )}
                  </div>
                )}

                <h4 style={{ marginBottom: '15px', color: 'var(--text-primary)' }}>Contul meu</h4>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '20px' }}>
                  Gestionează informațiile contului tău, vezi statusul aprobării și accesează istoricul rețetelor tale.
                </p>
                {!currentUser && (
                  <div style={{ marginTop: '20px' }}>
                    <button
                      onClick={() => {
                        setShowStatsModal(false)
                        setShowLoginModal(true)
                      }}
                      className="settings-modal-button"
                      style={{
                        width: '100%',
                        padding: '0.625rem 1.25rem',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        cursor: 'pointer',
                        marginTop: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                      }}
                      type="button"
                    >
                      Conectare
                    </button>
                  </div>
                )}
                {currentUser && (
                  <div className="settings-actions">
                    <button
                      className="settings-action-button"
                      onClick={async () => {
                        if (!showAccountStatusMessage()) {
                          return
                        }
                        setShowStatsModal(false)
                        setShowHistoryPage(true)
                        onHistoryPageChange(true)
                        setLoadingHistory(true)
                        try {
                          const response = await fetch(
                            `${API_BASE_URL}/api/prescriptions?userId=${currentUser.id}`
                          )
                          const data = await response.json()
                          if (response.ok) {
                            setPrescriptionHistory(data.prescriptions || [])
                          } else {
                            console.error('Eroare la încărcarea istoricului:', data.error)
                          }
                        } catch (error) {
                          console.error('Eroare la încărcarea istoricului:', error)
                        } finally {
                          setLoadingHistory(false)
                        }
                      }}
                      type="button"
                    >
                      Vizualizare istoric
                    </button>
                    <button
                      className="settings-action-button settings-action-button--danger"
                      onClick={handleDeleteAccount}
                      type="button"
                    >
                      Șterge contul
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="new-patient-modal-footer">
              <button
                className="settings-modal-button"
                onClick={() => setShowStatsModal(false)}
                style={{
                  width: '100%',
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease',
                }}
                type="button"
              >
                Închide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pentru status cont */}
      {showAccountStatusModal && (
        <div className="new-patient-modal-overlay" onClick={() => setShowAccountStatusModal(false)}>
          <div className="new-patient-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="new-patient-modal-header">
              <div className="new-patient-modal-icon new-patient-modal-icon--plain" aria-hidden="true" />
              <h3>{accountStatusTitle}</h3>
              <button className="new-patient-modal-close" onClick={() => setShowAccountStatusModal(false)} type="button">
                ✕
              </button>
            </div>

            <div className="new-patient-modal-body">
              <div style={{ padding: '20px' }}>
                {!currentUser ? (
                  <>
                    <p
                      style={{
                        color: 'var(--text-primary)',
                        fontSize: '16px',
                        marginBottom: '20px',
                        whiteSpace: 'pre-line',
                        lineHeight: '1.6',
                      }}
                    >
                      {accountStatusMessage}
                    </p>
                    <div
                      style={{
                        background: 'var(--background-light)',
                        padding: '15px',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        marginBottom: '20px',
                      }}
                    >
                      <p
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: '14px',
                          marginBottom: '10px',
                          fontWeight: '500',
                        }}
                      >
                        După autentificare vei putea:
                      </p>
                      <ul
                        style={{
                          color: 'var(--text-secondary)',
                          fontSize: '14px',
                          textAlign: 'left',
                          marginTop: '10px',
                          paddingLeft: '20px',
                          lineHeight: '1.8',
                        }}
                      >
                        <li>Adăuga medicamente în rețetă</li>
                        <li>Salva planuri de medicamente</li>
                        <li>Gestiona pacienți și notițe</li>
                        <li>Descărca rețete medicale</li>
                        <li>Accesa istoricul rețetelor</li>
                      </ul>
                    </div>
                  </>
                ) : (
                  <p
                    style={{
                      color: 'var(--text-primary)',
                      fontSize: '16px',
                      whiteSpace: 'pre-line',
                      lineHeight: '1.6',
                    }}
                  >
                    {accountStatusMessage}
                  </p>
                )}
              </div>
            </div>

            <div className="new-patient-modal-footer">
              {!currentUser ? (
                <>
                  <button
                    className="new-patient-confirm-button"
                    onClick={() => {
                      setShowAccountStatusModal(false)
                      setShowLoginModal(true)
                    }}
                    style={{ width: '100%', marginBottom: '10px' }}
                    type="button"
                  >
                    Autentificare
                  </button>
                  <button
                    className="new-patient-cancel-button"
                    onClick={() => {
                      setShowAccountStatusModal(false)
                      setShowSignUpModal(true)
                    }}
                    style={{ width: '100%' }}
                    type="button"
                  >
                    Creează cont nou
                  </button>
                </>
              ) : (
                <button
                  className="new-patient-confirm-button"
                  onClick={() => setShowAccountStatusModal(false)}
                  style={{ width: '100%' }}
                  type="button"
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal pentru Login */}
      {showLoginModal && (
        <div className="new-patient-modal-overlay" onClick={closeLoginModal}>
          <div className="new-patient-modal-content auth-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="new-patient-modal-header">
              <div className="new-patient-modal-icon">🔐</div>
              <h3>Autentificare</h3>
              <button className="new-patient-modal-close" onClick={closeLoginModal} type="button">
                ✕
              </button>
            </div>

            <div className="new-patient-modal-body" style={{ paddingTop: loginError ? '0' : undefined }}>
              {loginError && (
                <div
                  style={{
                    padding: '0 16px 8px 16px',
                    margin: '0',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '0',
                    color: '#dc2626',
                    fontSize: '14px',
                    textAlign: 'center',
                    lineHeight: '1.4',
                    width: '100%',
                  }}
                >
                  {loginError}
                </div>
              )}
              <div style={{ padding: loginError ? '0 20px 10px 20px' : '10px 20px' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: 'var(--text-primary)',
                      fontWeight: '500',
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="Introduceți email-ul"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--background-light)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: 'var(--text-primary)',
                      fontWeight: '500',
                    }}
                  >
                    Parolă
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showLoginPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="Introduceți parola"
                      style={{
                        width: '100%',
                        padding: '12px' + (loginPassword ? ' 45px 12px 12px' : ''),
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--background-light)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                    {loginPassword && (
                      <button
                        type="button"
                        onClick={() => setShowLoginPassword(!showLoginPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '5px',
                          fontSize: '18px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {showLoginPassword ? '🙈' : '👁️'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="new-patient-modal-footer">
              <button
                className="new-patient-confirm-button"
                onClick={async () => {
                  setLoginError('')
                  if (!loginEmail || !loginPassword) {
                    setLoginError('Te rugăm să completezi toate câmpurile')
                    return
                  }

                  try {
                    console.log('🔐 [FRONTEND] Trimite cerere de login la backend...')
                    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        email: loginEmail,
                        parola: loginPassword,
                      }),
                    })

                    console.log('📥 [FRONTEND] Răspuns primit de la backend:', response.status)
                    const data = await response.json()
                    console.log('📦 [FRONTEND] Date primite:', data)

                    if (response.ok && data.success) {
                      // Salvează utilizatorul în localStorage
                      console.log('💾 [FRONTEND] Salvare utilizator în localStorage:', data.user)
                      setStoredCurrentUser(data.user)
                      setCurrentUser(data.user)
                      // Încarcă datele utilizatorului din localStorage
                      loadUserData(data.user.id)
                      setShowLoginModal(false)
                      setLoginEmail('')
                      setLoginPassword('')
                      console.log('✅ [FRONTEND] Login reușit!')
                    } else {
                      console.log('❌ [FRONTEND] Eroare la login:', data.error)
                      if (data.code === 'ACCOUNT_DELETED') {
                        setLoginError(data.error)
                      } else {
                        setLoginError(data.error || 'Eroare la autentificare')
                      }
                    }
                  } catch (error) {
                    console.error('❌ [FRONTEND] Eroare la login:', error)
                    setLoginError(
                      `Eroare de conexiune: ${error.message}. Verifică dacă backend-ul rulează pe portul 3001.`
                    )
                  }
                }}
                style={{
                  width: '100%',
                  marginBottom: '10px',
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                }}
                type="button"
              >
                Autentificare
              </button>
              <div
                style={{
                  textAlign: 'center',
                  paddingTop: '15px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>Nu ai cont?</p>
                <button
                  onClick={() => {
                    closeLoginModal()
                    setShowSignUpModal(true)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-color)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                  type="button"
                >
                  Înregistrează-te
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pentru autentificare necesară */}
      {showLoginRequiredModal && (
        <div className="new-patient-modal-overlay" onClick={() => setShowLoginRequiredModal(false)}>
          <div className="new-patient-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="new-patient-modal-header">
              <div className="new-patient-modal-icon">🔐</div>
              <h3>Autentificare necesară</h3>
              <button
                className="new-patient-modal-close"
                onClick={() => setShowLoginRequiredModal(false)}
                type="button"
              >
                ✕
              </button>
            </div>

            <div className="new-patient-modal-body">
              <div style={{ padding: '20px' }}>
                <p
                  style={{
                    color: 'var(--text-primary)',
                    fontSize: '16px',
                    marginBottom: '20px',
                    whiteSpace: 'pre-line',
                    lineHeight: '1.6',
                  }}
                >
                  Pentru a finaliza și a descărca rețeta, trebuie să te autentifici sau să-ți creezi un cont.
                </p>
                <div
                  style={{
                    background: 'var(--background-light)',
                    padding: '15px',
                    borderRadius: '8px',
                    border: '1px solid var(--border-color)',
                    marginBottom: '20px',
                  }}
                >
                  <p
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      marginBottom: '10px',
                      fontWeight: '500',
                    }}
                  >
                    După autentificare vei putea:
                  </p>
                  <ul
                    style={{
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      textAlign: 'left',
                      marginTop: '10px',
                      paddingLeft: '20px',
                      lineHeight: '1.8',
                    }}
                  >
                    <li>Finaliza și descărca rețeta</li>
                    <li>Adăuga medicamente în rețetă</li>
                    <li>Salva planuri de medicamente</li>
                    <li>Gestiona pacienți și notițe</li>
                    <li>Accesa istoricul rețetelor</li>
                    <li>Adăuga indicații pentru pacienți și medici</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="new-patient-modal-footer">
              <button
                className="new-patient-confirm-button"
                onClick={() => {
                  setShowLoginRequiredModal(false)
                  setShowLoginModal(true)
                }}
                style={{ width: '100%', marginBottom: '10px' }}
                type="button"
              >
                Autentificare
              </button>
              <button
                className="new-patient-cancel-button"
                onClick={() => {
                  setShowLoginRequiredModal(false)
                  setShowSignUpModal(true)
                }}
                style={{ width: '100%' }}
                type="button"
              >
                Creează cont nou
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal pentru Sign Up */}
      {showSignUpModal && (
        <div className="new-patient-modal-overlay" onClick={closeSignUpModal}>
          <div className="new-patient-modal-content auth-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="new-patient-modal-header">
              <div className="new-patient-modal-icon">📝</div>
              <h3>Înregistrare</h3>
              <button className="new-patient-modal-close" onClick={closeSignUpModal} type="button">
                ✕
              </button>
            </div>

            <div className="new-patient-modal-body" style={{ paddingTop: signUpError ? '0' : undefined }}>
              {signUpError && (
                <div
                  style={{
                    padding: '0 16px 8px 16px',
                    margin: '0',
                    background: 'transparent',
                    border: 'none',
                    borderRadius: '0',
                    color: '#dc2626',
                    fontSize: '14px',
                    textAlign: 'center',
                    lineHeight: '1.4',
                    width: '100%',
                    marginTop: '0',
                    marginBottom: '0',
                  }}
                >
                  {signUpError}
                </div>
              )}
              <div
                style={{
                  padding: signUpError ? '0 20px 10px 20px' : '10px 20px',
                  marginTop: signUpError ? '0' : undefined,
                }}
              >
                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: 'var(--text-primary)',
                      fontWeight: '500',
                    }}
                  >
                    Nume complet
                  </label>
                  <input
                    type="text"
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    placeholder="Introduceți numele complet"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--background-light)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: 'var(--text-primary)',
                      fontWeight: '500',
                    }}
                  >
                    Email
                  </label>
                  <input
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    placeholder="Introduceți email-ul"
                    style={{
                      width: '100%',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid var(--border-color)',
                      background: 'var(--background-light)',
                      color: 'var(--text-primary)',
                      fontSize: '14px',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: 'var(--text-primary)',
                      fontWeight: '500',
                    }}
                  >
                    Parolă
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      value={signUpPassword}
                      onChange={(e) => setSignUpPassword(e.target.value)}
                      placeholder="Introduceți parola"
                      style={{
                        width: '100%',
                        padding: '12px' + (signUpPassword ? ' 45px 12px 12px' : ''),
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--background-light)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                    {signUpPassword && (
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '5px',
                          fontSize: '18px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {showSignUpPassword ? '🙈' : '👁️'}
                      </button>
                    )}
                  </div>
                </div>
                <div style={{ marginBottom: '20px' }}>
                  <label
                    style={{
                      display: 'block',
                      marginBottom: '8px',
                      color: 'var(--text-primary)',
                      fontWeight: '500',
                    }}
                  >
                    Confirmă parola
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showSignUpConfirmPassword ? 'text' : 'password'}
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      placeholder="Confirmați parola"
                      style={{
                        width: '100%',
                        padding: '12px' + (signUpConfirmPassword ? ' 45px 12px 12px' : ''),
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--background-light)',
                        color: 'var(--text-primary)',
                        fontSize: '14px',
                        boxSizing: 'border-box',
                      }}
                    />
                    {signUpConfirmPassword && (
                      <button
                        type="button"
                        onClick={() =>
                          setShowSignUpConfirmPassword(!showSignUpConfirmPassword)
                        }
                        style={{
                          position: 'absolute',
                          right: '10px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '5px',
                          fontSize: '18px',
                          color: 'var(--text-secondary)',
                        }}
                      >
                        {showSignUpConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="new-patient-modal-footer">
              <button
                className="new-patient-confirm-button"
                onClick={async () => {
                  setSignUpError('')

                  // Validare
                  if (!signUpName || !signUpEmail || !signUpPassword || !signUpConfirmPassword) {
                    setSignUpError('Te rugăm să completezi toate câmpurile')
                    return
                  }

                  if (signUpPassword.length < 6) {
                    setSignUpError('Parola trebuie să aibă cel puțin 6 caractere')
                    return
                  }

                  if (signUpPassword !== signUpConfirmPassword) {
                    setSignUpError('Parolele nu coincid')
                    return
                  }

                  try {
                    console.log('📝 [FRONTEND] Trimite cerere de signup la backend...', {
                      nume: signUpName,
                      email: signUpEmail,
                    })
                    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({
                        nume: signUpName,
                        email: signUpEmail,
                        parola: signUpPassword,
                      }),
                    })

                    console.log('📥 [FRONTEND] Răspuns primit de la backend:', response.status)
                    const data = await response.json()
                    console.log('📦 [FRONTEND] Date primite:', data)

                    if (response.ok && data.success) {
                      // Salvează utilizatorul în localStorage
                      console.log('💾 [FRONTEND] Salvare utilizator în localStorage:', data.user)
                      setStoredCurrentUser(data.user)
                      setCurrentUser(data.user)
                      // Încarcă datele utilizatorului din localStorage (pentru utilizatori noi va fi gol)
                      loadUserData(data.user.id)
                      setShowSignUpModal(false)
                      setSignUpName('')
                      setSignUpEmail('')
                      setSignUpPassword('')
                      setSignUpConfirmPassword('')
                      console.log('✅ [FRONTEND] Signup reușit!')
                      // Dacă contul este în așteptare, deschide setările pentru a vedea statusul
                      if (data.user.status === 'pending') {
                        setTimeout(() => {
                          setShowStatsModal(true)
                        }, 500)
                      }
                    } else {
                      console.log('❌ [FRONTEND] Eroare la signup:', data.error)
                      if (data.code === 'ACCOUNT_DELETED') {
                        setSignUpError('')
                        setRecoverError('')
                        setShowRecoverModal(true)
                      } else {
                        setSignUpError(data.error || 'Eroare la crearea contului')
                      }
                    }
                  } catch (error) {
                    console.error('❌ [FRONTEND] Eroare la signup:', error)
                    setSignUpError(
                      `Eroare de conexiune: ${error.message}. Verifică dacă backend-ul rulează pe portul 3001.`
                    )
                  }
                }}
                style={{
                  width: '100%',
                  marginBottom: '10px',
                  padding: '0.625rem 1.25rem',
                  fontSize: '0.8125rem',
                  fontWeight: '500',
                }}
                type="button"
              >
                Înregistrează-te
              </button>
              <div
                style={{
                  textAlign: 'center',
                  paddingTop: '15px',
                  borderTop: '1px solid var(--border-color)',
                }}
              >
                <p style={{ color: 'var(--text-secondary)', marginBottom: '10px' }}>Ai deja cont?</p>
                <button
                  onClick={() => {
                    closeSignUpModal()
                    setShowLoginModal(true)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--primary-color)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    fontSize: '14px',
                    fontWeight: '500',
                  }}
                  type="button"
                >
                  Autentifică-te
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pentru recuperare cont șters */}
      {showRecoverModal && (
        <div className="new-patient-modal-overlay" onClick={closeRecoverModal}>
          <div className="new-patient-modal-content auth-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="new-patient-modal-header">
              <div className="new-patient-modal-icon">🧭</div>
              <h3>Cont șters detectat</h3>
              <button className="new-patient-modal-close" onClick={closeRecoverModal} type="button">
                ✕
              </button>
            </div>

            <div className="new-patient-modal-body">
              <div style={{ padding: '20px' }}>
                <p style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
                  Email-ul <strong>{signUpEmail}</strong> are un cont șters.
                </p>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Poți restaura contul vechi sau poți crea un cont nou de la zero pe același email.
                </p>
              </div>
            </div>

            {recoverError && (
              <div
                style={{
                  padding: '12px',
                  margin: '0 20px 15px 20px',
                  background: '#fee2e2',
                  border: '1px solid #fca5a5',
                  borderRadius: '8px',
                  color: '#dc2626',
                  fontSize: '14px',
                }}
              >
                {recoverError}
              </div>
            )}

            <div className="new-patient-modal-footer">
              <button
                className="new-patient-confirm-button"
                onClick={() => handleRecoverAccount('restore')}
                disabled={recoverLoading}
                style={{ width: '100%', marginBottom: '10px' }}
                type="button"
              >
                {recoverLoading ? 'Se procesează...' : 'Restaurează contul'}
              </button>
              <button
                className="new-patient-cancel-button"
                onClick={() => handleRecoverAccount('new')}
                disabled={recoverLoading}
                style={{ width: '100%', marginBottom: '10px' }}
                type="button"
              >
                Cont nou (de la zero)
              </button>
              <button
                className="new-patient-cancel-button"
                onClick={closeRecoverModal}
                style={{ width: '100%' }}
                type="button"
              >
                Anulează
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default AuthModals

