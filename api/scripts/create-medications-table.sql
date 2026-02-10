-- Rulează acest script în Azure SQL (Query editor) pe baza MedAI.
-- Creează tabela medications așteptată de API.

IF NOT EXISTS (SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'medications')
BEGIN
  CREATE TABLE medications (
    id INT IDENTITY(1,1) PRIMARY KEY,
    denumire_medicament NVARCHAR(MAX),
    substanta_activa NVARCHAR(MAX),
    lista_compensare NVARCHAR(MAX),
    cod_medicament NVARCHAR(500),
    forma_farmaceutica NVARCHAR(MAX),
    cod_atc NVARCHAR(500),
    mod_prescriere NVARCHAR(MAX),
    concentratie NVARCHAR(MAX),
    forma_ambalare NVARCHAR(MAX),
    nume_detinator_app NVARCHAR(MAX),
    tara_detinator_app NVARCHAR(MAX),
    cantitate_pe_forma_ambalare NVARCHAR(MAX),
    pret_max_forma_ambalare NVARCHAR(MAX),
    pret_max_ut NVARCHAR(MAX),
    contributie_max_100 NVARCHAR(MAX),
    contributie_max_90_50_20 NVARCHAR(MAX),
    contributie_max_pensionari_90 NVARCHAR(MAX),
    categorie_varsta NVARCHAR(MAX),
    coduri_boli NVARCHAR(MAX)
  );
  PRINT 'Tabela medications a fost creată.';
END
ELSE
  PRINT 'Tabela medications există deja.';
