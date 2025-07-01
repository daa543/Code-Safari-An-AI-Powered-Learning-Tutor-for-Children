// Debugging Detective Game
// A game for kids to learn programming by fixing bugs in code

// Make sure Ace editor is properly initialized
function ensureAceEditorWorks() {
    console.log("Ensuring Ace editor works...");
    // Check if Ace is defined
    if (typeof ace === 'undefined') {
        console.error("Ace editor not found! Adding script tag");
        // Try to add the script tag
        const script = document.createElement('script');
        script.src = "https://cdn.jsdelivr.net/npm/ace-builds@1.4.12/src-min-noconflict/ace.js";
        document.head.appendChild(script);
        script.onload = function() {
            console.log("Ace editor loaded!");
            initializeEditor();
        };
    } else {
        initializeEditor();
    }
}

function initializeEditor() {
    console.log("Initializing editor...");
    const editorElement = document.getElementById('codeEditor');
    if (!editorElement) {
        console.error("Editor element not found!");
        return;
    }
    
    try {
        // Check if editor already exists
        try {
            const existingEditor = ace.edit("codeEditor");
            console.log("Editor already exists, setting content...");
            if (gameState && gameState.currentChallenge) {
                existingEditor.setValue(gameState.currentChallenge.buggyCode);
            }
        } catch (e) {
            console.log("Creating new editor...");
            // Create new editor
            const editor = ace.edit("codeEditor");
            editor.setTheme("ace/theme/monokai");
            editor.session.setMode("ace/mode/python");
            editor.setFontSize(14);
            
            if (gameState && gameState.currentChallenge) {
                editor.setValue(gameState.currentChallenge.buggyCode);
            }
        }
    } catch (error) {
        console.error("Failed to initialize editor:", error);
    }
}

// Initialize UI components when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log("DOM loaded, checking for code editor...");
    // Check if we're on the code-games page with the game elements
    if (document.getElementById('codeEditor')) {
        console.log("Code editor found, initializing...");
        // Initialize Ace Editor
        setTimeout(ensureAceEditorWorks, 500); // Wait a bit for DOM to be fully loaded
        
        // Set up event listeners
        document.getElementById('hintBtn').addEventListener('click', showHint);
        document.getElementById('submitBtn').addEventListener('click', checkSolution);
        document.getElementById('nextBtn').addEventListener('click', nextChallenge);
    }
});

// Functions to show/hide the Debugging Detective game
function loadDebuggingDetective() {
    console.log("Loading Debugging Detective game...");
    document.querySelector(".games-grid").style.display = "none";
    document.getElementById("debugging-detective-container").style.display = "block";
    
    // Ensure editor is initialized after the game is shown
    setTimeout(ensureAceEditorWorks, 500);
    
    // Reset the game state for a new session - everything except badges
    resetGameForNewSession();
    
    // Initialize game state if needed
    if (typeof gameState === 'undefined' || !gameState.currentChallenge) {
        console.log("Initializing game...");
        initGame();
    }
}

function hideDebuggingDetective() {
    document.querySelector(".games-grid").style.display = "grid";
    document.getElementById("debugging-detective-container").style.display = "none";
    
    // Save badges before leaving
    saveBadges();
}

// Reset game for a new session
function resetGameForNewSession() {
    // Store badges and solved challenges temporarily
    const savedBadges = gameState ? [...gameState.badges] : [];
    const savedSolvedChallenges = gameState ? {...gameState.solvedChallenges} : {};
    
    // Reset game state
    gameState.currentLevel = 1;
    gameState.totalLevels = 10;
    gameState.currentDifficulty = 'easy';
    gameState.hintsUsed = 0;
    gameState.score = 0; // Reset score to 0 for new session
    gameState.challengesCompleted = 0;
    gameState.currentChallenge = null;
    
    // Restore badges and solved challenges
    gameState.badges = savedBadges;
    gameState.solvedChallenges = savedSolvedChallenges;
}

// Game state
const gameState = {
    currentLevel: 1,
    totalLevels: 10,
    currentDifficulty: 'easy',
    hintsUsed: 0,
    score: 0,
    badges: [],
    challengesCompleted: 0,
    currentChallenge: null,
    solvedChallenges: {}, // Track which challenges have been solved
    modelEndpoint: 'http://localhost:11434/api/chat', 
    modelName: 'DebugModel',
    maxGenerationAttempts: 10,  // Increase max attempts to find valid challenges
    fallbackCount: 0  // Count how many times we've fallen back to default challenges
};

// Initialize the game
function initGame() {
    console.log("Initializing game...");
    // Load badges from storage
    loadBadges();
    
    // Load solved challenges from storage
    loadSolvedChallenges();
    
    // Init badges UI
    initBadges();
    
    // Load first challenge
    loadChallenge(gameState.currentLevel);
    
    // Update UI
    updateUI();
}

// Save just the badges to localStorage
function saveBadges() {
    localStorage.setItem('debuggingDetectiveBadges', JSON.stringify(gameState.badges));
}

// Load badges from localStorage
function loadBadges() {
    const savedBadges = localStorage.getItem('debuggingDetectiveBadges');
    if (savedBadges) {
        gameState.badges = JSON.parse(savedBadges);
    }
}

// Save solved challenges to localStorage
function saveSolvedChallenges() {
    localStorage.setItem('debuggingDetectiveSolved', JSON.stringify(gameState.solvedChallenges));
}

// Load solved challenges from localStorage
function loadSolvedChallenges() {
    const savedSolvedChallenges = localStorage.getItem('debuggingDetectiveSolved');
    if (savedSolvedChallenges) {
        gameState.solvedChallenges = JSON.parse(savedSolvedChallenges);
    }
}

// Initialize badges
function initBadges() {
    const badgeContainer = document.getElementById('badgeContainer');
    if (!badgeContainer) {
        console.error("Badge container not found!");
        return;
    }
    
    // Clear any existing badges
    badgeContainer.innerHTML = '';
    
    const badges = [
        { id: 'rookie', name: 'Rookie Detective', icon: '🔍' },
        { id: 'logic', name: 'Logic Master', icon: '🧩' },
        { id: 'loop', name: 'Loop Expert', icon: '🔄' },
        { id: 'syntax', name: 'Syntax Sleuth', icon: '📝' },
        { id: 'variable', name: 'Variable Tracker', icon: '🔢' },
        { id: 'function', name: 'Function Finder', icon: '⚙️' },
        { id: 'data', name: 'Data Structure Pro', icon: '📊' },
        { id: 'bug', name: 'Bug Squasher', icon: '🐞' },
        { id: 'master', name: 'Master Detective', icon: '🏆' }
    ];
    
    badges.forEach(badge => {
        const badgeElement = document.createElement('div');
        badgeElement.className = 'badge-item';
        badgeElement.id = `badge-${badge.id}`;
        badgeElement.title = badge.name;
        badgeElement.innerHTML = badge.icon;
        badgeContainer.appendChild(badgeElement);
    });
    
    // Show earned badges
    gameState.badges.forEach(badgeId => {
        const badgeElement = document.getElementById(`badge-${badgeId}`);
        if (badgeElement) {
            badgeElement.classList.add('earned');
        }
    });
}

// Load challenge based on level
async function loadChallenge(level) {
    console.log(`Loading challenge for level ${level}...`);
    // Set difficulty based on level
    if (level <= 3) {
        gameState.currentDifficulty = 'easy';
    } else if (level <= 7) {
        gameState.currentDifficulty = 'medium';
    } else {
        gameState.currentDifficulty = 'hard';
    }
    
    // Generate challenge using AI model with retry logic
    let challenge = null;
    let attempts = 0;
    
    while (!challenge && attempts < gameState.maxGenerationAttempts) {
        try {
            const generatedChallenge = await generateChallenge(gameState.currentDifficulty);
            
            // Skip the quote-only difference check - we'll handle quotes differently now
            
            // Validate the challenge thoroughly
            const isValid = validateChallenge(generatedChallenge);
            
            if (isValid) {
                challenge = generatedChallenge;
            } else {
                console.warn(`Generated challenge invalid on attempt ${attempts + 1}, retrying...`);
                attempts++;
            }
        } catch (error) {
            console.error('Error generating challenge:', error);
            attempts++;
        }
    }
    
    // If still no valid challenge after max attempts, use a fallback
    if (!challenge) {
        console.warn("Failed to generate a valid challenge after multiple attempts, using fallback...");
        challenge = getDefaultChallenge(gameState.currentDifficulty);
        gameState.fallbackCount++; // Track that we had to use a fallback
    }
    
    // Ensure the challenge has all required fields
    challenge = ensureChallengeRequiredFields(challenge);
    
    // Generate unique ID for the challenge if it doesn't have one
    if (!challenge.id) {
        challenge.id = generateChallengeId(challenge);
    }
    
    // Store the challenge
    gameState.currentChallenge = challenge;
    
    // Update UI with challenge details
    document.getElementById('levelTitle').textContent = `Case #${level}: ${challenge.title}`;
    document.getElementById('challengeDescription').textContent = challenge.description;
    
    // Set the buggy code in the editor
    try {
        const editor = ace.edit("codeEditor");
        editor.setValue(challenge.buggyCode);
    } catch (error) {
        console.error("Error setting editor value:", error);
        // Try initializing the editor again
        setTimeout(() => {
            try {
                const editor = ace.edit("codeEditor");
                editor.setValue(challenge.buggyCode);
            } catch (retryError) {
                console.error("Failed to set editor value after retry:", retryError);
            }
        }, 1000);
    }
    
    // Update difficulty badge
    updateDifficultyBadge(gameState.currentDifficulty);
    
    // Reset hint display
    document.getElementById('hintBox').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('feedbackArea').textContent = 'Solve the case to get feedback!';
}

// Check if both codes produce the same output after normalizing quotes
function areFunctionallyEquivalent(code1, code2) {
    // First, normalize quote styles to single quotes in both codes
    const normalized1 = normalizeQuotes(code1);
    const normalized2 = normalizeQuotes(code2);
    
    // If they match after normalization, they're functionally equivalent
    return normalized1 === normalized2;
}

// Normalize string literals to use single quotes consistently
function normalizeQuotes(code) {
    // This regex pattern matches both single and double quoted strings,
    // handling escaped quotes appropriately
    return code.replace(/(["'])((?:\\\1|(?!\1).)*?)\1/g, (match, quote, content) => {
        // Replace with single quotes and properly escape any single quotes in content
        return "'" + content.replace(/\\"/g, '"').replace(/\\'/g, "\\'").replace(/'/g, "\\'") + "'";
    });
}

// Generate a unique ID for the challenge based on its content
function generateChallengeId(challenge) {
    // Create a string that combines distinctive parts of the challenge
    const idBase = challenge.title + challenge.buggyCode.substring(0, 50);
    
    // Create a simple hash of the string for a shorter ID
    let hash = 0;
    for (let i = 0; i < idBase.length; i++) {
        const char = idBase.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    return `challenge_${hash}`;
}

// Validate a challenge is properly formed and has real bugs
function validateChallenge(challenge) {
    console.log("Validating challenge...");
    
    // Check if challenge has all required fields
    if (!challenge || !challenge.buggyCode || !challenge.solution || !challenge.title) {
        console.warn("Challenge missing required fields");
        return false;
    }
    
    // Check if description exists and is not empty
    if (!challenge.description || challenge.description.trim() === '') {
        console.warn("Challenge missing description");
        return false;
    }
    
    // Check if test case exists
    if (!challenge.testCase || Object.keys(challenge.testCase).length === 0) {
        console.warn("Challenge missing test case");
        return false;
    }
    
    // Check if buggy code and solution are identical (no actual bug)
    if (areFunctionallyEquivalent(challenge.buggyCode, challenge.solution)) {
        console.warn("Buggy code and solution are functionally equivalent");
        return false;
    }
    
    // Check for non-bug differences (like using alternative but equally valid approaches)
    if (isAlternativeImplementation(challenge.buggyCode, challenge.solution)) {
        console.warn("Detected alternative implementation, not a real bug");
        return false;
    }
    
    // Verify that the bug is significant enough (not just a whitespace or formatting difference)
    if (!hasSignificantDifference(challenge.buggyCode, challenge.solution)) {
        console.warn("No significant difference between buggy code and solution");
        return false;
    }
    
    // Functional validation via test case
    if (!isValidTestCase(challenge.testCase)) {
        console.warn("Invalid test case");
        return false;
    }
    
    return true;
}

// Check if the buggy code is just an alternative implementation rather than a bug
function isAlternativeImplementation(buggyCode, solution) {
    // Common patterns of equivalent implementations that aren't actual bugs
    
    // 1. String vs. list for character sets (like vowels example)
    if (sameSetDifferentRepresentation(buggyCode, solution)) {
        return true;
    }
    
    // 2. Capitalization in strings that doesn't affect functionality
    if (sameStringDifferentCase(buggyCode, solution)) {
        return true;
    }
    
    // 3. Minor formatting differences that don't affect functionality
    if (sameLogicDifferentFormatting(buggyCode, solution)) {
        return true;
    }
    
    // 4. Equivalent mathematical expressions
    if (sameExpressionDifferentForm(buggyCode, solution)) {
        return true;
    }
    
    return false;
}

// Check for same set of elements but different representation (string vs list, etc.)
function sameSetDifferentRepresentation(code1, code2) {
    // Check for vowels example: 'aeiou' vs ['a', 'e', 'i', 'o', 'u']
    const vowelsString = /vowels\s*=\s*['"]aeiou['"]/;
    const vowelsList = /vowels\s*=\s*\[\s*['"]a['"],\s*['"]e['"],\s*['"]i['"],\s*['"]o['"],\s*['"]u['"]\s*\]/;
    
    if ((vowelsString.test(code1) && vowelsList.test(code2)) ||
        (vowelsString.test(code2) && vowelsList.test(code1))) {
        return true;
    }
    
    // More general check for string vs list
    // Look for patterns like: x = "abc" vs x = ['a', 'b', 'c']
    const extractStringAssignments = (code) => {
        const regex = /(\w+)\s*=\s*['"](.*?)['"](?!\[)/g;
        const assignments = [];
        let match;
        
        while ((match = regex.exec(code)) !== null) {
            assignments.push({
                variable: match[1],
                value: match[2]
            });
        }
        
        return assignments;
    };
    
    const extractListAssignments = (code) => {
        const regex = /(\w+)\s*=\s*\[(.*?)\]/g;
        const assignments = [];
        let match;
        
        while ((match = regex.exec(code)) !== null) {
            assignments.push({
                variable: match[1],
                value: match[2]
            });
        }
        
        return assignments;
    };
    
    const stringAssignments1 = extractStringAssignments(code1);
    const listAssignments2 = extractListAssignments(code2);
    
    for (const strAssign of stringAssignments1) {
        for (const listAssign of listAssignments2) {
            if (strAssign.variable === listAssign.variable) {
                // Check if the string chars match list elements
                const chars = strAssign.value.split('');
                const elements = listAssign.value.split(',').map(e => {
                    const match = e.match(/['"](.)['"]/);
                    return match ? match[1] : null;
                }).filter(e => e !== null);
                
                if (arraysEqual(chars, elements)) {
                    return true;
                }
            }
        }
    }
    
    // Do the reverse check: lists in code1, strings in code2
    const listAssignments1 = extractListAssignments(code1);
    const stringAssignments2 = extractStringAssignments(code2);
    
    for (const listAssign of listAssignments1) {
        for (const strAssign of stringAssignments2) {
            if (listAssign.variable === strAssign.variable) {
                const elements = listAssign.value.split(',').map(e => {
                    const match = e.match(/['"](.)['"]/);
                    return match ? match[1] : null;
                }).filter(e => e !== null);
                
                const chars = strAssign.value.split('');
                
                if (arraysEqual(chars, elements)) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// Check if two arrays have the same elements in the same order
function arraysEqual(arr1, arr2) {
    if (arr1.length !== arr2.length) return false;
    
    for (let i = 0; i < arr1.length; i++) {
        if (arr1[i] !== arr2[i]) return false;
    }
    
    return true;
}

// Check for strings with different case but same meaning in context
function sameStringDifferentCase(code1, code2) {
    // Extract all string literals with their surrounding code
    const contextStringRegex = /([^"']+)(['"])((?:\\\2|(?:(?!\2)).)*)(\2)([^"']+)/g;
    
    const contexts1 = [];
    const contexts2 = [];
    
    let match;
    while ((match = contextStringRegex.exec(code1)) !== null) {
        contexts1.push({
            before: match[1],
            quote: match[2],
            content: match[3],
            after: match[5]
        });
    }
    
    contextStringRegex.lastIndex = 0; // Reset regex
    
    while ((match = contextStringRegex.exec(code2)) !== null) {
        contexts2.push({
            before: match[1],
            quote: match[2],
            content: match[3],
            after: match[5]
        });
    }
    
    // Look for contexts where the only difference is string case
    for (let i = 0; i < contexts1.length; i++) {
        for (let j = 0; j < contexts2.length; j++) {
            const c1 = contexts1[i];
            const c2 = contexts2[j];
            
            if (c1.before === c2.before && c1.after === c2.after && 
                c1.content.toLowerCase() === c2.content.toLowerCase() && 
                c1.content !== c2.content) {
                
                // If this is used in a context where case doesn't matter, it's not a real bug
                if (c1.before.includes("print") || c1.after.includes("print")) {
                    return true;
                }
            }
        }
    }
    
    return false;
}

// Check for same logic but different formatting
function sameLogicDifferentFormatting(code1, code2) {
    // Normalize whitespace and compare
    const normalized1 = code1.replace(/\s+/g, ' ').trim();
    const normalized2 = code2.replace(/\s+/g, ' ').trim();
    
    if (normalized1 === normalized2) {
        return true;
    }
    
    // If spaces are the only difference around operators, it's formatting
    const noSpaceOps1 = normalized1.replace(/\s*([+\-*/%=<>!&|])\s*/g, '$1');
    const noSpaceOps2 = normalized2.replace(/\s*([+\-*/%=<>!&|])\s*/g, '$1');
    
    if (noSpaceOps1 === noSpaceOps2) {
        return true;
    }
    
    return false;
}

// Check for equivalent mathematical expressions
function sameExpressionDifferentForm(code1, code2) {
    // Simplified check for common patterns like a+b vs b+a, a*b vs b*a
    const pattern1 = /(\w+)\s*([+*])\s*(\w+)/g;
    
    const replaceCommutative = (match, p1, op, p2) => {
        // Sort the operands for commutative operations
        const operands = [p1, p2].sort();
        return `${operands[0]}${op}${operands[1]}`;
    };
    
    const normalizedCode1 = code1.replace(pattern1, replaceCommutative);
    const normalizedCode2 = code2.replace(pattern1, replaceCommutative);
    
    if (normalizedCode1 === normalizedCode2) {
        return true;
    }
    
    return false;
}

// Check if there's a significant difference (not just whitespace, etc.)
function hasSignificantDifference(buggyCode, solution) {
    // If they are functionally equivalent after quote normalization, there's no significant difference
    if (areFunctionallyEquivalent(buggyCode, solution)) {
        return false;
    }
    
    // Remove all whitespace and comments for comparison
    const clean1 = buggyCode.replace(/\s+/g, '').replace(/#.*/g, '');
    const clean2 = solution.replace(/\s+/g, '').replace(/#.*/g, '');
    
    // If identical after cleaning, no significant difference
    if (clean1 === clean2) {
        return false;
    }
    
    // Look for actual code differences
    // This is just a heuristic - a more robust version would parse the AST
    
    // Check for different function/method names
    const funcs1 = extractFunctionCalls(buggyCode);
    const funcs2 = extractFunctionCalls(solution);
    
    // If there are different function/method names, it's a significant bug
    if (!arraysHaveSameElements(funcs1, funcs2)) {
        return true;
    }
    
    // Check for different variable names
    const vars1 = extractVariableNames(buggyCode);
    const vars2 = extractVariableNames(solution);
    
    // If there are different variable names, it's a significant bug
    if (!arraysHaveSameElements(vars1, vars2)) {
        return true;
    }
    
    // Check for different operators
    const ops1 = extractOperators(buggyCode);
    const ops2 = extractOperators(solution);
    
    // If there are different operators, it's a significant bug
    if (!arraysHaveSameElements(ops1, ops2)) {
        return true;
    }
    
    // If all of these are the same, it might not be a significant difference
    // This is a heuristic - not 100% accurate
    return false;
}

// Extract all function/method calls from code
function extractFunctionCalls(code) {
    const funcRegex = /(\w+)\s*\(/g;
    const funcs = [];
    
    let match;
    while ((match = funcRegex.exec(code)) !== null) {
        funcs.push(match[1]);
    }
    
    return funcs;
}

// Extract all variable names from code
function extractVariableNames(code) {
    const varRegex = /\b(\w+)\s*=/g;
    const vars = [];
    
    let match;
    while ((match = varRegex.exec(code)) !== null) {
        vars.push(match[1]);
    }
    
    return vars;
}

// Extract all operators from code
function extractOperators(code) {
    const opRegex = /([+\-*/%=<>!&|]{1,2})/g;
    const ops = [];
    
    let match;
    while ((match = opRegex.exec(code)) !== null) {
        ops.push(match[1]);
    }
    
    return ops;
}

// Check if two arrays have the same elements (ignoring order)
function arraysHaveSameElements(arr1, arr2) {
    if (arr1.length !== arr2.length) {
        return false;
    }
    
    const set1 = new Set(arr1);
    const set2 = new Set(arr2);
    
    if (set1.size !== set2.size) {
        return false;
    }
    
    for (const item of set1) {
        if (!set2.has(item)) {
            return false;
        }
    }
    
    return true;
}

// Validate test case
function isValidTestCase(testCase) {
    // Check if test case has required fields
    if (!testCase || !testCase.hasOwnProperty('expectedOutput')) {
        return false;
    }
    
    // Check if expectedOutput is not undefined, null, or empty string
    if (testCase.expectedOutput === undefined || 
        testCase.expectedOutput === null || 
        (typeof testCase.expectedOutput === 'string' && testCase.expectedOutput.trim() === '')) {
        return false;
    }
    
    return true;
}

// Ensure all required fields exist in challenge
function ensureChallengeRequiredFields(challenge) {
    if (!challenge) {
        return getDefaultChallenge(gameState.currentDifficulty);
    }
    
    // If no description or empty description, create one from other fields
    if (!challenge.description || challenge.description.trim() === '') {
        if (challenge.title) {
            challenge.description = `Fix the code to ${challenge.title.toLowerCase()}.`;
        } else if (challenge.feedback) {
            const firstSentence = challenge.feedback.split(/[.!?]/)[0] + ".";
            challenge.description = firstSentence;
        } else {
            challenge.description = "Find and fix the bugs in this Python code.";
        }
    }
    
    // If no title, create one
    if (!challenge.title || challenge.title.trim() === '') {
        challenge.title = "Debugging Challenge";
    }
    
    // If no hint, generate one
    if (!challenge.hint || challenge.hint.trim() === '') {
        challenge.hint = "Look carefully at the code and find what's wrong.";
    }
    
    // If no feedback, create basic feedback
    if (!challenge.feedback || challenge.feedback.trim() === '') {
        challenge.feedback = "Great job! You've successfully fixed the bug in the code.";
    }
    
    // Ensure test case exists
    if (!challenge.testCase || Object.keys(challenge.testCase).length === 0) {
        challenge.testCase = generateDefaultTestCase(challenge);
    }
    
    // Clean up any reference to quote styles in hints or feedback
    if (challenge.hint && 
        (challenge.hint.toLowerCase().includes("quote") || 
         challenge.hint.toLowerCase().includes("\"") || 
         challenge.hint.toLowerCase().includes("'"))) {
        challenge.hint = "Look carefully at the code and find what's wrong.";
    }
    
    if (challenge.feedback && 
        (challenge.feedback.toLowerCase().includes("quote") || 
         challenge.feedback.toLowerCase().includes("single quote") || 
         challenge.feedback.toLowerCase().includes("double quote"))) {
        challenge.feedback = "Great job! You fixed the bug in the code.";
    }
    
    return challenge;
}

// Generate default test case based on the challenge
function generateDefaultTestCase(challenge) {
    // Simple test case for different challenge types
    if (challenge.buggyCode.includes('print') && !challenge.buggyCode.includes('return')) {
        // For print-based challenges, test the output
        return { 
            input: '', 
            expectedOutput: 'output', 
            description: 'Check if the code produces the correct output' 
        };
    } else if (challenge.buggyCode.includes('def ')) {
        // For function-based challenges
        return { 
            input: 'function_call()', 
            expectedOutput: 'return_value', 
            description: 'Test the function with sample input' 
        };
    } else {
        // Generic test case
        return { 
            input: '', 
            expectedOutput: 'result', 
            description: 'Check if the code runs correctly' 
        };
    }
}

// Introduce a bug to code if none exists
function introduceBug(code, difficulty) {
    console.log("Introducing a bug to the code...");
    
    // Easy bugs - syntax errors
    const easyBugs = [
        (c) => c.replace(':', ''), // Remove a colon from a line with ':'
        (c) => c.replace('=', ''), // Remove an equals sign
        (c) => c.replace('print(', 'print ('), // Add space after print
        (c) => c.replace('range(', 'rang('), // Typo in range function
        (c) => c.replace(/\s{4}/g, '   '), // Incorrect indentation
    ];
    
    // Medium bugs - logical errors
    const mediumBugs = [
        (c) => c.replace(/range\((\d+),\s*(\d+)\)/g, (m, p1, p2) => `range(${p1}, ${parseInt(p2)-1})`), // Off-by-one in range
        (c) => c.replace('+=', '='), // Replace increment with assignment
        (c) => c.replace('==', '='), // Replace comparison with assignment
        (c) => c.replace('.upper()', ''), // Remove string method
        (c) => c.replace(/while\s+(.+?):/g, 'while True:') // Infinite loop
    ];
    
    // Hard bugs - complex issues
    const hardBugs = [
        (c) => c.replace(/if\s+(.+?):/g, 'if False:'), // Condition never true
        (c) => c.replace(/for\s+(.+?)\s+in/g, 'for _ in'), // Lose iterator variable
        (c) => c.replace(/\.append\((.+?)\)/g, '.appnd($1)'), // Typo in method name
        (c) => c.replace(/\[(.+?)\]/g, '($1)'), // Replace list with tuple
        (c) => c.replace('return', 'print') // Replace return with print
    ];
    
    // Select appropriate bug types based on difficulty
    let bugOptions;
    if (difficulty === 'easy') {
        bugOptions = easyBugs;
    } else if (difficulty === 'medium') {
        bugOptions = [...easyBugs, ...mediumBugs];
    } else {
        bugOptions = [...mediumBugs, ...hardBugs];
    }
    
    // Select a random bug type
    const bugFunction = bugOptions[Math.floor(Math.random() * bugOptions.length)];
    
    // Apply the bug and return the buggy code
    const buggyCode = bugFunction(code);
    
    // If no change was made (bug couldn't be applied), try a simple replacement
    if (buggyCode === code) {
        if (code.includes(':')) {
            return code.replace(':', '');
        } else if (code.includes('=')) {
            return code.replace('=', '');
        } else {
            // Add an obvious syntax error
            const lines = code.split('\n');
            if (lines.length > 0) {
                lines[0] = 'printt(' + lines[0].trim() + ')';
                return lines.join('\n');
            }
        }
    }
    
    return buggyCode;
}

// Generate challenge using AI model
async function generateChallenge(difficulty) {
    console.log(`Generating challenge for difficulty: ${difficulty}...`);
    
    try {
        // Create a topic based on difficulty
        const topic = getRandomTopic(difficulty);
        
        // Call your AI model API
        const response = await fetch(gameState.modelEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "model": "DebugModel",
                "messages": [
                  {
                    "role": "system",
                    "content": `Generate a Python debugging challenge for kids (age 10-13) with the following components:
1. A title for the challenge (creative and fun)
2. A brief description of what the code is supposed to do (IMPORTANT: include a <DESCRIPTION> tag with this content)
3. Python code with intentional bugs that needs to be fixed
4. The correct solution (fixed code)
5. A hint that helps identify the bug without giving away the solution
6. Detailed feedback explaining what was wrong and how to fix it
7. A single test case to verify the solution (IMPORTANT: include <TEST_CASE> with one accurate test case)

Difficulty level: ${difficulty.toUpperCase()}

For ${difficulty.toUpperCase()} difficulty:
${getDifficultyInstructions(difficulty)}

IMPORTANT RULES:
- The buggy code MUST contain a real, significant bug - not just an alternative implementation
- Make sure the buggy code will NOT function correctly as-is
- The solution code should work correctly and pass the test case
- Include a clear <DESCRIPTION> tag with what the code should do
- Include <TEST_CASE> with ONE accurate test case to verify the solution

ABSOLUTELY DO NOT create challenges where single quotes vs double quotes is the bug. In Python, these are completely interchangeable:
print('Hello') and print("Hello") are EXACTLY THE SAME and work identically.

CREATE REAL BUGS ONLY like:
1. Syntax errors (missing colons, parentheses, etc.)
2. Using undefined variables or functions
3. Logic errors that cause incorrect output
4. Off-by-one errors in loops
5. Using wrong operators (== vs =, etc.)
6. Missing key code elements
7. Errors that would cause the code to crash or produce wrong results

Remember that ANY string in Python can use either single quotes (') or double quotes (") - they are 100% equivalent and interchangeable.

For the test case, use this format inside <TEST_CASE> tag:
{
  "input": "test input", 
  "expectedOutput": "expected output", 
  "description": "description of the test case"
}

For function-based challenges, the input should be function call parameters, and the expectedOutput should be the return value.
For script-based challenges, the input can be empty and the expectedOutput should be what the script prints.

Format with XML tags (<ORIGINAL_CODE>, <BUGGY_CODE>, <QUESTION>, <HINT>, <EXPLANATION>, <DESCRIPTION>, <TEST_CASE>)`
                  },
                  {
                    "role": "user",
                    "content": `Generate a Python debugging challenge about ${topic} with a REAL bug, not just a stylistic difference. Remember that using 'Hello World' vs "Hello World" is not a bug at all - both single and double quotes are 100% equivalent in Python and should be treated as identical.`
                  }
                ],
                "stream": false
              })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        let responseContent = data.message?.content || "";
        console.log("Response content:", responseContent);
        
        // Parse the generated text to extract challenge components
        return parseGeneratedChallenge(responseContent, difficulty);
        
    } catch (error) {
        console.error('Error calling AI model:', error);
        throw error;
    }
}

// Get difficulty-specific instructions
function getDifficultyInstructions(difficulty) {
    if (difficulty === 'easy') {
        return `- Include only single-line bugs (like a missing colon, incorrect indentation, or wrong variable name)
- Focus on basic concepts like print statements, variables, or simple math operations
- Code should be 5-10 lines maximum
- Use clear, simple language in the description and feedback
- Test case should be very simple and straightforward
- IMPORTANT: Make sure it's a real bug that affects functionality, not just a stylistic difference
- REMEMBER: Single quotes vs double quotes are NOT bugs - both are valid in Python and completely interchangeable`;
    } else if (difficulty === 'medium') {
        return `- Include bugs related to loops (for/while) or conditional statements (if/else)
- Focus on list operations, basic functions, or simple logical errors
- Code should be 10-15 lines
- Challenge should require understanding of program flow
- Test case should test typical input scenario
- IMPORTANT: Make sure it's a real bug that affects functionality, not just a stylistic difference
- REMEMBER: Single quotes vs double quotes are NOT bugs - both are valid in Python and completely interchangeable`;
    } else {
        return `- Include multiple bugs or more complex logical errors
- Focus on dictionaries, nested structures, or function parameters
- Code can be 15-25 lines
- Challenge should require deeper debugging skills and careful code reading
- Test case should be comprehensive and validate the fixed functionality
- IMPORTANT: Make sure it's a real bug that affects functionality, not just a stylistic difference
- REMEMBER: Single quotes vs double quotes are NOT bugs - both are valid in Python and completely interchangeable`;
    }
}

// Random topic generator based on difficulty
function getRandomTopic(difficulty) {
    const topics = {
        'easy': ['printing text', 'basic variables', 'simple math operations', 'string basics'],
        'medium': ['loops', 'lists', 'if-else statements', 'string manipulation'],
        'hard': ['functions', 'dictionaries', 'nested loops', 'error handling']
    };
    
    const difficultyTopics = topics[difficulty] || topics.easy;
    return difficultyTopics[Math.floor(Math.random() * difficultyTopics.length)];
}

// Parse the generated challenge from AI response
function parseGeneratedChallenge(generatedText, difficulty) {
    try {
        console.log("Parsing generated text:", generatedText);
        
        // The response format now includes XML-like tags
        let challenge = {
            title: "",
            description: "",
            buggyCode: "",
            solution: "",
            hint: "",
            feedback: "",
            testCase: {},
            difficulty: difficulty
        };
        
        // Extract content between XML-like tags
        const titleMatch = generatedText.match(/<QUESTION>(.*?)<\/QUESTION>/s);
        if (titleMatch && titleMatch[1]) {
            challenge.title = titleMatch[1].trim().replace("Find the error in this loop code:", "").trim();
        }
        
        // First try to extract description from DESCRIPTION tag (preferred)
        const descriptionMatch = generatedText.match(/<DESCRIPTION>(.*?)<\/DESCRIPTION>/s);
        if (descriptionMatch && descriptionMatch[1]) {
            challenge.description = descriptionMatch[1].trim();
        }
        
        // Use BUGGY_CODE for buggyCode
        const buggyCodeMatch = generatedText.match(/<BUGGY_CODE>(.*?)<\/BUGGY_CODE>/s);
        if (buggyCodeMatch && buggyCodeMatch[1]) {
            challenge.buggyCode = buggyCodeMatch[1].trim();
        }
        
        // Use ORIGINAL_CODE for solution (the correct code)
        const solutionMatch = generatedText.match(/<ORIGINAL_CODE>(.*?)<\/ORIGINAL_CODE>/s);
        if (solutionMatch && solutionMatch[1]) {
            challenge.solution = solutionMatch[1].trim();
        }
        
        // Extract hint
        const hintMatch = generatedText.match(/<HINT>(.*?)<\/HINT>/s);
        if (hintMatch && hintMatch[1]) {
            challenge.hint = hintMatch[1].trim();
        } else if (generatedText.match(/<EXPLANATION>(.*?)<\/EXPLANATION>/s)) {
            // Use first sentence of explanation as hint if no hint is provided
            const explanationMatch = generatedText.match(/<EXPLANATION>(.*?)<\/EXPLANATION>/s);
            const explanation = explanationMatch[1].trim();
            const firstSentence = explanation.split(/[.!?]/)[0] + ".";
            challenge.hint = "Hint: " + firstSentence;
        }
        
        // Extract explanation for feedback
        const explanationMatch = generatedText.match(/<EXPLANATION>(.*?)<\/EXPLANATION>/s);
        if (explanationMatch && explanationMatch[1]) {
            challenge.feedback = explanationMatch[1].trim();
        }
        
        // Extract test case
        const testCaseMatch = generatedText.match(/<TEST_CASE>(.*?)<\/TEST_CASE>/s);
        if (testCaseMatch && testCaseMatch[1]) {
            try {
                const testCaseText = testCaseMatch[1].trim();
                // Handle potential formatting issues in the JSON
                const cleanedTestCaseText = testCaseText
                    .replace(/'/g, '"')  // Replace single quotes with double quotes
                    .replace(/(\w+):/g, '"$1":')  // Add quotes to JSON keys
                    .replace(/\n/g, ' ');  // Remove newlines
                
                // Try to parse the JSON
                try {
                    challenge.testCase = JSON.parse(cleanedTestCaseText);
                } catch (jsonError) {
                    console.error("Error parsing test case JSON:", jsonError);
                    
                    // Try to extract using regex as a fallback
                    const testCaseRegex = /input['"]\s*:\s*['"]([^'"]*)['"]\s*,\s*['"]expectedOutput['"]\s*:\s*['"]([^'"]*)['"]\s*,\s*['"]description['"]\s*:\s*['"]([^'"]*)['"]/;
                    const match = testCaseRegex.exec(testCaseText);
                    
                    if (match) {
                        challenge.testCase = {
                            input: match[1],
                            expectedOutput: match[2],
                            description: match[3]
                        };
                    } else {
                        // If all else fails, generate default test case
                        challenge.testCase = generateDefaultTestCase(challenge);
                    }
                }
            } catch (error) {
                console.error("Error processing test case:", error);
                challenge.testCase = generateDefaultTestCase(challenge);
            }
        } else {
            // No test case found, generate default one
            challenge.testCase = generateDefaultTestCase(challenge);
        }
        
        // If still no description from DESCRIPTION tag, try other sources
        if (!challenge.description || challenge.description.trim() === '') {
            // Try to extract from title/question
            if (challenge.title) {
                challenge.description = `Fix the code to ${challenge.title.toLowerCase()}.`;
            } 
            // Try to extract from explanation
            else if (challenge.feedback) {
                const descriptionParts = challenge.feedback.split(/[.!?]/);
                if (descriptionParts.length > 0) {
                    challenge.description = descriptionParts[0] + ".";
                }
            }
            // Default description
            else {
                challenge.description = "Find and fix the bugs in this Python code.";
            }
        }
        
        // If no clear title was found, create one
        if (!challenge.title || challenge.title.trim() === '') {
            challenge.title = "Debugging Challenge: Fix the Code";
        }
        
        // If the only difference is quote styles, or if there's no real bug,
        // introduce a legitimate bug
        if (areFunctionallyEquivalent(challenge.buggyCode, challenge.solution)) {
            console.warn("No real bug detected (or only quote differences). Introducing a real bug.");
            challenge.buggyCode = introduceBug(challenge.solution, difficulty);
        }
        
        // Additional check for potentially false "bugs"
        if (isAlternativeImplementation(challenge.buggyCode, challenge.solution)) {
            console.warn("Detected false bug (alternative implementation). Introducing real bug instead.");
            challenge.buggyCode = introduceBug(challenge.solution, difficulty);
        }
        
        // Clean up any references to quotes in hints/feedback
        challenge = ensureChallengeRequiredFields(challenge);
        
        console.log("Parsed challenge:", challenge);
        return challenge;
        
    } catch (error) {
        console.error('Error parsing challenge:', error);
        // Return a default challenge if parsing fails
        return getDefaultChallenge(difficulty);
    }
}

// Fallback to default challenges if AI generation fails
function loadDefaultChallenge(level) {
    console.log(`Loading default challenge for level ${level}...`);
    const challenges = [
        {
            title: "The Missing Colon",
            description: "This code should print numbers from 1 to 5, but it's not working correctly.",
            buggyCode: "for i in range(1, 6)\n    print(i)",
            solution: "for i in range(1, 6):\n    print(i)",
            hint: "Python uses a special character to indicate the start of a code block.",
            feedback: "Great job! The bug was a missing colon (:) after the for loop declaration. In Python, colons are required to indicate the start of a code block like loops and conditionals.",
            difficulty: 'easy',
            testCase: { 
                input: "", 
                expectedOutput: "1\n2\n3\n4\n5", 
                description: "Checks if numbers 1 to 5 are printed" 
            }
        },
        {
            title: "Variable Mystery",
            description: "This code should calculate the area of a rectangle, but it's giving the wrong result.",
            buggyCode: "length = 5\nwidth = 3\narea = lenght * width\nprint(f'The area is {area} square units')",
            solution: "length = 5\nwidth = 3\narea = length * width\nprint(f'The area is {area} square units')",
            hint: "Check the spelling of variables carefully.",
            feedback: "Well done! The bug was a typo in the variable name. It was spelled 'lenght' instead of 'length' when calculating the area.",
            difficulty: 'easy',
            testCase: { 
                input: "", 
                expectedOutput: "The area is 15 square units", 
                description: "Checks if the area is calculated correctly" 
            }
        },
        {
            title: "Countdown Confusion",
            description: "This code should count down from 10 to 1, but it's not working right.",
            buggyCode: "count = 10\nwhile count > 0:\n    print(count)\n    count = count",
            solution: "count = 10\nwhile count > 0:\n    print(count)\n    count = count - 1",
            hint: "The value of 'count' needs to change with each loop iteration.",
            feedback: "Great detective work! The bug was that the count variable wasn't being decreased. You needed to add '- 1' to make it count down properly.",
            difficulty: 'medium',
            testCase: { 
                input: "", 
                expectedOutput: "10\n9\n8\n7\n6\n5\n4\n3\n2\n1", 
                description: "Checks if numbers 10 to 1 are printed in descending order" 
            }
        },
        {
            title: "Loop Range Problem",
            description: "This loop is supposed to calculate the sum of numbers from 1 to 10, but it's not working correctly.",
            buggyCode: "total = 0\nfor i in range(1, 10):\n    total += i\nprint(f'The sum is: {total}')",
            solution: "total = 0\nfor i in range(1, 11):\n    total += i\nprint(f'The sum is: {total}')",
            hint: "Check the range of the loop. Remember that range(start, end) goes from start to end-1.",
            feedback: "Great job! The bug was in the range. range(1, 10) only goes from 1 to 9, not including 10. To include 10, you need to use range(1, 11).",
            difficulty: 'medium',
            testCase: { 
                input: "", 
                expectedOutput: "The sum is: 55", 
                description: "Checks if the sum of numbers from 1 to 10 equals 55" 
            }
        },
        {
            title: "Dictionary Dilemma",
            description: "This code should count the frequency of each word in a sentence, but it's crashing.",
            buggyCode: "sentence = \"the quick brown fox jumps over the lazy dog\"\nwords = sentence.split()\nword_count = {}\n\nfor word in words:\n    word_count[word] += 1\n\nprint(word_count)",
            solution: "sentence = \"the quick brown fox jumps over the lazy dog\"\nwords = sentence.split()\nword_count = {}\n\nfor word in words:\n    if word in word_count:\n        word_count[word] += 1\n    else:\n        word_count[word] = 1\n\nprint(word_count)",
            hint: "What happens when you try to increment a value that doesn't exist yet?",
            feedback: "Excellent debugging! The code was trying to increment a counter for each word, but it wasn't checking if the word was already in the dictionary. You need to initialize each word's count to 1 when first encountered or increment it if it already exists.",
            difficulty: 'hard',
            testCase: { 
                input: "", 
                expectedOutput: "{'the': 2, 'quick': 1, 'brown': 1, 'fox': 1, 'jumps': 1, 'over': 1, 'lazy': 1, 'dog': 1}", 
                description: "Checks if word frequencies are correctly counted" 
            }
        }
    ];
    
    // Use modulo to cycle through default challenges if level exceeds available challenges
    let challenge = challenges[(level - 1) % challenges.length];
    
    // Generate a unique ID for the challenge
    challenge.id = generateChallengeId(challenge);
    
    gameState.currentChallenge = challenge;
    
    // Update UI with challenge details
    document.getElementById('levelTitle').textContent = `Case #${level}: ${challenge.title}`;
    document.getElementById('challengeDescription').textContent = challenge.description;
    
    // Set the buggy code in the editor
    try {
        const editor = ace.edit("codeEditor");
        editor.setValue(challenge.buggyCode);
    } catch (error) {
        console.error("Error setting editor value:", error);
        // Try initializing the editor again
        setTimeout(() => {
            try {
                ensureAceEditorWorks();
                setTimeout(() => {
                    const editor = ace.edit("codeEditor");
                    editor.setValue(challenge.buggyCode);
                }, 500);
            } catch (retryError) {
                console.error("Failed to set editor value after retry:", retryError);
            }
        }, 1000);
    }
    
    // Update difficulty badge
    updateDifficultyBadge(challenge.difficulty);
    
    // Reset hint display
    document.getElementById('hintBox').style.display = 'none';
    document.getElementById('nextBtn').style.display = 'none';
    document.getElementById('feedbackArea').textContent = 'Solve the case to get feedback!';
}

function getDefaultChallenge(difficulty) {
    let challenge;
    
    if (difficulty === 'easy') {
        challenge = {
            title: "The Missing Colon",
            description: "This code should print numbers from 1 to 5, but it's not working correctly.",
            buggyCode: "for i in range(1, 6)\n    print(i)",
            solution: "for i in range(1, 6):\n    print(i)",
            hint: "Python uses a special character to indicate the start of a code block.",
            feedback: "Great job! The bug was a missing colon (:) after the for loop declaration. In Python, colons are required to indicate the start of a code block like loops and conditionals.",
            difficulty: 'easy',
            testCase: { 
                input: "", 
                expectedOutput: "1\n2\n3\n4\n5", 
                description: "Checks if numbers 1 to 5 are printed" 
            }
        };
    } else if (difficulty === 'medium') {
        challenge = {
            title: "Loop Range Problem",
            description: "This loop is supposed to calculate the sum of numbers from 1 to 10, but it's not working correctly.",
            buggyCode: "total = 0\nfor i in range(1, 10):\n    total += i\nprint(f'The sum is: {total}')",
            solution: "total = 0\nfor i in range(1, 11):\n    total += i\nprint(f'The sum is: {total}')",
            hint: "Check the range of the loop. Remember that range(start, end) goes from start to end-1.",
            feedback: "Great job! The bug was in the range. range(1, 10) only goes from 1 to 9, not including 10. To include 10, you need to use range(1, 11).",
            difficulty: 'medium',
            testCase: { 
                input: "", 
                expectedOutput: "The sum is: 55", 
                description: "Checks if the sum of numbers from 1 to 10 equals 55" 
            }
        };
    } else {
        challenge = {
            title: "Dictionary Dilemma",
            description: "This code should count the frequency of each word in a sentence, but it's crashing.",
            buggyCode: "sentence = \"the quick brown fox jumps over the lazy dog\"\nwords = sentence.split()\nword_count = {}\n\nfor word in words:\n    word_count[word] += 1\n\nprint(word_count)",
            solution: "sentence = \"the quick brown fox jumps over the lazy dog\"\nwords = sentence.split()\nword_count = {}\n\nfor word in words:\n    if word in word_count:\n        word_count[word] += 1\n    else:\n        word_count[word] = 1\n\nprint(word_count)",
            hint: "What happens when you try to increment a value that doesn't exist yet?",
            feedback: "Excellent debugging! The code was trying to increment a counter for each word, but it wasn't checking if the word was already in the dictionary. You need to initialize each word's count to 1 when first encountered or increment it if it already exists.",
            difficulty: 'hard',
            testCase: { 
                input: "", 
                expectedOutput: "{'the': 2, 'quick': 1, 'brown': 1, 'fox': 1, 'jumps': 1, 'over': 1, 'lazy': 1, 'dog': 1}", 
                description: "Checks if word frequencies are correctly counted" 
            }
        };
    }
    
    // Generate a unique ID for the challenge
    challenge.id = generateChallengeId(challenge);
    
    return challenge;
}

// Show hint
function showHint() {
    const hintBox = document.getElementById('hintBox');
    const hintText = document.getElementById('hintText');
    
    if (gameState.currentChallenge && hintBox && hintText) {
        hintText.textContent = gameState.currentChallenge.hint;
        hintBox.style.display = 'block';
        gameState.hintsUsed++;
    }
}

// Check solution
async function checkSolution() {
    let userCode;
    
    try {
        // Try to get value from Ace editor
        const editor = ace.edit("codeEditor");
        userCode = editor.getValue();
    } catch (error) {
        console.error("Error getting editor value:", error);
        return; // Can't proceed without user code
    }
    
    const feedbackArea = document.getElementById('feedbackArea');
    
    if (!gameState.currentChallenge || !feedbackArea) {
        if (feedbackArea) feedbackArea.textContent = "Error: No challenge loaded.";
        return;
    }
    
    // Check if challenge has already been solved during this session
    // If already solved, show message but don't add points again
    const challengeId = gameState.currentChallenge.id;
    const alreadySolved = gameState.solvedChallenges[challengeId];
    
    // Check if user code is unchanged (still the buggy code)
    if (userCode.trim() === gameState.currentChallenge.buggyCode.trim()) {
        feedbackArea.innerHTML = `
            <div class="alert alert-warning">
                <h4>Not Quite Right</h4>
                <p>You haven't fixed the bugs yet. Try to identify what's wrong with the code.</p>
            </div>
        `;
        return;
    }
    
    // First check: If the user code is functionally equivalent to the solution (handles quote differences)
    if (areFunctionallyEquivalent(userCode, gameState.currentChallenge.solution)) {
        handleCorrectSolution(alreadySolved);
        return;
    }
    
    // Display loading message
    feedbackArea.innerHTML = `
        <div class="alert alert-info">
            <h4>Testing your solution...</h4>
            <p>Checking if your code fixes the bug.</p>
        </div>
    `;
    
    // Test the solution against the test case
    try {
        const testResult = await testSolution(userCode, gameState.currentChallenge.testCase);
        
        // Check if the test passed
        if (testResult.passed) {
            handleCorrectSolution(alreadySolved);
        } else {
            // Show test failure information
            feedbackArea.innerHTML = `
                <div class="alert alert-warning">
                    <h4>Not Quite Right</h4>
                    <p>Your solution didn't pass the test case.</p>
                    <p><strong>Test:</strong> ${testResult.description || 'Test case'}</p>
                    <p><strong>Expected output:</strong> ${testResult.expectedOutput}</p>
                    <p><strong>Your code output:</strong> ${testResult.actualOutput}</p>
                    <p>Keep trying to fix the bugs!</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error testing solution:', error);
        
        feedbackArea.innerHTML = `
            <div class="alert alert-danger">
                <h4>Error Testing Code</h4>
                <p>There was an error testing your solution. This might be due to a syntax error in your code.</p>
                <p>${error.message}</p>
            </div>
        `;
    }
}

// Test the solution against provided test case
async function testSolution(userCode, testCase) {
    // Prepare the testing prompt for the AI model
    const testingPrompt = `
I need to test if this Python code correctly fixes the bugs:

\`\`\`python
${userCode}
\`\`\`

Please run the code against this test case and report if it passes or fails:

${JSON.stringify(testCase, null, 2)}

Test the code with the given input and check if the output matches the expected output.

IMPORTANT: In Python, single quotes (') and double quotes (") are exactly equivalent. 
Consider print('Hello') and print("Hello") as identical and correct.

Return your result in this JSON format:
{
  "description": "${testCase.description || 'Test case'}",
  "input": "${testCase.input || ''}",
  "expectedOutput": "${testCase.expectedOutput || ''}",
  "actualOutput": "actual output from running the code",
  "passed": true/false
}

Don't provide any explanation, just the JSON result. Remember to treat single and double quotes as equivalent when comparing outputs.
`;

    try {
        // Call the AI model to test the code
        const response = await fetch(gameState.modelEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "model": gameState.modelName,
                "messages": [
                  {
                    "role": "system",
                    "content": "You are a Python code testing assistant. You will execute and test Python code against provided test cases and return the results in JSON format. IMPORTANT: In Python, single quotes (') and double quotes (\") are functionally identical - treat them as equivalent when comparing outputs."
                  },
                  {
                    "role": "user",
                    "content": testingPrompt
                  }
                ]
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        
        const data = await response.json();
        const responseContent = data.message?.content || "";
        
        // Extract JSON from the response
        const jsonMatch = responseContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            try {
                const result = JSON.parse(jsonMatch[0]);
                
                // Special handling for quote differences in expected vs actual output
                if (!result.passed && typeof result.expectedOutput === 'string' && typeof result.actualOutput === 'string') {
                    // If the only difference is quotes, mark as passed
                    if (normalizeQuotes(result.expectedOutput) === normalizeQuotes(result.actualOutput)) {
                        result.passed = true;
                        result.actualOutput += " (Functionally equivalent)";
                    }
                }
                
                return result;
            } catch (parseError) {
                console.error("Error parsing test result JSON:", parseError);
                throw new Error("Could not parse test result");
            }
        } else {
            throw new Error("No test result found in the response");
        }
    } catch (error) {
        console.error("Error testing solution:", error);
        throw error;
    }
}

// Handle correct solution logic
function handleCorrectSolution(alreadySolved) {
    const feedbackArea = document.getElementById('feedbackArea');
    
    // Mark challenge as completed if not already completed
    if (!alreadySolved) {
        gameState.challengesCompleted++;
        
        // Calculate score (base points minus penalty for hints)
        const basePoints = getDifficultyPoints(gameState.currentDifficulty);
        const hintPenalty = gameState.hintsUsed * 5;
        const pointsEarned = Math.max(basePoints - hintPenalty, 5); // Minimum 5 points
        
        gameState.score += pointsEarned;
        
        // Mark this challenge as solved
        gameState.solvedChallenges[gameState.currentChallenge.id] = true;
        
        // Save the solved status
        saveSolvedChallenges();
        
        // Update message to include points earned
        feedbackArea.innerHTML = `
            <div class="alert alert-success">
                <h4>🎉 Case Solved!</h4>
                <p>${gameState.currentChallenge.feedback}</p>
                <p>You earned ${pointsEarned} points!</p>
            </div>
        `;
        
        // Award badges as appropriate
        awardBadges();
        
        // Show celebration if significant achievement
        if (gameState.currentLevel % 3 === 0 || gameState.currentDifficulty === 'hard') {
            showCelebration();
        }
    } else {
        // Already solved before, just show success but no additional points
        feedbackArea.innerHTML = `
            <div class="alert alert-success">
                <h4>🎉 Case Solved!</h4>
                <p>${gameState.currentChallenge.feedback}</p>
                <p>You already solved this challenge before.</p>
            </div>
        `;
    }
    
    // Update UI to reflect any score changes
    updateUI();
    
    // Show next button
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) nextBtn.style.display = 'inline-block';
}

// Update difficulty badge
function updateDifficultyBadge(difficulty) {
    const badge = document.getElementById('difficultyBadge');
    if (badge) {
        badge.className = `difficulty-badge ${difficulty}`;
        badge.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    }
}

// Get points based on difficulty
function getDifficultyPoints(difficulty) {
    switch (difficulty) {
        case 'easy': return 20;
        case 'medium': return 35;
        case 'hard': return 50;
        default: return 20;
    }
}

// Award badges based on progress
function awardBadges() {
    // Award rookie badge after first challenge
    if (gameState.challengesCompleted === 1) {
        awardBadge('rookie');
    }
    
    // Award based on difficulty mastery
    if (gameState.currentDifficulty === 'easy' && gameState.currentLevel % 3 === 0) {
        awardBadge('syntax');
    } else if (gameState.currentDifficulty === 'medium' && gameState.currentLevel % 3 === 0) {
        const badges = ['loop', 'logic', 'variable'];
        awardBadge(badges[Math.floor(Math.random() * badges.length)]);
    } else if (gameState.currentDifficulty === 'hard' && gameState.currentLevel % 2 === 0) {
        const badges = ['function', 'data', 'bug'];
        awardBadge(badges[Math.floor(Math.random() * badges.length)]);
    }
    
    // Master detective badge for completing many challenges
    if (gameState.challengesCompleted >= 8) {
        awardBadge('master');
    }
}

// Award specific badge
function awardBadge(badgeId) {
    if (!gameState.badges.includes(badgeId)) {
        gameState.badges.push(badgeId);
        
        // Update badge UI
        const badgeElement = document.getElementById(`badge-${badgeId}`);
        if (badgeElement) {
            badgeElement.classList.add('earned');
            
            // Show celebration for new badge
            const celebrationText = document.getElementById('celebrationText');
            if (celebrationText) {
                celebrationText.textContent = `You earned the ${badgeElement.title} badge!`;
                showCelebration();
            }
        }
        
        // Save badges to storage
        saveBadges();
    }
}

// Show celebration modal
function showCelebration() {
    const celebration = document.getElementById('celebration');
    if (celebration) {
        celebration.style.display = 'flex';
        // Auto-hide celebration after 3 seconds
        setTimeout(() => {
            celebration.style.display = 'none';
        }, 3000);
    }
}

// Move to next challenge
function nextChallenge() {
    // Increment level
    gameState.currentLevel++;
    
    // Reset hints used
    gameState.hintsUsed = 0;
    
    // Load new challenge
    loadChallenge(gameState.currentLevel);
    
    // Update UI
    updateUI();
    
    // Scroll to top
    window.scrollTo(0, 0);
}

// Update UI elements
function updateUI() {
    // Update score
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.textContent = gameState.score;
    }
    
    // Update progress bar
    const progressElement = document.getElementById('levelProgress');
    if (progressElement) {
        const progressPercent = (gameState.currentLevel - 1) / gameState.totalLevels * 100;
        progressElement.style.width = `${progressPercent}%`;
    }
    
    // Update badges display
    gameState.badges.forEach(badgeId => {
        const badgeElement = document.getElementById(`badge-${badgeId}`);
        if (badgeElement) {
            badgeElement.classList.add('earned');
        }
    });
}

// Initialize game when DOM content is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if we're on the game page
    if (document.getElementById('codeEditor')) {
        console.log("Game page detected, initializing...");
        
        // Initialize Ace editor with a delay to ensure DOM is ready
        setTimeout(ensureAceEditorWorks, 500); 
    }
});

// Close celebration modal when clicked
document.addEventListener('click', function(event) {
    const celebration = document.getElementById('celebration');
    if (celebration && celebration.style.display === 'flex') {
        if (event.target === celebration || event.target.classList.contains('close-celebration')) {
            celebration.style.display = 'none';
        }
    }
});

// Add keyboard shortcuts
document.addEventListener('keydown', function(event) {
    // Check if the game is active
    if (!document.getElementById('codeEditor')) return;
    
    // Run code with Ctrl+Enter
    if (event.ctrlKey && event.key === 'Enter') {
        event.preventDefault();
        checkSolution();
    }
    
    // Show hint with Ctrl+H
    if (event.ctrlKey && event.key === 'h') {
        event.preventDefault();
        showHint();
    }
});