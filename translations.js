// Translations for the UI
const translations = {
	en: {
		welcome: 'Transform your voice into text effortlessly.',
		features:
			'Features live waveform visualization, multi-language support, and smart device handling.',
		demo: "Welcome! This demo showcases client-side speech recognition using the browser's Web Speech API. Try the live microphone recording, upload audio files to playback and transcribe while playing, or paste text to the editor.",
		bestResults:
			'For best results use Chrome/Chromium and allow microphone access when prompted.',
		langSelect: 'Select Interface Language',
		letsStart: "Let's Start",
		back: 'Back',
		settings: 'Settings',
		history: 'History',
		help: 'Help',
		microphone: 'Microphone',
		uploadAudio: 'Upload Audio',
		voiceRecognition: 'Voice Recognition',
		ready: 'Ready',
		listening: 'Listening...',
		noSpeech: 'No speech detected',
		networkError: 'Network error - check your connection',
		micDenied: 'Microphone access denied',
		start: 'Start Recording',
		stop: 'Stop',
		pause: 'Pause',
		resume: 'Resume',
		noiseLevel: 'Noise Level',
		confidence: 'Confidence',
		result: 'Result',
		download: 'Download .txt',
		copy: 'Copy',
		transcribe: 'Transcribe Audio',
		clearHistory: 'Clear History',
		theme: 'Theme',
		dark: 'Dark',
		light: 'Light',
		autoSave: 'Auto-save transcriptions',
		interfaceLanguage: 'Interface Language',
		recognitionLanguage: 'Recognition Language',
	},
	uk: {
		welcome: 'Перетворіть свій голос у текст без зусиль.',
		features:
			'Включає візуалізацію звукової хвилі, підтримку багатьох мов та розумне керування пристроями.',
		demo: 'Вітаємо! Це демонстрація розпізнавання мовлення на стороні клієнта за допомогою Web Speech API браузера. Спробуйте запис через мікрофон, завантажте аудіофайли для відтворення та транскрибації під час відтворення.',
		bestResults:
			"Для найкращих результатів використовуйте Chrome/Chromium та дозвольте доступ до мікрофона, коли з'явиться запит.",
		langSelect: 'Оберіть мову інтерфейсу',
		letsStart: 'Почати',
		back: 'Назад',
		settings: 'Налаштування',
		history: 'Історія',
		help: 'Довідка',
		microphone: 'Мікрофон',
		uploadAudio: 'Завантажити аудіо',
		voiceRecognition: 'Розпізнавання голосу',
		ready: 'Готово',
		listening: 'Слухаю...',
		noSpeech: 'Мовлення не виявлено',
		networkError: "Помилка мережі - перевірте з'єднання",
		micDenied: 'Доступ до мікрофона заборонено',
		start: 'Почати запис',
		stop: 'Стоп',
		pause: 'Пауза',
		resume: 'Продовжити',
		noiseLevel: 'Рівень шуму',
		confidence: 'Точність',
		result: 'Результат',
		download: 'Завантажити .txt',
		copy: 'Копіювати',
		transcribe: 'Транскрибувати аудіо',
		clearHistory: 'Очистити історію',
		theme: 'Тема',
		dark: 'Темна',
		light: 'Світла',
		autoSave: 'Автозбереження транскрипцій',
		interfaceLanguage: 'Мова інтерфейсу',
		recognitionLanguage: 'Мова розпізнавання',
	},
	ru: {
		welcome: 'Преобразуйте свой голос в текст без усилий.',
		features:
			'Включает визуализацию звуковой волны, поддержку многих языков и умное управление устройствами.',
		demo: 'Добро пожаловать! Это демонстрация распознавания речи на стороне клиента с помощью Web Speech API браузера. Попробуйте запись через микрофон, загрузите аудиофайлы для воспроизведения и транскрибации во время воспроизведения.',
		bestResults:
			'Для наилучших результатов используйте Chrome/Chromium и разрешите доступ к микрофону, когда появится запрос.',
		langSelect: 'Выберите язык интерфейса',
		letsStart: 'Начать',
		back: 'Назад',
		settings: 'Настройки',
		history: 'История',
		help: 'Справка',
		microphone: 'Микрофон',
		uploadAudio: 'Загрузить аудио',
		voiceRecognition: 'Распознавание голоса',
		ready: 'Готово',
		listening: 'Слушаю...',
		noSpeech: 'Речь не обнаружена',
		networkError: 'Ошибка сети - проверьте соединение',
		micDenied: 'Доступ к микрофону запрещен',
		start: 'Начать запись',
		stop: 'Стоп',
		pause: 'Пауза',
		resume: 'Продолжить',
		noiseLevel: 'Уровень шума',
		confidence: 'Точность',
		result: 'Результат',
		download: 'Скачать .txt',
		copy: 'Копировать',
		transcribe: 'Транскрибировать аудио',
		clearHistory: 'Очистить историю',
		theme: 'Тема',
		dark: 'Тёмная',
		light: 'Светлая',
		autoSave: 'Автосохранение транскрипций',
		interfaceLanguage: 'Язык интерфейса',
		recognitionLanguage: 'Язык распознавания',
	},
}

// Supported interface languages
const INTERFACE_LANGUAGES = [
	['en', 'English'],
	['uk', 'Українська'],
	['ru', 'Русский'],
]

// Recognition languages (this is an extended list of languages supported by Web Speech API)
const RECOGNITION_LANGUAGES = [
	['en-US', 'English (US)'],
	['en-GB', 'English (UK)'],
	['uk-UA', 'Ukrainian'],
	['ru-RU', 'Russian'],
	['es-ES', 'Spanish'],
	['fr-FR', 'French'],
	['de-DE', 'German'],
	['it-IT', 'Italian'],
	['pt-PT', 'Portuguese'],
	['pl-PL', 'Polish'],
	['nl-NL', 'Dutch'],
	['ja-JP', 'Japanese'],
	['ko-KR', 'Korean'],
	['zh-CN', 'Chinese (Simplified)'],
	['zh-TW', 'Chinese (Traditional)'],
	['ar-SA', 'Arabic'],
	['hi-IN', 'Hindi'],
	['tr-TR', 'Turkish'],
	['vi-VN', 'Vietnamese'],
]

// Default language for interface
const DEFAULT_INTERFACE_LANGUAGE = 'en'

// Language utilities
function getBrowserLanguage() {
	const lang = navigator.language || navigator.userLanguage
	const shortLang = lang.split('-')[0]

	// Check if we support the full locale first
	if (translations[lang]) return lang

	// Then check if we support the language part
	if (translations[shortLang]) return shortLang

	// Default to English if we don't support the browser language
	return DEFAULT_INTERFACE_LANGUAGE
}

function getTranslation(key, lang = getCurrentInterfaceLanguage()) {
	return (
		translations[lang]?.[key] ||
		translations[DEFAULT_INTERFACE_LANGUAGE][key] ||
		key
	)
}

function getCurrentInterfaceLanguage() {
	return localStorage.getItem('interfaceLanguage') || getBrowserLanguage()
}

function setInterfaceLanguage(lang) {
	if (translations[lang]) {
		localStorage.setItem('interfaceLanguage', lang)
		return true
	}
	return false
}

// Export for use in main app
window.Translations = {
	getTranslation,
	getCurrentInterfaceLanguage,
	setInterfaceLanguage,
	INTERFACE_LANGUAGES,
	RECOGNITION_LANGUAGES,
}
