document.addEventListener('DOMContentLoaded', () => {
    const audioContextOptions = {
        latencyHint: 'interactive', // 'interactive' (objetivo de ~0.01s), 'balanced' (~0.04s), 'playback' (~0.07s+)
                                    // El valor por defecto suele ser 'interactive'. El impacto real varía.
        // sampleRate: 44100       // Opcional: puedes intentar fijar la tasa de muestreo.
                                    // Usualmente es mejor dejar que el navegador elija la óptima para el sistema.
    };
    const audioContext = new (window.AudioContext || window.webkitAudioContext)(audioContextOptions);

    const soundBuffers = {};
    const soundFiles = { /* ... tus sonidos ... */
        'kick': 'sounds/kick.wav',
        'snare': 'sounds/snare.wav',
        'hihat-closed': 'sounds/hihat-closed.wav',
        'hihat-open': 'sounds/hihat-open.wav',
        'tom1': 'sounds/tom1.wav',
        'tom2': 'sounds/tom2.wav',
        'crash': 'sounds/crash.wav',
        'ride': 'sounds/ride.wav'
    };

    const loadingMessage = document.getElementById('loading-message');
    const drumPadsContainer = document.querySelector('.drum-pads-container');
    const pads = document.querySelectorAll('.pad');

    async function loadSound(soundName, url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status} for ${soundName}`);
            const arrayBuffer = await response.arrayBuffer();
            soundBuffers[soundName] = await audioContext.decodeAudioData(arrayBuffer);
        } catch (error) {
            console.error(`Error cargando el sonido ${soundName} desde ${url}:`, error);
        }
    }

    function playSound(soundName) {
        if (!soundBuffers[soundName]) return;

        // Esto es lo más rápido que podemos pedirle al navegador:
        const source = audioContext.createBufferSource();
        source.buffer = soundBuffers[soundName];
        source.connect(audioContext.destination);
        source.start(0); // 0 significa audioContext.currentTime (reproducir ahora)
    }

    async function handleInteraction(padElement, soundName) {
        if (audioContext.state === 'suspended') {
            try {
                await audioContext.resume(); // Necesario para la primera interacción del usuario.
                                             // Esta reanudación puede tener una latencia única la primera vez.
            } catch (err) {
                console.error("Error al reanudar AudioContext:", err);
                return;
            }
        }

        playSound(soundName);

        if (padElement) {
            padElement.classList.add('active');
            setTimeout(() => {
                padElement.classList.remove('active');
            }, 70); // Mantén esto corto y el CSS para .active ligero.
        }
    }

    async function initializeDrumMachine() {
        const soundNames = Object.keys(soundFiles);
        const loadPromises = soundNames.map(name => loadSound(name, soundFiles[name]));

        try {
            await Promise.all(loadPromises);
            // console.log("Todos los sonidos cargados y listos!");
            loadingMessage.style.display = 'none';
            drumPadsContainer.style.display = 'grid';
            setupEventListeners();
        } catch (error) {
            // console.error("Error al cargar algunos sonidos:", error);
            loadingMessage.textContent = 'Error al cargar sonidos. Intenta recargar.';
        }
    }

    function setupEventListeners() {
        pads.forEach(pad => {
            const soundName = pad.dataset.sound;
            if (!soundName) return;

            pad.addEventListener('mousedown', () => handleInteraction(pad, soundName));
            pad.addEventListener('touchstart', (event) => {
                event.preventDefault();
                handleInteraction(pad, soundName);
            }, { passive: false });
        });

        document.addEventListener('keydown', (event) => {
            if (event.repeat) return;
            const key = event.key.toLowerCase();
            const padElement = document.querySelector(`.pad[data-key="${key}"]`);
            if (padElement) {
                const soundName = padElement.dataset.sound;
                handleInteraction(padElement, soundName);
            }
        });
    }

    initializeDrumMachine();
});