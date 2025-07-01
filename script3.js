// Configuration
let GEMINI_API_KEY = 'AIzaSyCFwFgiUousdiCpP-_udybNlwxThObPlBE';
let WORKING_MODEL = 'gemini-1.5-flash'; // Default model, will be updated after testing

// Debug mode for console logging AND visual feedback
let DEBUG_MODE = true;

// Track current code
let CURRENT_CODE = "";

// Supported code topics
const CODE_TOPICS = [
    "Variables", 
    "Loops", 
    "Conditionals", 
    "String Manipulation", 
    "Functions", 
    "Operators"
];

// Show AI Artist Game
function loadAIArtistGame() {
    // Hide any other games
    if (typeof hideDebuggingDetective === 'function') {
        hideDebuggingDetective();
    }
    
    // Show the AI Artist game container
    const container = document.getElementById('ai-artist-game-container');
    if (container) {
        container.style.display = 'block';
        container.innerHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Code Visualizer: AI Learning Tool</title>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet">
    <style>
        .code-editor {
            font-family: 'Courier New', monospace;
            border: 3px solid #4F46E5;
            background-color: #1e293b;
            color: #4ade80;
            font-size: 16px;
            line-height: 1.5;
            padding: 12px;
            min-height: 200px;
            width: 100%;
            resize: vertical;
        }
        .game-container {
            background: linear-gradient(135deg, #f0f4ff 0%, #e6eeff 100%);
        }
        .canvas-area {
            background: white;
            border: 2px solid #4F46E5;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden; /* Ensure canvas stays within bounds */
            width: 100%; /* Make container responsive */
            height: auto; /* Maintain aspect ratio */
        }
        .canvas-container {
            position: relative;
            width: 100%;
            overflow: auto;
        }
        .instruction-panel {
            background: rgba(255, 255, 255, 0.9);
            backdrop-filter: blur(10px);
        }
        .run-button {
            background: linear-gradient(45deg, #4F46E5, #7C3AED);
            transition: transform 0.2s;
        }
        .run-button:hover {
            transform: scale(1.05);
        }
        .concept-badge {
            background: #F3F4F6;
            color: #1F2937;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 0.875rem;
        }
        .loading-spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #4F46E5;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        .error-message {
            background-color: #fee2e2;
            border: 1px solid #ef4444;
            color: #b91c1c;
            padding: 10px;
            border-radius: 5px;
            margin-bottom: 10px;
        }
        .code-display {
            border: 2px solid #4F46E5;
            background-color: #1e293b;
            color: #4ade80;
            padding: 15px;
            border-radius: 8px;
            font-family: 'Courier New', monospace;
            white-space: pre-wrap;
            margin-top: 15px;
            font-size: 16px;
            max-height: 200px;
            overflow-y: auto;
        }
        .code-highlight {
            border: 5px solid #ff0000;
            box-shadow: 0 0 15px #ff0000;
            animation: pulse 2s infinite;
        }
        @keyframes pulse {
            0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
            70% { box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
        }
        .code-container {
            background-color: #0f172a;
            padding: 20px;
            border-radius: 12px;
            margin-bottom: 20px;
        }
        .code-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        .code-title {
            color: white;
            font-size: 20px;
            font-weight: bold;
        }
        .controls-container {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-top: 10px;
            margin-bottom: 10px;
            padding: 10px;
            background-color: #f1f5f9;
            border-radius: 8px;
        }
        .slider-container {
            flex-grow: 1;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        .slider-label {
            font-size: 14px;
            color: #4b5563;
            white-space: nowrap;
        }
        .download-btn {
            background-color: #4F46E5;
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-weight: bold;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        .download-btn:hover {
            background-color: #4338ca;
        }
    </style>
</head>
<body class="game-container min-h-screen">
    <!-- Header -->
    <header class="bg-white shadow-md">
        <div class="container mx-auto px-4 py-6">
            <h1 class="text-3xl font-bold text-indigo-600">Code Visualizer: AI Learning Tool</h1>
            <p class="text-gray-600 mt-2">Learn programming through AI-powered visualizations!</p>
        </div>
    </header>

    

    <!-- Main Game Content -->
    <main class="container mx-auto px-4 py-8">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <!-- Left Panel - Code Input -->
            <div>
                <!-- SIMPLIFIED CODE INPUT -->
                <div class="code-container">
                    <div class="code-header">
                        <div class="code-title">🔴 YOUR PYTHON CODE HERE:</div>
                    </div>
                    
                    <!-- Simplified bare code input -->
                    <textarea 
                        id="simpleCodeInput" 
                        class="code-editor"
                        placeholder="Enter your Python code here..."
                    ></textarea>
                    
                    <!-- Explicit button -->
                    <button 
                        id="visualizeBtn" 
                        class="w-full mt-4 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-lg text-xl shadow-lg transition-all duration-300 transform hover:scale-105">
                        ▶️ VISUALIZE THIS CODE NOW
                    </button>
                    
                    <!-- Clear confirmation -->
                    <div id="codeConfirmation" class="code-display mt-4 hidden">
                        <div class="font-bold mb-2">Code to be visualized:</div>
                        <pre id="confirmedCode"></pre>
                    </div>
                </div>

                <!-- Tips Panel -->
                <div class="bg-yellow-50 rounded-lg p-6 mt-6">
                    <h3 class="font-bold text-yellow-700 mb-2">💡 Write Simple Code for Best Results:</h3>
                    <ul class="list-disc list-inside text-yellow-700 space-y-2">
                        <li><strong>Variables:</strong> Use clear names (x = 10, name = "Alex")</li>
                        <li><strong>Loops:</strong> Simple for/while loops with few iterations</li>
                        <li><strong>Conditionals:</strong> Basic if/else with clear conditions</li>
                        <li><strong>Strings:</strong> Use .upper(), .lower(), .replace() methods</li>
                        <li><strong>Functions:</strong> Short functions with 1-2 parameters</li>
                        <li><strong>Operators:</strong> Basic math (+, -, *, /) with small numbers</li>
                        <li>Add print() statements to show what your code does</li>
                        <li>Keep your code under 10 lines for best visualizations</li>
                    </ul>
                </div>
            </div>

            <!-- Right Panel - Canvas and Output -->
            <div>
                <!-- AI Status and Processing -->
                <div id="aiStatus" class="hidden bg-indigo-50 rounded-lg p-4 mb-6">
                    <div class="flex items-center gap-4">
                        <div class="loading-spinner"></div>
                        <span class="text-indigo-700">AI is visualizing your code...</span>
                    </div>
                </div>
                
                <!-- Canvas Controls -->
                <div class="controls-container">
                    <div class="slider-container">
                        <span class="slider-label">Visualization Size:</span>
                        <input type="range" id="canvasSizeSlider" min="600" max="1200" step="100" value="800" class="w-full">
                        <span id="canvasSizeValue" class="slider-label">800px</span>
                    </div>
                    <button id="downloadBtn" class="download-btn">
                        📥 Download
                    </button>
                </div>

                <!-- Canvas Area -->
                <div class="canvas-area p-6 canvas-container">
                    <canvas id="gameCanvas" width="800" height="600"></canvas>
                </div>

                <!-- AI Description Area -->
                <div id="aiDescription" class="mt-6 bg-white rounded-lg p-6 shadow-md hidden">
                    <h3 class="font-bold text-indigo-700 mb-3">AI Artist's Commentary:</h3>
                    <p id="aiDescriptionText" class="text-gray-700"></p>
                </div>

                <!-- Image Interpretation -->
                <div id="aiInterpretation" class="mt-6 bg-purple-50 rounded-lg p-6 shadow-md hidden">
                    <h3 class="font-bold text-purple-700 mb-3">What the AI Sees:</h3>
                    <p id="aiInterpretationText" class="text-purple-700"></p>
                </div>
            </div>
        </div>
        
        <button id="backToGamesBtn" class="btn btn-secondary mt-4">Back to Games</button>
    </main>
</body>
</html>
`;
        
        // Initialize the game after DOM is loaded
        setTimeout(initializeGame, 100);
        
        // Add event listeners
        setTimeout(() => {
            const visualizeBtn = document.getElementById('visualizeBtn');
            const updateKeyBtn = document.getElementById('updateKeyBtn');
            const backToGamesBtn = document.getElementById('backToGamesBtn');
            const simpleCodeInput = document.getElementById('simpleCodeInput');
            const canvasSizeSlider = document.getElementById('canvasSizeSlider');
            const canvasSizeValue = document.getElementById('canvasSizeValue');
            const downloadBtn = document.getElementById('downloadBtn');
            
            if (visualizeBtn) {
                visualizeBtn.addEventListener('click', visualizeSimpleCode);
                console.log('Attached visualize button event listener');
            }
            
            if (updateKeyBtn) {
                updateKeyBtn.addEventListener('click', updateGeminiKey);
            }
            
            if (backToGamesBtn) {
                backToGamesBtn.addEventListener('click', hideAIArtistGame);
            }
            
            // Add slider event listener
            if (canvasSizeSlider && canvasSizeValue) {
                canvasSizeSlider.addEventListener('input', function() {
                    canvasSizeValue.textContent = this.value + 'px';
                    updateCanvasSize(this.value);
                });
            }
            
            // Add download button event listener
            if (downloadBtn) {
                downloadBtn.addEventListener('click', downloadCanvasImage);
            }
            
            // Set initial code value
            if (simpleCodeInput) {
                CURRENT_CODE = simpleCodeInput.value;
                console.log('Initial code set:', CURRENT_CODE);
                
                // Add input listener
                simpleCodeInput.addEventListener('input', function() {
                    CURRENT_CODE = simpleCodeInput.value;
                    console.log('Code updated:', CURRENT_CODE);
                });
            }
        }, 200);
    }
}

// Update canvas size
function updateCanvasSize(size) {
    const gameCanvas = document.getElementById('gameCanvas');
    if (!gameCanvas) return;
    
    // Update canvas dimensions
    gameCanvas.width = parseInt(size);
    gameCanvas.height = Math.round(parseInt(size) * 0.75); // Keep 4:3 aspect ratio
    
    // Redraw if we have code
    if (CURRENT_CODE) {
        processVisualization(CURRENT_CODE);
    }
}

// Download canvas as image
function downloadCanvasImage() {
    const gameCanvas = document.getElementById('gameCanvas');
    if (!gameCanvas) return;
    
    // Create a temporary link
    const link = document.createElement('a');
    link.download = 'code-visualization.png';
    
    // Convert canvas to data URL
    link.href = gameCanvas.toDataURL('image/png');
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

// Initialize game function
function initializeGame() {
    console.log('Initializing game...');
    
    const gameCanvas = document.getElementById('gameCanvas');
    if (!gameCanvas) {
        console.error('Canvas element not found');
        return;
    }
    
    // Clear canvas initially
    clearCanvas();
    
    // Try to detect available Gemini models in the background
    findWorkingGeminiModel();
    
    // Get initial code
    const simpleCodeInput = document.getElementById('simpleCodeInput');
    if (simpleCodeInput) {
        CURRENT_CODE = simpleCodeInput.value;
        console.log('Initial code loaded:', CURRENT_CODE);
    }
}

// Check which Gemini models are accessible
async function findWorkingGeminiModel() {
    console.log('Testing available Gemini models...');
    
    // Update the status for user visibility
    showApiStatus('Checking API connectivity...', 'info');
    
    // Models to test in order of preference
    const models = [
        'gemini-1.5-flash',
        'gemini-1.5-pro',
        'gemini-pro-vision',
        'gemini-pro'
    ];
    
    let foundModel = false;
    
    for (const model of models) {
        try {
            console.log(`Testing model: ${model}`);
            
            const testPayload = {
                contents: [{
                    parts: [{
                        text: "Hi there, this is a test message to check if this model is available."
                    }]
                }]
            };
            
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testPayload)
            });
            
            const responseData = await response.json();
            
            if (response.ok && responseData.candidates && responseData.candidates.length > 0) {
                WORKING_MODEL = model;
                foundModel = true;
                console.log(`Found working model: ${model}`);
                showApiStatus(`Connected successfully to ${model}`, 'success');
                return model;
            } else {
                // Log the specific error
                console.warn(`Model ${model} returned error:`, responseData);
                if (responseData.error) {
                    console.warn(`Error details: ${responseData.error.message}`);
                }
            }
        } catch (error) {
            console.error(`Error testing model ${model}:`, error);
        }
    }
    
    if (!foundModel) {
        const errorMsg = "No Gemini models are available. Please check your API key and internet connection.";
        console.warn(errorMsg);
        showApiStatus(errorMsg, 'error');
    }
    
    return null;
}

// Show API status to the user
function showApiStatus(message, type = 'info') {
    const statusElement = document.getElementById('apiStatus');
    if (!statusElement) return;
    
    statusElement.classList.remove('hidden');
    statusElement.textContent = message;
    
    // Style based on type
    statusElement.className = statusElement.className.replace(/bg-\w+-\d+/g, '');
    
    if (type === 'error') {
        statusElement.classList.add('error-message');
    } else if (type === 'success') {
        statusElement.classList.remove('error-message');
        statusElement.classList.add('bg-green-100', 'border', 'border-green-400', 'text-green-700', 'p-4', 'rounded-lg', 'mb-4');
    } else {
        statusElement.classList.remove('error-message');
        statusElement.classList.add('bg-blue-100', 'border', 'border-blue-400', 'text-blue-700', 'p-4', 'rounded-lg', 'mb-4');
    }
    
    // Auto-hide success messages after 5 seconds
    if (type === 'success') {
        setTimeout(() => {
            statusElement.classList.add('hidden');
        }, 5000);
    }
}

// New simplified visualization function
function visualizeSimpleCode() {
    try {
        console.log('VISUALIZE BUTTON CLICKED');
        
        // Get the code input element
        const simpleCodeInput = document.getElementById('simpleCodeInput');
        
        if (!simpleCodeInput) {
            console.error('Simple code input not found!');
            showApiStatus('Error: Could not find the code input field', 'error');
            return;
        }
        
        // Get the code
        const code = simpleCodeInput.value.trim();
        console.log('CODE TO VISUALIZE:', code);
        
        // Update the global variable
        CURRENT_CODE = code;
        
        // Validate code
        if (!code) {
            console.error('No code entered');
            showApiStatus('Please enter some Python code to visualize', 'error');
            return;
        }
        
        // Show confirmation of the code
        const confirmedCode = document.getElementById('confirmedCode');
        const codeConfirmation = document.getElementById('codeConfirmation');
        
        if (confirmedCode && codeConfirmation) {
            confirmedCode.textContent = code;
            codeConfirmation.classList.remove('hidden');
        }
        
        // Turn on loading status
        const aiStatusDiv = document.getElementById('aiStatus');
        if (aiStatusDiv) {
            aiStatusDiv.classList.remove('hidden');
        }
        
        // Process the visualization
        processVisualization(code);
    } catch (error) {
        console.error('Error starting visualization:', error);
        showApiStatus(`Error: ${error.message}`, 'error');
    }
}

// Process and create visualization
async function processVisualization(code) {
    try {
        // Get canvas
        const gameCanvas = document.getElementById('gameCanvas');
        if (!gameCanvas) {
            throw new Error('Canvas element not found');
        }
        
        const ctx = gameCanvas.getContext('2d');
        
        // Clear the canvas
        clearCanvas();
        
        // Parse code
        const codeIR = parseCode(code);
        console.log('Code parsed into:', codeIR);
        
        // Create visualization
        createVisualization(ctx, codeIR);
        console.log('Visualization created');

        // updateAIArtistProgress();
        
        // Check if API key is available for AI commentary
        if (!GEMINI_API_KEY) {
            showApiStatus('API key is required for AI commentary', 'error');
            return;
        }
        
        if (!WORKING_MODEL) {
            console.log('No working model found, trying to find one...');
            await findWorkingGeminiModel();
            
            if (!WORKING_MODEL) {
                showApiStatus('Could not connect to Gemini API', 'error');
                return;
            }
        }
        
        try {
            // Get canvas image for AI
            const canvasImage = gameCanvas.toDataURL('image/png');
            
            // Generate AI commentary
            const [commentary, visualPerception] = await Promise.all([
                generateCommentary(code, codeIR, canvasImage),
                generateVisualPerception(code, codeIR, canvasImage)
            ]);
            
            // Update UI with AI commentary
            const aiDescriptionText = document.getElementById('aiDescriptionText');
            if (aiDescriptionText) {
                aiDescriptionText.textContent = commentary;
            }
            
            const aiDescription = document.getElementById('aiDescription');
            if (aiDescription) {
                aiDescription.classList.remove('hidden');
            }
            
            // Update UI with AI visual perception
            const aiInterpretationText = document.getElementById('aiInterpretationText');
            if (aiInterpretationText) {
                aiInterpretationText.textContent = visualPerception;
            }
            
            const aiInterpretation = document.getElementById('aiInterpretation');
            if (aiInterpretation) {
                aiInterpretation.classList.remove('hidden');
            }
            
        } catch (error) {
            console.error('Error generating AI commentary:', error);
            showApiStatus(`Error generating AI commentary: ${error.message}`, 'error');
        }
        
    } catch (error) {
        console.error('Error in visualization process:', error);
        showApiStatus(`Error: ${error.message}`, 'error');
    } finally {
        // Hide loading status
        const aiStatusDiv = document.getElementById('aiStatus');
        if (aiStatusDiv) {
            aiStatusDiv.classList.add('hidden');
        }
    }
}

// Parse code into intermediate representation
function parseCode(code) {
    console.log('Parsing code:', code);
    
    // Create a simple intermediate representation (IR) of the code
    // This abstracts the code into a format that's easier to visualize
    const codeIR = {
        mainTopic: null,       // Primary concept: variables, loops, etc.
        variables: [],         // List of variables: {name, value, type, line}
        loops: [],             // List of loops: {type, variable, range, line}
        conditionals: [],      // List of conditionals: {condition, line}
        functions: [],         // List of functions: {name, params, line}
        stringOps: [],         // List of string operations: {operation, string, line}
        operators: [],         // List of operators: {type, operands, line}
        prints: [],            // List of print statements: {content, line}
        simOutput: [],         // Simulated output lines
        structure: []          // Code structure by line: {type, content, indent, line}
    };
    
    // Split code into lines for analysis
    const lines = code.split('\n');
    console.log(`Processing ${lines.length} lines of code`);
    
    // Process each line
    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        const trimmed = line.trim();
        const indentation = line.search(/\S|$/) / 2; // Spaces ÷ 2 for level
        
        // For debugging specific line issues
        if (DEBUG_MODE && lineNum < 5) {
            console.log(`Line ${lineNum}: "${trimmed}"`);
        }
        
        // Skip empty lines and comments
        if (trimmed === '' || trimmed.startsWith('#')) {
            codeIR.structure.push({
                type: trimmed.startsWith('#') ? 'comment' : 'empty',
                content: trimmed,
                indent: indentation,
                line: lineNum
            });
            continue;
        }
        
        // Check for variable assignment
        if (trimmed.includes('=') && !trimmed.includes('==') && !trimmed.includes('>=') && 
            !trimmed.includes('<=') && !trimmed.startsWith('if ') && !trimmed.startsWith('elif ')) {
            
            const assignmentMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.+)$/);
            
            if (assignmentMatch) {
                const varName = assignmentMatch[1];
                const varValue = assignmentMatch[2].trim();
                
                // Determine type
                let varType = 'unknown';
                if (varValue.startsWith('"') || varValue.startsWith("'")) {
                    varType = 'string';
                } else if (varValue === 'True' || varValue === 'False') {
                    varType = 'boolean';
                } else if (!isNaN(Number(varValue))) {
                    varType = 'number';
                } else if (varValue.includes('.') && !varValue.startsWith('.')) {
                    // This might be a method call like string.upper()
                    varType = 'object';
                    
                    // Check for string operations
                    const stringOpMatch = varValue.match(/(.+)\.([a-zA-Z_]+)\(.*\)/);
                    if (stringOpMatch) {
                        codeIR.stringOps.push({
                            string: stringOpMatch[1],
                            operation: stringOpMatch[2],
                            result: varName,
                            line: lineNum
                        });
                    }
                } else if (varValue.includes('(') && varValue.includes(')')) {
                    varType = 'function result';
                }
                
                codeIR.variables.push({
                    name: varName,
                    value: varValue,
                    type: varType,
                    line: lineNum
                });
                
                codeIR.structure.push({
                    type: 'assignment',
                    content: trimmed,
                    indent: indentation,
                    line: lineNum
                });
                
                continue;
            }
        }
        
        // Check for loops
        if (trimmed.startsWith('for ')) {
            const forLoopMatch = trimmed.match(/for\s+([a-zA-Z_][a-zA-Z0-9_]*)\s+in\s+(.+):/);
            
            if (forLoopMatch) {
                const loopVar = forLoopMatch[1];
                let loopRange = forLoopMatch[2].trim();
                
                // Parse range() if present
                let rangeStart = 0, rangeEnd = 0, rangeStep = 1;
                const rangeMatch = loopRange.match(/range\s*\(\s*([^,)]*)\s*(?:,\s*([^,)]*)\s*)?(?:,\s*([^,)]*)\s*)?\)/);
                
                if (rangeMatch) {
                    if (rangeMatch[2]) { // range(start, end, ?step)
                        rangeStart = parseInt(rangeMatch[1]) || 0;
                        rangeEnd = parseInt(rangeMatch[2]) || 10;
                        rangeStep = parseInt(rangeMatch[3]) || 1;
                    } else { // range(end)
                        rangeStart = 0;
                        rangeEnd = parseInt(rangeMatch[1]) || 10;
                        rangeStep = 1;
                    }
                }
                
                codeIR.loops.push({
                    type: 'for',
                    variable: loopVar,
                    range: loopRange,
                    rangeStart: rangeStart,
                    rangeEnd: rangeEnd,
                    rangeStep: rangeStep,
                    line: lineNum
                });
                
                codeIR.structure.push({
                    type: 'loop_start',
                    content: trimmed,
                    indent: indentation,
                    line: lineNum
                });
                
                continue;
            }
        }
        
        if (trimmed.startsWith('while ')) {
            const whileLoopMatch = trimmed.match(/while\s+(.+):/);
            
            if (whileLoopMatch) {
                const condition = whileLoopMatch[1].trim();
                
                codeIR.loops.push({
                    type: 'while',
                    condition: condition,
                    line: lineNum
                });
                
                codeIR.structure.push({
                    type: 'loop_start',
                    content: trimmed,
                    indent: indentation,
                    line: lineNum
                });
                
                continue;
            }
        }
        
        // Check for conditionals
        if (trimmed.startsWith('if ')) {
            const ifMatch = trimmed.match(/if\s+(.+):/);
            
            if (ifMatch) {
                codeIR.conditionals.push({
                    type: 'if',
                    condition: ifMatch[1].trim(),
                    line: lineNum
                });
                
                codeIR.structure.push({
                    type: 'conditional_start',
                    content: trimmed,
                    indent: indentation,
                    line: lineNum
                });
                
                continue;
            }
        }
        
        if (trimmed.startsWith('elif ')) {
            const elifMatch = trimmed.match(/elif\s+(.+):/);
            
            if (elifMatch) {
                codeIR.conditionals.push({
                    type: 'elif',
                    condition: elifMatch[1].trim(),
                    line: lineNum
                });
                
                codeIR.structure.push({
                    type: 'conditional_branch',
                    content: trimmed,
                    indent: indentation,
                    line: lineNum
                });
                
                continue;
            }
        }
        
        if (trimmed === 'else:') {
            codeIR.conditionals.push({
                type: 'else',
                line: lineNum
            });
            
            codeIR.structure.push({
                type: 'conditional_branch',
                content: trimmed,
                indent: indentation,
                line: lineNum
            });
            
            continue;
        }
        
        // Check for functions
        if (trimmed.startsWith('def ')) {
            const funcMatch = trimmed.match(/def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)\s*:/);
            
            if (funcMatch) {
                const funcName = funcMatch[1];
                const paramsStr = funcMatch[2].trim();
                const params = paramsStr ? paramsStr.split(',').map(p => p.trim()) : [];
                
                codeIR.functions.push({
                    name: funcName,
                    params: params,
                    line: lineNum
                });
                
                codeIR.structure.push({
                    type: 'function_def',
                    content: trimmed,
                    indent: indentation,
                    line: lineNum
                });
                
                continue;
            }
        }
        
        // Check for function calls
        const funcCallMatch = trimmed.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/);
        if (funcCallMatch && !trimmed.startsWith('def ')) {
            const funcName = funcCallMatch[1];
            
            // Check for print statements
            if (funcName === 'print') {
                const printContent = funcCallMatch[2].trim();
                
                codeIR.prints.push({
                    content: printContent,
                    line: lineNum
                });
                
                // Add to simulated output (simplified)
                let simpleOutput = printContent
                    .replace(/^['"]|['"]$/g, '')     // Remove outer quotes
                    .replace(/^f['"]|['"]$/g, '');   // Remove f-string marker
                
                // Try to evaluate variable references
                simpleOutput = simpleOutput.replace(/{([^}]+)}/g, (match, varName) => {
                    const foundVar = codeIR.variables.find(v => v.name === varName.trim());
                    if (foundVar) {
                        if (foundVar.type === 'number') {
                            return foundVar.value;
                        } else if (foundVar.value.startsWith('"') || foundVar.value.startsWith("'")) {
                            return foundVar.value.slice(1, -1);
                        } else if (foundVar.value.includes('+')) {
                            // Simple variable expression evaluation
                            const parts = foundVar.value.split('+').map(p => p.trim());
                            if (parts.length === 2) {
                                const var1 = codeIR.variables.find(v => v.name === parts[0]);
                                const var2 = codeIR.variables.find(v => v.name === parts[1]);
                                if (var1 && var2 && var1.type === 'number' && var2.type === 'number') {
                                    return (parseFloat(var1.value) + parseFloat(var2.value)).toString();
                                }
                            }
                        }
                        return foundVar.value;
                    }
                    return match;
                });
                
                // For simple variable references in print, evaluate them
                if (codeIR.variables.some(v => v.name === simpleOutput)) {
                    const foundVar = codeIR.variables.find(v => v.name === simpleOutput);
                    if (foundVar && foundVar.type === 'number') {
                        simpleOutput = foundVar.value;
                    }
                }
                
                // Special case for string multiplication in print like print("*" * (i + 1))
                const stringMultMatch = printContent.match(/["'](.*)["']\s*\*\s*\((.*)\)/);
                if (stringMultMatch) {
                    const str = stringMultMatch[1];
                    const expr = stringMultMatch[2].trim();
                    
                    // Handle simple cases like i + 1
                    if (expr.includes('+')) {
                        const parts = expr.split('+').map(p => p.trim());
                        if (parts.length === 2) {
                            const varName = parts[0];
                            const addValue = parseInt(parts[1]) || 0;
                            
                            // Look for loop variable
                            const loopVar = codeIR.loops.find(loop => loop.variable === varName);
                            if (loopVar && loopVar.type === 'for') {
                                // Generate outputs for each loop iteration
                                for (let i = loopVar.rangeStart; i < loopVar.rangeEnd; i += loopVar.rangeStep) {
                                    const repetitions = i + addValue;
                                    const output = str.repeat(repetitions);
                                    codeIR.simOutput.push(output);
                                }
                                // Skip adding the original simulation since we've expanded it
                                continue;
                            }
                        }
                    }
                }
                
                codeIR.simOutput.push(simpleOutput);
                
                codeIR.structure.push({
                    type: 'print',
                    content: trimmed,
                    indent: indentation,
                    line: lineNum
                });
                
                continue;
            }
            
            codeIR.structure.push({
                type: 'function_call',
                content: trimmed,
                indent: indentation,
                line: lineNum
            });
            
            continue;
        }
        
        // Check for operators
        const operatorMatch = trimmed.match(/([^=<>!])([\+\-\*\/\%]|\*\*|==|!=|>=|<=|>|<)([^=])/);
        if (operatorMatch) {
            const operator = operatorMatch[2];
            
            codeIR.operators.push({
                type: operator,
                line: lineNum
            });
        }
        
        // Default: unknown line type
        codeIR.structure.push({
            type: 'other',
            content: trimmed,
            indent: indentation,
            line: lineNum
        });
    }
    
    // Determine main topic based on code content
    const topicScores = {
        'Variables': codeIR.variables.length * 2,
        'Loops': codeIR.loops.length * 3,
        'Conditionals': codeIR.conditionals.length * 3,
        'String Manipulation': codeIR.stringOps.length * 3,
        'Functions': codeIR.functions.length * 3,
        'Operators': codeIR.operators.length * 1.5
    };
    
    let maxScore = 0;
    let maxTopic = 'Variables'; // Default
    
    for (const [topic, score] of Object.entries(topicScores)) {
        if (score > maxScore) {
            maxScore = score;
            maxTopic = topic;
        }
    }
    
    codeIR.mainTopic = maxTopic;
    console.log(`Main topic detected: ${maxTopic}`);
    
    return codeIR;
}

// Create visualization based on code IR
function createVisualization(ctx, codeIR) {
    console.log(`Creating visualization for topic: ${codeIR.mainTopic}`);
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Clear canvas and set background
    ctx.fillStyle = '#f8fafc'; // Light background
    ctx.fillRect(0, 0, width, height);
    
    // Draw title section
    ctx.fillStyle = '#4338ca'; // Indigo
    ctx.fillRect(0, 0, width, 60);
    
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText(`${codeIR.mainTopic} Visualization`, width / 2, 40);
    
    // Create main topic visualization
    switch(codeIR.mainTopic) {
        case "Variables":
            createVariablesVisualization(ctx, codeIR);
            break;
        case "Loops":
            createLoopsVisualization(ctx, codeIR);
            break;
        case "Conditionals":
            createConditionalsVisualization(ctx, codeIR);
            break;
        case "String Manipulation":
            createStringVisualization(ctx, codeIR);
            break;
        case "Functions":
            createFunctionsVisualization(ctx, codeIR);
            break;
        case "Operators":
            createOperatorsVisualization(ctx, codeIR);
            break;
        default:
            createBasicCodeFlow(ctx, codeIR);
    }
}

// Create variables visualization
function createVariablesVisualization(ctx, codeIR) {
    console.log('Creating variables visualization');
    
    if (codeIR.variables.length === 0) {
        console.log('No variables found, falling back to generic view');
        createBasicCodeFlow(ctx, codeIR);
        return;
    }
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Scale measurements based on canvas size
    const scale = Math.min(width, height) / 600;
    
    // Background area for visualization
    ctx.fillStyle = '#eef2ff'; // Indigo-50
    ctx.fillRect(width * 0.1, height * 0.15, width * 0.8, height * 0.7);
    
    // Variable container title
    ctx.font = `bold ${24 * scale}px Arial`;
    ctx.fillStyle = '#4f46e5'; // Indigo-600
    ctx.textAlign = 'center';
    ctx.fillText('Variables in Memory', width / 2, height * 0.2);
    
    // Draw variable boxes with values
    const boxWidth = 120 * scale;
    const boxHeight = 80 * scale;
    const boxesPerRow = 3;
    const startX = width * 0.15;
    const startY = height * 0.25;
    const padding = 20 * scale;
    
    for (let i = 0; i < Math.min(codeIR.variables.length, 6); i++) {
        const rowIndex = Math.floor(i / boxesPerRow);
        const colIndex = i % boxesPerRow;
        
        const x = startX + colIndex * (boxWidth + padding * 1.5);
        const y = startY + rowIndex * (boxHeight + padding);
        
        // Draw box
        ctx.fillStyle = '#ffffff'; // White
        ctx.fillRect(x, y, boxWidth, boxHeight);
        
        ctx.strokeStyle = '#6366f1'; // Indigo-500
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, boxWidth, boxHeight);
        
        // Variable name (label)
        ctx.font = `bold ${14 * scale}px Arial`;
        ctx.fillStyle = '#4338ca'; // Indigo-700
        ctx.textAlign = 'center';
        ctx.fillText(codeIR.variables[i].name, x + boxWidth/2, y + 20 * scale);
        
        // Separator line
        ctx.beginPath();
        ctx.moveTo(x, y + 30 * scale);
        ctx.lineTo(x + boxWidth, y + 30 * scale);
        ctx.strokeStyle = '#c7d2fe'; // Indigo-200
        ctx.stroke();
        
        // Variable value
        const value = codeIR.variables[i].value;
        const displayValue = value.length > 15 ? value.substring(0, 13) + "..." : value;
        
        ctx.font = `${15 * scale}px monospace`;
        ctx.fillStyle = '#4f46e5'; // Indigo-600
        ctx.fillText(displayValue, x + boxWidth/2, y + 55 * scale);
    }
    
    if (codeIR.variables.length > 6) {
        ctx.font = `${14 * scale}px Arial`;
        ctx.fillStyle = '#6366f1'; // Indigo-500
        ctx.textAlign = 'right';
        ctx.fillText('... more variables ...', width * 0.85, height * 0.7);
    }
}

// Create loops visualization
function createLoopsVisualization(ctx, codeIR) {
    // If no loops detected, fall back to generic view
    if (codeIR.loops.length === 0) {
        createBasicCodeFlow(ctx, codeIR);
        return;
    }
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Scale measurements based on canvas size
    const scale = Math.min(width, height) / 600;
    
    // Background for visualization
    ctx.fillStyle = codeIR.loops[0].type === 'for' ? '#eef2ff' : '#f0fdf4'; // Indigo-50 or Emerald-50
    ctx.fillRect(width * 0.1, height * 0.15, width * 0.8, height * 0.7);
    
    // Common styling
    const boxSize = 70 * scale;
    const arrowLength = 50 * scale;
    
    if (codeIR.loops[0].type === 'for') {
        // Title
        ctx.font = `bold ${24 * scale}px Arial`;
        ctx.fillStyle = '#4f46e5'; // Indigo-600
        ctx.textAlign = 'center';
        ctx.fillText('For Loop Iteration Process', width / 2, height * 0.2);
        
        // Get the loop details
        const forLoop = codeIR.loops.find(loop => loop.type === 'for');
        
        // Draw iteration boxes
        let startVal = forLoop.rangeStart;
        let endVal = Math.min(startVal + 5, forLoop.rangeEnd);
        let values = [];
        
        for (let i = startVal; i < endVal; i += forLoop.rangeStep) {
            values.push(i);
        }
        
        if (endVal < forLoop.rangeEnd) {
            values.push("...");
        }
        
        // Draw boxes in a circular flow
        const centerX = width / 2;
        const centerY = height * 0.45;
        const radius = Math.min(width, height) * 0.25;
        const angle = (2 * Math.PI) / values.length;
        
        // Draw loop explanation in center
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(centerX - boxSize * 1.5, centerY - boxSize / 2, boxSize * 3, boxSize);
        ctx.strokeStyle = '#4338ca'; // Indigo-700
        ctx.lineWidth = 2;
        ctx.strokeRect(centerX - boxSize * 1.5, centerY - boxSize / 2, boxSize * 3, boxSize);
        
        ctx.font = `bold ${14 * scale}px Arial`;
        ctx.fillStyle = '#4338ca'; // Indigo-700
        ctx.textAlign = 'center';
        ctx.fillText('Loop Body Executes', centerX, centerY);
        ctx.font = `${12 * scale}px Arial`;
        ctx.fillText('Indented Code Block', centerX, centerY + boxSize/2 - 10 * scale);
        
        for (let i = 0; i < values.length; i++) {
            const x = centerX + radius * Math.cos(i * angle - Math.PI/2);
            const y = centerY + radius * Math.sin(i * angle - Math.PI/2);
            
            // Draw box
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(x - boxSize/2, y - boxSize/2, boxSize, boxSize);
            ctx.strokeStyle = '#6366f1'; // Indigo-500
            ctx.lineWidth = 2;
            ctx.strokeRect(x - boxSize/2, y - boxSize/2, boxSize, boxSize);
            
            // Loop variable value
            ctx.font = `bold ${18 * scale}px Arial`;
            ctx.fillStyle = '#4338ca'; // Indigo-700
            ctx.textAlign = 'center';
            ctx.fillText(values[i], x, y + 5 * scale);
            
            // Label
            ctx.font = `${14 * scale}px Arial`;
            ctx.fillStyle = '#6366f1'; // Indigo-500
            ctx.textAlign = 'center';
            ctx.fillText(`${forLoop.variable} =`, x, y - boxSize/2 - 10 * scale);
            
            // Draw arrow to next box (if not the last box)
            if (i < values.length - 1) {
                const nextX = centerX + radius * Math.cos((i+1) * angle - Math.PI/2);
                const nextY = centerY + radius * Math.sin((i+1) * angle - Math.PI/2);
                
                // Calculate points for a curved arrow
                const midAngle = ((i * angle) + ((i+1) * angle)) / 2 - Math.PI/2;
                const controlX = centerX + radius * 1.3 * Math.cos(midAngle);
                const controlY = centerY + radius * 1.3 * Math.sin(midAngle);
                
                // Find points on the edge of each box
                const fromBoxX = x + (boxSize/2) * Math.cos(i * angle - Math.PI/2);
                const fromBoxY = y + (boxSize/2) * Math.sin(i * angle - Math.PI/2);
                const toBoxX = nextX + (boxSize/2) * Math.cos(Math.PI + (i+1) * angle - Math.PI/2);
                const toBoxY = nextY + (boxSize/2) * Math.sin(Math.PI + (i+1) * angle - Math.PI/2);
                
                // Draw curved arrow
                ctx.beginPath();
                ctx.moveTo(fromBoxX, fromBoxY);
                ctx.quadraticCurveTo(controlX, controlY, toBoxX, toBoxY);
                ctx.strokeStyle = '#6366f1'; // Indigo-500
                ctx.lineWidth = 2;
                ctx.stroke();
                
                // Draw arrow head
                const arrowHeadSize = 10 * scale;
                const arrowAngle = Math.atan2(toBoxY - controlY, toBoxX - controlX);
                
                ctx.beginPath();
                ctx.moveTo(toBoxX, toBoxY);
                ctx.lineTo(
                    toBoxX - arrowHeadSize * Math.cos(arrowAngle - Math.PI/6),
                    toBoxY - arrowHeadSize * Math.sin(arrowAngle - Math.PI/6)
                );
                ctx.lineTo(
                    toBoxX - arrowHeadSize * Math.cos(arrowAngle + Math.PI/6),
                    toBoxY - arrowHeadSize * Math.sin(arrowAngle + Math.PI/6)
                );
                ctx.closePath();
                ctx.fillStyle = '#6366f1'; // Indigo-500
                ctx.fill();
            }
        }
        
        // Loop text
        ctx.font = `${16 * scale}px Arial`;
        ctx.fillStyle = '#4338ca'; // Indigo-700
        ctx.textAlign = 'center';
        ctx.fillText(`Loop iterates from ${forLoop.rangeStart} to ${forLoop.rangeEnd-1}`, width/2, height * 0.75);
        ctx.fillText(`Variable "${forLoop.variable}" takes each value in sequence`, width/2, height * 0.75 + 25 * scale);
    } else {
        // While loop
        const whileLoop = codeIR.loops.find(loop => loop.type === 'while');
        
        // Title
        ctx.font = `bold ${24 * scale}px Arial`;
        ctx.fillStyle = '#059669'; // Emerald-600
        ctx.textAlign = 'center';
        ctx.fillText('While Loop Flow', width/2, height * 0.2);
        
        // Draw loop flow diagram
        const centerX = width/2;
        const centerY = height * 0.45;
        const diamondSize = 90 * scale;
        
        // Condition check (diamond)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - diamondSize);
        ctx.lineTo(centerX + diamondSize, centerY);
        ctx.lineTo(centerX, centerY + diamondSize);
        ctx.lineTo(centerX - diamondSize, centerY);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#10b981'; // Emerald-500
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Condition text
        ctx.font = `bold ${16 * scale}px Arial`;
        ctx.fillStyle = '#047857'; // Emerald-700
        ctx.textAlign = 'center';
        
        // Format condition to fit
        let condText = whileLoop.condition;
        if (condText.length > 15) {
            condText = condText.substring(0, 13) + "...";
        }
        
        ctx.fillText('while', centerX, centerY - 15 * scale);
        ctx.fillText(condText, centerX, centerY + 15 * scale);
        
        // True path (right)
        const execX = centerX + width * 0.25;
        const execY = centerY;
        
        drawArrow(ctx, centerX + diamondSize, centerY, execX - 70 * scale, centerY, '#10b981', 2);
        
        // True label
        ctx.font = `bold ${14 * scale}px Arial`;
        ctx.fillStyle = '#059669'; // Emerald-600
        ctx.fillText('True', centerX + diamondSize * 0.6, centerY - 15 * scale);
        
        // Execute box
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(execX - 70 * scale, execY - 40 * scale, 140 * scale, 80 * scale);
        ctx.strokeStyle = '#10b981'; // Emerald-500
        ctx.lineWidth = 2;
        ctx.strokeRect(execX - 70 * scale, execY - 40 * scale, 140 * scale, 80 * scale);
        
        ctx.font = `bold ${16 * scale}px Arial`;
        ctx.fillStyle = '#047857'; // Emerald-700
        ctx.fillText('Execute', execX, execY - 10 * scale);
        ctx.fillText('Loop Body', execX, execY + 15 * scale);
        
        // Loop back arrow
        ctx.beginPath();
        ctx.moveTo(execX + 70 * scale, execY);
        ctx.lineTo(execX + 90 * scale, execY);
        ctx.lineTo(execX + 90 * scale, execY + 100 * scale);
        ctx.lineTo(centerX - 100 * scale, execY + 100 * scale);
        ctx.lineTo(centerX - 100 * scale, execY);
        ctx.lineTo(centerX - diamondSize, execY);
        ctx.strokeStyle = '#10b981'; // Emerald-500
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Loop back arrow head
        drawArrowHead(ctx, centerX - diamondSize, execY, '#10b981');
        
        // False path (down)
        const exitX = centerX;
        const exitY = centerY + height * 0.25;
        
        drawArrow(ctx, centerX, centerY + diamondSize, exitX, exitY - 40 * scale, '#ef4444', 2);
        
        // False label
        ctx.font = `bold ${14 * scale}px Arial`;
        ctx.fillStyle = '#b91c1c'; // Red-700
        ctx.fillText('False', centerX + 15 * scale, centerY + diamondSize * 0.6);
        
        // Exit box
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(exitX - 60 * scale, exitY - 40 * scale, 120 * scale, 60 * scale);
        ctx.strokeStyle = '#ef4444'; // Red-500
        ctx.lineWidth = 2;
        ctx.strokeRect(exitX - 60 * scale, exitY - 40 * scale, 120 * scale, 60 * scale);
        
        ctx.font = `bold ${16 * scale}px Arial`;
        ctx.fillStyle = '#b91c1c'; // Red-700
        ctx.fillText('Exit Loop', exitX, exitY);
        
        // Loop explanation
        ctx.font = `${16 * scale}px Arial`;
        ctx.fillStyle = '#047857'; // Emerald-700
        ctx.textAlign = 'center';
        ctx.fillText('While loop continues as long as the condition is True', width/2, height * 0.75);
    }
}

// Create conditionals visualization
function createConditionalsVisualization(ctx, codeIR) {
    // If no conditionals detected, fall back to generic view
    if (codeIR.conditionals.length === 0) {
        createBasicCodeFlow(ctx, codeIR);
        return;
    }
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Scale measurements based on canvas size
    const scale = Math.min(width, height) / 600;
    
    // Background for visualization
    ctx.fillStyle = '#fef3c7'; // Amber-100
    ctx.fillRect(width * 0.1, height * 0.15, width * 0.8, height * 0.7);
    
    // Title
    ctx.font = `bold ${24 * scale}px Arial`;
    ctx.fillStyle = '#b45309'; // Amber-700
    ctx.textAlign = 'center';
    ctx.fillText('Conditional Branching Paths', width / 2, height * 0.2);
    
    // Create a flowchart for the conditional logic
    const hasElse = codeIR.conditionals.some(cond => cond.type === 'else');
    const hasElif = codeIR.conditionals.some(cond => cond.type === 'elif');
    
    // Draw decision diamond at the center
    const centerX = width / 2;
    const centerY = height * 0.4;
    const diamondSize = 70 * scale;
    
    // Draw diamond
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - diamondSize);
    ctx.lineTo(centerX + diamondSize, centerY);
    ctx.lineTo(centerX, centerY + diamondSize);
    ctx.lineTo(centerX - diamondSize, centerY);
    ctx.closePath();
    ctx.fill();
    
    ctx.strokeStyle = '#d97706'; // Amber-600
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Get main condition (the if statement)
    const mainCondition = codeIR.conditionals.find(cond => cond.type === 'if');
    
    // Decision text
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.fillStyle = '#b45309'; // Amber-700
    ctx.textAlign = 'center';
    
    // Format condition text to fit
    let condText = mainCondition ? mainCondition.condition : 'condition';
    if (condText.length > 15) {
        condText = condText.substring(0, 13) + '...';
    }
    
    ctx.fillText('if', centerX, centerY - 15 * scale);
    ctx.fillText(condText, centerX, centerY + 15 * scale);
    
    // True path (right)
    const trueX = centerX + width * 0.25;
    const trueY = centerY;
    
    drawArrow(ctx, centerX + diamondSize, centerY, trueX - 60 * scale, centerY, '#16a34a', 2);
    
    // True label
    ctx.font = `bold ${14 * scale}px Arial`;
    ctx.fillStyle = '#16a34a'; // Green-600
    ctx.fillText('True', centerX + diamondSize * 0.6, centerY - 15 * scale);
    
    // True box
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(trueX - 60 * scale, trueY - 40 * scale, 120 * scale, 80 * scale);
    
    ctx.strokeStyle = '#16a34a'; // Green-500
    ctx.lineWidth = 2;
    ctx.strokeRect(trueX - 60 * scale, trueY - 40 * scale, 120 * scale, 80 * scale);
    
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.fillStyle = '#15803d'; // Green-700
    ctx.fillText('Execute', trueX, trueY - 10 * scale);
    ctx.fillText('If Block', trueX, trueY + 15 * scale);
    
    // False path (left)
    const falseX = centerX - width * 0.25;
    const falseY = centerY;
    
    drawArrow(ctx, centerX - diamondSize, centerY, falseX + 60 * scale, centerY, '#dc2626', 2);
    
    // False label
    ctx.font = `bold ${14 * scale}px Arial`;
    ctx.fillStyle = '#dc2626'; // Red-600
    ctx.fillText('False', centerX - diamondSize * 0.6, centerY - 15 * scale);
    
    // False destination (else/elif or exit)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(falseX - 60 * scale, falseY - 40 * scale, 120 * scale, 80 * scale);
    
    if (hasElif) {
        ctx.strokeStyle = '#f59e0b'; // Amber-500
        ctx.lineWidth = 2;
        ctx.strokeRect(falseX - 60 * scale, falseY - 40 * scale, 120 * scale, 80 * scale);
        
        ctx.font = `bold ${16 * scale}px Arial`;
        ctx.fillStyle = '#b45309'; // Amber-700
        ctx.fillText('Check', falseX, falseY - 10 * scale);
        ctx.fillText('Next Condition', falseX, falseY + 15 * scale);
        
        // Draw a small elif diamond to indicate further checks
        const smallDiamondSize = 30 * scale;
        const elifY = falseY + 100 * scale;
        
        // Draw connecting line
        ctx.beginPath();
        ctx.moveTo(falseX, falseY + 40 * scale);
        ctx.lineTo(falseX, elifY - smallDiamondSize);
        ctx.strokeStyle = '#f59e0b'; // Amber-500
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Draw small diamond for elif
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(falseX, elifY - smallDiamondSize);
        ctx.lineTo(falseX + smallDiamondSize, elifY);
        ctx.lineTo(falseX, elifY + smallDiamondSize);
        ctx.lineTo(falseX - smallDiamondSize, elifY);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#f59e0b'; // Amber-500
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Elif text
        ctx.font = `bold ${14 * scale}px Arial`;
        ctx.fillStyle = '#b45309'; // Amber-700
        ctx.fillText('elif', falseX, elifY + 5 * scale);
    } else if (hasElse) {
        ctx.strokeStyle = '#0284c7'; // Sky-600
        ctx.lineWidth = 2;
        ctx.strokeRect(falseX - 60 * scale, falseY - 40 * scale, 120 * scale, 80 * scale);
        
        ctx.font = `bold ${16 * scale}px Arial`;
        ctx.fillStyle = '#0369a1'; // Sky-700
        ctx.fillText('Execute', falseX, falseY - 10 * scale);
        ctx.fillText('Else Block', falseX, falseY + 15 * scale);
    } else {
        ctx.strokeStyle = '#dc2626'; // Red-500
        ctx.lineWidth = 2;
        ctx.strokeRect(falseX - 60 * scale, falseY - 40 * scale, 120 * scale, 80 * scale);
        
        ctx.font = `bold ${16 * scale}px Arial`;
        ctx.fillStyle = '#b91c1c'; // Red-700
        ctx.fillText('Skip', falseX, falseY - 10 * scale);
        ctx.fillText('Conditional', falseX, falseY + 15 * scale);
    }
    
    // Add explanation
    ctx.font = `${16 * scale}px Arial`;
    ctx.fillStyle = '#b45309'; // Amber-700
    ctx.textAlign = 'center';
    
    if (hasElif) {
        ctx.fillText('Program checks conditions in sequence', width/2, height * 0.7);
        ctx.fillText('Executes the first block where condition is True', width/2, height * 0.7 + 25 * scale);
    } else if (hasElse) {
        ctx.fillText('If condition is True → Execute "if" block', width/2, height * 0.7);
        ctx.fillText('If condition is False → Execute "else" block', width/2, height * 0.7 + 25 * scale);
    } else {
        ctx.fillText('If condition is True → Execute "if" block', width/2, height * 0.7);
        ctx.fillText('If condition is False → Skip this section', width/2, height * 0.7 + 25 * scale);
    }
}

// Create string visualization
function createStringVisualization(ctx, codeIR) {
    // If no string operations, fall back to generic view
    if (codeIR.stringOps.length === 0 && !codeIR.variables.some(v => v.type === 'string')) {
        createBasicCodeFlow(ctx, codeIR);
        return;
    }
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Scale measurements based on canvas size
    const scale = Math.min(width, height) / 600;
    
    // Background for visualization
    ctx.fillStyle = '#f0f9ff'; // Sky-50
    ctx.fillRect(width * 0.1, height * 0.15, width * 0.8, height * 0.7);
    
    // Title
    ctx.font = `bold ${24 * scale}px Arial`;
    ctx.fillStyle = '#0369a1'; // Sky-700
    ctx.textAlign = 'center';
    ctx.fillText('String Transformations', width / 2, height * 0.2);
    
    // Find string variables
    const stringVars = codeIR.variables.filter(v => 
        v.type === 'string' || 
        (v.value && (v.value.startsWith('"') || v.value.startsWith("'")))
    );
    
    if (stringVars.length > 0) {
        // Original string box
        const originalString = stringVars[0].value.replace(/^['"]|['"]$/g, '');
        
        // Draw string in a box at the top
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(width * 0.15, height * 0.25, width * 0.7, 50 * scale);
        
        ctx.strokeStyle = '#0ea5e9'; // Sky-500
        ctx.lineWidth = 2;
        ctx.strokeRect(width * 0.15, height * 0.25, width * 0.7, 50 * scale);
        
        ctx.font = `bold ${16 * scale}px Arial`;
        ctx.fillStyle = '#0c4a6e'; // Sky-900
        ctx.textAlign = 'left';
        ctx.fillText("Original String:", width * 0.17, height * 0.25 + 30 * scale);
        
        ctx.font = `bold ${18 * scale}px monospace`;
        ctx.fillStyle = '#0284c7'; // Sky-600
        ctx.textAlign = 'left';
        ctx.fillText(`"${originalString.substring(0, 20)}"`, width * 0.4, height * 0.25 + 30 * scale);
        
        // Check for specific string operations
        const operations = codeIR.stringOps.length > 0 ? codeIR.stringOps : [
            { operation: 'upper', string: stringVars[0].name, result: 'uppercase' }
        ];
        
        // Display operations (max 3)
        const startY = height * 0.35;
        const boxHeight = 60 * scale;
        const gap = 20 * scale;
        const maxOps = Math.min(operations.length, 3);
        
        for (let i = 0; i < maxOps; i++) {
            const y = startY + i * (boxHeight + gap);
            
            // Draw arrow down
            drawArrow(ctx, width / 2, y - 10 * scale, width / 2, y, '#0ea5e9', 2);
            
            // Draw operation box
            ctx.fillStyle = '#e0f2fe'; // Sky-100
            ctx.fillRect(width * 0.15, y, width * 0.7, boxHeight);
            
            ctx.strokeStyle = '#0ea5e9'; // Sky-500
            ctx.lineWidth = 2;
            ctx.strokeRect(width * 0.15, y, width * 0.7, boxHeight);
            
            // Operation name
            ctx.font = `bold ${18 * scale}px Arial`;
            ctx.fillStyle = '#0369a1'; // Sky-700
            ctx.textAlign = 'center';
            
            let displayOp = operations[i].operation;
            let opResult = '';
            
            // Determine operation display text
            switch(displayOp) {
                case 'upper':
                    opResult = originalString.toUpperCase();
                    displayOp = '.upper()';
                    break;
                case 'lower':
                    opResult = originalString.toLowerCase();
                    displayOp = '.lower()';
                    break;
                case 'title':
                case 'capitalize':
                    opResult = originalString.replace(/\b\w/g, c => c.toUpperCase());
                    displayOp = '.title()';
                    break;
                case 'replace':
                    opResult = originalString.replace(/\w/, '*');
                    displayOp = '.replace(...)';
                    break;
                default:
                    opResult = originalString;
                    break;
            }
            
            // Method name
            ctx.fillText(displayOp, width / 2, y + 25 * scale);
            
            // Result
            ctx.font = `${16 * scale}px monospace`;
            ctx.fillStyle = '#0284c7'; // Sky-600
            ctx.textAlign = 'center';
            ctx.fillText(`→ "${opResult.substring(0, 20)}"`, width / 2, y + 45 * scale);
        }
        
        // Explanation
        ctx.font = `${16 * scale}px Arial`;
        ctx.fillStyle = '#0369a1'; // Sky-700
        ctx.textAlign = 'center';
        ctx.fillText('String methods create new transformed strings', width / 2, height * 0.7);
        ctx.fillText('without changing the original', width / 2, height * 0.7 + 25 * scale);
    }
}

// Create functions visualization
function createFunctionsVisualization(ctx, codeIR) {
    // If no functions, fall back to generic view
    if (codeIR.functions.length === 0) {
        createBasicCodeFlow(ctx, codeIR);
        return;
    }
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Scale measurements based on canvas size
    const scale = Math.min(width, height) / 600;
    
    // Background for visualization
    ctx.fillStyle = '#faf5ff'; // Purple-50
    ctx.fillRect(width * 0.1, height * 0.15, width * 0.8, height * 0.7);
    
    // Title
    ctx.font = `bold ${24 * scale}px Arial`;
    ctx.fillStyle = '#7e22ce'; // Purple-700
    ctx.textAlign = 'center';
    ctx.fillText('Function Call Process', width / 2, height * 0.2);
    
    // Choose a function to visualize
    const func = codeIR.functions[0];
    
    // Draw main diagram
    const centerX = width / 2;
    const centerY = height * 0.45;
    
    // Function definition box
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(centerX - 150 * scale, centerY - 80 * scale, 300 * scale, 80 * scale);
    
    ctx.strokeStyle = '#a855f7'; // Purple-500
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - 150 * scale, centerY - 80 * scale, 300 * scale, 80 * scale);
    
    // Function name and params
    ctx.font = `bold ${18 * scale}px Arial`;
    ctx.fillStyle = '#7e22ce'; // Purple-700
    ctx.textAlign = 'center';
    
    const paramsList = func.params.join(', ');
    ctx.fillText(`def ${func.name}(${paramsList}):`, centerX, centerY - 45 * scale);
    
    // Function description
    ctx.font = `${16 * scale}px Arial`;
    ctx.fillStyle = '#9333ea'; // Purple-600
    ctx.fillText('Function Definition', centerX, centerY - 15 * scale);
    
    // Function call box
    ctx.fillStyle = '#f3e8ff'; // Purple-100
    ctx.fillRect(width * 0.15, centerY + 50 * scale, 150 * scale, 60 * scale);
    
    ctx.strokeStyle = '#a855f7'; // Purple-500
    ctx.lineWidth = 2;
    ctx.strokeRect(width * 0.15, centerY + 50 * scale, 150 * scale, 60 * scale);
    
    // Function call text
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.fillStyle = '#7e22ce'; // Purple-700
    ctx.textAlign = 'center';
    ctx.fillText(`${func.name}(...)`, width * 0.15 + 75 * scale, centerY + 75 * scale);
    
    ctx.font = `${14 * scale}px Arial`;
    ctx.fillStyle = '#9333ea'; // Purple-600
    ctx.fillText('Function Call', width * 0.15 + 75 * scale, centerY + 95 * scale);
    
    // Return value box
    ctx.fillStyle = '#f3e8ff'; // Purple-100
    ctx.fillRect(width * 0.85 - 150 * scale, centerY + 50 * scale, 150 * scale, 60 * scale);
    
    ctx.strokeStyle = '#a855f7'; // Purple-500
    ctx.lineWidth = 2;
    ctx.strokeRect(width * 0.85 - 150 * scale, centerY + 50 * scale, 150 * scale, 60 * scale);
    
    // Return value text
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.fillStyle = '#7e22ce'; // Purple-700
    ctx.fillText('Return Value', width * 0.85 - 75 * scale, centerY + 75 * scale);
    
    ctx.font = `${14 * scale}px Arial`;
    ctx.fillStyle = '#9333ea'; // Purple-600
    ctx.fillText('Result', width * 0.85 - 75 * scale, centerY + 95 * scale);
    
    // Draw arrows for function flow
    // Call arrow
    drawArrow(ctx, width * 0.15 + 150 * scale, centerY + 80 * scale, centerX - 100 * scale, centerY, '#a855f7', 2);
    // Return arrow
    drawArrow(ctx, centerX + 100 * scale, centerY, width * 0.85 - 150 * scale, centerY + 80 * scale, '#a855f7', 2);
    
    // Function explanation
    ctx.font = `${16 * scale}px Arial`;
    ctx.fillStyle = '#7e22ce'; // Purple-700
    ctx.textAlign = 'center';
    ctx.fillText('Functions package code into reusable blocks', centerX, height * 0.7);
    ctx.fillText('with inputs (parameters) and outputs (return values)', centerX, height * 0.7 + 25 * scale);
}

// Create operators visualization
function createOperatorsVisualization(ctx, codeIR) {
    // If no operators detected, fall back to generic view
    if (codeIR.operators.length === 0) {
        createBasicCodeFlow(ctx, codeIR);
        return;
    }
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Scale measurements based on canvas size
    const scale = Math.min(width, height) / 600;
    
    // Background for visualization
    ctx.fillStyle = '#f7fee7'; // Lime-50
    ctx.fillRect(width * 0.1, height * 0.15, width * 0.8, height * 0.7);
    
    // Title
    ctx.font = `bold ${24 * scale}px Arial`;
    ctx.fillStyle = '#3f6212'; // Lime-800
    ctx.textAlign = 'center';
    ctx.fillText('Operator Expressions', width / 2, height * 0.2);
    
    // Find numeric variables
    const numberVars = codeIR.variables.filter(v => 
        v.type === 'number' || 
        (!isNaN(parseFloat(v.value)) && isFinite(v.value))
    );
    
    // Use 10 and 5 as default values if no number variables are found
    let a = 10, b = 5;
    
    if (numberVars.length >= 2) {
        a = parseFloat(numberVars[0].value);
        b = parseFloat(numberVars[1].value);
    } else if (numberVars.length === 1) {
        a = parseFloat(numberVars[0].value);
    }
    
    // Show basic operators
    const operators = [
        { symbol: '+', name: 'Addition', result: a + b, color: '#84cc16' },
        { symbol: '-', name: 'Subtraction', result: a - b, color: '#f59e0b' },
        { symbol: '*', name: 'Multiplication', result: a * b, color: '#ef4444' },
        { symbol: '/', name: 'Division', result: a / b, color: '#3b82f6' }
    ];
    
    // Values display
    ctx.font = `bold ${18 * scale}px Arial`;
    ctx.fillStyle = '#3f6212'; // Lime-800
    ctx.textAlign = 'center';
    ctx.fillText(`Values: a = ${a}, b = ${b}`, width / 2, height * 0.25);
    
    // Draw operator boxes in a grid
    const boxWidth = 200 * scale;
    const boxHeight = 80 * scale;
    const startX = width * 0.15;
    const startY = height * 0.3;
    const gapX = 50 * scale;
    const gapY = 30 * scale;
    
    for (let i = 0; i < operators.length; i++) {
        const row = Math.floor(i / 2);
        const col = i % 2;
        
        const x = startX + col * (boxWidth + gapX);
        const y = startY + row * (boxHeight + gapY);
        
        // Box background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(x, y, boxWidth, boxHeight);
        
        // Box border
        ctx.strokeStyle = operators[i].color;
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, boxWidth, boxHeight);
        
        // Operator info
        ctx.font = `bold ${24 * scale}px Arial`;
        ctx.fillStyle = operators[i].color;
        ctx.textAlign = 'center';
        ctx.fillText(operators[i].symbol, x + 30 * scale, y + boxHeight/2 + 10 * scale);
        
        // Operator name
        ctx.font = `${14 * scale}px Arial`;
        ctx.fillText(operators[i].name, x + 30 * scale, y + boxHeight - 15 * scale);
        
        // Expression
        ctx.font = `${18 * scale}px monospace`;
        ctx.fillStyle = '#334155'; // Slate-700
        ctx.textAlign = 'right';
        ctx.fillText(`${a} ${operators[i].symbol} ${b} = ${operators[i].result}`, x + boxWidth - 15 * scale, y + boxHeight/2 + 10 * scale);
    }
    
    // Explanation
    ctx.font = `${16 * scale}px Arial`;
    ctx.fillStyle = '#3f6212'; // Lime-800
    ctx.textAlign = 'center';
    ctx.fillText('Operators perform calculations on values', width / 2, height * 0.7);
    ctx.fillText('to produce new results', width / 2, height * 0.7 + 25 * scale);
}

// Create a basic code flow visualization
function createBasicCodeFlow(ctx, codeIR) {
    console.log('Creating basic code flow visualization');
    
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Scale measurements based on canvas size
    const scale = Math.min(width, height) / 600;
    
    // Background for visualization
    ctx.fillStyle = '#f1f5f9'; // Slate-100
    ctx.fillRect(width * 0.1, height * 0.15, width * 0.8, height * 0.7);
    
    // Title
    ctx.font = `bold ${24 * scale}px Arial`;
    ctx.fillStyle = '#334155'; // Slate-700
    ctx.textAlign = 'center';
    ctx.fillText('Code Execution Flow', width / 2, height * 0.2);
    
    // Draw program flow
    const centerX = width / 2;
    const centerY = height * 0.45;
    const boxWidth = 120 * scale;
    const boxHeight = 50 * scale;
    const arrowLength = 80 * scale;
    
    // Start box
    ctx.fillStyle = '#bfdbfe'; // Blue-200
    ctx.fillRect(centerX - arrowLength - boxWidth, centerY - boxHeight/2, boxWidth, boxHeight);
    
    ctx.strokeStyle = '#3b82f6'; // Blue-500
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - arrowLength - boxWidth, centerY - boxHeight/2, boxWidth, boxHeight);
    
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.fillStyle = '#1d4ed8'; // Blue-700
    ctx.textAlign = 'center';
    ctx.fillText('Start', centerX - arrowLength - boxWidth/2, centerY + 5 * scale);
    
    // Process box
    ctx.fillStyle = '#e2e8f0'; // Slate-200
    ctx.fillRect(centerX - boxWidth/2, centerY - boxHeight/2, boxWidth, boxHeight);
    
    ctx.strokeStyle = '#64748b'; // Slate-500
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX - boxWidth/2, centerY - boxHeight/2, boxWidth, boxHeight);
    
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.fillStyle = '#334155'; // Slate-700
    ctx.textAlign = 'center';
    ctx.fillText('Process', centerX, centerY + 5 * scale);
    
    // End box
    ctx.fillStyle = '#bbf7d0'; // Green-200
    ctx.fillRect(centerX + arrowLength, centerY - boxHeight/2, boxWidth, boxHeight);
    
    ctx.strokeStyle = '#22c55e'; // Green-500
    ctx.lineWidth = 2;
    ctx.strokeRect(centerX + arrowLength, centerY - boxHeight/2, boxWidth, boxHeight);
    
    ctx.font = `bold ${16 * scale}px Arial`;
    ctx.fillStyle = '#15803d'; // Green-700
    ctx.textAlign = 'center';
    ctx.fillText('End', centerX + arrowLength + boxWidth/2, centerY + 5 * scale);
    
    // Arrows
    drawArrow(ctx, centerX - arrowLength, centerY, centerX - boxWidth/2, centerY, '#3b82f6', 2);
    drawArrow(ctx, centerX + boxWidth/2, centerY, centerX + arrowLength, centerY, '#22c55e', 2);
    
    // Flow explanation
    ctx.font = `${16 * scale}px Arial`;
    ctx.fillStyle = '#334155'; // Slate-700
    ctx.textAlign = 'center';
    ctx.fillText('Program executes instructions in sequence', centerX, height * 0.65);
    ctx.fillText('from start to end', centerX, height * 0.65 + 25 * scale);
}

// Helper function to draw arrows
function drawArrow(ctx, fromX, fromY, toX, toY, color = '#000000', width = 2) {
    const headLength = 10;
    const angle = Math.atan2(toY - fromY, toX - fromX);
    
    // Draw the line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    
    // Draw the arrow head
    drawArrowHead(ctx, toX, toY, color, angle);
}

// Helper function to draw curved arrows
function drawCurvedArrow(ctx, fromX, fromY, toX, toY, color = '#000000', width = 2) {
    const headLength = 10;
    
    // Calculate control points for curve
    const dx = toX - fromX;
    const dy = toY - fromY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // Perpendicular offset for control point
    const perpX = -dy * 0.5;
    const perpY = dx * 0.5;
    
    // Draw the curved line
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.quadraticCurveTo(
        fromX + dx/2 + perpX, 
        fromY + dy/2 + perpY, 
        toX, toY
    );
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
    
    // Calculate angle at the end point for arrow head
    const endAngle = Math.atan2(
        toY - (fromY + dy/2 + perpY), 
        toX - (fromX + dx/2 + perpX)
    );
    
    // Draw the arrow head
    drawArrowHead(ctx, toX, toY, color, endAngle);
}

// Helper function to draw just the arrow head
function drawArrowHead(ctx, x, y, color = '#000000', angle = 0) {
    const headLength = 10;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
        x - headLength * Math.cos(angle - Math.PI/6),
        y - headLength * Math.sin(angle - Math.PI/6)
    );
    ctx.lineTo(
        x - headLength * Math.cos(angle + Math.PI/6),
        y - headLength * Math.sin(angle + Math.PI/6)
    );
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
}

// Generate AI Artist's Commentary
async function generateCommentary(code, codeIR, canvasImage) {
    console.log(`Generating commentary for ${codeIR.mainTopic}`);
    
    try {
        // Construct a prompt based on the code IR and visualization
        const prompt = `You are a friendly coding instructor for children. Create an engaging commentary about this Python code that demonstrates "${codeIR.mainTopic}" concepts.
        
        The code shows:
        - ${codeIR.variables.length} variables
        - ${codeIR.loops.length} loops
        - ${codeIR.conditionals.length} conditionals
        - ${codeIR.functions.length} functions
        - ${codeIR.stringOps.length} string operations
        
        Your explanation should be educational and accessible for young learners aged 10-14. 
        Use simple language but don't avoid proper programming terminology.
        
        Code:
        ${code}
        
        A visualization of this code has been created showing the key "${codeIR.mainTopic}" concepts in action.
        
        Your commentary should be 3-5 sentences long, positive, encouraging, and focused on helping children understand the code concepts.
        Focus specifically on the "${codeIR.mainTopic}" concepts shown in the code and visualization.
        
        This will appear in the "AI Artist's Commentary" section of an educational code visualization tool.`;
        
        console.log(`Sending request to Gemini model: ${WORKING_MODEL}`);
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${WORKING_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error ? errorData.error.message : `API request failed with status ${response.status}`;
            console.log(`API error: ${errorMessage}`);
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(`Received response from Gemini`);
        
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            const commentary = data.candidates[0].content.parts[0].text;
            console.log(`Commentary generated: ${commentary.substring(0, 50)}...`);
            return commentary;
        } else {
            console.log(`Unexpected API response format: ${JSON.stringify(data).substring(0, 100)}...`);
            throw new Error('Unexpected API response format');
        }
    } catch (error) {
        console.error('Error generating commentary:', error);
        throw error;
    }
}

// Generate "What the AI Sees" commentary
async function generateVisualPerception(code, codeIR, canvasImage) {
    console.log(`Generating visual perception for ${codeIR.mainTopic}`);
    
    try {
        // Construct a prompt based on the code IR and visualization
        const prompt = `You are an AI that can describe and interpret code visualizations for children.
        
        Describe what you "see" in the visualization that was created for this Python code that demonstrates "${codeIR.mainTopic}" concepts.
        
        The visualization shows:
        - A title at the top: "${codeIR.mainTopic} Visualization"
        - A central diagram showing the main coding concepts
        
        Code:
        ${code}
        
        Your description should explain what visual elements represent in terms of code execution. Be specific about colors, shapes, and text in the visualization and how they connect to programming concepts.
        
        Keep your explanation to 3-5 sentences using child-friendly language (for ages 10-14).
        This will appear in the "What the AI Sees" section of an educational code visualization tool.`;
        
        console.log(`Sending visual perception request to Gemini model: ${WORKING_MODEL}`);
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${WORKING_MODEL}:generateContent?key=${GEMINI_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }]
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            const errorMessage = errorData.error ? errorData.error.message : `API request failed with status ${response.status}`;
            console.log(`API error: ${errorMessage}`);
            throw new Error(errorMessage);
        }

        const data = await response.json();
        console.log(`Received visual perception response from Gemini`);
        
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            const perception = data.candidates[0].content.parts[0].text;
            console.log(`Visual perception generated: ${perception.substring(0, 50)}...`);
            return perception;
        } else {
            console.log(`Unexpected API response format: ${JSON.stringify(data).substring(0, 100)}...`);
            throw new Error('Unexpected API response format');
        }
    } catch (error) {
        console.error('Error generating visual perception:', error);
        throw error;
    }
}

// Clear canvas function
function clearCanvas() {
    const gameCanvas = document.getElementById('gameCanvas');
    if (!gameCanvas) {
        console.error('Canvas element not found');
        return;
    }
    
    const ctx = gameCanvas.getContext('2d');
    
    // Reset transformation matrix first
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    
    // Clear the entire canvas
    ctx.clearRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Fill with white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    // Reset any UI elements
    const aiDescription = document.getElementById('aiDescription');
    const aiInterpretation = document.getElementById('aiInterpretation');
    
    if (aiDescription) aiDescription.classList.add('hidden');
    if (aiInterpretation) aiInterpretation.classList.add('hidden');
}

// Update Gemini API key
function updateGeminiKey() {
    const apiKeyInput = document.getElementById('apiKeyInput');
    if (apiKeyInput) {
        GEMINI_API_KEY = apiKeyInput.value.trim();
        
        if (!GEMINI_API_KEY) {
            showApiStatus('API key cannot be empty', 'error');
            return;
        }
        
        showApiStatus('API key updated, testing connectivity...', 'info');
        console.log(`API key updated to: ${GEMINI_API_KEY.substring(0, 5)}...`);
        
        // Try to find a working model with the new key
        findWorkingGeminiModel();
    }
}

// Hide AI Artist Game function
function hideAIArtistGame() {
    const container = document.getElementById('ai-artist-game-container');
    if (container) {
        container.style.display = 'none';
        container.innerHTML = '';
    }
}

// Hide debugging detective game if it exists
function hideDebuggingDetective() {
    const container = document.getElementById('debugging-detective-container');
    if (container) {
        container.style.display = 'none';
    }
}

// Navigation handler for sidebar
document.addEventListener('DOMContentLoaded', function () {
    // Sidebar navigation
    document.querySelectorAll('.nav-item[data-page]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            // Remove active from all nav items
            document.querySelectorAll('.nav-item').forEach(function (item) {
                item.classList.remove('active');
            });
            btn.classList.add('active');

            // Hide all pages
            document.querySelectorAll('.page').forEach(function (page) {
                page.classList.remove('active');
            });

            // Show the selected page
            const pageId = btn.getAttribute('data-page');
            const pageDiv = document.getElementById(pageId);
            if (pageDiv) {
                pageDiv.classList.add('active');
            }

            // Special case: AI Artist
            if (pageId === 'ai-artist') {
                loadAIArtistGame();
            }
        });
    });
});

// Expose necessary functions to global scope
window.loadAIArtistGame = loadAIArtistGame;
window.hideAIArtistGame = hideAIArtistGame;
window.visualizeSimpleCode = visualizeSimpleCode;
window.clearCanvas = clearCanvas;
window.updateGeminiKey = updateGeminiKey;