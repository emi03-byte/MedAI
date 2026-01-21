import { useMemo } from 'react'

export const useHistoryFilters = ({
  prescriptionHistory,
  historyDateFilter,
  historySpecificDate,
  historyNameFilter,
}) => {
  const filteredHistory = useMemo(() => {
    // Filtrare rețete (logică identică cu cea din MedicinesTable.jsx)
    let filtered = prescriptionHistory

    // Filtrare după dată
    if (historyDateFilter !== 'toate' || historySpecificDate) {
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

      filtered = filtered.filter((prescription) => {
        const prescriptionDate = new Date(prescription.data_creare)
        const prescriptionDateOnly = new Date(
          prescriptionDate.getFullYear(),
          prescriptionDate.getMonth(),
          prescriptionDate.getDate()
        )

        if (historyDateFilter === 'specifica' && historySpecificDate) {
          const selectedDate = new Date(historySpecificDate)
          const selectedDateOnly = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            selectedDate.getDate()
          )
          return prescriptionDateOnly.getTime() === selectedDateOnly.getTime()
        } else if (historyDateFilter === 'azi') {
          return prescriptionDateOnly.getTime() === today.getTime()
        } else if (historyDateFilter === 'saptamana') {
          const weekAgo = new Date(today)
          weekAgo.setDate(weekAgo.getDate() - 7)
          return prescriptionDate >= weekAgo
        } else if (historyDateFilter === 'luna') {
          const monthAgo = new Date(today)
          monthAgo.setMonth(monthAgo.getMonth() - 1)
          return prescriptionDate >= monthAgo
        } else if (historyDateFilter === 'anul') {
          const yearAgo = new Date(today)
          yearAgo.setFullYear(yearAgo.getFullYear() - 1)
          return prescriptionDate >= yearAgo
        }
        return true
      })
    }

    // Filtrare după nume
    if (historyNameFilter) {
      const nameFilterLower = historyNameFilter.toLowerCase().trim()
      filtered = filtered.filter((prescription) => {
        const patientName = (prescription.nume_pacient || '').toLowerCase()
        return patientName.includes(nameFilterLower)
      })
    }

    return filtered
  }, [historyDateFilter, historyNameFilter, historySpecificDate, prescriptionHistory])

  const hasActiveFilters = useMemo(
    () => historyDateFilter !== 'toate' || !!historySpecificDate || !!historyNameFilter,
    [historyDateFilter, historyNameFilter, historySpecificDate]
  )

  return { filteredHistory, hasActiveFilters }
}

