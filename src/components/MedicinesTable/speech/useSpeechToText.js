import { useCallback } from 'react'

/**
 * Hook “mecanic” care păstrează comportamentul existent al înregistrării vocale.
 * Nu schimbă logica; doar o mută din componentă.
 */
export const useSpeechToText = ({
  recognitionRef,
  isRecording,
  setIsRecording,
  text,
  setText,
  recordedText,
  setRecordedText,
}) => {
  const toggleRecording = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (!SpeechRecognition) {
      alert('Browserul tău nu suportă recunoașterea vocală. Folosește Chrome sau Edge.')
      return
    }

    if (!recognitionRef.current) {
      const recognition = new SpeechRecognition()
      recognition.lang = 'ro-RO'
      recognition.continuous = true
      recognition.interimResults = true
      recognition.maxAlternatives = 1
      recognitionRef.current = recognition
    }

    const recognition = recognitionRef.current

    if (isRecording) {
      setIsRecording(false)
      recognition.stop()

      // Adaugă textul înregistrat la început
      if (recordedText.trim()) {
        const existingText = text.replace(recordedText, '').trim()
        setText(recordedText + (existingText ? `\n\n${existingText}` : ''))
        setRecordedText('')
      }
      return
    }

    // Salvează textul existent (fără textul înregistrat)
    const existingText = text.replace(recordedText, '').trim()
    setRecordedText('')

    recognition.onresult = (event) => {
      let interimTranscript = ''
      let newRecordedText = recordedText

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          newRecordedText = (newRecordedText ? `${newRecordedText} ${transcript}` : transcript).trim()
          setRecordedText(newRecordedText)
        } else {
          interimTranscript += transcript
        }
      }

      // Afișează textul live: textul înregistrat + interim + textul existent
      const displayText =
        newRecordedText +
        (interimTranscript ? ` ${interimTranscript}` : '') +
        (existingText ? `\n\n${existingText}` : '')
      setText(displayText)
    }

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error)
      if (event.error !== 'no-speech') {
        alert('Nu am putut prelua vocea. Încearcă din nou.')
      }
      setIsRecording(false)
    }

    recognition.onend = () => {
      if (isRecording) {
        try {
          recognition.start()
        } catch (error) {
          console.error('Speech recognition restart error:', error)
          setIsRecording(false)
        }
      }
    }

    try {
      recognition.start()
      setIsRecording(true)
    } catch (error) {
      console.error('Speech recognition start error:', error)
      setIsRecording(false)
    }
  }, [isRecording, recognitionRef, recordedText, setIsRecording, setRecordedText, setText, text])

  const stop = useCallback(() => {
    if (recognitionRef.current && isRecording) {
      setIsRecording(false)
      recognitionRef.current.stop()

      // Adaugă textul înregistrat la început
      if (recordedText.trim()) {
        const existingText = text.replace(recordedText, '').trim()
        setText(recordedText + (existingText ? `\n\n${existingText}` : ''))
        setRecordedText('')
      }
    }
  }, [isRecording, recognitionRef, recordedText, setIsRecording, setRecordedText, setText, text])

  return { toggleRecording, stop }
}

