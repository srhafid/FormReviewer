class SpeechManager {
    constructor() {
        this.utterance = null;
        this.queue = []; // Cola para fragmentos de texto
        this.currentUtteranceIndex = 0; // Índice del fragmento actual
        this.isReading = false;
        this.isPaused = false;
        this.voicesLoaded = false;
        // Pre-carga voces al inicio para evitar delays
        window.speechSynthesis.getVoices();
    }

    // Divide el texto en fragmentos manejables
    splitTextIntoChunks(text) {
        const maxWordsPerChunk = 100; // Límite de palabras por fragmento
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]; // Divide por oraciones
        const chunks = [];
        let currentChunk = '';
        let wordCount = 0;

        for (const sentence of sentences) {
            const words = sentence.trim().split(/\s+/).length;
            if (wordCount + words <= maxWordsPerChunk) {
                currentChunk += sentence + ' ';
                wordCount += words;
            } else {
                if (currentChunk) chunks.push(currentChunk.trim());
                currentChunk = sentence + ' ';
                wordCount = words;
            }
        }
        if (currentChunk) chunks.push(currentChunk.trim());

        console.log(`Texto dividido en ${chunks.length} fragmentos.`, chunks);
        return chunks;
    }

    async startReading(contextParagraphs) {
        if (!('speechSynthesis' in window) || !contextParagraphs.length) {
            console.warn('Speech synthesis not supported or no text provided.');
            return;
        }

        // Verifica interacción para evitar bloqueo de autoplay
        if (document.visibilityState !== 'visible' || !document.hasFocus()) {
            console.warn('Pestaña no activa o sin foco. Haz clic para activar.');
            return;
        }

        console.log('Iniciando lectura. Texto original:', contextParagraphs.join(' '));

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        this.queue = []; // Limpia la cola
        this.currentUtteranceIndex = 0;

        // Prepare text
        const cleanText = this.cleanInclusiveLanguage(contextParagraphs.join(' '));
        const textChunks = this.splitTextIntoChunks(cleanText);

        // Crea utterances para cada fragmento
        this.queue = textChunks.map(chunk => {
            const utterance = new SpeechSynthesisUtterance(chunk);
            utterance.rate = 0.85; // Tono calmado
            utterance.pitch = 1.0;
            utterance.lang = 'es-ES';
            utterance.volume = 0.9;
            return utterance;
        });

        const speakNext = () => {
            if (this.currentUtteranceIndex >= this.queue.length) {
                console.log('Todos los fragmentos leídos.');
                this.isReading = false;
                this.isPaused = false;
                const textElement = document.getElementById('floatingReadText');
                if (textElement) textElement.innerText = 'Leer contexto';
                return;
            }

            this.utterance = this.queue[this.currentUtteranceIndex];
            this.selectBestSpanishVoice();
            this.setupSpeechEvents();

            console.log(`Reproduciendo fragmento ${this.currentUtteranceIndex + 1}/${this.queue.length}:`, this.utterance.text);
            const pending = window.speechSynthesis.pending;
            const speaking = window.speechSynthesis.speaking;
            console.log('Estado antes de speak: pending=', pending, 'speaking=', speaking);

            window.speechSynthesis.speak(this.utterance);

            setTimeout(() => {
                console.log('Estado después de speak: pending=', window.speechSynthesis.pending, 'speaking=', window.speechSynthesis.speaking);
            }, 500);
        };

        // Ensure voices are loaded
        const voices = window.speechSynthesis.getVoices();
        console.log('Voces iniciales:', voices.length);
        if (voices.length === 0 && !this.voicesLoaded) {
            console.log('Esperando carga de voces...');
            window.speechSynthesis.onvoiceschanged = () => {
                this.voicesLoaded = true;
                console.log('Voces cargadas:', window.speechSynthesis.getVoices().length);
                speakNext();
                window.speechSynthesis.onvoiceschanged = null;
            };
        } else {
            this.voicesLoaded = true;
            speakNext();
        }
    }

    handleToggle() {
        if (!this.utterance) {
            console.warn('No hay utterance activa para pausar/reanudar.');
            return;
        }

        if (this.isPaused) {
            console.log('Reanudando lectura...');
            window.speechSynthesis.resume();
            this.isPaused = false;
            this.isReading = true;
        } else if (this.isReading) {
            console.log('Pausando lectura...');
            window.speechSynthesis.pause();
            this.isPaused = true;
        } else {
            console.warn('No hay lectura activa para pausar.');
        }
    }

    cleanInclusiveLanguage(text) {
        try {
            const cleaned = text
                .replace(/\b(l@s|los\/las|las\/los|el\/la|la\/el|un@|uno\/una|una\/uno|una\/un|niñ@s|tod@s|alumn@s)\b/gi, match => {
                    const conversions = {
                        'l@s': 'los',
                        'los/las': 'los',
                        'las/los': 'los',
                        'el/la': 'el',
                        'la/el': 'el',
                        'un@': 'un',
                        'uno/una': 'un',
                        'una/uno': 'un',
                        'una/un': 'un',
                        'niñ@s': 'niños',
                        'tod@s': 'todos',
                        'alumn@s': 'alumnos'
                    };
                    return conversions[match.toLowerCase()] || match.replace(/@/g, 'o');
                })
                .replace(/\b([a-záéíóúñ]+)x(es|as|os)?\b/gi, (match, base) => base + 'os')
                .replace(/\b(todes|niñes|alumnes|compañeres)\b/gi, match => {
                    const conversions = {
                        'todes': 'todos',
                        'niñes': 'niños',
                        'alumnes': 'alumnos',
                        'compañeres': 'compañeros'
                    };
                    return conversions[match.toLowerCase()] || match.replace(/e([s]?)$/, 'o$1');
                })
                .replace(/\b(él o ella|ella o él)\b/gi, 'él')
                .replace(/\b(nosotros y nosotras|nosotras y nosotros)\b/gi, 'nosotros')
                .replace(/\b(ellos y ellas|ellas y ellos)\b/gi, 'ellos')
                .replace(/\s+/g, ' ') // Normalize multiple spaces
                .trim();
            console.log('Texto limpiado exitosamente.');
            return cleaned;
        } catch (error) {
            console.error('Error cleaning text:', error);
            return text;
        }
    }

    selectBestSpanishVoice() {
        const voices = window.speechSynthesis.getVoices();
        if (!voices.length) {
            console.warn('No voices available.');
            return;
        }

        console.log('Buscando voz española entre', voices.length, 'voces disponibles.');

        const voicePreferences = [
            v => v.lang.startsWith('es') && v.name.toLowerCase().includes('paloma'),
            v => v.lang.startsWith('es') && v.name.toLowerCase().includes('esperanza'),
            v => v.lang.startsWith('es') && v.name.toLowerCase().includes('isabela'),
            v => v.lang.startsWith('es') && v.name.toLowerCase().includes('mónica'),
            v => v.lang.startsWith('es') && v.name.toLowerCase().includes('femenina'),
            v => v.lang.startsWith('es') && v.name.toLowerCase().includes('female'),
            v => v.lang.startsWith('es') && !v.name.toLowerCase().includes('male'),
            v => v.lang === 'es-ES',
            v => v.lang.startsWith('es')
        ];

        const selectedVoice = voicePreferences.reduce((found, pref) => found || voices.find(pref), null);
        if (selectedVoice) {
            this.utterance.voice = selectedVoice;
            console.log(`Selected voice: ${selectedVoice.name} (${selectedVoice.lang})`);
        } else {
            console.warn('No suitable Spanish voice found, using default.');
        }
    }

    setupSpeechEvents() {
        const textElement = document.getElementById('floatingReadText');
        if (!textElement) {
            console.warn('Text element not found for speech events.');
        }

        this.utterance.onstart = () => {
            console.log(`🟢 EVENTO: Empezó fragmento ${this.currentUtteranceIndex + 1}/${this.queue.length}`);
            this.isReading = true;
            this.isPaused = false;
            if (textElement) textElement.innerText = 'Pausar';
        };

        this.utterance.onpause = () => {
            console.log('🟡 EVENTO: Pausado');
            this.isPaused = true;
            if (textElement) textElement.innerText = 'Reanudar';
        };

        this.utterance.onresume = () => {
            console.log('🟢 EVENTO: Reanudado');
            this.isPaused = false;
            if (textElement) textElement.innerText = 'Pausar';
        };

        this.utterance.onend = () => {
            console.log(`🔴 EVENTO: Terminó fragmento ${this.currentUtteranceIndex + 1}/${this.queue.length}`);
            this.isReading = false;
            this.isPaused = false;
            this.currentUtteranceIndex++;
            if (this.currentUtteranceIndex < this.queue.length) {
                // Reproduce el siguiente fragmento
                this.utterance = this.queue[this.currentUtteranceIndex];
                this.selectBestSpanishVoice();
                this.setupSpeechEvents();
                window.speechSynthesis.speak(this.utterance);
            } else {
                if (textElement) textElement.innerText = 'Leer contexto';
            }
        };

        this.utterance.onerror = (event) => {
            console.error('🔴 ERROR EN VOZ:', event.error, 'Detalles:', event);
            this.isReading = false;
            this.isPaused = false;
            this.currentUtteranceIndex++;
            if (this.currentUtteranceIndex < this.queue.length) {
                // Intenta el siguiente fragmento
                this.utterance = this.queue[this.currentUtteranceIndex];
                this.selectBestSpanishVoice();
                this.setupSpeechEvents();
                window.speechSynthesis.speak(this.utterance);
            } else if (textElement) {
                textElement.innerText = 'Leer contexto';
            }
        };

        // Chequeo extendido para delays de voces
        setTimeout(() => {
            if (this.isReading === false && this.isPaused === false && this.currentUtteranceIndex === 0) {
                console.error('❌ No inició la lectura después de 5s. Reintentando...');
                window.speechSynthesis.cancel();
                setTimeout(() => window.speechSynthesis.speak(this.utterance), 1000);
            }
        }, 5000);
    }
}