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

    // Handle Ecosystem tab click to play animation-3.mp4 once, then redirect
    const ecosystemLink = document.querySelector('nav ul li a[href="ecosystem.html"]');
    if (ecosystemLink) {
        ecosystemLink.addEventListener('click', function(event) {
            event.preventDefault();
            const href = ecosystemLink.getAttribute('href');

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
    }
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

        const source = audioContext.createBufferSource();

        const audioBuffer = await audioContext.decodeAudioData(await audioBlob.arrayBuffer());
        source.buffer = audioBuffer;

        const gainNode = audioContext.createGain();
        gainNode.gain.value = 1.0;

        const pannerNode = audioContext.createStereoPanner();
        pannerNode.pan.value = 0;

        const convolver = audioContext.createConvolver();
        const reverbResponse = await fetch('/assets/reverb-impulse.wav');
        const reverbArrayBuffer = await reverbResponse.arrayBuffer();
        convolver.buffer = await audioContext.decodeAudioData(reverbArrayBuffer);

        const dryGain = audioContext.createGain();
        dryGain.gain.value = 0.6;

        const wetGain = audioContext.createGain();
        wetGain.gain.value = 0.4;

        source.connect(dryGain).connect(pannerNode).connect(audioContext.destination);
        source.connect(convolver).connect(wetGain).connect(pannerNode).connect(audioContext.destination);

        source.start();

        narratingIndicator.classList.remove('hidden');

        source.onended = () => {
            if (!hasCleanedUp) {
                hasCleanedUp = true;
                narratingIndicator.classList.add('hidden');
                URL.revokeObjectURL(audioUrl);
                audioContext.close();
            }
        };

        return source;
    } catch (error) {
        console.error('Narration Error:', error.message);
        if (!hasCleanedUp) {
            hasCleanedUp = true;
            narratingIndicator.classList.add('hidden');
        }
        throw error;
    }
}

// Toggle Chatbox Body
function toggleChatboxBody() {
    const chatbox = document.getElementById('chatbox');
    chatbox.classList.toggle('minimized');
}

// Maximize Chatbox
function maximizeChatbox() {
    const chatbox = document.getElementById('chatbox');
    chatbox.classList.remove('minimized');
}

// Toggle Navigation Menu (Mobile)
function toggleMenu() {
    const nav = document.getElementById('nav-menu');
    nav.classList.toggle('open');
}

// Toggle Dropdown Menu
function toggleDropdown(event) {
    event.preventDefault();
    const dropdown = event.target.nextElementSibling;
    const isActive = dropdown.classList.contains('active');

    // Close all dropdowns
    document.querySelectorAll('.dropdown').forEach(d => {
        d.classList.remove('active');
    });

    // Toggle the clicked dropdown
    if (!isActive) {
        dropdown.classList.add('active');
    }
}

// Close dropdowns when clicking outside
document.addEventListener('click', function(event) {
    const dropdowns = document.querySelectorAll('.dropdown');
    const navLinks = document.querySelectorAll('nav ul li a');

    let isDropdownClick = false;
    dropdowns.forEach(dropdown => {
        if (dropdown.contains(event.target)) {
            isDropdownClick = true;
        }
    });

    let isNavLinkClick = false;
    navLinks.forEach(link => {
        if (link === event.target) {
            isNavLinkClick = true;
        }
    });

    if (!isDropdownClick && !isNavLinkClick) {
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    }
});

// Copy CA to Clipboard
function copyCA() {
    const caAddressElements = document.querySelectorAll('.ca-address');
    let caAddress = '';
    
    caAddressElements.forEach(element => {
        if (element.textContent) {
            caAddress = element.textContent.trim();
        }
    });

    if (caAddress) {
        navigator.clipboard.writeText(caAddress).then(() => {
            alert('Contract Address copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy CA:', err);
            alert('Failed to copy Contract Address. Please copy it manually.');
        });
    } else {
        alert('Contract Address not found.');
    }
}