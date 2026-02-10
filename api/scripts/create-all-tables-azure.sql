-- Rulează în Azure SQL (Query editor) pe baza MedAI.
-- Creează toate tabelele necesare pentru backend-ul Express (auth, rețete, user_medicines).
-- Rulează și create-medications-table.sql dacă nu ai deja tabela medications.

-- 1. users
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'users')
BEGIN
  CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    nume NVARCHAR(500) NOT NULL,
    email NVARCHAR(500) NOT NULL,
    parola NVARCHAR(MAX) NOT NULL,
    data_creare DATETIME2 DEFAULT GETUTCDATE(),
    status NVARCHAR(50) DEFAULT 'pending',
    is_admin INT DEFAULT 0,
    data_aprobare DATETIME2,
    deleted_at DATETIME2,
    CONSTRAINT UQ_users_email UNIQUE (email)
  );
  PRINT 'Tabela users creată.';
END
ELSE
  PRINT 'Tabela users există deja.';

-- 2. retete
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'retete')
BEGIN
  CREATE TABLE retete (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    nume_pacient NVARCHAR(MAX),
    medicamente NVARCHAR(MAX) NOT NULL,
    planuri_tratament NVARCHAR(MAX),
    indicatii_pacient NVARCHAR(MAX),
    indicatii_medic NVARCHAR(MAX),
    data_creare DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_retete_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  PRINT 'Tabela retete creată.';
END
ELSE
  PRINT 'Tabela retete există deja.';

-- 3. user_medicines
IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'user_medicines')
BEGIN
  CREATE TABLE user_medicines (
    id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    denumire NVARCHAR(MAX) NOT NULL,
    forma_farmaceutica NVARCHAR(MAX),
    concentratie NVARCHAR(MAX),
    substanta_activa NVARCHAR(MAX),
    cod_atc NVARCHAR(MAX),
    mod_prescriere NVARCHAR(MAX),
    note NVARCHAR(MAX),
    created_at DATETIME2 DEFAULT GETUTCDATE(),
    updated_at DATETIME2 DEFAULT GETUTCDATE(),
    CONSTRAINT FK_user_medicines_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );
  PRINT 'Tabela user_medicines creată.';
END
ELSE
  PRINT 'Tabela user_medicines există deja.';
