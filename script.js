// Enhanced Video Progress Tracking System with Firebase Integration

// Handle navigation item clicks
document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      document.querySelectorAll('.nav-item').forEach(navItem => {
        navItem.classList.remove('active');
      });
      
      item.classList.add('active');
      
      const pageId = item.getAttribute('data-page');
      showPage(pageId);
    });
});

// Function to show the selected page
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
      page.classList.remove('active');
    });
    
    const selectedPage = document.getElementById(pageId);
    if (selectedPage) {
      selectedPage.classList.add('active');
    }
}

// Global variables for video progress tracking
let currentLesson = 1;
const totalLessons = 7;
let completedVideos = new Set();
let isFirebaseReady = false;
let currentUser = null;

// Video order mapping (lesson number to video ID)
let videoOrder = [
    'Nj-L0FC2c0U',           // Lesson 1: Introduction to Python
    'mQamOwiW3iM',           // Lesson 2: Variables
    'fAr6EMp0SSc',           // Lesson 3: Loops
    'w826p9clLeA',           // Lesson 4: Conditionals
    'BEMoUK9BBIA',           // Lesson 5: String Manipulation
    'XOfNHCGfJEM',           // Lesson 6: Functions
    'qQHl0VqM8Ac'            // Lesson 7: Operators
];

// Firebase and database references (make sure these are available globally)
let db, auth;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 Initializing Video Progress System...");
    
    // Initialize Firebase references
    initializeFirebaseReferences();
    
    // Initialize other components
    initializeGenerateButtons();
    initializePagination();
    initializeVideoTracking();
    
    // Setup Firebase authentication listener
    setupAuthStateListener();
});

// Initialize Firebase references
function initializeFirebaseReferences() {
    try {
        if (typeof firebase !== 'undefined') {
            db = firebase.firestore();
            auth = firebase.auth();
            isFirebaseReady = true;
            console.log("✅ Firebase references initialized");
        } else {
            console.error("❌ Firebase not loaded");
            // Apply default locks (only first video unlocked)
            setTimeout(() => {
                applyVideoLocks();
                updateOverallProgress();
            }, 1000);
        }
    } catch (error) {
        console.error("❌ Error initializing Firebase:", error);
        isFirebaseReady = false;
    }
}

// Setup Firebase authentication state listener
function setupAuthStateListener() {
    if (!isFirebaseReady) {
        console.warn("⚠️ Firebase not ready, cannot setup auth listener");
        return;
    }
    
    auth.onAuthStateChanged(async (user) => {
        currentUser = user;
        
        if (user) {
            console.log("👤 User authenticated:", user.email);
            await loadUserVideoProgress();
            setupProgressSync();
        } else {
            console.log("👤 No user authenticated - applying default locks");
            completedVideos.clear();
            applyVideoLocks();
            updateOverallProgress();
        }
    });
}

// Initialize generate content buttons
function initializeGenerateButtons() {
    const generateButtons = document.querySelectorAll('.generate-content');
    generateButtons.forEach(button => {
        button.addEventListener('click', handleGenerateContent);
    });
}

// Initialize pagination system
function initializePagination() {
    const prevBtn = document.getElementById('prevLesson');
    const nextBtn = document.getElementById('nextLesson');
    
    if (prevBtn) prevBtn.addEventListener('click', () => changeLesson('prev'));
    if (nextBtn) nextBtn.addEventListener('click', () => changeLesson('next'));
    
    document.querySelectorAll('.step').forEach(step => {
        step.addEventListener('click', () => {
            const lessonNum = parseInt(step.getAttribute('data-lesson'));
            goToLesson(lessonNum);
        });
    });
    
    goToLesson(1);
}

// Change lesson (prev/next)
function changeLesson(direction) {
    if (direction === 'prev' && currentLesson > 1) {
        goToLesson(currentLesson - 1);
    } else if (direction === 'next' && currentLesson < totalLessons) {
        goToLesson(currentLesson + 1);
    }
}

// Navigate to specific lesson
function goToLesson(lessonNum) {
    currentLesson = lessonNum;
    
    // Update active lesson
    document.querySelectorAll('.lesson').forEach(lesson => {
        lesson.classList.remove('active');
    });
    const targetLesson = document.querySelector(`.lesson[data-lesson="${lessonNum}"]`);
    if (targetLesson) {
        targetLesson.classList.add('active');
    }
    
    // Update step indicators
    updateLessonStepsProgress();
    
    // Update navigation buttons
    const prevBtn = document.getElementById('prevLesson');
    const nextBtn = document.getElementById('nextLesson');
    
    if (prevBtn) prevBtn.disabled = lessonNum === 1;
    if (nextBtn) nextBtn.disabled = lessonNum === totalLessons;
    
    // Scroll to top
    const videoLessonsContainer = document.querySelector('#video-lessons');
    if (videoLessonsContainer) {
        videoLessonsContainer.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
    
    // Apply video locks
    applyVideoLocks();
    
    console.log(`✅ Navigated to Lesson ${lessonNum}`);
}

// Initialize video tracking for completion
function initializeVideoTracking() {
    console.log("📹 Initializing video completion tracking...");
    
    // Add manual completion buttons to all video cards
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach((card, index) => {
        const videoId = videoOrder[index];
        if (videoId) {
            addManualCompletionButton(card, videoId);
        }
    });
    
    // Setup YouTube iframe tracking (if available)
    const youtubeIframes = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
    youtubeIframes.forEach(iframe => {
        const videoId = extractVideoId(iframe.src);
        if (videoId) {
            setupYouTubeCompletionTracking(iframe, videoId);
        }
    });
}

// Extract YouTube video ID from URL
function extractVideoId(url) {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
}

// Setup YouTube completion tracking
function setupYouTubeCompletionTracking(iframe, videoId) {
    console.log(`Setting up tracking for YouTube video: ${videoId}`);
    
    // Add interaction-based completion detection
    let interactionTime = 0;
    let interactionStart = null;
    let videoCompleted = false;
    
    iframe.addEventListener('mouseenter', () => {
        if (!videoCompleted) {
            interactionStart = Date.now();
        }
    });
    
    iframe.addEventListener('mouseleave', () => {
        if (interactionStart && !videoCompleted) {
            interactionTime += Date.now() - interactionStart;
            interactionStart = null;
            
            // If user has been watching for sufficient time, consider video watched
            if (interactionTime > 120000) { // 2 minutes minimum
                videoCompleted = true;
                markVideoAsCompleted(videoId);
            }
        }
    });
}

// Add manual completion button for each video
function addManualCompletionButton(videoCard, videoId) {
    // Check if button already exists
    if (videoCard.querySelector('.mark-complete-btn')) {
        return;
    }
    
    const completeButton = document.createElement('button');
    completeButton.className = 'btn mark-complete-btn';
    completeButton.textContent = '✅ Mark as Completed';
    completeButton.style.cssText = `
        background: #10b981;
        color: white;
        margin: 10px 0;
        padding: 8px 16px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-weight: bold;
        display: block;
        width: 100%;
        max-width: 200px;
    `;
    
    completeButton.addEventListener('click', () => {
        markVideoAsCompleted(videoId);
    });
    
    // Insert button in video card
    const videoContainer = videoCard.querySelector('.video-container');
    if (videoContainer) {
        videoContainer.parentNode.insertBefore(completeButton, videoContainer.nextSibling);
    } else {
        videoCard.appendChild(completeButton);
    }
}

// Mark video as completed and update progress
async function markVideoAsCompleted(videoId) {
    if (completedVideos.has(videoId)) {
        console.log(`Video ${videoId} already marked as completed`);
        return;
    }
    
    completedVideos.add(videoId);
    console.log(`✅ Video marked as completed: ${videoId}`);
    
    // Update Firebase
    const firebaseSuccess = await updateVideoProgress(videoId);
    
    // Update UI regardless of Firebase success
    updateVideoCompletionUI(videoId);
    applyVideoLocks();
    updateOverallProgress();
    updateLessonStepsProgress();
    
    if (firebaseSuccess) {
        console.log(`🎯 Video completion saved to Firebase: ${videoId}`);
    } else {
        console.warn(`⚠️ Firebase update failed for video: ${videoId}, but UI updated`);
    }
}

// Update video completion UI
function updateVideoCompletionUI(videoId) {
    console.log(`🎨 Updating UI for completed video: ${videoId}`);
    
    // Find and update video card
    const videoCards = document.querySelectorAll('.video-card');
    videoCards.forEach((card, index) => {
        if (videoOrder[index] === videoId) {
            card.classList.add('completed');
            
            // Add completion badge if not exists
            if (!card.querySelector('.completion-badge')) {
                const badge = document.createElement('div');
                badge.className = 'completion-badge';
                badge.innerHTML = '✅ Completed';
                badge.style.cssText = `
                    position: absolute;
                    top: 10px;
                    right: 10px;
                    background: #10b981;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 10;
                `;
                card.style.position = 'relative';
                card.appendChild(badge);
            }
            
            // Hide/disable completion button
            const completeBtn = card.querySelector('.mark-complete-btn');
            if (completeBtn) {
                completeBtn.style.display = 'none';
            }
        }
    });
}

// Apply video locks based on completion status
function applyVideoLocks() {
    console.log("🔒 Applying video locks based on completion status...");
    
    let unlockedCount = 0;
    let lockedCount = 0;
    
    videoOrder.forEach((videoId, index) => {
        // First video is always unlocked, others need previous video completed
        const isUnlocked = index === 0 || completedVideos.has(videoOrder[index - 1]);
        const videoCard = findVideoCardByIndex(index);
        
        if (videoCard) {
            if (isUnlocked) {
                unlockVideo(videoCard, videoId, index + 1);
                unlockedCount++;
            } else {
                lockVideo(videoCard, videoId, index + 1);
                lockedCount++;
            }
        }
    });
    
    console.log(`🔓 Videos unlocked: ${unlockedCount}, 🔒 Videos locked: ${lockedCount}`);
}

// Find video card by index (more reliable than searching by video ID)
function findVideoCardByIndex(index) {
    const videoCards = document.querySelectorAll('.video-card');
    return videoCards[index] || null;
}

// Lock video
function lockVideo(videoCard, videoId, lessonNum) {
    if (!videoCard) return;
    
    videoCard.classList.add('locked');
    videoCard.classList.remove('unlocked');
    
    // Disable interactions
    const iframe = videoCard.querySelector('iframe');
    const video = videoCard.querySelector('video');
    const generateButton = videoCard.querySelector('.generate-content');
    const completeButton = videoCard.querySelector('.mark-complete-btn');
    
    // Disable video elements
    if (iframe) {
        iframe.style.pointerEvents = 'none';
        iframe.style.opacity = '0.5';
    }
    
    if (video) {
        video.style.pointerEvents = 'none';
        video.style.opacity = '0.5';
    }
    
    // Disable buttons
    if (generateButton) {
        generateButton.disabled = true;
        generateButton.textContent = `🔒 Complete Lesson ${lessonNum - 1} First`;
    }
    
    if (completeButton) {
        completeButton.disabled = true;
        completeButton.style.opacity = '0.5';
        completeButton.textContent = '🔒 Locked';
    }
    
    // Add lock overlay
    if (!videoCard.querySelector('.lock-overlay')) {
        const lockOverlay = document.createElement('div');
        lockOverlay.className = 'lock-overlay';
        lockOverlay.innerHTML = `
            <div class="lock-content">
                <div class="lock-icon">🔒</div>
                <div class="lock-text">Complete Lesson ${lessonNum - 1} to unlock</div>
            </div>
        `;
        lockOverlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 5;
            border-radius: 8px;
            color: white;
            text-align: center;
        `;
        
        videoCard.style.position = 'relative';
        videoCard.appendChild(lockOverlay);
    }
    
    console.log(`🔒 Locked video: Lesson ${lessonNum} (${videoId})`);
}

// Unlock video
function unlockVideo(videoCard, videoId, lessonNum) {
    if (!videoCard) return;
    
    videoCard.classList.add('unlocked');
    videoCard.classList.remove('locked');
    
    // Enable interactions
    const iframe = videoCard.querySelector('iframe');
    const video = videoCard.querySelector('video');
    const generateButton = videoCard.querySelector('.generate-content');
    const completeButton = videoCard.querySelector('.mark-complete-btn');
    
    // Enable video elements
    if (iframe) {
        iframe.style.pointerEvents = 'auto';
        iframe.style.opacity = '1';
    }
    
    if (video) {
        video.style.pointerEvents = 'auto';
        video.style.opacity = '1';
    }
    
    // Enable buttons (only if video not completed)
    if (generateButton) {
        generateButton.disabled = false;
        generateButton.textContent = '📚 Create Learning Materials';
    }
    
    if (completeButton && !completedVideos.has(videoId)) {
        completeButton.disabled = false;
        completeButton.style.opacity = '1';
        completeButton.textContent = '✅ Mark as Completed';
        completeButton.style.display = 'block';
    }
    
    // Remove lock overlay
    const lockOverlay = videoCard.querySelector('.lock-overlay');
    if (lockOverlay) {
        lockOverlay.remove();
    }
    
    console.log(`🔓 Unlocked video: Lesson ${lessonNum} (${videoId})`);
}

// Load user video progress from Firebase
async function loadUserVideoProgress() {
    console.log("🔄 Loading user video progress from Firebase...");
    
    if (!isFirebaseReady || !currentUser) {
        console.warn("⚠️ Firebase not ready or no user - applying default locks");
        applyVideoLocks();
        return;
    }
    
    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        const doc = await userRef.get();
        
        if (!doc.exists) {
            console.log("📝 New user - creating initial document and unlocking first lesson only");
            await initializeUserDocument();
            completedVideos.clear();
            applyVideoLocks();
            updateOverallProgress();
            return;
        }
        
        const userData = doc.data();
        const videoProgress = userData.progress?.videoLessons;
        
        if (videoProgress && Array.isArray(videoProgress.completed)) {
            const completedVideosList = videoProgress.completed;
            console.log("✅ Found completed videos in Firebase:", completedVideosList);
            
            // Clear and reload completed videos
            completedVideos.clear();
            
            completedVideosList.forEach(videoId => {
                if (videoOrder.includes(videoId)) {
                    completedVideos.add(videoId);
                    updateVideoCompletionUI(videoId);
                }
            });
            
            console.log(`📊 Loaded ${completedVideos.size} completed videos from Firebase`);
        } else {
            console.log("📋 No video progress found - new user");
            completedVideos.clear();
        }
        
        // Apply locks and update UI
        applyVideoLocks();
        updateOverallProgress();
        updateLessonStepsProgress();
        
    } catch (error) {
        console.error("❌ Error loading video progress from Firebase:", error);
        completedVideos.clear();
        applyVideoLocks();
    }
}

// // Initialize user document in Firebase
// async function initializeUserDocument() {
//     if (!isFirebaseReady || !currentUser) return false;
    
//     try {
//         const userRef = db.collection('users').doc(currentUser.uid);
        
//         const initialData = {
//             email: currentUser.email,
//             displayName: currentUser.displayName || 'Student',
//             createdAt: firebase.firestore.FieldValue.serverTimestamp(),
//             lastActive: firebase.firestore.FieldValue.serverTimestamp(),
//             progress: {
//                 videoLessons: {
//                     completed: [],
//                     totalCompleted: 0,
//                     lastCompleted: null,
//                     lastCompletedVideoId: null,
//                     progressPercentage: 0
//                 },
//                 overallProgress: 0
//             }
//         };
        
//         await userRef.set(initialData);
//         console.log("✅ User document initialized successfully");
//         return true;
        
//     } catch (error) {
//         console.error("❌ Error initializing user document:", error);
//         return false;
//     }
// }

// Update video progress in Firebase
async function updateVideoProgress(videoId) {
    console.log(`📹 Updating video completion progress for: ${videoId}`);
    
    if (!isFirebaseReady || !currentUser) {
        console.warn("⚠️ Firebase not ready or no user - progress not saved");
        return false;
    }
    
    try {
        const userRef = db.collection('users').doc(currentUser.uid);
        
        // Get current progress
        const doc = await userRef.get();
        if (!doc.exists) {
            await initializeUserDocument();
        }
        
        const userData = doc.data() || {};
        let completedVideosList = userData.progress?.videoLessons?.completed || [];
        
        // Add video if not already completed
        if (!completedVideosList.includes(videoId)) {
            completedVideosList.push(videoId);
            console.log(`📝 Adding completed video to Firebase: ${videoId}`);
            
            // Calculate progress percentage
            const progressPercentage = (completedVideosList.length / videoOrder.length) * 100;
            
            // Update progress
            const updateData = {
                'progress.videoLessons.completed': completedVideosList,
                'progress.videoLessons.totalCompleted': completedVideosList.length,
                'progress.videoLessons.lastCompleted': firebase.firestore.FieldValue.serverTimestamp(),
                'progress.videoLessons.lastCompletedVideoId': videoId,
                'progress.videoLessons.progressPercentage': Math.round(progressPercentage),
                'progress.overallProgress': Math.round(progressPercentage),
                'lastActive': firebase.firestore.FieldValue.serverTimestamp()
            };
            
            await userRef.update(updateData);
            console.log(`✅ Video completion progress updated in Firebase! Total: ${completedVideosList.length}`);
        }
        
        return true;
        
    } catch (error) {
        console.error("❌ Error updating video progress in Firebase:", error);
        return false;
    }
}

// Update lesson steps progress
function updateLessonStepsProgress() {
    console.log("🎯 Updating lesson steps progress...");
    
    videoOrder.forEach((videoId, index) => {
        const lessonNum = index + 1;
        const step = document.querySelector(`.step[data-lesson="${lessonNum}"]`);
        
        if (step) {
            // Remove all progress classes
            step.classList.remove('completed', 'active', 'locked');
            
            if (completedVideos.has(videoId)) {
                step.classList.add('completed');
            } else if (index === 0 || completedVideos.has(videoOrder[index - 1])) {
                // Current lesson or unlocked lesson
                if (lessonNum === currentLesson) {
                    step.classList.add('active');
                }
            } else {
                step.classList.add('locked');
            }
        }
    });
}

// Update overall progress display
function updateOverallProgress() {
    const totalVideos = videoOrder.length;
    const completedCount = completedVideos.size;
    const progressPercent = totalVideos > 0 ? (completedCount / totalVideos) * 100 : 0;
    
    // Update progress bars
    const progressBars = document.querySelectorAll('.video-progress-bar, .progress-bar-fill');
    progressBars.forEach(bar => {
        bar.style.width = `${progressPercent}%`;
    });
    
    // Update progress text
    const progressTexts = document.querySelectorAll('.video-progress-text');
    progressTexts.forEach(text => {
        text.textContent = `${completedCount}/${totalVideos} videos completed`;
    });
    
    console.log(`📊 Overall Progress: ${completedCount}/${totalVideos} (${progressPercent.toFixed(1)}%)`);
}

// Setup real-time progress sync across tabs
function setupProgressSync() {
    if (!isFirebaseReady || !currentUser) return;
    
    const userRef = db.collection('users').doc(currentUser.uid);
    
    // Listen for real-time updates
    userRef.onSnapshot((doc) => {
        if (doc.exists) {
            const userData = doc.data();
            const completedVideosList = userData.progress?.videoLessons?.completed || [];
            
            // Check if Firebase data is different from local
            const localCompleted = Array.from(completedVideos);
            if (JSON.stringify(localCompleted.sort()) !== JSON.stringify(completedVideosList.sort())) {
                console.log("🔄 Syncing progress from Firebase...");
                
                completedVideos.clear();
                completedVideosList.forEach(videoId => {
                    if (videoOrder.includes(videoId)) {
                        completedVideos.add(videoId);
                        updateVideoCompletionUI(videoId);
                    }
                });
                
                applyVideoLocks();
                updateOverallProgress();
                updateLessonStepsProgress();
            }
        }
    });
}

// Utility functions for debugging and manual control
function resetUserProgress() {
    if (!isFirebaseReady || !currentUser) {
        console.warn("No user logged in or Firebase not ready");
        return false;
    }
    
    return db.collection('users').doc(currentUser.uid).update({
        'progress.videoLessons.completed': [],
        'progress.videoLessons.totalCompleted': 0,
        'progress.videoLessons.lastCompleted': null,
        'progress.videoLessons.lastCompletedVideoId': null,
        'progress.videoLessons.progressPercentage': 0,
        'progress.overallProgress': 0,
        'lastActive': firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        completedVideos.clear();
        applyVideoLocks();
        updateOverallProgress();
        updateLessonStepsProgress();
        console.log("✅ User progress reset successfully");
        return true;
    }).catch(error => {
        console.error("❌ Error resetting progress:", error);
        return false;
    });
}

// Export debug functions
window.debugVideoProgress = {
    loadProgress: loadUserVideoProgress,
    resetProgress: resetUserProgress,
    currentCompleted: () => Array.from(completedVideos),
    videoOrder: videoOrder,
    markCompleted: markVideoAsCompleted,
    applyLocks: applyVideoLocks,
    updateProgress: updateOverallProgress
};

  
  // Rest of the existing functions (PDF generation, content generation, etc.)
  // These remain unchanged from your original code...
  
  // Check libraries function
  function checkLibraries() {
    if (typeof window.jspdf === 'undefined') {
        console.error('jsPDF library not loaded');
        return false;
    }
    if (typeof html2canvas === 'undefined') {
        console.error('html2canvas library not loaded');
        return false;
    }
    return true;
  }
  
  // Add this post-processing function
  function postProcessContent(content) {
    content = content.replace(/([a-zA-Z_]\w*\s*=.*?)(?=\n|$)/g, function(match) {
        if (!content.slice(0, content.indexOf(match)).includes('```') || 
            content.slice(content.indexOf(match)).indexOf('```') > content.slice(content.indexOf(match)).indexOf('\n')) {
            return '```python\n' + match + '\n```';
        }
        return match;
    });
    
    content = content.replace(/^(?!#)(.+?)(?=\n\n|$)/gm, function(match) {
        if (match.includes('🎯') || match.includes('Python')) {
            return '## ' + match;
        }
        return match;
    });
    
    content = content.replace(/(?:^|\n)(?![-*#])(\s*)([^-*#\n].*?):(?=\n|$)/g, '\n$1- $2:');
    
    return content;
  }
  
  // Update the addDownloadButtons function
  function addDownloadButtons(lectureElement, cheatsheetElement, videoId, videoTitle) {
    lectureElement.parentElement.querySelectorAll('.download-btn').forEach(btn => btn.remove());
    lectureElement.parentElement.querySelectorAll('.download-btn-secondary').forEach(btn => btn.remove());
    
    const cleanTitle = (videoTitle || 'video-content')
                       .replace(/[^a-z0-9]/gi, '-')
                       .replace(/-+/g, '-')
                       .replace(/^-|-$/g, '')
                       .toLowerCase();
    
    const lectureBtn = document.createElement('button');
    lectureBtn.className = 'btn download-btn';
    lectureBtn.textContent = '💾 Save Study Guide';
    lectureBtn.onclick = () => downloadAsPDF(lectureElement, `${cleanTitle}-study-guide.pdf`, videoTitle);
  
    const cheatsheetBtn = document.createElement('button');
    cheatsheetBtn.className = 'btn download-btn';
    cheatsheetBtn.textContent = '⬇️ Save Quick Reference';
    cheatsheetBtn.onclick = () => downloadAsPDF(cheatsheetElement, `${cleanTitle}-quick-reference.pdf`, videoTitle);
    
    // Create a container for download buttons
    const buttonContainer = document.createElement('div');
    buttonContainer.style.cssText = 'margin-top: 20px; margin-bottom: 20px;';
    
    buttonContainer.appendChild(lectureBtn);
    buttonContainer.appendChild(cheatsheetBtn);
    
    lectureElement.parentElement.insertBefore(buttonContainer, lectureElement);
  }
  
  // Alternative PDF download method (for backup)
  function downloadAsPDFAlternative(element, filename, videoTitle = '') {
    console.log('Using alternative PDF method');
    
    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${filename}</title>
            <meta charset="UTF-8">
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    line-height: 1.8;
                    margin: 20px;
                    color: #333;
                }
                h1, h2, h3 { 
                    color: #064e3b;
                    page-break-after: avoid;
                }
                pre {
                    background: #f5f5f5;
                    border: 1px solid #ddd;
                    padding: 10px;
                    border-radius: 4px;
                    overflow-x: auto;
                    page-break-inside: avoid;
                }
                code {
                    font-family: monospace;
                    background: #f5f5f5;
                    padding: 2px 4px;
                    border-radius: 3px;
                }
                @media print {
                    body { margin: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            <h1>${videoTitle || filename.replace('.pdf', '').toUpperCase()}</h1>
            ${element.innerHTML}
            <script>
                window.onload = function() {
                    window.print();
                    window.close();
                };
            </script>
        </body>
        </html>
    `;
    
    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }
  
  // Update the PDF download function to capture full content
  async function downloadAsPDF(element, filename, videoTitle = '') {
    console.log('Attempting to download PDF:', filename);
    
    if (!checkLibraries()) {
        alert('PDF libraries not loaded. Using print method instead.');
        return downloadAsPDFAlternative(element, filename, videoTitle);
    }
    
    try {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-indicator';
        loadingDiv.textContent = 'Generating PDF...';
        element.parentElement.insertBefore(loadingDiv, element);
        
        const container = document.createElement('div');
        container.style.cssText = `
            width: 800px;
            padding: 40px;
            background: white;
            font-family: Arial, Helvetica, sans-serif;
            color: #333;
            line-height: 1.8;
            position: absolute;
            top: 0;
            left: -9999px;
        `;
        
        const titleSection = document.createElement('div');
        titleSection.style.cssText = `
            margin-bottom: 40px;
            border-bottom: 2px solid #e5e7eb;
            padding-bottom: 20px;
        `;
        
        const title = document.createElement('h1');
        title.textContent = videoTitle || filename.replace('.pdf', '').replace(/-/g, ' ').toUpperCase();
        title.style.cssText = `
            color: #064e3b;
            margin-bottom: 15px;
            text-align: center;
            font-size: 28px;
            line-height: 1.3;
        `;
        
        const date = document.createElement('p');
        date.textContent = `Generated on: ${new Date().toLocaleDateString()}`;
        date.style.cssText = `
            text-align: center;
            color: #666;
            margin-bottom: 0;
        `;
        
        titleSection.appendChild(title);
        titleSection.appendChild(date);
        container.appendChild(titleSection);
        
        const content = element.cloneNode(true);
        
        content.style.maxHeight = 'none';
        content.style.overflow = 'visible';
        content.style.height = 'auto';
        
        const headings = content.querySelectorAll('h1, h2, h3, h4');
        headings.forEach(heading => {
            const level = heading.tagName;
            const styles = {
                'H1': 'font-size: 24px; margin-top: 40px; margin-bottom: 20px;',
                'H2': 'font-size: 20px; margin-top: 35px; margin-bottom: 15px;',
                'H3': 'font-size: 18px; margin-top: 30px; margin-bottom: 12px;',
                'H4': 'font-size: 16px; margin-top: 25px; margin-bottom: 10px;'
            };
            heading.style.cssText = styles[level] + ' color: #064e3b; font-weight: bold; page-break-after: avoid;';
        });
        
        const paragraphs = content.querySelectorAll('p');
        paragraphs.forEach(p => {
            p.style.cssText = 'margin-bottom: 18px; line-height: 1.8;';
        });
        
        const lists = content.querySelectorAll('ul, ol');
        lists.forEach(list => {
            list.style.cssText = 'margin-bottom: 25px; line-height: 1.8; margin-left: 20px;';
            const items = list.querySelectorAll('li');
            items.forEach(li => {
                li.style.cssText = 'margin-bottom: 10px;';
            });
        });
        
        const codeBlocks = content.querySelectorAll('pre');
        codeBlocks.forEach(block => {
            block.style.cssText = `
                background-color: #f5f5f5;
                border: 1px solid #ddd;
                border-radius: 6px;
                padding: 25px;
                margin: 30px 0;
                font-family: 'Courier New', monospace;
                font-size: 13px;
                line-height: 1.6;
                overflow-x: auto;
                page-break-inside: avoid;
                width: 100%;
                box-sizing: border-box;
            `;
        });
        
        const inlineCode = content.querySelectorAll('code:not(pre code)');
        inlineCode.forEach(code => {
            code.style.cssText = `
                background-color: #f0f0f0;
                padding: 2px 6px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 13px;
            `;
        });
        
        container.appendChild(content);
        document.body.appendChild(container);
        
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const contentHeight = container.offsetHeight;
        
      const canvas = await html2canvas(container, {
          scale: 2,
          logging: false,
          useCORS: false,
          windowWidth: 800 + 80,
          windowHeight: contentHeight,
          height: contentHeight,
          width: 800 + 80
      });
      
      document.body.removeChild(container);
      element.parentElement.removeChild(loadingDiv);
      
      const { jsPDF } = window.jspdf;
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      const pdfWidth = 210;
      const pdfHeight = 297;
      
      const pdfWidthFormatted = pdfWidth;
      const pdfHeightFormatted = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeightFormatted;
      let position = 0;
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      while (heightLeft > 0) {
          pdf.addImage(imgData, 'PNG', 0, position, pdfWidthFormatted, pdfHeightFormatted);
          heightLeft -= pdfHeight;
          
          if (heightLeft > 0) {
              position = position - pdfHeight;
              pdf.addPage();
          }
      }
      
      pdf.save(filename);
      
  } catch (error) {
      console.error('Error details:', error);
      alert('Error generating PDF: ' + error.message + '\nUsing alternative method.');
      downloadAsPDFAlternative(element, filename, videoTitle);
  }
}

// Complete JavaScript File - script.js (continued)

// Update handleGenerateContent with new button text
async function handleGenerateContent(event) {
  const button = event.target;
  const videoId = button.getAttribute('data-video-id');
  const videoTitle = button.getAttribute('data-video-title');
  const videoCard = button.closest('.video-card');
  const lectureOutput = videoCard.querySelector('.lecture-output');
  const cheatsheetOutput = videoCard.querySelector('.cheatsheet-output');
  
//     // Track content generation
//   console.log(`Generating content for video: ${videoId}`);
//   updateVideoProgress(`generate-${videoId}`);

  button.disabled = true;
  button.innerHTML = 'Generating... <span class="loading-spinner"></span>';
  
  try {
      const transcript = await getVideoTranscript(videoId);
      console.info(videoId)
      
      let lectureContent = await generateLectureContent(transcript);
      let cheatSheet = await generateCheatSheet(transcript);
      
      lectureContent = postProcessContent(lectureContent);
      cheatSheet = postProcessContent(cheatSheet);
      
      lectureContent = cleanupMarkdown(lectureContent);
      cheatSheet = cleanupMarkdown(cheatSheet);
      
      lectureOutput.innerHTML = marked.parse(lectureContent);
      cheatsheetOutput.innerHTML = marked.parse(cheatSheet);
      
      lectureOutput.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightBlock(block);
      });
      cheatsheetOutput.querySelectorAll('pre code').forEach((block) => {
          hljs.highlightBlock(block);
      });
      
      lectureOutput.style.display = 'block';
      cheatsheetOutput.style.display = 'block';
      
      addDownloadButtons(lectureOutput, cheatsheetOutput, videoId, videoTitle);
      
    //   // Track successful content generation
    //   updateVideoProgress(`generated-${videoId}`);


  } catch (error) {
      console.error('Error generating content:', error);
      lectureOutput.textContent = 'Error generating content: ' + error.message;
      lectureOutput.style.display = 'block';
  } finally {
      button.disabled = false;
      button.innerHTML = '📚 Create Learning Materials';
  }
}

// Add this function to clean up the generated content
function cleanupMarkdown(content) {
  content = content.replace(/\*\*(```[\s\S]*?```)\*\*/g, '$1');
  
  content = content.replace(/```python\n([\s\S]*?)```/g, function(match, code) {
      return '```python\n' + code.trim() + '\n```';
  });
  
  return content;
}

// Update the getVideoTranscript function to provide topic-specific content
async function getVideoTranscript(videoId) {
  const videoTopics = {
      'Nj-L0FC2c0U': {
          topic: 'Introduction to Python',
          keywords: 'programming language basics, python syntax, getting started',
          content: `Welcome to Python! Today we'll cover what Python is, why it's popular, how to install it, 
          basic syntax, hello world program, variables introduction, and running your first Python program.`
      },
      'mQamOwiW3iM': {
          topic: 'Variables in Python',
          keywords: 'variable assignment, data types, naming conventions',
          content: `Let's learn about Python variables! We'll cover variable declaration, assignment operator, 
          data types (strings, integers, floats), variable naming rules, and how to print variables.`
      },
      'fAr6EMp0SSc': {
          topic: 'Python Loops',
          keywords: 'for loops, while loops, iteration, range function',
          content: `Loops are essential in Python! We'll learn about for loops, while loops, range() function, 
          loop control statements, and practical examples of using loops for repetitive tasks.`
      },
      'w826p9clLeA': {
          topic: 'Python Conditionals',
          keywords: 'if statements, else, elif, comparison operators',
          content: `Today we'll explore Python conditionals! We'll cover if statements, else clauses, elif for multiple conditions, 
          comparison operators (==, !=, <, >, <=, >=), logical operators (and, or, not), and nested conditions.`
      },
      'BEMoUK9BBIA': {
          topic: 'String Manipulation',
          keywords: 'string methods, concatenation, slicing',
          content: `Let's work with strings in Python! We'll learn string creation, string methods (upper(), lower(), replace()), 
          string concatenation, string slicing, f-strings for formatting, and common string operations.`
      },
      'XOfNHCGfJEM': {
          topic: 'Python Functions',
          keywords: 'function definition, parameters, return values, scope',
          content: `Functions make code reusable! We'll learn how to define functions with def, function parameters, 
          return values, default arguments, variable scope, and best practices for writing functions.`
      },
      'qQHl0VqM8Ac': {
          topic: 'Python Operators',
          keywords: 'arithmetic operators, comparison operators, logical operators',
          content: `Let's master Python operators! We'll cover arithmetic operators (+, -, *, /, %, **), 
          comparison operators, logical operators, assignment operators, and operator precedence.`
      }
  };

  const topicData = videoTopics[videoId];
  
  if (topicData) {
      return {
          topic: topicData.topic,
          keywords: topicData.keywords,
          content: topicData.content
      };
  } else {
      return {
          topic: 'Python Programming',
          keywords: 'programming concepts',
          content: 'This video covers Python programming concepts.'
      };
  }
}

// Update the generateLectureContent to use specific prompts
async function generateLectureContent(transcript) {
  const prompt = `You are a friendly coding teacher explaining "${transcript.topic}" to kids aged 10-16.

TOPIC: ${transcript.topic}
KEYWORDS: ${transcript.keywords}
CONTENT SUMMARY: ${transcript.content}

Create a structured lecture about ${transcript.topic}. FORMATTING RULES:
1. Start with ## ${transcript.topic} 🎯
2. Use ### for subtopics related to ${transcript.topic}
3. Use bullet points with - for key concepts
4. All code examples MUST be about ${transcript.topic}
5. Use emojis relevant to ${transcript.topic}
6. Explain everything in simple terms for kids

TOPIC-SPECIFIC REQUIREMENTS:
${getTopicSpecificRequirements(transcript.topic)}

Create the lecture following these rules!`;

  try {
      const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              model: 'lectureModel',
              prompt: prompt,
              stream: false
          })
      });
      
      const data = await response.json();
      return cleanupMarkdown(data.response);
  } catch (error) {
      throw new Error('Failed to generate lecture content');
  }
}

// Helper function for topic-specific requirements
function getTopicSpecificRequirements(topic) {
  const requirements = {
      'Introduction to Python': `
          - Start with what Python is and why it's popular
          - Show "Hello, World!" example
          - Explain basic syntax rules
          - NO focus on complex concepts`,
      
      'Variables in Python': `
          - Focus on variable creation: name = value
          - Show different data types: strings, numbers
          - Explain naming rules
          - Show practical examples`,
      
      'Python Loops': `
          - Teach for loop with range()
          - Teach while loop
          - Show loop examples for counting, lists
          - Explain loop control (break, continue)`,
      
      'Python Conditionals': `
          - Start with simple if statements
          - Explain comparison operators
          - Teach if-else structure
          - Show nested conditions
          - Include practical examples`,
      
      'String Manipulation': `
          - Creating strings
          - String methods (upper, lower, replace)
          - String concatenation
          - String slicing
          - F-strings for formatting`,
      
      'Python Functions': `
          - Function definition with def
          - Parameters and arguments
          - Return statements
          - Function examples
          - Variable scope basics`,
      
      'Python Operators': `
          - Arithmetic operators
          - Comparison operators
          - Logical operators
          - Assignment operators
          - Operator precedence`
  };
  
  return requirements[topic] || 'Explain the topic clearly with examples';
}

// Update the generateCheatSheet to be topic-specific
async function generateCheatSheet(transcript) {
  const prompt = `Create a cheatsheet for "${transcript.topic}" for kids aged 10-16.

TOPIC: ${transcript.topic}

Create a concise reference for ${transcript.topic}. FORMATTING RULES:
1. Use ## ${transcript.topic} Quick Reference 📝
2. Use - for bullet points
3. All code examples must be about ${transcript.topic}
4. Keep it simple and focused on this topic
5. Use relevant emojis

Include ONLY ${transcript.topic} content - no other topics!

CREATE THE CHEATSHEET NOW!`;

  try {
      const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
              'Content-Type': 'application/json'
          },
          body: JSON.stringify({
              model: 'lectureModel',
              prompt: prompt,
              stream: false
          })
      });
      
      const data = await response.json();
      return cleanupMarkdown(data.response);
  } catch (error) {
      throw new Error('Failed to generate cheat sheet');
  }
}

// Optional: Add video end event listener to auto-generate content
function addVideoEndListeners() {
  const iframes = document.querySelectorAll('.video-container iframe');
  
  iframes.forEach(iframe => {
      iframe.addEventListener('load', function() {
          const player = new YT.Player(iframe, {
              events: {
                  'onStateChange': function(event) {
                      if (event.data === YT.PlayerState.ENDED) {
                          const videoCard = iframe.closest('.video-card');
                          const generateButton = videoCard.querySelector('.generate-content');
                          generateButton.click();
                      }
                  }
              }
          });
      });
  });
}
