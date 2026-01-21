export const mapMedicationRowToUi = (row) => ({
  'Denumire medicament': row?.denumire_medicament || '',
  'Substanta activa': row?.substanta_activa || '',
  'Lista de compensare': row?.lista_compensare || '',
  'Cod medicament': row?.cod_medicament || '',
  'Formă farmaceutica': row?.forma_farmaceutica || '',
  'Cod ATC': row?.cod_atc || '',
  'Mod de prescriere': row?.mod_prescriere || '',
  Concentratie: row?.concentratie || '',
  'Forma de ambalare': row?.forma_ambalare || '',
  'Nume detinator APP': row?.nume_detinator_app || '',
  'Tara detinator APP': row?.tara_detinator_app || '',
  'Cantitate pe forma ambalare': row?.cantitate_pe_forma_ambalare || '',
  'Preț maximal al medicamentului raportat la forma de ambalare': row?.pret_max_forma_ambalare || '',
  'Pret maximal al medicamentului raportat la UT': row?.pret_max_ut || '',
  'Contributie maxima a asiguratului raportat la UT, pentru asiguratii care beneficiază de compensare 100% din prețul de referinta':
    row?.contributie_max_100 || '',
  'Contributie maxima a asiguratului raportat la UT, pentru asiguratii care beneficiaza de compensare 90% - sublista A, 50% - sublista B, 20% - sublista D din prețul de referinta':
    row?.contributie_max_90_50_20 || '',
  'Contribuție maxima a asiguratului raportat la UT, pentru asiguratii care beneficiază de compensare 90% din pretul de referinta, pentru pensionari cu venituri de pana la 1.299 lei/luna inclusiv':
    row?.contributie_max_pensionari_90 || '',
})

export const mapMedicationRowsToUi = (rows) =>
  Array.isArray(rows) ? rows.map(mapMedicationRowToUi) : []

