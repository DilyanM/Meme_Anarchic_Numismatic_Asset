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

    // Add Enter key listener for chatbox input (disabled, but keeping for future use)
    const userInput = document.getElementById('user-input');
    if (userInput) {
        userInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                sendMessage();
            }
        });
    }

    // Handle Roadmap dropdown click to play animation-3.mp4 once, then redirect
    const roadmapLinks = document.querySelectorAll('#roadmap-dropdown a');
    roadmapLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const href = link.getAttribute('href');

            if (backgroundVideo) {
                const animation3Src = '/assets/animation-3.mp4';
                backgroundVideo.removeAttribute('loop');
                backgroundVideo.style.opacity = '0';
                setTimeout(() => {
                    backgroundVideo.src = animation3Src;
                    backgroundVideo.load();
                    backgroundVideo.onloadeddata = () => {
                        backgroundVideo.play().catch(error => {
                            console.error('Animation-3 video playback failed:', error);
                            window.location.href = href;
                        });
                        backgroundVideo.style.opacity = '1';
                    };
                    backgroundVideo.onerror = () => {
                        console.error('Failed to load animation-3 video:', animation3Src);
                        window.location.href = href;
                    };
                    backgroundVideo.onended = () => {
                        window.location.href = href;
                    };
                }, 500);
            } else {
                window.location.href = href;
            }
        });
    });
});

// Chatbox Logic
async function sendMessage() {
    // Disabled functionality - input and button are disabled in HTML
    console.log('Message sending is disabled.');
}

// Fetch LLM Response via Netlify Function (kept for future use)
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
        throw error;
    }
}

// Typing animation (kept for future use)
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

// Voice narration with ethereal effects (via Netlify Function, kept for future use)
async function narrateResponse(text, narratingIndicator, agentMessage) {
    let hasCleanedUp = false;

    try {
        console.log('Starting narration for text:', text);

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

        const audioContext = new (window.AudioContext || window.webkitAudioContext)();

        if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('AudioContext resumed');
        }

        const narrationAudio = new Audio(audioUrl);
        const narrationSource = audioContext.createMediaElementSource(narrationAudio);
        const convolver = audioContext.createConvolver();
        const narrationGain = audioContext.createGain();

        const duration = 0.5;
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
        narrationGain.gain.value = 0.4;

        const effectAudio = new Audio('/assets/ethereal-hum.mp3');
        effectAudio.loop = true;
        const effectSource = audioContext.createMediaElementSource(effectAudio);
        const effectGain = audioContext.createGain();
        effectSource.connect(effectGain);
        effectGain.connect(audioContext.destination);
        effectGain.gain.value = 0.2;

        const animatedVideo = document.getElementById('background-video');
        if (!animatedVideo) {
            console.error('Background video element not found. Tried #background-video');
        } else {
            console.log('Background video element found:', animatedVideo);
        }

        narratingIndicator.remove();

        effectAudio.play().catch(error => {
            console.error('Effect audio playback failed:', error);
        });

        let currentVideoState = 'animation-1';

        narrationAudio.onplaying = () => {
            console.log('Narration audio started playing');
            if (animatedVideo) {
                const animation2Src = '/assets/animation-2.mp4';
                console.log('Switching to animation-2:', animation2Src);
                animatedVideo.style.opacity = '0';
                const transitionDuration = 500;
                setTimeout(() => {
                    animatedVideo.src = animation2Src;
                    animatedVideo.load();
                    animatedVideo.onloadeddata = () => {
                        animatedVideo.play().catch(error => {
                            console.error('Animation-2 video playback failed:', error);
                        });
                        animatedVideo.style.opacity = '1';
                        currentVideoState = 'animation-2';
                        console.log('Successfully switched to animation-2');
                    };
                    animatedVideo.onerror = () => {
                        console.error('Failed to load animation-2 video:', animation2Src);
                    };
                }, transitionDuration);
            }
            typeResponse(agentMessage, text);
        };

        narrationAudio.play().catch(error => {
            console.error('Narration audio playback failed:', error);
        }).then(() => {
            console.log('Narration audio play() called');
            if (animatedVideo) {
                const animation2Src = '/assets/animation-2.mp4';
                console.log('Switching to animation-2 (fallback):', animation2Src);
                animatedVideo.style.opacity = '0';
                const transitionDuration = 500;
                setTimeout(() => {
                    animatedVideo.src = animation2Src;
                    animatedVideo.load();
                    animatedVideo.onloadeddata = () => {
                        animatedVideo.play().catch(error => {
                            console.error('Animation-2 video playback failed:', error);
                        });
                        animatedVideo.style.opacity = '1';
                        currentVideoState = 'animation-2';
                        console.log('Successfully switched to animation-2 (fallback)');
                    };
                    animatedVideo.onerror = () => {
                        console.error('Failed to load animation-2 video:', animation2Src);
                    };
                }, transitionDuration);
            }
            typeResponse(agentMessage, text);
        });

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
        throw error;
    }
}

// Helper function to clean up and switch back to animation-1
function cleanupAndSwitchBack(animatedVideo, effectAudio, audioContext, audioUrl, resolve, currentVideoState) {
    try {
        effectAudio.pause();
    } catch (error) {
        console.error('Failed to pause effect audio:', error);
    }

    if (audioContext.state !== 'closed') {
        audioContext.close().catch(error => {
            console.error('Failed to close AudioContext:', error);
        });
    }

    URL.revokeObjectURL(audioUrl);

    if (animatedVideo) {
        console.log('Current video state:', currentVideoState);
        if (currentVideoState === 'animation-2') {
            const animation1Src = '/assets/animation-1.mp4';
            console.log('Switching back to animation-1:', animation1Src);
            animatedVideo.style.opacity = '0';
            setTimeout(() => {
                animatedVideo.src = animation1Src;
                animatedVideo.load();
                animatedVideo.onloadeddata = () => {
                    animatedVideo.play().catch(error => {
                        console.error('Animation-1 video playback failed:', error);
                    });
                    animatedVideo.style.opacity = '1';
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

// Socials and Roadmap Dropdown Logic
function toggleDropdown(event) {
    event.preventDefault();
    const target = event.currentTarget;
    const dropdownId = target.nextElementSibling.id;
    const dropdown = document.getElementById(dropdownId);
    const isActive = dropdown.classList.contains('active');

    // Close all dropdowns
    document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('active'));

    // Toggle the clicked dropdown
    if (!isActive) {
        dropdown.classList.add('active');
    }
}

document.addEventListener('click', function(event) {
    const dropdowns = document.querySelectorAll('.dropdown');
    const tabs = document.querySelectorAll('.socials a, .roadmap a');
    let isInsideDropdownOrTab = false;

    dropdowns.forEach(dropdown => {
        if (dropdown.contains(event.target)) isInsideDropdownOrTab = true;
    });
    tabs.forEach(tab => {
        if (tab.contains(event.target)) isInsideDropdownOrTab = true;
    });

    if (!isInsideDropdownOrTab) {
        dropdowns.forEach(dropdown => dropdown.classList.remove('active'));
    }
});

// Chatbox Logic (Toggle Body and Input)
function toggleChatboxBody() {
    const chatbox = document.getElementById('chatbox');
    const chatboxBody = document.getElementById('chatbox-body');
    const chatboxInput = document.querySelector('.chatbox-input');
    const chatboxHeader = document.querySelector('.chatbox-header');

    chatboxBody.style.display = chatboxBody.style.display === 'block' ? 'none' : 'block';
    chatboxInput.style.display = chatboxInput.style.display === 'block' ? 'none' : 'block';
    chatboxHeader.classList.toggle('open');

    // Toggle minimized class based on visibility
    if (chatboxBody.style.display === 'none') {
        chatbox.classList.add('minimized');
    } else {
        chatbox.classList.remove('minimized');
    }
}

// Minimize Chatbox
function minimizeChatbox(event) {
    event.stopPropagation();
    const chatboxBody = document.getElementById('chatbox-body');
    const chatboxInput = document.querySelector('.chatbox-input');
    const chatboxHeader = document.querySelector('.chatbox-header');

    chatboxBody.style.display = 'none';
    chatboxInput.style.display = 'none';
    chatboxHeader.classList.remove('open');
    document.getElementById('chatbox').classList.add('minimized');
}

// Maximize Chatbox
function maximizeChatbox() {
    const chatboxBody = document.getElementById('chatbox-body');
    const chatboxInput = document.querySelector('.chatbox-input');
    const chatboxHeader = document.querySelector('.chatbox-header');

    chatboxBody.style.display = 'block';
    chatboxInput.style.display = 'block';
    chatboxHeader.classList.add('open');
    document.getElementById('chatbox').classList.remove('minimized');
}

// Menu Logic
function toggleMenu() {
    const navMenu = document.getElementById('nav-menu');
    navMenu.classList.toggle('open');
}