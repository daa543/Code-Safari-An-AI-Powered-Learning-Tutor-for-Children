// Configuration - Change this to match your Flask server
const SERVER_URL = 'http://localhost:5000';

// Score system constants
const POINTS_PER_PROBLEM = 10;

// Global variables to track current session
let currentScore = 0;
let currentBestScore = 0;
let problemsSolved = 0;

// Initialize score display when page loads
document.addEventListener('DOMContentLoaded', function() {
    showInstructions();
    initializeScoreDisplay();
    generateProblem();
});

// Initialize score display and load user progress
async function initializeScoreDisplay() {
    try {
        // Wait for Firebase auth to be ready
        if (typeof window.CodeSafariProgressTracker !== 'undefined') {
            const progress = await window.CodeSafariProgressTracker.getCodingExerciseProgress();
            if (progress) {
                currentScore = progress.score;
                currentBestScore = progress.bestScore;
                problemsSolved = progress.problemsSolved;
            }
        }
        updateScoreDisplay();
    } catch (error) {
        console.error("Error loading user progress:", error);
        updateScoreDisplay(); // Show default values
    }
}

// Update score display in the UI
function updateScoreDisplay() {
    const scoreContainer = document.getElementById('score-container');
    if (!scoreContainer) {
        // Create score display if it doesn't exist
        const scoreHtml = `
        <div id="score-container" style="background-color: #f8f9fa; border: 2px solid #e9ecef; border-radius: 8px; padding: 15px; margin: 10px 0; text-align: center;">
            <div style="display: flex; justify-content: space-around; align-items: center;">
                <div>
                    <h4 style="margin: 0; color: #495057;">Current Score</h4>
                    <span id="current-score" style="font-size: 24px; font-weight: bold; color: #007bff;">${currentScore}</span>
                </div>
                <div>
                    <h4 style="margin: 0; color: #495057;">Best Score</h4>
                    <span id="best-score" style="font-size: 24px; font-weight: bold; color: #28a745;">${currentBestScore}</span>
                </div>
                <div>
                    <h4 style="margin: 0; color: #495057;">Problems Solved</h4>
                    <span id="problems-solved" style="font-size: 24px; font-weight: bold; color: #6f42c1;">${problemsSolved}</span>
                </div>
            </div>
        </div>`;
        
        const problemDiv = document.getElementById("problem");
        problemDiv.insertAdjacentHTML('beforebegin', scoreHtml);
    } else {
        // Update existing display
        document.getElementById('current-score').textContent = currentScore;
        document.getElementById('best-score').textContent = currentBestScore;
        document.getElementById('problems-solved').textContent = problemsSolved;
    }
}

async function generateProblem() {
    try {
        // Show loading
        document.getElementById("problem").innerHTML = 
            "<p style='color: blue;'>🔄 Generating new problem...</p>";
            
        const res = await fetch(`${SERVER_URL}/generate`);
        const data = await res.json();
        
        if (data.status === "error") {
            document.getElementById("problem").innerHTML = 
                "<p style='color: red;'>Error generating problem. Please try again.</p>";
            return;
        }
        
        document.getElementById("problem").innerHTML = 
            `<pre><strong>${data.problem}</strong>\n\n${data.truncated}</pre>`;
        document.getElementById("result").innerHTML = "";
        document.getElementById("user_code").value = "";
        
        // Clear any previous sections
        const existingSections = document.querySelectorAll("#instructions");
        existingSections.forEach(section => section.remove());
        
    } catch (error) {
        console.error("Error generating problem:", error);
        document.getElementById("problem").innerHTML = 
            "<p style='color: red;'>Error connecting to server. Make sure Flask server is running on port 5000.</p>";
    }
}

async function checkSolution() {
    const userCode = document.getElementById("user_code").value;
    
    if (!userCode.trim()) {
        document.getElementById("result").innerHTML = 
            "<p style='color: orange;'>⚠️ Please enter your code before checking.</p>";
        return;
    }
    
    // Show evaluation message
    document.getElementById("result").innerHTML = 
        "<p style='color: blue;'>🔄 Comparing your solution with the model solution...</p>";
    
    try {
        const res = await fetch(`${SERVER_URL}/evaluate`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_code: userCode })
        });
        
        const data = await res.json();
        
        const resultDiv = document.getElementById("result");
        
        // Handle correct solution
        if (data.is_correct) {
            // Award points and update progress
            await awardPoints(POINTS_PER_PROBLEM);
            
            resultDiv.innerHTML = 
                `<div style="background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 6px; padding: 15px; margin: 10px 0;">
                    <p style="color: #155724; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">✅ ${data.feedback}</p>
                    <p style="color: #155724; margin: 0 0 10px 0;">Great job! Your solution produces the same results as the model solution.</p>
                    <div style="background-color: #c3e6cb; padding: 10px; border-radius: 4px; text-align: center;">
                        <span style="color: #155724; font-weight: bold; font-size: 16px;">🎉 +${POINTS_PER_PROBLEM} Points Earned!</span>
                        ${(currentScore > currentBestScore - POINTS_PER_PROBLEM) ? '<br><span style="color: #155724; font-size: 14px;">🏆 New Best Score!</span>' : ''}
                    </div>
                </div>`;
        } else {
            // Incorrect solution
            resultDiv.innerHTML = 
                `<div style="background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 6px; padding: 15px; margin: 10px 0;">
                    <p style="color: #721c24; font-size: 18px; font-weight: bold; margin: 0 0 10px 0;">❌ ${data.feedback}</p>
                    <details style="margin-top: 15px;">
                        <summary style="cursor: pointer; font-weight: bold; color: #721c24;">💡 Show Expected Solution Structure</summary>
                        <pre style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; margin-top: 10px; overflow-x: auto;">${data.suggested_code}</pre>
                    </details>
                </div>`;
        }
            
    } catch (error) {
        console.error("Error checking solution:", error);
        document.getElementById("result").innerHTML = 
            "<p style='color: red;'>Error connecting to server. Make sure Flask server is running on port 5000.</p>";
    }
}

// Award points and update Firebase
async function awardPoints(points) {
    try {
        // Update local variables first
        currentScore += points;
        problemsSolved += 1;
        
        // Update Firebase if available
        if (typeof window.CodeSafariProgressTracker !== 'undefined') {
            const isNewBestScore = await window.CodeSafariProgressTracker.updateCodingExerciseProgress(points);
            
            // Update best score if needed
            if (isNewBestScore) {
                currentBestScore = currentScore;
                console.log("🏆 New best score achieved:", currentBestScore);
            }
            
            console.log(`✅ Points awarded: +${points}. Current score: ${currentScore}`);
        } else {
            console.warn("Progress tracker not available - points not saved to database");
        }
        
        // Update the display
        updateScoreDisplay();
        
    } catch (error) {
        console.error("❌ Error awarding points:", error);
        // Still update local display even if Firebase fails
        updateScoreDisplay();
    }
}

// Reset current score (for testing or new sessions)
// Reset current score (for testing or new sessions)
async function resetCurrentScore() {
    if (confirm("Are you sure you want to reset your current score? This will not affect your best score.")) {
        try {
            currentScore = 0;
            
            // Update Firebase
            if (typeof window.CodeSafariProgressTracker !== 'undefined') {
                const user = firebase.auth().currentUser;
                if (user) {
                    const userRef = firebase.firestore().collection('users').doc(user.uid);
                    await userRef.update({
                        'progress.games.codingExercise.score': 0,
                        'lastActive': firebase.firestore.FieldValue.serverTimestamp()
                    });
                }
            }
            
            updateScoreDisplay();
            console.log("Current score reset to 0");
            
        } catch (error) {
            console.error("Error resetting score:", error);
        }
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Ctrl+Enter to check solution
    if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        checkSolution();
    }
    // Ctrl+N for new problem
    if (event.ctrlKey && event.key === 'n') {
        event.preventDefault();
        generateProblem();
    }
});

// Instructions for users
function showInstructions() {
    const instructions = `
<div id="instructions" style="background-color: #e8f4fd; padding: 15px; margin: 10px 0; border: 1px solid #b8d4ea; border-radius: 8px;">
    <h4 style="margin-top: 0; color: #1a5490;">📚 Model-Based Code Exercise System</h4>
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 15px;">
        <div>
            <h5 style="margin: 0 0 8px 0; color: #2c5282;">🎯 How It Works:</h5>
            <ul style="margin: 0; padding-left: 18px; color: #2c5282;">
                <li><strong>Model Comparison:</strong> Your solution is compared directly with an AI-generated model solution</li>
                <li><strong>Sample Testing:</strong> Tests your code with various inputs against the model</li>
                <li><strong>Smart Feedback:</strong> Shows exactly where your output differs from expected</li>
                <li><strong>Scoring:</strong> Earn ${POINTS_PER_PROBLEM} points for each correctly solved problem!</li>
            </ul>
        </div>
        <div>
            <h5 style="margin: 0 0 8px 0; color: #2c5282;">⌨️ Shortcuts:</h5>
            <ul style="margin: 0; padding-left: 18px; color: #2c5282;">
                <li><strong>Ctrl+Enter:</strong> Check solution</li>
                <li><strong>Ctrl+N:</strong> New problem</li>
            </ul>
        </div>
    </div>
    <p style="margin: 0; font-style: italic; color: #2c5282; text-align: center;">
        🤖 Your solution just needs to produce the same results as the AI model - multiple approaches accepted!
        <br>🏆 Try to beat your best score by solving more problems correctly!
    </p>
</div>`;
    
    const problemDiv = document.getElementById("problem");
    problemDiv.insertAdjacentHTML('beforebegin', instructions);
}

// Auto-resize textarea
document.addEventListener('DOMContentLoaded', function() {
    const textarea = document.getElementById('user_code');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }
});

// Health check function (optional - for debugging)
async function checkServerHealth() {
    try {
        const res = await fetch(`${SERVER_URL}/health`);
        const data = await res.json();
        console.log('Server health:', data);
        return data.status === 'healthy';
    } catch (error) {
        console.error('Server health check failed:', error);
        return false;
    }
}

// Make functions available globally for debugging
window.codingExerciseGame = {
    resetCurrentScore,
    awardPoints,
    updateScoreDisplay,
    currentScore: () => currentScore,
    currentBestScore: () => currentBestScore,
    problemsSolved: () => problemsSolved
};