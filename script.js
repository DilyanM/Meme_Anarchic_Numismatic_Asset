// Intro Section Logic (Only for index.html)
document.addEventListener('DOMContentLoaded', function() {
    const exploreButton = document.getElementById('explore-button');
    const introSection = document.getElementById('intro-section');
    const mainWebsite = document.getElementById('main-website');
    const transitionVideo = document.getElementById('transition-video');
    const backgroundVideo = document.getElementById('background-video-1') || document.getElementById('background-video');

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

    // Handle navigation links
    const navLinks = document.querySelectorAll('nav ul li a:not([target="_blank"]), .dropdown a:not([target="_blank"])');
    navLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const href = link.getAttribute('href');
            if (href === '#' || !href) return; // Skip disabled links

            // Close all dropdowns and the mobile menu
            const dropdowns = document.querySelectorAll('.dropdown');
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
            const navMenu = document.getElementById('nav-menu');
            if (navMenu.classList.contains('open')) {
                navMenu.classList.remove('open');
            }

            // Hide background image during transition
            const backgroundImages = document.querySelectorAll('.background-image');
            backgroundImages.forEach(img => img.classList.add('hidden'));

            // Skip animation-3 for specific routes
            if (
                window.location.pathname.includes('tree-roadmap.html') ||
                (window.location.pathname.includes('roadmap.html') && (href === 'ecosystem.html' || href === 'tree-roadmap.html'))
            ) {
                window.location.href = href;
                return;
            }

            // Play animation-3 for other pages
            const videoElement = document.getElementById('background-video-1') || document.getElementById('background-video');
            if (videoElement) {
                const animation3Src = '/assets/animation-3.mp4';
                videoElement.removeAttribute('loop');
                videoElement.style.opacity = '0';
                setTimeout(() => {
                    videoElement.src = animation3Src;
                    videoElement.load();
                    videoElement.onloadeddata = () => {
                        videoElement.play().catch(error => {
                            console.error('Animation-3 video playback failed:', error);
                            window.location.href = href;
                        });
                        videoElement.style.opacity = '1';
                    };
                    videoElement.onerror = () => {
                        console.error('Failed to load animation-3 video:', animation3Src);
                        window.location.href = href;
                    };
                    videoElement.onended = () => {
                        window.location.href = href;
                    };
                }, 500);
            } else {
                window.location.href = href;
            }
        });
    });

    // Close dropdowns and mobile menu on click anywhere
    document.addEventListener('click', function(event) {
        const dropdowns = document.querySelectorAll('.dropdown');
        const dropdownTriggers = document.querySelectorAll('.buy a, .roadmap a, .socials a');
        const navMenu = document.getElementById('nav-menu');
        const menuToggle = document.querySelector('.menu-toggle');
        let isTriggerOrDropdown = false;

        // Check if click is on a dropdown trigger or inside a dropdown
        dropdownTriggers.forEach(trigger => {
            if (trigger.contains(event.target)) {
                isTriggerOrDropdown = true;
            }
        });
        dropdowns.forEach(dropdown => {
            if (dropdown.contains(event.target)) {
                isTriggerOrDropdown = true;
            }
        });

        // Close all dropdowns if click is outside
        if (!isTriggerOrDropdown) {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }

        // Close mobile menu if click is outside the menu and menu toggle
        if (!navMenu.contains(event.target) && !menuToggle.contains(event.target)) {
            navMenu.classList.remove('open');
        }
    });
});

// Chatbox Logic
async function sendMessage() {
    console.log('Message sending is disabled.');
}

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

function toggleChatboxBody() {
    const chatbox = document.getElementById('chatbox');
    chatbox.classList.toggle('minimized');
}

function maximizeChatbox() {
    const chatbox = document.getElementById('chatbox');
    chatbox.classList.remove('minimized');
}

function toggleMenu() {
    const nav = document.getElementById('nav-menu');
    nav.classList.toggle('open');

    // Close all dropdowns when toggling the menu
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        dropdown.classList.remove('active');
    });
}

function toggleDropdown(event) {
    event.preventDefault();
    event.stopPropagation();
    const dropdown = event.target.nextElementSibling;
    const isActive = dropdown.classList.contains('active');

    document.querySelectorAll('.dropdown').forEach(d => {
        d.classList.remove('active');
    });

    if (!isActive) {
        dropdown.classList.add('active');
    }
}

function copyCA(address) {
    if (address) {
        navigator.clipboard.writeText(address).then(() => {
            alert('Contract Address copied to clipboard!');
        }).catch(err => {
            console.error('Failed to copy CA:', err);
            alert('Failed to copy Contract Address. Please copy it manually.');
        });
    } else {
        alert('Contract Address not found.');
    }
}