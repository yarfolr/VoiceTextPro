# Text Recognization — minimal web demo

Simple local demo project (HTML/CSS/JS) implementing a client-side speech-to-text playground with a dark purple/violet theme.

Features

- Landing page with author credit and links to GitHub/Telegram (bottom-left)
- Help page describing features and limitations
- Language selection for SpeechRecognition
- Paste text and upload .txt files
- Upload audio file (playback) and "Transcribe while playing" (captures via microphone)
- Live microphone recording with waveform and live transcription (Web Speech API)
- Download transcript as .txt or copy to clipboard

How to run

1. Open `index.html` in a Chromium-based browser (Chrome/Edge) for best SpeechRecognition support.
2. Click "Let's start" and choose a language.
3. Allow microphone permissions when prompted for recording.

Notes

- Browser compatibility: the Web Speech API is not standardized across all browsers. For best experience use Chrome/Chromium.
- Uploaded audio transcription via the browser is limited. For robust audio-file transcription, a server-side model or cloud service is recommended.

Author: Yaroslav Antoniuk "rettargatted"
