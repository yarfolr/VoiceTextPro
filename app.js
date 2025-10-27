// Minimal speech-to-text app logic with multi-language support
const startBtn = document.getElementById('startBtn')
const landing = document.getElementById('landing')
const appSection = document.getElementById('app')
const languagesDiv = document.getElementById('languages')
const interfaceLanguagesDiv = document.getElementById('interfaceLanguages')
const actions = document.getElementById('actions')

// Initialize interface language
function initializeLanguage() {
	const currentLang = Translations.getCurrentInterfaceLanguage()
	const select = document.getElementById('interfaceLangSelect')
	const startBtn = document.getElementById('startBtn')
	const warningIcon = document.getElementById('langWarningIcon')
	const langStatus = document.getElementById('interfaceLangStatus')

	// Populate dropdown
	select.innerHTML =
		`<option value="">Select language</option>` +
		Translations.INTERFACE_LANGUAGES.map(
			([code, name]) => `<option value="${code}">${name}</option>`
		).join('')

	// Set initial state
	if (currentLang) {
		select.value = currentLang
		updateInterfaceLanguage(currentLang)
		startBtn.disabled = false
		warningIcon.classList.add('hidden')
		langStatus.innerHTML = `
            <svg class="icon success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Selected
        `
		langStatus.classList.add('updated')
	} else {
		startBtn.disabled = true
		warningIcon.classList.remove('hidden')
		setTimeout(() => {
			showToast('Please select your interface language to continue', {
				type: 'warning',
				timeout: 4000,
			})
		}, 1000)
	}

	// Handle language selection
	select.addEventListener('change', () => {
		const code = select.value
		if (code) {
			updateInterfaceLanguage(code)
			startBtn.disabled = false
			warningIcon.classList.add('hidden')

			// Update status with success icon
			langStatus.innerHTML = `
                <svg class="icon success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Updated
            `
			langStatus.classList.add('updated')

			// Show success toast
			showToast('Interface language updated successfully', {
				type: 'success',
				timeout: 3000,
			})

			// Animate status
			requestAnimationFrame(() => {
				langStatus.style.animation = 'none'
				langStatus.offsetHeight // Force reflow
				langStatus.style.animation = ''
			})

			setTimeout(() => {
				langStatus.classList.remove('updated')
			}, 2000)
		} else {
			startBtn.disabled = true
			warningIcon.classList.remove('hidden')
			showToast('Please select a language', { type: 'warning', timeout: 3000 })
		}
	})
}

// Create interface language dropdown
function createInterfaceLanguageDropdown() {
	// Clear existing options
	const select = document.getElementById('interfaceLangSelect')
	const startBtn = document.getElementById('startBtn')
	select.innerHTML = ''

	select.innerHTML =
		`<option value="">Select language</option>` +
		Translations.INTERFACE_LANGUAGES.map(
			([code, name]) => `<option value="${code}">${name}</option>`
		).join('')

	const currentLang = Translations.getCurrentInterfaceLanguage()
	if (currentLang) {
		select.value = currentLang
		startBtn.disabled = false
	} else {
		startBtn.disabled = true
	}

	// Handle language selection
	select.addEventListener('change', () => {
		const code = select.value
		if (code) {
			updateInterfaceLanguage(code)
			startBtn.disabled = false
			document.getElementById('interfaceLangStatus').textContent = 'Updated'
			document.getElementById('interfaceLangStatus').classList.add('updated')
			setTimeout(() => {
				document
					.getElementById('interfaceLangStatus')
					.classList.remove('updated')
			}, 1000)
		} else {
			startBtn.disabled = true
		}
	})
}

// Update all interface text based on selected language
function updateInterfaceLanguage(lang) {
	Translations.setInterfaceLanguage(lang)
	document.querySelectorAll('[data-i18n]').forEach(element => {
		const key = element.getAttribute('data-i18n')
		element.textContent = Translations.getTranslation(key, lang)
	})
}
// paste button removed from UI; keep variable undefined to avoid accidental use
const pasteBtn = document.getElementById('pasteBtn')
const fileInput = document.getElementById('fileInput')
const recordBtn = document.getElementById('recordBtn')
const audioControls = document.getElementById('audioControls')
const playUploaded = document.getElementById('playUploaded')
// In HTML the button id is `transcribeAudio` — ensure we reference that element
const transcribeAudio = document.getElementById('transcribeAudio')
const recArea = document.getElementById('recArea')
const recStart = document.getElementById('recStart')
const recStop = document.getElementById('recStop')
const recPause = document.getElementById('recPause')
const waveform = document.getElementById('waveform')
const resultText = document.getElementById('resultText')
const downloadTxt = document.getElementById('downloadTxt')
const copyText = document.getElementById('copyText')
const deviceSelect = document.getElementById('deviceSelect')
const deviceRow = document.getElementById('deviceRow')
const deviceStatus = document.getElementById('deviceStatus')

let selectedLang = 'en-US'
let recognition = null
let audioElement = null
let audioFile = null
let isRecordingActive = false
let audioPaused = false
let volumeCheckInterval = null
let lastTranscriptTime = Date.now()
// Track whether the SpeechRecognition instance is currently running
let recognitionRunning = false
let signalMonitorInterval = null
let recognitionStarting = false
// Throttle identical error logs to avoid console spam
const lastErrorTimestamps = {}

// Debug toggle: set to true to enable original verbose error callbacks (for development)
const DEBUG_LOGGING = false

// Toast helper
function showToast(message, opts = {}) {
	const type = opts.type || 'info'
	const toast =
		document.getElementById('toast') || document.createElement('div')
	if (!toast.id) {
		toast.id = 'toast'
		toast.className = 'toast'
		document.body.appendChild(toast)
	}

	const icons = {
		success: `<svg class="icon success-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>`,
		warning: `<svg class="icon warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>`,
		error: `<svg class="icon error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>`,
		info: `<svg class="icon info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 16v-4m0-4h.01"/>
                </svg>`,
	}

	toast.innerHTML = `${icons[type]}${message}`
	toast.className = `toast ${type}`
	toast.classList.remove('hidden')

	requestAnimationFrame(() => {
		toast.classList.add('show')
	})

	const timeout = opts.timeout || 6000
	if (opts.persistent) return

	setTimeout(() => {
		toast.classList.remove('show')
		setTimeout(() => toast.classList.add('hidden'), 300)
	}, timeout)
}

function throttleError(key, fn, minMs = 1200) {
	const now = Date.now()
	if (!lastErrorTimestamps[key] || now - lastErrorTimestamps[key] > minMs) {
		lastErrorTimestamps[key] = now
		try {
			// In production we avoid calling potentially noisy error callbacks
			// (many browser extensions hook console/error and produce stack traces).
			if (DEBUG_LOGGING) {
				fn()
			} else {
				// Log a compact debug entry instead of executing the original callback
				console.debug('[throttleError]', key, new Date().toISOString())
			}
		} catch (e) {
			console.warn('throttleError handler failed', e)
		}
	}
}

// Utilities collection: provide many small helper functions (>=50)
window.Utils = (function () {
	function noop() {}
	function clamp(n, a, b) {
		return Math.max(a, Math.min(b, n))
	}
	function uid(prefix = 'id') {
		return prefix + '-' + Math.random().toString(36).slice(2, 9)
	}
	function now() {
		return Date.now()
	}
	function sleep(ms) {
		return new Promise(r => setTimeout(r, ms))
	}
	function once(fn) {
		let done = false
		return function (...a) {
			if (done) return
			done = true
			return fn.apply(this, a)
		}
	}
	function debounce(fn, wait = 200) {
		let t
		return (...a) => {
			clearTimeout(t)
			t = setTimeout(() => fn.apply(this, a), wait)
		}
	}
	function throttle(fn, limit = 200) {
		let inThrottle
		return (...a) => {
			if (!inThrottle) {
				fn.apply(this, a)
				inThrottle = true
				setTimeout(() => (inThrottle = false), limit)
			}
		}
	}
	function clamp01(v) {
		return clamp(v, 0, 1)
	}
	function isMobile() {
		return /Mobi|Android|iPhone|iPad|iPod/.test(navigator.userAgent)
	}
	function isTouch() {
		return 'ontouchstart' in window || navigator.maxTouchPoints > 0
	}
	function formatSeconds(s) {
		const m = Math.floor(s / 60)
		const r = s % 60
		return `${m}:${r.toString().padStart(2, '0')}`
	}
	function formatDateISO(d = new Date()) {
		return d.toISOString()
	}
	function parseJSONSafe(s, fallback = null) {
		try {
			return JSON.parse(s)
		} catch (e) {
			return fallback
		}
	}
	function stringifySafe(o) {
		try {
			return JSON.stringify(o)
		} catch (e) {
			return ''
		}
	}
	function randomInt(min, max) {
		return Math.floor(Math.random() * (max - min + 1)) + min
	}
	function randomHex(len = 6) {
		return Math.random()
			.toString(16)
			.slice(2, 2 + len)
	}
	function pick(obj, keys) {
		const out = {}
		keys.forEach(k => {
			if (k in obj) out[k] = obj[k]
		})
		return out
	}
	function omit(obj, keys) {
		const out = {}
		Object.keys(obj).forEach(k => {
			if (!keys.includes(k)) out[k] = obj[k]
		})
		return out
	}
	function clampArrayIndex(i, len) {
		return Math.max(0, Math.min(len - 1, i))
	}
	function titleCase(s) {
		return s.replace(/\w/g, c => c.toUpperCase())
	}
	function truncate(s, n = 100) {
		return s.length > n ? s.slice(0, n - 1) + '…' : s
	}
	function slugify(s) {
		return s
			.toString()
			.toLowerCase()
			.trim()
			.replace(/\s+/g, '-')
			.replace(/[^ -]/g, '')
	}
	function escapeHtml(s) {
		return s.replace(
			/[&<>'"`]/g,
			c =>
				({
					'&': '&amp;',
					'<': '&lt;',
					'>': '&gt;',
					'"': '&quot;',
					"'": '&#39;',
					'`': '&#96;',
				}[c])
		)
	}
	function unescapeHtml(s) {
		return s.replace(/&(#?\w+);/g, (m, n) => {
			const map = { amp: '&', lt: '<', gt: '>', quot: '"', '#39': "'" }
			return map[n] || m
		})
	}
	function clampFloat(v, min, max) {
		return Math.min(max, Math.max(min, parseFloat(v) || 0))
	}
	function fileSizeHuman(bytes) {
		if (bytes < 1024) return bytes + ' B'
		if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB'
		if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB'
		return (bytes / 1073741824).toFixed(1) + ' GB'
	}
	function downloadText(filename, text) {
		const b = new Blob([text], { type: 'text/plain' })
		const u = URL.createObjectURL(b)
		const a = document.createElement('a')
		a.href = u
		a.download = filename
		document.body.appendChild(a)
		a.click()
		a.remove()
		URL.revokeObjectURL(u)
	}
	async function copyToClipboard(text) {
		if (navigator.clipboard) return navigator.clipboard.writeText(text)
		const ta = document.createElement('textarea')
		ta.value = text
		document.body.appendChild(ta)
		ta.select()
		document.execCommand('copy')
		ta.remove()
	}
	function safeAddEvent(el, ev, fn) {
		if (!el) return
		el.addEventListener(ev, fn)
	}
	function createEl(tag, attrs = {}, children = []) {
		const e = document.createElement(tag)
		Object.entries(attrs).forEach(([k, v]) => e.setAttribute(k, v))
		children.forEach(c =>
			e.appendChild(typeof c === 'string' ? document.createTextNode(c) : c)
		)
		return e
	}
	function append(parent, child) {
		parent.appendChild(child)
		return child
	}
	function prepend(parent, child) {
		parent.insertBefore(child, parent.firstChild)
		return child
	}
	function removeEl(el) {
		if (!el) return
		el.remove()
	}
	function addClass(el, cls) {
		if (el && !el.classList.contains(cls)) el.classList.add(cls)
	}
	function removeClass(el, cls) {
		if (el && el.classList.contains(cls)) el.classList.remove(cls)
	}
	function toggleClass(el, cls) {
		if (!el) return
		el.classList.toggle(cls)
	}
	function hasClass(el, cls) {
		return el && el.classList.contains(cls)
	}
	function getFromStorage(k, fallback = null) {
		try {
			return JSON.parse(localStorage.getItem(k))
		} catch (e) {
			return fallback
		}
	}
	function setToStorage(k, v) {
		try {
			localStorage.setItem(k, JSON.stringify(v))
			return true
		} catch (e) {
			return false
		}
	}
	function removeFromStorage(k) {
		try {
			localStorage.removeItem(k)
			return true
		} catch (e) {
			return false
		}
	}
	async function retryAsync(fn, attempts = 3, delay = 500) {
		let lastErr
		for (let i = 0; i < attempts; i++) {
			try {
				return await fn()
			} catch (e) {
				lastErr = e
				await sleep(delay)
			}
		}
		throw lastErr
	}
	function isFunction(v) {
		return typeof v === 'function'
	}
	function safeJSON(obj) {
		try {
			return JSON.stringify(obj)
		} catch (e) {
			return '{}'
		}
	}
	function merge(a, b) {
		return Object.assign({}, a, b)
	}
	function deepClone(obj) {
		return JSON.parse(JSON.stringify(obj))
	}
	function toArray(val) {
		if (Array.isArray(val)) return val
		if (val == null) return []
		return [val]
	}
	function first(arr) {
		return Array.isArray(arr) ? arr[0] : undefined
	}
	function last(arr) {
		return Array.isArray(arr) ? arr[arr.length - 1] : undefined
	}
	function indexOfIgnoreCase(arr, str) {
		return arr.findIndex(s => s.toLowerCase() === String(str).toLowerCase())
	}
	function ensureNumber(v, fallback = 0) {
		const n = Number(v)
		return isNaN(n) ? fallback : n
	}
	function clampRange(v, min, max) {
		return Math.min(max, Math.max(min, v))
	}
	function noopPromise() {
		return Promise.resolve()
	}
	function groupBy(arr, key) {
		return arr.reduce((acc, item) => {
			const k = item[key]
			acc[k] = acc[k] || []
			acc[k].push(item)
			return acc
		}, {})
	}
	function zip(a, b) {
		const len = Math.min(a.length, b.length)
		const out = []
		for (let i = 0; i < len; i++) out.push([a[i], b[i]])
		return out
	}

	return {
		noop,
		clamp,
		uid,
		now,
		sleep,
		once,
		debounce,
		throttle,
		clamp01,
		isMobile,
		isTouch,
		formatSeconds,
		formatDateISO,
		parseJSONSafe,
		stringifySafe,
		randomInt,
		randomHex,
		pick,
		omit,
		clampArrayIndex,
		titleCase,
		truncate,
		slugify,
		escapeHtml,
		unescapeHtml,
		clampFloat,
		fileSizeHuman,
		downloadText,
		copyToClipboard,
		safeAddEvent,
		createEl,
		append,
		prepend,
		removeEl,
		addClass,
		removeClass,
		toggleClass,
		hasClass,
		getFromStorage,
		setToStorage,
		removeFromStorage,
		retryAsync,
		isFunction,
		safeJSON,
		merge,
		deepClone,
		toArray,
		first,
		last,
		indexOfIgnoreCase,
		ensureNumber,
		clampRange,
		noopPromise,
		groupBy,
		zip,
		uid,
	}
})()

// Mobile menu and back/buttons wiring
document.addEventListener('DOMContentLoaded', () => {
	const mobileMenuBtn = document.getElementById('mobileMenuBtn')
	const navMenu = document.querySelector('.nav-menu')
	const mobileSettingsBtn = document.getElementById('mobileSettingsBtn')
	const featuresBtn = document.getElementById('featuresBtn')
	const backBtnTop = document.getElementById('backBtnTop')
	const backBtnResult = document.getElementById('backBtnResult')

	if (mobileMenuBtn && navMenu) {
		mobileMenuBtn.addEventListener('click', () => {
			navMenu.classList.toggle('active')
		})
	}

	if (mobileSettingsBtn) {
		mobileSettingsBtn.addEventListener('click', () => {
			try {
				showSettings()
			} catch (e) {
				console.warn('settings open failed', e)
			}
		})
	}

	// Ensure features button still works
	if (featuresBtn) {
		featuresBtn.addEventListener('click', () => {
			const p = document.getElementById('featuresPanel')
			if (p) p.classList.toggle('hidden')
		})
	}

	// back buttons
	if (backBtnTop) backBtnTop.addEventListener('click', () => history.back())
	if (backBtnResult)
		backBtnResult.addEventListener('click', () => history.back())

	// Hide mobile-only settings on large screens (extra guard)
	function updateMobileUI() {
		const isM = window.innerWidth <= 768
		const mobileOnlyEls = document.querySelectorAll('.mobile-only')
		mobileOnlyEls.forEach(el => {
			el.style.display = isM ? 'inline-flex' : 'none'
		})
	}
	updateMobileUI()
	window.addEventListener('resize', updateMobileUI)
})

// Speech Recognition config
const RECOGNITION_CONFIG = {
	continuous: true,
	interimResults: true,
	maxAlternatives: 3,
}

// Audio processing config
const AUDIO_CONFIG = {
	fftSize: 2048,
	smoothingTimeConstant: 0.8,
	minDecibels: -90,
	maxDecibels: -10,
}

// UI update intervals
const UI_UPDATE = {
	volume: 100, // Volume meter update interval (ms)
	noise: 1000, // Noise level check interval (ms)
	retry: 2000, // Recognition retry interval (ms)
}

// Use recognition languages from translations.js
const LANGS = Translations.RECOGNITION_LANGUAGES

function createLangButtons() {
	// Clear existing buttons
	languagesDiv.innerHTML = ''

	// Get saved recognition language or default to browser language
	const savedLang = localStorage.getItem('recognitionLang')
	const browserLang = navigator.language
	const defaultLang = LANGS.some(([code]) => code === browserLang)
		? browserLang
		: 'en-US'
	selectedLang = savedLang || defaultLang

	// Create buttons for all recognition languages
	LANGS.forEach(([code, name]) => {
		const btn = document.createElement('button')
		btn.textContent = name
		btn.dataset.lang = code
		btn.addEventListener('click', () => {
			document
				.querySelectorAll('#languages button')
				.forEach(b => b.classList.remove('selected'))
			btn.classList.add('selected')
			selectedLang = code
			localStorage.setItem('recognitionLang', code)
			actions.classList.remove('hidden')
			audioControls.classList.add('hidden')
			recArea.classList.add('hidden')

			// If recognition is active, restart it with new language
			if (recognition && isRecordingActive) {
				recognition.lang = code
				try {
					recognition.stop()
					setTimeout(() => safeStartRecognition(recognition), 100)
				} catch (e) {
					console.warn('Failed to restart recognition:', e)
					showToast('Failed to switch recognition language', { timeout: 3000 })
				}
			} else {
				showToast('Recognition language set to ' + name, { timeout: 2000 })
			}
		})

		// Select saved/default language
		if (code === selectedLang) {
			btn.classList.add('selected')
		}

		languagesDiv.appendChild(btn)
	})

	// enumerate devices initially (may request permission if needed later)
	if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
		populateDeviceList().catch(function () {
			console.warn('Failed to enumerate audio devices')
			showToast('Could not access audio devices', { timeout: 3000 })
		})
	}
}

startBtn.addEventListener('click', () => {
	landing.classList.add('hidden')
	appSection.classList.remove('hidden')
	createLangButtons()
})

// populate device select
async function populateDeviceList() {
	if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices)
		return
	const devices = await navigator.mediaDevices.enumerateDevices()
	const inputs = devices.filter(d => d.kind === 'audioinput')
	deviceSelect.innerHTML = ''
	inputs.forEach((d, idx) => {
		const o = document.createElement('option')
		o.value = d.deviceId
		// use label if available (requires permission) otherwise fallback
		o.textContent = d.label || 'Microphone ' + (idx + 1)
		deviceSelect.appendChild(o)
	})
	if (inputs.length > 0) {
		deviceRow.classList.remove('hidden')
		deviceStatus.textContent = inputs.length + ' input(s)'

		// restore preferred device if saved
		const pref = localStorage.getItem('preferredDevice')
		if (pref) {
			const opt = Array.from(deviceSelect.options).find(o => o.value === pref)
			if (opt) deviceSelect.value = pref
		}
		// save on change
		deviceSelect.addEventListener('change', () => {
			localStorage.setItem('preferredDevice', deviceSelect.value)
		})
	} else {
		deviceRow.classList.add('hidden')
	}
}

// Try to get media stream for a deviceId; returns stream or throws
async function tryGetStream(deviceId) {
	const constraints = deviceId
		? { audio: { deviceId: { exact: deviceId } } }
		: { audio: true }
	return await navigator.mediaDevices.getUserMedia(constraints)
}

// Try devices sequentially until one succeeds
async function getStreamWithFallback(preferredId) {
	deviceStatus.textContent = 'Requesting microphone...'
	const devices = await navigator.mediaDevices.enumerateDevices()
	const inputs = devices.filter(d => d.kind === 'audioinput')
	const candidates = []
	if (preferredId) candidates.push(preferredId)
	inputs.forEach(d => {
		if (!candidates.includes(d.deviceId)) candidates.push(d.deviceId)
	})
	// final fallback - try default
	candidates.push(null)
	let lastErr = null
	for (const id of candidates) {
		try {
			const s = await tryGetStream(id)
			deviceStatus.textContent =
				'Using: ' +
				(deviceSelect.selectedOptions[0]
					? deviceSelect.selectedOptions[0].text
					: id
					? id
					: 'default')
			// if deviceSelect doesn't match, select it
			if (id && deviceSelect) {
				deviceSelect.value = id
			}
			return s
		} catch (err) {
			lastErr = err
			console.warn('device failed', id, err)
			// continue to next candidate
		}
	}
	deviceStatus.textContent = 'No microphone available'
	throw lastErr
}

// SpeechRecognition helper
function getRecognition() {
	const SpeechRecognition =
		window.SpeechRecognition || window.webkitSpeechRecognition
	if (!SpeechRecognition) return null
	const r = new SpeechRecognition()
	r.lang = selectedLang
	r.interimResults = true
	r.continuous = true
	return r
}

// Paste text
// paste button removed from the UI; do not add runtime behavior here

// File input
fileInput.addEventListener('change', async e => {
	try {
		const f = e.target.files[0]
		if (!f) return

		// Check file size (limit to 100MB)
		if (f.size > 100 * 1024 * 1024) {
			showToast('File too large. Please upload files under 100MB.', {
				timeout: 5000,
			})
			return
		}

		if (f.type.startsWith('text') || f.name.endsWith('.txt')) {
			try {
				const txt = await f.text()
				resultText.value = txt
				showToast('Text file loaded successfully', { timeout: 3000 })
			} catch (error) {
				showToast('Error reading text file. Please try again.', {
					timeout: 5000,
				})
				console.error('Text file read error:', error)
			}
		} else if (
			f.type.startsWith('audio') ||
			/\.(wav|mp3|m4a|ogg)$/i.test(f.name)
		) {
			try {
				audioFile = URL.createObjectURL(f)
				if (!audioElement) {
					audioElement = document.createElement('audio')
					audioElement.controls = true
					document.body.appendChild(audioElement)
				}
				audioElement.src = audioFile
				audioControls.classList.remove('hidden')
				showToast('Audio file loaded successfully', { timeout: 3000 })

				// Use showToast instead of alert for better UX
				showToast(
					'Use "Transcribe while playing" to capture audio via microphone. For best results, use headphones or ensure clear playback.',
					{ timeout: 8000 }
				)
			} catch (error) {
				showToast('Error loading audio file. Please try again.', {
					timeout: 5000,
				})
				console.error('Audio file load error:', error)
			}
		} else {
			showToast(
				'Unsupported file type. Please use .txt or common audio files (.wav, .mp3, .m4a, .ogg).',
				{ timeout: 5000 }
			)
		}
	} catch (error) {
		showToast('Error processing file. Please try again.', { timeout: 5000 })
		console.error('File processing error:', error)
	}
})

playUploaded &&
	playUploaded.addEventListener('click', () => {
		if (audioElement) {
			audioElement.play()
		}
	})

// Transcribe while playing (listen via microphone while playing uploaded audio)
if (transcribeAudio) {
	transcribeAudio.addEventListener('click', async () => {
		if (!audioElement) {
			alert('No audio loaded')
			return
		}
		if (
			!navigator.mediaDevices ||
			(!window.SpeechRecognition && !window.webkitSpeechRecognition)
		) {
			alert(
				'Your browser does not support required APIs (SpeechRecognition or getUserMedia). See Help.'
			)
			return
		}
		// start recognition (it will listen from mic while audio plays)
		recognition && recognition.stop()
		recognition = getRecognition()
		if (!recognition) {
			alert('SpeechRecognition not supported')
			return
		}
		recognition.lang = selectedLang
		recognition.onresult = ev => {
			let text = ''
			for (const r of ev.results) {
				text += r[0].transcript
			}
			resultText.value = text
		}
		recognition.onerror = ev => {
			// throttle logging
			throttleError('transcribe-rec-error-' + (ev?.error || 'unknown'), () =>
				console.log('rec error', ev)
			)
			if (ev && ev.error === 'network') {
				showToast(
					'Network error from speech service — transcription stopped. Check your connection.',
					{ timeout: 8000 }
				)
				try {
					recognition.stop()
				} catch (_) {}
				return
			}
		}
		safeStartRecognition(recognition)
		// play audio
		audioElement.currentTime = 0
		audioElement.play()
		// stop recognition after audio ends
		audioElement.onended = () => {
			recognition && recognition.stop()
		}
		alert(
			'Recording from microphone while audio plays. Allow microphone access. This method relies on capturing the audio via your mic and may be imperfect.'
		)
	})
}

// Recording area & waveform
let audioCtx = null,
	analyser = null,
	dataArray = null,
	source = null,
	mediaStream = null,
	drawId = null

let recordingStartTime = 0
let recordingTimer = null

function updateRecordingTime() {
	if (!recordingStartTime) return
	const elapsed = Date.now() - recordingStartTime
	const seconds = Math.floor(elapsed / 1000)
	const minutes = Math.floor(seconds / 60)
	const displaySeconds = (seconds % 60).toString().padStart(2, '0')
	const displayMinutes = minutes.toString().padStart(2, '0')
	document.getElementById('recordingTime').textContent =
		displayMinutes + ':' + displaySeconds
}

function startRecordingTimer() {
	recordingStartTime = Date.now()
	recordingTimer = setInterval(updateRecordingTime, 1000)
}

function stopRecordingTimer() {
	clearInterval(recordingTimer)
	recordingStartTime = 0
	document.getElementById('recordingTime').textContent = '00:00'
}

recordBtn.addEventListener('click', async () => {
	try {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			throw new Error('Speech recognition not supported in this browser.')
		}

		await populateDeviceList()
		const preferred = deviceSelect?.value
		mediaStream = await getStreamWithFallback(preferred)

		// Initialize audio context and analyzer
		audioCtx = new (window.AudioContext || window.webkitAudioContext)()
		source = audioCtx.createMediaStreamSource(mediaStream)
		analyser = audioCtx.createAnalyser()
		analyser.fftSize = 2048
		const bufferLength = analyser.frequencyBinCount
		dataArray = new Uint8Array(bufferLength)
		source.connect(analyser)

		// Show recording UI
		recArea.classList.remove('hidden')
		recStart.disabled = false
		recStop.disabled = true

		// Start visualization
		startDrawing()

		// Update UI
		deviceStatus.textContent = 'Microphone ready'
		document.getElementById('recordingStatus').classList.remove('recording')
	} catch (err) {
		console.error('Microphone initialization failed:', err)
		alert('Please allow microphone access to use speech recognition.')
		deviceStatus.textContent = 'Microphone access denied'
	}
})

function startDrawing() {
	const canvas = waveform
	const ctx = canvas.getContext('2d')
	const gradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
	gradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)') // var(--accent)
	gradient.addColorStop(1, 'rgba(109, 40, 217, 0.8)') // var(--accent-2)

	function draw() {
		drawId = requestAnimationFrame(draw)

		// Get audio data
		analyser.getByteTimeDomainData(dataArray)

		// Clear canvas with semi-transparent background
		ctx.fillStyle = 'rgba(11, 2, 20, 0.1)'
		ctx.fillRect(0, 0, canvas.width, canvas.height)

		// Draw waveform
		ctx.lineWidth = 2
		ctx.strokeStyle = gradient
		ctx.beginPath()

		const sliceWidth = (canvas.width * 1.0) / dataArray.length
		let x = 0

		for (let i = 0; i < dataArray.length; i++) {
			const v = dataArray[i] / 128.0
			const y = (v * canvas.height) / 2

			if (i === 0) {
				ctx.moveTo(x, y)
			} else {
				ctx.lineTo(x, y)
			}

			x += sliceWidth
		}

		// Add glow effect
		ctx.shadowBlur = 15
		ctx.shadowColor = 'rgba(139, 92, 246, 0.5)'

		// Complete the line
		ctx.lineTo(canvas.width, canvas.height / 2)
		ctx.stroke()

		// Reset shadow for next frame
		ctx.shadowBlur = 0

		// Draw center line
		ctx.beginPath()
		ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)'
		ctx.lineWidth = 1
		ctx.moveTo(0, canvas.height / 2)
		ctx.lineTo(canvas.width, canvas.height / 2)
		ctx.stroke()
	}

	// Start the animation
	draw()
}

// Signal-quality monitor: compute RMS from time-domain data and update confidence
function startSignalMonitor(intervalMs = 250) {
	if (signalMonitorInterval) clearInterval(signalMonitorInterval)
	if (!analyser || !dataArray) return

	signalMonitorInterval = setInterval(() => {
		if (!isRecordingActive || audioPaused) return
		try {
			analyser.getByteTimeDomainData(dataArray)
			// convert to [-1,1]
			let sum = 0
			for (let i = 0; i < dataArray.length; i++) {
				const v = (dataArray[i] - 128) / 128
				sum += v * v
			}
			const rms = Math.sqrt(sum / dataArray.length)
			const confidence = Math.min(100, Math.round(rms * 200))
			const el = document.getElementById('confidenceLevel')
			if (el) el.textContent = confidence + '%'
		} catch (err) {
			// ignore transient errors
			console.warn('Signal monitor error', err)
		}
	}, intervalMs)
}

function stopSignalMonitor() {
	if (signalMonitorInterval) {
		clearInterval(signalMonitorInterval)
		signalMonitorInterval = null
	}
}

// Safely start SpeechRecognition avoiding duplicate starts/race conditions
function safeStartRecognition(rec) {
	if (!rec) return

	// Prevent multiple simultaneous starts
	if (recognitionStarting || recognitionRunning) {
		console.debug('Recognition already starting/running, skipping start')
		return
	}

	// Reset error state
	recognition._lastErrorTime = 0
	recognition._consecutiveErrors = 0

	// Validate network connectivity
	if (!navigator.onLine) {
		showToast('No internet connection. Please check your network.', {
			timeout: 8000,
			persistent: true,
		})
		deviceStatus.textContent = 'No internet connection'
		return
	}

	// Validate audio state
	if (!mediaStream || mediaStream.getTracks().some(track => !track.enabled)) {
		showToast('Microphone access is required. Please check your settings.', {
			timeout: 5000,
		})
		deviceStatus.textContent = 'Microphone unavailable'
		return
	}

	recognitionStarting = true
	try {
		// Ensure clean state before starting
		try {
			rec.abort()
		} catch (e) {
			// Ignore abort errors
		}

		// Configure recognition
		rec.continuous = true
		rec.interimResults = true
		rec.maxAlternatives = 3

		// Start recognition with error handling
		setTimeout(() => {
			try {
				rec.start()
				if (isRecordingActive) {
					startSignalMonitor()
					deviceStatus.textContent = 'Listening...'
				}
			} catch (startErr) {
				console.warn('Recognition start failed:', startErr)
				recognitionStarting = false
				deviceStatus.textContent = 'Failed to start recognition'
				showToast('Failed to start voice recognition. Please try again.', {
					timeout: 5000,
				})
				// Attempt recovery
				setTimeout(() => {
					if (isRecordingActive) {
						console.log('Attempting recognition recovery...')
						safeStartRecognition(rec)
					}
				}, 2000)
			}
		}, 100)
	} catch (err) {
		console.warn('safeStartRecognition setup failed:', err)
		recognitionStarting = false
		deviceStatus.textContent = 'Recognition initialization failed'
		showToast('Voice recognition setup failed. Please refresh and try again.', {
			timeout: 5000,
		})
	}
}

// Hook into recognition onstart/onend to maintain flags
function attachBasicRecognitionStateHandlers(rec) {
	if (!rec) return
	rec.onstart = () => {
		recognitionRunning = true
		recognitionStarting = false
	}
	rec.onend = () => {
		recognitionRunning = false
		recognitionStarting = false
	}
}

recStart.addEventListener('click', async () => {
	if (!mediaStream) {
		alert('Please allow microphone access first')
		return
	}

	try {
		// Reset and prepare recognition
		recognition?.stop()
		recognition = getRecognition()

		if (!recognition) {
			throw new Error('Speech recognition not supported in this browser')
		}

		recognition.lang = selectedLang
		isRecordingActive = true
		resultText.value = ''

		// Configure recognition handlers
		recognition._retryCount = 0
		recognition.onstart = () => {
			recognitionRunning = true
			recognitionStarting = false
			deviceStatus.textContent = 'Listening...'
			// Reset state on successful start
			recognition._retryCount = 0
			RecognitionState.markSuccess()
		}

		recognition.onresult = ev => {
			let interim = ''
			let final = ''
			for (const r of ev.results) {
				if (r.isFinal) {
					final += r[0].transcript + '\n'
					// Save to history when we get final results
					if (r[0].transcript.trim()) {
						saveTranscription(r[0].transcript.trim())
					}
				} else {
					interim += r[0].transcript
				}
			}
			resultText.value = final + interim
		}

		recognition.onerror = e => {
			throttleError('recognition-error-' + (e?.error || 'unknown'), () =>
				console.error('Recognition error:', e)
			)

			// Handle different types of errors
			if (e && e.error === 'network') {
				deviceStatus.textContent = 'Network error - check your connection'
				showToast(
					'Network error detected. Check your internet connection and try again.',
					{ timeout: 8000 }
				)
				stopRecording()
				return
			} else if (e && e.error === 'not-allowed') {
				deviceStatus.textContent = 'Microphone access denied'
				showToast('Please allow microphone access to use voice recognition', {
					timeout: 8000,
				})
				stopRecording()
				return
			} else if (e && e.error === 'no-speech') {
				deviceStatus.textContent = 'No speech detected'
				// Continue recording but notify user
				showToast(
					'No speech detected. Please speak louder or check your microphone.',
					{ timeout: 4000 }
				)
				return
			}

			deviceStatus.textContent = 'Error: ' + e.error + '. Retrying...'

			// Try a controlled restart only if recognition is not currently running
			if (isRecordingActive && !recognitionRunning) {
				setTimeout(() => {
					if (!recognitionRunning && isRecordingActive) {
						try {
							// limit retry attempts to avoid infinite loops
							recognition._retryCount = (recognition._retryCount || 0) + 1
							if (recognition._retryCount <= 5) {
								safeStartRecognition(recognition)
							} else {
								deviceStatus.textContent =
									'Recognition failed. Please try again.'
								stopRecording()
							}
						} catch (err) {
							console.warn('Retry failed:', err)
						}
					}
				}, 1000)
			}
		}

		recognition.onend = () => {
			// mark as stopped
			recognitionRunning = false
			// onend may be called when recognition genuinely stops — attempt restart only if recording is still active
			if (isRecordingActive) {
				// attempt restart via the same guarded path
				if (!recognitionRunning) {
					try {
						// small delay to avoid race conditions
						setTimeout(() => {
							if (!recognitionRunning && isRecordingActive) {
								try {
									recognition._retryCount = (recognition._retryCount || 0) + 1
									if (recognition._retryCount <= 5) {
										safeStartRecognition(recognition)
										deviceStatus.textContent = 'Listening...'
									} else {
										deviceStatus.textContent =
											'Recognition failed. Please try again.'
										stopRecording()
									}
								} catch (err) {
									console.warn('Restart failed:', err)
								}
							}
						}, 500)
					} catch (err) {
						console.warn('Restart scheduling failed:', err)
					}
				}
			}
		}

		// Start recording (guarded to avoid duplicate starts)
		safeStartRecognition(recognition)
		recStart.disabled = true
		recStop.disabled = false

		// Update UI
		document.getElementById('recordingStatus').classList.add('recording')
		startRecordingTimer()
		deviceStatus.textContent = 'Listening...'
	} catch (err) {
		console.error('Failed to start recognition:', err)
		alert('Could not start speech recognition. Please try again.')
		stopRecording()
	}
})

function stopRecording() {
	isRecordingActive = false

	// Stop recognition
	if (recognition) {
		try {
			recognition.stop()
		} catch (_) {}
		recognitionStarting = false
	}

	// Reset UI
	recStart.disabled = false
	recStop.disabled = true
	document.getElementById('recordingStatus').classList.remove('recording')
	stopRecordingTimer()
	deviceStatus.textContent = 'Ready'

	// Clean up audio context
	if (drawId) {
		cancelAnimationFrame(drawId)
		drawId = null
	}
	stopSignalMonitor()
	if (mediaStream) {
		mediaStream.getTracks().forEach(t => t.stop())
		mediaStream = null
	}
	if (audioCtx) {
		audioCtx.close()
		audioCtx = null
	}

	recArea.classList.add('hidden')
}

recStop.addEventListener('click', stopRecording)

// Keyboard shortcuts: r = toggle recording, s = start, e = stop (ignore when typing)
window.addEventListener('keydown', e => {
	const activeTag = document.activeElement && document.activeElement.tagName
	if (activeTag === 'INPUT' || activeTag === 'TEXTAREA') return
	if (e.key === 'r') {
		if (isRecordingActive) stopRecording()
		else recStart.click()
	}
	if (e.key === 's') {
		if (!isRecordingActive) recStart.click()
	}
	if (e.key === 'e') {
		if (isRecordingActive) recStop.click()
	}
})

downloadTxt.addEventListener('click', () => {
	try {
		const text = resultText.value || ''
		if (!text.trim()) {
			showToast(
				'No text to download. Please record or paste some text first.',
				{ timeout: 5000 }
			)
			return
		}

		const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
		const url = URL.createObjectURL(blob)
		const a = document.createElement('a')
		const timestamp = new Date()
			.toISOString()
			.replace(/[:.]/g, '-')
			.substring(0, 19)
		a.href = url
		a.download = 'transcript-' + timestamp + '.txt'
		document.body.appendChild(a)
		a.click()
		document.body.removeChild(a)
		URL.revokeObjectURL(url)

		showToast('Transcript downloaded successfully!', { timeout: 3000 })
	} catch (error) {
		showToast('Error downloading transcript. Please try again.', {
			timeout: 5000,
		})
		console.error('Download error:', error)
	}
})

copyText.addEventListener('click', async () => {
	try {
		const text = resultText.value || ''
		if (!text.trim()) {
			showToast('No text to copy. Please record or paste some text first.', {
				timeout: 5000,
			})
			return
		}

		await navigator.clipboard.writeText(text)
		showToast('Text copied to clipboard successfully!', { timeout: 3000 })
	} catch (err) {
		console.error('Copy error:', err)
		showToast(
			'Copy failed. Please try selecting and copying manually (Ctrl/Cmd + C).',
			{ timeout: 5000 }
		)

		// Fallback: select the text for manual copying
		resultText.select()
	}
})

// Menu functionality
const historyBtn = document.getElementById('historyBtn')
const settingsBtn = document.getElementById('settingsBtn')

// History management
let transcriptionHistory = JSON.parse(
	localStorage.getItem('transcriptionHistory') || '[]'
)

function saveTranscription(text) {
	if (!text) return
	const entry = {
		text,
		timestamp: new Date().toISOString(),
		language: selectedLang,
	}
	transcriptionHistory.unshift(entry)
	if (transcriptionHistory.length > 10) transcriptionHistory.pop()
	localStorage.setItem(
		'transcriptionHistory',
		JSON.stringify(transcriptionHistory)
	)
}

function showHistory() {
	const dialog = document.createElement('div')
	dialog.classList.add('modal')
	dialog.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>History</h2>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                ${
									transcriptionHistory.length
										? transcriptionHistory
												.map(
													entry => `
                    <div class="history-item">
                        <div class="history-meta">
                            <span>${new Date(
															entry.timestamp
														).toLocaleString()}</span>
                            <span class="lang-tag">${
															LANGS.find(l => l[0] === entry.language)?.[1] ||
															entry.language
														}</span>
                        </div>
                        <div class="history-text">${entry.text.substring(
													0,
													100
												)}${entry.text.length > 100 ? '...' : ''}</div>
                        <button class="load-btn" data-text="${encodeURIComponent(
													entry.text
												)}">Load</button>
                    </div>
                `
												)
												.join('')
										: '<p class="empty-state">No transcriptions yet</p>'
								}
            </div>
        </div>
    `
	document.body.appendChild(dialog)

	dialog.querySelector('.close-btn').onclick = () => dialog.remove()
	dialog.querySelectorAll('.load-btn').forEach(btn => {
		btn.onclick = () => {
			resultText.value = decodeURIComponent(btn.dataset.text)
			dialog.remove()
		}
	})
}

function showSettings() {
	const dialog = document.createElement('div')
	dialog.classList.add('modal')

	// Create interface language options
	const interfaceLangOptions = Translations.INTERFACE_LANGUAGES.map(
		([code, name]) => `<option value="${code}">${name}</option>`
	).join('')

	// Create recognition language options
	const recognitionLangOptions = Translations.RECOGNITION_LANGUAGES.map(
		([code, name]) => `<option value="${code}">${name}</option>`
	).join('')

	dialog.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2 data-i18n="settings">Settings</h2>
                <button class="close-btn">&times;</button>
            </div>
            <div class="modal-body">
                <div class="setting-group">
                    <label data-i18n="theme">Theme</label>
                    <select id="themeSelect">
                        <option value="dark" data-i18n="dark">Dark</option>
                        <option value="light" data-i18n="light">Light (Coming soon)</option>
                    </select>
                </div>
                <div class="setting-group">
                    <label data-i18n="interfaceLanguage">Interface Language</label>
                    <select id="interfaceLangSelect">
                        ${interfaceLangOptions}
                    </select>
                </div>
                <div class="setting-group">
                    <label data-i18n="recognitionLanguage">Recognition Language</label>
                    <select id="recognitionLangSelect">
                        ${recognitionLangOptions}
                    </select>
                </div>
                <div class="setting-group">
                    <label data-i18n="autoSave">Auto-save transcriptions</label>
                    <input type="checkbox" id="autoSaveToggle" checked>
                </div>
            </div>
        </div>
    `
	document.body.appendChild(dialog)
	dialog.querySelector('.close-btn').onclick = () => dialog.remove()

	// Hook up all settings controls
	const themeSelect = dialog.querySelector('#themeSelect')
	themeSelect.innerHTML = `
        <option value="dark">Dark Theme</option>
        <option value="light">Light Theme</option>
        <option value="ocean">Ocean Theme</option>
        <option value="sunset">Sunset Theme</option>
        <option value="forest">Forest Theme</option>
        <option value="royal">Royal Theme</option>
    `
	const interfaceLangSelect = dialog.querySelector('#interfaceLangSelect')
	const recognitionLangSelect = dialog.querySelector('#recognitionLangSelect')
	const autoSaveToggle = dialog.querySelector('#autoSaveToggle')

	// Restore saved theme
	const savedTheme = localStorage.getItem('theme') || 'dark'
	if (themeSelect) {
		themeSelect.value = savedTheme
		document.body.className = savedTheme + '-theme'

		themeSelect.addEventListener('change', e => {
			const theme = e.target.value
			document.body.className = theme + '-theme'
			localStorage.setItem('theme', theme)

			showToast(`Theme changed to ${theme}`, {
				type: 'success',
				timeout: 3000,
			})
		})
	}

	// Restore and handle interface language
	if (interfaceLangSelect) {
		const currentInterfaceLang = Translations.getCurrentInterfaceLanguage()
		interfaceLangSelect.value = currentInterfaceLang
		interfaceLangSelect.addEventListener('change', e => {
			const newLang = e.target.value
			updateInterfaceLanguage(newLang)
		})
	}

	// Restore and handle recognition language
	if (recognitionLangSelect) {
		const savedRecognitionLang =
			localStorage.getItem('recognitionLang') || 'en-US'
		recognitionLangSelect.value = savedRecognitionLang
		selectedLang = savedRecognitionLang // Update the global selected language
		recognitionLangSelect.addEventListener('change', e => {
			const newLang = e.target.value
			selectedLang = newLang
			localStorage.setItem('recognitionLang', newLang)
			// If recognition is active, restart it with new language
			if (recognition && isRecordingActive) {
				recognition.lang = newLang
				try {
					recognition.stop()
					safeStartRecognition(recognition)
				} catch (e) {
					console.warn('Failed to restart recognition with new language:', e)
				}
			}
		})
	}

	// Restore and handle autosave
	if (autoSaveToggle) {
		const savedAuto = localStorage.getItem('autoSave')
		autoSaveToggle.checked = savedAuto !== 'false'
		autoSaveToggle.addEventListener('change', e => {
			localStorage.setItem('autoSave', e.target.checked ? 'true' : 'false')
		})
	}

	// add clear history button
	const modalBody = dialog.querySelector('.modal-body')
	if (modalBody) {
		const clearBtn = document.createElement('button')
		clearBtn.textContent = 'Clear History'
		clearBtn.className = 'action-button danger-action'
		clearBtn.style.marginTop = '0.75rem'
		clearBtn.onclick = () => {
			if (confirm('Clear transcription history?')) {
				transcriptionHistory = []
				localStorage.removeItem('transcriptionHistory')
				showToast('History cleared')
				dialog.remove()
			}
		}
		modalBody.appendChild(clearBtn)
	}
}

historyBtn.addEventListener('click', showHistory)
settingsBtn.addEventListener('click', showSettings)

// Auto-save functionality
function setupAutoSave() {
	const debounce = (func, wait) => {
		let timeout
		return function executedFunction(...args) {
			const later = () => {
				clearTimeout(timeout)
				func(...args)
			}
			clearTimeout(timeout)
			timeout = setTimeout(later, wait)
		}
	}

	const saveDebounced = debounce(text => {
		if (localStorage.getItem('autoSave') !== 'false') {
			saveTranscription(text)
		}
	}, 2000)

	resultText.addEventListener('input', e => saveDebounced(e.target.value))
}

setupAutoSave()

// Initialize language system and theme
document.addEventListener('DOMContentLoaded', () => {
	// Initialize theme
	const savedTheme = localStorage.getItem('theme') || 'dark'
	document.body.className = savedTheme + '-theme'

	initializeLanguage()
	// Set initial recognition language from storage or default to browser language
	const savedRecognitionLang = localStorage.getItem('recognitionLang')
	if (savedRecognitionLang) {
		selectedLang = savedRecognitionLang
	} else {
		const browserLang = navigator.language
		// Check if browser language is supported for recognition
		const isSupported = LANGS.some(([code]) => code === browserLang)
		selectedLang = isSupported ? browserLang : 'en-US'
		localStorage.setItem('recognitionLang', selectedLang)
	}
})

// Recognition state management
const RecognitionState = {
	_state: {
		lastError: null,
		errorCount: 0,
		lastSuccessTime: Date.now(),
		recoveryAttempts: 0,
	},

	resetErrors() {
		this._state.errorCount = 0
		this._state.lastError = null
		this._state.recoveryAttempts = 0
		this._state.lastSuccessTime = Date.now()
	},

	handleError(error) {
		const now = Date.now()
		this._state.lastError = error
		this._state.errorCount++

		// Reset error count if it's been a while since the last error
		if (now - this._state.lastSuccessTime > 30000) {
			this._state.errorCount = 1
		}

		return this._state.errorCount
	},

	markSuccess() {
		this._state.lastSuccessTime = Date.now()
		this.resetErrors()
	},
}

// Network connectivity monitoring with improved handling
window.addEventListener('online', () => {
	if (isRecordingActive) {
		showToast('Network connection restored. Resuming recognition...', {
			timeout: 5000,
		})
		deviceStatus.textContent = 'Connection restored'

		// Reset error state on network recovery
		RecognitionState.resetErrors()

		// Attempt to restart recognition with delay to ensure network is stable
		setTimeout(() => {
			if (recognition && !recognitionRunning && !recognitionStarting) {
				safeStartRecognition(recognition)
			}
		}, 1000)
	}
})

window.addEventListener('offline', () => {
	showToast(
		'Network connection lost. Recognition will resume when connection is restored.',
		{
			timeout: 5000,
			persistent: true,
		}
	)
	deviceStatus.textContent = 'No internet connection'

	// Clean up if recording
	if (isRecordingActive) {
		try {
			recognition && recognition.stop()
		} catch (e) {
			// Ignore stop errors
		}
	}
})

// Enhanced audio processing functions
function updateVolumeMeter(analyserNode, dataArray) {
	analyserNode.getByteFrequencyData(dataArray)
	const average = dataArray.reduce((a, b) => a + b) / dataArray.length
	const volume = Math.min(100, (average / 256) * 150)

	document.getElementById('volumeBar').style.width = `${volume}%`

	// Update noise level indicator
	const noiseLevel = volume < 30 ? 'Low' : volume < 70 ? 'Medium' : 'High'
	document.getElementById('noiseLevel').textContent = noiseLevel
	document.getElementById(
		'noiseLevel'
	).className = `stat-value noise-${noiseLevel.toLowerCase()}`

	return volume
}

function startDrawing() {
	const canvas = waveform
	const ctx = canvas.getContext('2d')

	// Create gradients
	const waveformGradient = ctx.createLinearGradient(0, 0, canvas.width, 0)
	waveformGradient.addColorStop(0, 'rgba(139, 92, 246, 0.8)')
	waveformGradient.addColorStop(1, 'rgba(109, 40, 217, 0.8)')

	const backgroundGradient = ctx.createLinearGradient(0, 0, 0, canvas.height)
	backgroundGradient.addColorStop(0, 'rgba(11, 2, 20, 0.05)')
	backgroundGradient.addColorStop(1, 'rgba(11, 2, 20, 0.2)')

	function draw() {
		drawId = requestAnimationFrame(draw)

		if (!analyser || !dataArray) return

		// Get audio data
		analyser.getByteTimeDomainData(dataArray)

		// Clear canvas with gradient background
		ctx.fillStyle = backgroundGradient
		ctx.fillRect(0, 0, canvas.width, canvas.height)

		// Draw frequency spectrum
		const barWidth = (canvas.width / dataArray.length) * 2.5
		let x = 0

		ctx.beginPath()
		ctx.moveTo(0, canvas.height)

		for (let i = 0; i < dataArray.length; i++) {
			const percent = dataArray[i] / 256
			const height = canvas.height * percent
			const y = canvas.height - height

			ctx.lineTo(x, y)
			x += barWidth
		}

		ctx.lineTo(canvas.width, canvas.height)
		ctx.closePath()

		// Add gradient fill
		ctx.fillStyle = waveformGradient
		ctx.fill()

		// Add glow effect
		ctx.shadowBlur = 20
		ctx.shadowColor = 'rgba(139, 92, 246, 0.3)'
		ctx.strokeStyle = 'rgba(139, 92, 246, 0.5)'
		ctx.lineWidth = 2
		ctx.stroke()

		// Reset shadow
		ctx.shadowBlur = 0

		// Draw grid lines
		ctx.strokeStyle = 'rgba(139, 92, 246, 0.1)'
		ctx.lineWidth = 1

		// Horizontal lines
		for (let i = 0; i < canvas.height; i += canvas.height / 8) {
			ctx.beginPath()
			ctx.moveTo(0, i)
			ctx.lineTo(canvas.width, i)
			ctx.stroke()
		}

		// Update volume meter
		if (!audioPaused) {
			updateVolumeMeter(analyser, dataArray)
		}
	}

	draw()
}

function setupAudioProcessor() {
	analyser = audioCtx.createAnalyser()
	analyser.fftSize = AUDIO_CONFIG.fftSize
	analyser.smoothingTimeConstant = AUDIO_CONFIG.smoothingTimeConstant
	analyser.minDecibels = AUDIO_CONFIG.minDecibels
	analyser.maxDecibels = AUDIO_CONFIG.maxDecibels

	const bufferLength = analyser.frequencyBinCount
	dataArray = new Uint8Array(bufferLength)

	// Do not use ScriptProcessorNode (deprecated). We'll sample analyser data periodically
	// and compute a simple confidence metric. Caller should start the signal monitor when recording.
	return { analyser }
}

// Initialize record button functionality
recordBtn.addEventListener('click', async () => {
	try {
		if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
			throw new Error('Speech recognition not supported in this browser')
		}

		await populateDeviceList()
		const preferred = deviceSelect?.value
		mediaStream = await getStreamWithFallback(preferred)

		// Initialize audio context and analyzer
		audioCtx = new (window.AudioContext || window.webkitAudioContext)()
		source = audioCtx.createMediaStreamSource(mediaStream)

		// Setup audio processing (no ScriptProcessor)
		const { analyser: newAnalyser } = setupAudioProcessor()
		analyser = newAnalyser
		source.connect(analyser)

		// Show recording UI
		document.getElementById('controlPanel').classList.remove('hidden')
		recArea.classList.remove('hidden')
		recStart.disabled = false
		recStop.disabled = true
		recPause.disabled = true

		// Start visualization
		startDrawing()

		// Update UI
		document.getElementById('statusText').textContent = 'Microphone ready'
		document.getElementById('recordingStatus').classList.remove('recording')
		document.getElementById('volumeBar').style.width = '0%'
		document.getElementById('confidenceLevel').textContent = '--'
	} catch (err) {
		console.error('Microphone initialization failed:', err)
		alert('Please allow microphone access to use voice recognition')
		document.getElementById('statusText').textContent =
			'Microphone access denied'
	}
})

// Pause/Resume functionality
const pauseBtnEl = document.getElementById('recPause')
pauseBtnEl &&
	pauseBtnEl.addEventListener('click', () => {
		if (!isRecordingActive) return

		audioPaused = !audioPaused

		if (audioPaused) {
			try {
				recognition && recognition.stop()
			} catch (_) {}
			pauseBtnEl.innerHTML = `
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<polygon points="5 3 19 12 5 21 5 3"/>
			</svg>
			Resume
		`
			stopSignalMonitor()
			document.getElementById('statusText').textContent = 'Paused'
		} else {
			// resume using safeStart to avoid InvalidStateError
			safeStartRecognition(recognition)
			pauseBtnEl.innerHTML = `
			<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
				<path d="M10 4H6v16h4V4z"/>
				<path d="M18 4h-4v16h4V4z"/>
			</svg>
			Pause
		`
			startSignalMonitor()
			document.getElementById('statusText').textContent = 'Recording...'
		}
	})

// Add modal styles
const style = document.createElement('style')
style.textContent = `
    .modal {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
    }

    .modal-content {
        background: var(--panel);
        border-radius: 12px;
        max-width: 600px;
        width: 90%;
        max-height: 90vh;
        overflow-y: auto;
        box-shadow: var(--shadow-lg);
    }

    .modal-header {
        padding: 1rem;
        border-bottom: 1px solid rgba(139, 92, 246, 0.1);
        display: flex;
        justify-content: space-between;
        align-items: center;
    }

    .modal-header h2 {
        margin: 0;
        color: #fff;
    }

    .close-btn {
        background: transparent;
        border: none;
        color: var(--muted);
        font-size: 1.5rem;
        cursor: pointer;
        padding: 0.5rem;
        border-radius: 8px;
        line-height: 1;
    }

    .close-btn:hover {
        background: rgba(139, 92, 246, 0.1);
        color: #fff;
    }

    .modal-body {
        padding: 1rem;
    }

    .history-item {
        padding: 1rem;
        border: 1px solid rgba(139, 92, 246, 0.1);
        border-radius: 8px;
        margin-bottom: 1rem;
    }

    .history-meta {
        display: flex;
        justify-content: space-between;
        color: var(--muted);
        font-size: 0.9rem;
        margin-bottom: 0.5rem;
    }

    .lang-tag {
        background: rgba(139, 92, 246, 0.1);
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        color: var(--accent);
    }

    .history-text {
        color: #fff;
        margin-bottom: 1rem;
        line-height: 1.5;
    }

    .load-btn {
        background: var(--gradient);
        border: none;
        color: white;
        padding: 0.5rem 1rem;
        border-radius: 8px;
        cursor: pointer;
    }

    .empty-state {
        text-align: center;
        color: var(--muted);
    }

    .setting-group {
        margin-bottom: 1rem;
    }

    .setting-group label {
        display: block;
        color: var(--muted);
        margin-bottom: 0.5rem;
    }

    .setting-group select {
        background: rgba(0, 0, 0, 0.2);
        border: 1px solid rgba(139, 92, 246, 0.1);
        color: #fff;
        padding: 0.5rem;
        border-radius: 8px;
        width: 100%;
    }

    @media (max-width: 768px) {
        .modal-content {
            width: 95%;
            margin: 1rem;
        }
    }
`
document.head.appendChild(style)
