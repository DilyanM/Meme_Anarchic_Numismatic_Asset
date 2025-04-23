// Intro Section Logic (Only for index.html)
document.addEventListener('DOMContentLoaded', function() {
    const exploreButton = document.getElementById('explore-button');
    const introSection = document.getElementById('intro-section');
    const mainWebsite = document.getElementById('main-website');
    const transitionVideo = document.getElementById('transition-video');
    const backgroundVideo = document.getElementById('background-video');

    // Check for skipIntro query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const skipIntro = urlParams.get('skipIntro') === 'true';

    if (skipIntro && introSection && mainWebsite) {
        introSection.classList.add('hidden');
        mainWebsite.classList.remove('hidden');
        document.body.classList.add('main-active');
        if (backgroundVideo) {
            backgroundVideo.play().catch(error => {
                console.error('Background video playback failed:', error);
            });
        }
    } else if (exploreButton) {
        exploreButton.addEventListener('click', function() {
            const introImage = document.querySelector('.intro-image');
            if (introImage) {
                introImage.classList.add('hidden');
            }
            if (transitionVideo.querySelector('source').src) {
                transitionVideo.classList.remove('hidden');
                transitionVideo.play().catch(error => {
                    console.error('Error playing transition video:', error);
                    transitionVideo.classList.add('hidden');
                    introSection.classList.add('hidden');
                    mainWebsite.classList.remove('hidden');
                    document.body.classList.add('main-active');
                    if (backgroundVideo) {
                        backgroundVideo.play().catch(error => {
                            console.error('Background video playback failed:', error);
                        });
                    }
                });
                transitionVideo.onended = function() {
                    transitionVideo.classList.add('hidden');
                    introSection.classList.add('hidden');
                    mainWebsite.classList.remove('hidden');
                    document.body.classList.add('main-active');
                    if (backgroundVideo) {
                        backgroundVideo.play().catch(error => {
                            console.error('Background video playback failed:', error);
                        });
                    }
                };
            } else {
                introSection.classList.add('hidden');
                mainWebsite.classList.remove('hidden');
                document.body.classList.add('main-active');
                if (backgroundVideo) {
                    backgroundVideo.play().catch(error => {
                        console.error('Background video playback failed:', error);
                    });
                }
            }
        });
    }

    // Add Enter key listener for chatbox input
    const userInput = document.getElementById('user-input');
    if (userInput) {
        userInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault(); // Prevent form submission or newline
                sendMessage();
            }
        });
    }
});

// Chatbox Logic
async function sendMessage() {
    const userInput = document.getElementById('user-input');
    const chatboxBody = document.getElementById('chatbox-body');
    const message = userInput.value.trim();

    if (!message) return; // Ignore empty messages

    // Clear input
    userInput.value = '';
    userInput.focus();

    // Append user message
    const userMessage = document.createElement('div');
    userMessage.className = 'message user-message';
    userMessage.textContent = message;
    chatboxBody.appendChild(userMessage);
    chatboxBody.scrollTop = chatboxBody.scrollHeight;

    // Show buffering animation
    const buffering = document.createElement('div');
    buffering.className = 'buffering-dots';
    buffering.innerHTML = '<span>.</span><span>.</span><span>.</span>';
    chatboxBody.appendChild(buffering);
    chatboxBody.scrollTop = chatboxBody.scrollHeight;

    try {
        // Call LLM proxy function
        const llmResponse = await fetchLLMResponse(message);

        // Remove buffering animation
        buffering.remove();

        // Append agent message (but don’t start typing yet)
        const agentMessage = document.createElement('div');
        agentMessage.className = 'message agent-message typing';
        chatboxBody.appendChild(agentMessage);
        chatboxBody.scrollTop = chatboxBody.scrollHeight;

        // Show narrating indicator
        const narratingIndicator = document.createElement('div');
        narratingIndicator.className = 'narrating-indicator';
        narratingIndicator.textContent = 'Narrating...';
        chatboxBody.appendChild(narratingIndicator);
        chatboxBody.scrollTop = chatboxBody.scrollHeight;

        // Start narration and wait for audio to be ready
        const narrationPromise = narrateResponse(llmResponse, narratingIndicator, agentMessage);

        // Wait for narration to complete
        await narrationPromise;

        // Remove typing class after animation
        agentMessage.classList.remove('typing');
    } catch (error) {
        console.error('Error processing message:', error);
        buffering.remove();
        const errorMessage = document.createElement('div');
        errorMessage.className = 'message agent-message';
        errorMessage.textContent = `Oops, something went wrong: ${error.message}. Try again!`;
        chatboxBody.appendChild(errorMessage);
        chatboxBody.scrollTop = chatboxBody.scrollHeight;
    }
}

// Fetch LLM Response via Netlify Function
async function fetchLLMResponse(message) {
    try {
        const response = await fetch('/.netlify/functions/llm-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch LLM response');
        }

        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error('Fetch LLM Response Error:', error.message);
        throw error; // Re-throw to display in chatbox
    }
}

// Typing animation
async function typeResponse(element, text) {
    element.textContent = '';
    const words = text.split(' ');
    let currentText = '';

    for (const word of words) {
        currentText += word + ' ';
        element.textContent = currentText;
        await new Promise(resolve => setTimeout(resolve, 150));
    }
}

// Voice narration with ethereal effects (via Netlify Function)
async function narrateResponse(text, narratingIndicator, agentMessage) {
    let hasCleanedUp = false; // Flag to prevent multiple cleanups

    try {
        console.log('Starting narration for text:', text);

        // Call Netlify Function to proxy ElevenLabs API
        console.time('TTS Proxy Call');
        const response = await fetch('/.netlify/functions/tts-proxy', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ text }),
        });
        console.timeEnd('TTS Proxy Call');

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Failed to fetch narration audio');
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);

        // Set up Web Audio API for reverb and sound effect overlay
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        // Resume audio context to ensure playback (some browsers suspend it)
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('AudioContext resumed');
        }

        // Main narration audio (MANA voice) with reduced reverb
        const narrationAudio = new Audio(audioUrl);
        const narrationSource = audioContext.createMediaElementSource(narrationAudio);
        const convolver = audioContext.createConvolver();
        const narrationGain = audioContext.createGain();

        // Create impulse response for reduced reverb
        const duration = 0.5; // Reduced from 2 to 0.5 seconds
        const sampleRate = audioContext.sampleRate;
        const buffer = audioContext.createBuffer(2, sampleRate * duration, sampleRate);
        for (let channel = 0; channel < 2; channel++) {
            const data = buffer.getChannelData(channel);
            for (let i = 0; i < data.length; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, 3);
            }
        }
        convolver.buffer = buffer;

        narrationSource.connect(convolver);
        convolver.connect(narrationGain);
        narrationGain.connect(audioContext.destination);
        narrationGain.gain.value = 0.4; // Reduced from 0.8 to 0.4 for less reverb intensity

        // Ethereal sound effect (background hum)
        const effectAudio = new Audio('/assets/ethereal-hum.mp3');
        effectAudio.loop = true; // Loop the sound effect
        const effectSource = audioContext.createMediaElementSource(effectAudio);
        const effectGain = audioContext.createGain();
        effectSource.connect(effectGain);
        effectGain.connect(audioContext.destination);
        effectGain.gain.value = 0.2; // Low volume for background effect

        // Select the video element to animate
        const animatedVideo = document.getElementById('background-video');
        if (!animatedVideo) {
            console.error('Background video element not found. Tried #background-video');
        } else {
            console.log('Background video element found:', animatedVideo);
        }

        // Remove narrating indicator
        narratingIndicator.remove();

        // Play background effect audio
        effectAudio.play().catch(error => {
            console.error('Effect audio playback failed:', error);
        });

        // Track the current video state
        let currentVideoState = 'animation-1'; // Assume starting with animation-1

        // Trigger animation transition and start typing when the narration audio starts playing
        narrationAudio.onplaying = () => {
            console.log('Narration audio started playing');
            if (animatedVideo) {
                // Switch to animation-2 video source
                const animation2Src = '/assets/animation-2.mp4';
                console.log('Switching to animation-2:', animation2Src);
                animatedVideo.style.opacity = '0'; // Fade out
                const transitionDuration = 500; // Half of the 1s transition
                setTimeout(() => {
                    animatedVideo.src = animation2Src;
                    animatedVideo.load();
                    // Wait for the video to be ready before playing
                    animatedVideo.onloadeddata = () => {
                        animatedVideo.play().catch(error => {
                            console.error('Animation-2 video playback failed:', error);
                        });
                        animatedVideo.style.opacity = '1'; // Fade in
                        currentVideoState = 'animation-2'; // Update state
                        console.log('Successfully switched to animation-2');
                    };
                    animatedVideo.onerror = () => {
                        console.error('Failed to load animation-2 video:', animation2Src);
                    };
                }, transitionDuration);
            }
            // Start typing animation now that narration has started
            typeResponse(agentMessage, text);
        };

        // Fallback: Trigger immediately after calling play() in case onplaying doesn't fire
        narrationAudio.play().catch(error => {
            console.error('Narration audio playback failed:', error);
        }).then(() => {
            console.log('Narration audio play() called');
            if (animatedVideo) {
                const animation2Src = '/assets/animation-2.mp4';
                console.log('Switching to animation-2 (fallback):', animation2Src);
                animatedVideo.style.opacity = '0'; // Fade out
                const transitionDuration = 500;
                setTimeout(() => {
                    animatedVideo.src = animation2Src;
                    animatedVideo.load();
                    animatedVideo.onloadeddata = () => {
                        animatedVideo.play().catch(error => {
                            console.error('Animation-2 video playback failed:', error);
                        });
                        animatedVideo.style.opacity = '1'; // Fade in
                        currentVideoState = 'animation-2'; // Update state
                        console.log('Successfully switched to animation-2 (fallback)');
                    };
                    animatedVideo.onerror = () => {
                        console.error('Failed to load animation-2 video:', animation2Src);
                    };
                }, transitionDuration);
            }
            // Start typing animation now that narration has started
            typeResponse(agentMessage, text);
        });

        // Ensure the audio ends properly and switch back to animation-1
        return new Promise((resolve) => {
            narrationAudio.onended = () => {
                console.log('Narration audio ended (onended event fired)');
                if (!hasCleanedUp) {
                    hasCleanedUp = true;
                    cleanupAndSwitchBack(animatedVideo, effectAudio, audioContext, audioUrl, resolve, currentVideoState);
                }
            };

            narrationAudio.onerror = (error) => {
                console.error('Narration audio error:', error);
                if (!hasCleanedUp) {
                    hasCleanedUp = true;
                    cleanupAndSwitchBack(animatedVideo, effectAudio, audioContext, audioUrl, resolve, currentVideoState);
                }
            };
        });
    } catch (error) {
        console.error('Error narrating response:', error);
        if (narratingIndicator) narratingIndicator.remove();
        // Fallback to SpeechSynthesis
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            utterance.rate = 0.8;
            utterance.pitch = 0.7;
            const voices = window.speechSynthesis.getVoices();
            const fallbackVoice = voices.find(voice => voice.lang === 'en-US') || voices[0];
            if (fallbackVoice) utterance.voice = fallbackVoice;
            window.speechSynthesis.speak(utterance);
        }
        throw error; // Re-throw to allow sendMessage to handle the error
    }
}

// Helper function to clean up and switch back to animation-1
function cleanupAndSwitchBack(animatedVideo, effectAudio, audioContext, audioUrl, resolve, currentVideoState) {
    // Pause effect audio (synchronous, no Promise)
    try {
        effectAudio.pause();
    } catch (error) {
        console.error('Failed to pause effect audio:', error);
    }

    // Close audio context if not already closed
    if (audioContext.state !== 'closed') {
        audioContext.close().catch(error => {
            console.error('Failed to close AudioContext:', error);
        });
    }

    // Revoke the audio URL
    URL.revokeObjectURL(audioUrl);

    // Transition back to animation-1
    if (animatedVideo) {
        console.log('Current video state:', currentVideoState);
        if (currentVideoState === 'animation-2') {
            const animation1Src = '/assets/animation-1.mp4';
            console.log('Switching back to animation-1:', animation1Src);
            animatedVideo.style.opacity = '0'; // Fade out
            setTimeout(() => {
                animatedVideo.src = animation1Src;
                animatedVideo.load();
                animatedVideo.onloadeddata = () => {
                    animatedVideo.play().catch(error => {
                        console.error('Animation-1 video playback failed:', error);
                    });
                    animatedVideo.style.opacity = '1'; // Fade in
                    console.log('Successfully switched back to animation-1');
                };
                animatedVideo.onerror = () => {
                    console.error('Failed to load animation-1 video:', animation1Src);
                };
            }, 500);
        } else {
            console.warn('Expected video state to be animation-2, but found:', currentVideoState);
        }
    } else {
        console.error('Animated video element not available during cleanup');
    }

    resolve();
}

// Copy CA to Clipboard
function copyCA() {
    const caText = 'Bw5K8eZaf361uDLHgX2UUn1PNfC7XtgQVvY9sSappump';
    navigator.clipboard.writeText(caText).then(() => {
        alert('CA copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy CA: ', err);
        alert('Failed to copy CA. Please copy it manually.');
    });
}

// Socials Dropdown Logic
function toggleDropdown(event) {
    event.preventDefault();
    const dropdown = document.getElementById('socials-dropdown');
    dropdown.classList.toggle('active');
}

document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('socials-dropdown');
    const socialsTab = document.querySelector('.socials a');
    if (!dropdown.contains(event.target) && !socialsTab.contains(event.target)) {
        dropdown.classList.remove('active');
    }
});

// Chatbox Logic (Toggle Body and Input)
function toggleChatboxBody() {
    const chatboxBody = document.getElementById('chatbox-body');
    const chatboxInput = document.querySelector('.chatbox-input');
    const chatboxHeader = document.querySelector('.chatbox-header');

    chatboxBody.style.display = chatboxBody.style.display === 'block' ? 'none' : 'block';
    chatboxInput.style.display = chatboxInput.style.display === 'block' ? 'none' : 'block';
    chatboxHeader.classList.toggle('open');
}

// Minimize Chatbox
function minimizeChatbox() {
    const chatbox = document.getElementById('chatbox');
    const maximizeButton = document.querySelector('.chatbox-maximize');
    chatbox.classList.add('minimized');
    maximizeButton.classList.remove('hidden');
}

// Maximize Chatbox
function maximizeChatbox() {
    const chatbox = document.getElementById('chatbox');
    const maximizeButton = document.querySelector('.chatbox-maximize');
    chatbox.classList.remove('minimized');
    maximizeButton.classList.add('hidden');
}

// Menu Logic
function toggleMenu() {
    const navMenu = document.getElementById('nav-menu');
    navMenu.classList.toggle('open');
}