document.addEventListener('DOMContentLoaded', () => {
    const startQuizBtn = document.getElementById('start-quiz-btn');
    const quizStartSection = document.getElementById('quiz-start');
    const quizContainer = document.getElementById('quiz-container');
    const questionText = document.getElementById('question-text');
    const answerButtons = document.querySelectorAll('.answer-btn');
    const questionContainer = document.getElementById('question-container');
    const timerElement = document.createElement('div');
    timerElement.id = 'question-timer';
    timerElement.className = 'timer';

    let currentQuestionIndex = 0;
    let streak = 0;
    let longestStreak = 0;
    let quizQuestions = [];
    let timer;
    let timeLeft = 30;
    let isLoadingQuestion = false;
    const QUESTION_TIME_LIMIT = 30; // 30 seconds per question
    
    // Expose best score for database access
    window.pythonQuizBestScore = 0;
    
    // Initialize question history in localStorage for persistence
    if (!localStorage.getItem('questionHistory')) {
        const topics = ["Variables", "Loops", "Conditionals", "String Manipulation", "Functions", "Operators"];
        const initialHistory = {};
        topics.forEach(topic => initialHistory[topic] = []);
        localStorage.setItem('questionHistory', JSON.stringify(initialHistory));
    }

    // Add timer to question container if it doesn't exist
    if (!document.getElementById('question-timer')) {
        timerElement.innerHTML = `<span>${QUESTION_TIME_LIMIT}</span> seconds left`;
        if (questionContainer) {
            questionContainer.insertBefore(timerElement, questionContainer.firstChild);
        }
    }

    // Start timer for question
    function startQuestionTimer() {
        // Reset timer
        clearInterval(timer);
        timeLeft = QUESTION_TIME_LIMIT;
        timerElement.innerHTML = `<span>${timeLeft}</span> seconds left`;
        timerElement.className = 'timer';

        // Start countdown
        timer = setInterval(() => {
            timeLeft--;
            timerElement.innerHTML = `<span>${timeLeft}</span> seconds left`;
            
            // Add warning class when time is running low
            if (timeLeft <= 10) {
                timerElement.className = 'timer warning';
            }
            
            if (timeLeft <= 5) {
                timerElement.className = 'timer danger';
            }
            
            if (timeLeft <= 0) {
                clearInterval(timer);
                handleTimeUp();
            }
        }, 1000);
    }

    // Handle when time runs out
    function handleTimeUp() {
        clearInterval(timer);
        
        // Find the correct answer button
        const currentQuestion = quizQuestions[currentQuestionIndex - 1];
        if (!currentQuestion) return;
        
        const correctAnswerText = currentQuestion.options[currentQuestion.correctIndex];
        
        // Mark all buttons as disabled and highlight the correct one
        answerButtons.forEach(btn => {
            btn.disabled = true;
            if (btn.textContent === correctAnswerText) {
                btn.classList.add('correct');
            }
        });
        
        showFeedback(false, correctAnswerText, "Time's up! You ran out of time.");
    }

    // Function to generate a question on a specific Python topic
    async function generateQuestion(topic) {
        try {
            console.log(`Generating question for topic: ${topic}`);
            
            // Get question history from localStorage
            const questionHistory = JSON.parse(localStorage.getItem('questionHistory'));
            
            // Add existing questions as context for the AI
            const existingQuestions = questionHistory[topic]
                .slice(-5) // Only use the last 5 questions for context
                .map(item => item.question)
                .join('\n\n');
            
            // No loading indicator shown to user
            isLoadingQuestion = true;
            
            const response = await fetch('http://localhost:11434/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    "model": "mcqmodel",
                    "messages": [
                        {
                            "role": "system",
                            "content": `You are an AI tutor that creates Python programming questions to teach concepts to children aged 10 to 13.

Your questions should be clear, engaging, and age-appropriate with 100% valid Python syntax. 

VERY IMPORTANT GUIDELINES:
1. ONLY generate the question text AND the correct answer, in JSON format.
2. Only create questions that can be programmatically verified:
   - Questions about output of expressions (print statements)
   - Questions about string operations (len(), indexing, slicing, etc.)
   - Questions about variable assignments and their final values
   - Questions about simple boolean expressions and comparisons
   - Questions about basic math operations in Python
3. NEVER create story problems about real-world scenarios like "A student scored 85 in math..."
4. ONLY create pure code questions that test specific Python syntax and behavior
5. DO NOT CREATE questions about Python syntax rules, best practices, or other topics that can't be automatically verified.
6. NEVER reference students, scores, people, or real-world scenarios in your questions
7. ALWAYS show the FULL code being asked about

SYNTAX RULES:
1. All code MUST be valid Python syntax that would run without errors
2. Function definitions must include proper indentation and colons
3. Loop statements must include proper indentation and colons
4. If statements must include proper indentation and colons
5. NEVER use 'end' keyword (that's Ruby, not Python)
6. EVERY code block MUST be properly terminated
7. ALL parentheses, brackets, and quotes must be properly matched and closed
8. If a function is called, ALWAYS provide the argument values

ANSWER FORMAT RULES: 
1. For string concatenation like print('egg'[0] + 'egg'[1]), the answer is "ee" (not "eggeg")
2. For string methods like 'banana'.replace('a', ''), the answer is "bnn"
3. For loop outputs, separate them with commas (e.g., "0, 1, 4, 9, 16, 25" for a loop printing squares)
4. For conditional loops, include ALL outputs that would print (e.g., "Yes, Yes" if it prints twice)
5. If nothing is printed, the answer is "None"

FORMAT YOUR RESPONSE AS JSON:
{
  "question": "Your question text here",
  "correctAnswer": "The exact correct answer value"
}

EXAMPLE RESPONSES:
{"question": "What is the output of: print(len('hello'))?", "correctAnswer": "5"}
{"question": "What does x equal after: x = 5; x += 3?", "correctAnswer": "8"}
{"question": "What will print(2 * 'abc') display?", "correctAnswer": "abcabc"}
{"question": "What is the value of x % y if x = 10 and y = 3?", "correctAnswer": "1"}
{"question": "What is the result of 'Python'[2]?", "correctAnswer": "t"}
{"question": "What will the following code print? for i in range(3): print(i * 2)", "correctAnswer": "0, 2, 4"}
{"question": "What will print('is' + 'a' * 3) display?", "correctAnswer": "isaaa"}
{"question": "What will the following code print? for i in range(3): if i == 2: print('Yes')", "correctAnswer": "Yes"}
{"question": "What will the following code print? for i in range(6): if i % 2 == 0: print(i ** 2)", "correctAnswer": "0, 4, 16"}
{"question": "What will print('egg'[0] + 'egg'[1]) display?", "correctAnswer": "ee"}
{"question": "What will the following code print? for i in range(4): if i == 0 or i == 3: print('Yes')", "correctAnswer": "Yes, Yes"}
{"question": "What will result = 'banana'.replace('a', '') return?", "correctAnswer": "bnn"}
{"question": "What will the following code print? for i in range(6): print(i ** 2)", "correctAnswer": "0, 1, 4, 9, 16, 25"}`
                        },
                        {
                            "role": "user",
                            "content": `Generate a Python question for kids about ${topic}. 
                            
PREVIOUSLY GENERATED QUESTIONS (DO NOT REPEAT THESE):
${existingQuestions}

CREATE A COMPLETELY DIFFERENT QUESTION with different content and different code examples (if applicable). Make sure the question tests a different aspect of ${topic} than the previous questions.

DO NOT create story problems or word problems about real-world scenarios. Create ONLY pure code questions.

RETURN ONLY THE JSON OBJECT with the question and correctAnswer as shown in the system prompt.

IMPORTANT RULES:
1. For questions about output, the correct answer should be EXACTLY what Python would display (without quotes unless they are part of the output)
2. For boolean expressions, use "True" or "False" (with capital first letter)
3. For IndexError or other errors, use the error name like "IndexError" 
4. For string indexing, the answer should be the single character (without quotes)
5. For numeric values, just provide the number without quotes
6. Make sure your answer is 100% accurate according to Python's behavior
7. For multiple outputs (like in a loop), use comma-separated values like "0, 2, 4" 
8. If code prints "Yes" exactly once, the answer is "Yes" (not "None")
9. For string concatenation like print('egg'[0] + 'egg'[1]), the answer is "ee" (not "eggeg")
10. For string methods like 'banana'.replace('a', ''), the answer is "bnn"
11. ALWAYS include the FULL code in your question - don't leave any parts out

REMEMBER: Use only standard, valid Python syntax!`
                        }
                    ],
                    "stream": false
                })
            });
    
            // Reset loading state
            isLoadingQuestion = false;
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const data = await response.json();
            let responseContent = data.message?.content || "";
            
            // Extract JSON from the response
            let jsonMatch = responseContent.match(/\{.*\}/s);
            if (!jsonMatch) {
                throw new Error("No valid JSON found in response");
            }
            
            let questionData;
            try {
                questionData = JSON.parse(jsonMatch[0]);
            } catch (e) {
                console.error("Error parsing JSON:", e);
                throw new Error("Invalid JSON format in response");
            }
            
            // Validate required fields
            if (!questionData.question || !questionData.correctAnswer) {
                throw new Error("Missing required fields in question data");
            }
            
            // Clean up the question text
            questionData.question = questionData.question
                .replace(/^['"]|['"]$/g, '') // Remove surrounding quotes if present
                .replace(/^Here's a question:|^Question:|^Here is a question:/i, '') // Remove prefixes
                .trim();
            
            // Validate question syntax and content
            if (questionData.question.includes(" end") || 
                questionData.question.includes("end(") || 
                !hasValidPythonSyntax(questionData.question) || 
                !hasCompleteQuestion(questionData.question)) {
                console.log("Rejecting question with invalid or incomplete Python syntax");
                return null;
            }
            
            // Create hash for the question to check uniqueness
            const questionHash = createQuestionHash(questionData.question);
            
            // Check if this question is unique enough
            const isDuplicate = questionHistory[topic].some(item => 
                createQuestionHash(item.question) === questionHash
            );
            
            // Filter out questions containing story problem keywords
            const storyProblemKeywords = ['student', 'scored', 'test', 'apple', 'grade', 'train', 'purchase', 'bought'];
            const containsStoryProblem = storyProblemKeywords.some(keyword => 
                questionData.question.toLowerCase().includes(keyword)
            );
            
            if (containsStoryProblem) {
                console.log("Detected story problem, rejecting question");
                return null;
            }
            
            if (!isDuplicate) {
                // Store the question in history
                questionHistory[topic].push({
                    question: questionData.question,
                    timestamp: Date.now()
                });
                
                // Keep history size manageable
                if (questionHistory[topic].length > 50) {
                    questionHistory[topic].shift();
                }
                
                // Update localStorage
                localStorage.setItem('questionHistory', JSON.stringify(questionHistory));
                
                console.log(`Generated unique question about: ${topic}`);
                return questionData;
            } else {
                console.log("Duplicate question detected");
                return null;
            }
        } catch (error) {
            console.error("Error generating question:", error);
            
            // Reset loading state on error
            isLoadingQuestion = false;
            
            return null;
        }
    }
    
    // Function to check if a question is complete with code
    function hasCompleteQuestion(question) {
        // Check if the question asks about code but doesn't show the code
        if (question.includes("following code") && 
            !question.includes("print(") && 
            !question.includes(" = ") && 
            !question.includes("if ") && 
            !question.includes("for ")) {
            return false;
        }
        
        // Check if it's a function question without function definition
        if ((question.includes("function") || question.includes("def ")) && 
            !question.match(/def\s+\w+\s*\([^)]*\):/)) {
            return false;
        }
        
        return true;
    }
    
    // Function to check if a question has valid Python syntax
    function hasValidPythonSyntax(question) {
        // Extract code snippets from question
        const codeSnippets = extractCodeSnippets(question);
        
        // No code snippets found
        if (codeSnippets.length === 0) return true;
        
        for (const snippet of codeSnippets) {
            // Check for balanced brackets and quotes
            if (!hasBalancedDelimiters(snippet)) return false;
            
            // Check for invalid keywords or syntax patterns
            const invalidPatterns = [
                /\bend\b(?!\s*=)/,         // 'end' keyword (not part of Python)
                /\bdef\s+\w+\s*[^():]/,    // invalid function definition
                /\bfor\s+\w+\s+in\s+[^:]+$/, // for loop without colon
                /\bif\s+[^:]+$/,           // if statement without colon
                /\bwhile\s+[^:]+$/,        // while loop without colon
                /\b\w+\s*=\s*$/           // assignment without value
            ];
            
            for (const pattern of invalidPatterns) {
                if (pattern.test(snippet)) return false;
            }
        }
        
        return true;
    }
    
    // Helper to extract code snippets from a question
    function extractCodeSnippets(question) {
        const snippets = [];
        
        // Look for code in backticks
        const backtickMatches = question.match(/`([^`]+)`/g);
        if (backtickMatches) {
            snippets.push(...backtickMatches.map(m => m.replace(/`/g, '')));
        }
        
        // Look for code after "print(" or similar patterns
        const printMatches = question.match(/print\(([^)]+)\)/g);
        if (printMatches) {
            snippets.push(...printMatches);
        }
        
        // Look for code after code patterns
        const codePatterns = [
            /for\s+\w+\s+in\s+[^:]+:/g,
            /if\s+[^:]+:/g,
            /def\s+\w+\([^)]*\):/g,
            /\w+\s*=\s*[^;]+/g
        ];
        
        for (const pattern of codePatterns) {
            const matches = question.match(pattern);
            if (matches) {
                snippets.push(...matches);
            }
        }
        
        return snippets;
    }
    
    // Helper to check if delimiters are balanced
    function hasBalancedDelimiters(snippet) {
        const stack = [];
        const pairs = {
            '(': ')',
            '[': ']',
            '{': '}',
            "'": "'",
            '"': '"'
        };
        
        let inSingleQuote = false;
        let inDoubleQuote = false;
        
        for (let i = 0; i < snippet.length; i++) {
            const char = snippet[i];
            
            // Handle quotes differently
            if (char === "'" && !inDoubleQuote) {
                inSingleQuote = !inSingleQuote;
                continue;
            }
            
            if (char === '"' && !inSingleQuote) {
                inDoubleQuote = !inDoubleQuote;
                continue;
            }
            
            // Skip characters in quotes
            if (inSingleQuote || inDoubleQuote) continue;
            
            // Handle brackets
            if (char in pairs) {
                stack.push(char);
            } else if (Object.values(pairs).includes(char)) {
                const expected = pairs[stack.pop()];
                if (char !== expected) return false;
            }
        }
        
        // Check if we have unmatched brackets or quotes
        return stack.length === 0 && !inSingleQuote && !inDoubleQuote;
    }

    // Function to create hash for question to better track uniqueness
    function createQuestionHash(question) {
        // Simple hash function based on question text
        return question.trim().toLowerCase().replace(/\s+/g, '');
    }

    // Function to verify Python execution
    function verifyPythonExecution(questionData) {
        const { question, correctAnswer } = questionData;
        let verifiedAnswer = correctAnswer;
        
        try {
            // Check for string indexing with concatenation: print('egg'[0] + 'egg'[1])
            if (question.includes("print(") && question.includes("[") && question.includes("+") && question.includes("]")) {
                const indexConcatMatch = question.match(/print\s*\(\s*['"]([^'"]+)['"]\s*\[\s*(\d+)\s*\]\s*\+\s*['"]([^'"]+)['"]\s*\[\s*(\d+)\s*\]\s*\)/);
                if (indexConcatMatch) {
                    const [_, str1, idx1, str2, idx2] = indexConcatMatch;
                    const index1 = parseInt(idx1);
                    const index2 = parseInt(idx2);
                    
                    if (index1 < str1.length && index2 < str2.length) {
                        verifiedAnswer = str1[index1] + str2[index2];
                        return verifiedAnswer;
                    }
                }
            }
            
            // Check for string replace method: 'banana'.replace('a', '')
            if (question.includes(".replace(") && question.includes("return")) {
                const replaceMatch = question.match(/['"]([^'"]+)['"]\s*\.\s*replace\s*\(\s*['"]([^'"]+)['"]\s*,\s*['"]([^'"]*)['"]\s*\)/);
                if (replaceMatch) {
                    const [_, str, target, replacement] = replaceMatch;
                    verifiedAnswer = str.replace(new RegExp(target, 'g'), replacement);
                    return verifiedAnswer;
                }
            }
            
            // String concatenation with string repetition: print('is' + 'a' * 3)
            if (question.includes("print(") && question.includes("'") && question.includes("+") && question.includes("*")) {
                const stringConcatRepeatMatch = question.match(/print\s*\(\s*['"]([^'"]+)['"]\s*\+\s*['"]([^'"]+)['"]\s*\*\s*(\d+)\s*\)/);
                if (stringConcatRepeatMatch) {
                    const [_, str1, str2, times] = stringConcatRepeatMatch;
                    verifiedAnswer = str1 + str2.repeat(parseInt(times));
                    return verifiedAnswer;
                }
            }
            
            // For loops with conditional statements that print multiple outputs
            const conditionalLoopMatch = question.match(/for\s+(\w+)\s+in\s+range\((\d+)\):\s*if\s+([^:]+):/);
            if (conditionalLoopMatch) {
                const [_, varName, rangeEnd, condition] = conditionalLoopMatch;
                const rangeLimit = parseInt(rangeEnd);
                
                // Check for print statement inside the conditional
                const printMatch = question.match(/if\s+[^:]+:\s*print\(([^)]+)\)/);
                if (printMatch) {
                    const printExpression = printMatch[1];
                    
                    // Execute the loop with conditional
                    let outputs = [];
                    for (let i = 0; i < rangeLimit; i++) {
                        // Replace loop variable in condition
                        let currentCondition = condition.replace(new RegExp(`\\b${varName}\\b`, 'g'), i);
                        
                        // Handle specific conditions (or, and, ==, %, etc.)
                        currentCondition = currentCondition
                            .replace(/\s+or\s+/g, " || ")
                            .replace(/\s+and\s+/g, " && ")
                            .replace(/==/g, "===")
                            .replace(/!=/g, "!==");
                        
                        // Evaluate the condition
                        try {
                            if (eval(currentCondition)) {
                                // If condition is true, evaluate the print expression
                                let currentPrintExpr = printExpression.replace(new RegExp(`\\b${varName}\\b`, 'g'), i);
                                
                                // Handle string literals
                                if (currentPrintExpr.includes("'") || currentPrintExpr.includes('"')) {
                                    // Just use the literal value
                                    const stringMatch = currentPrintExpr.match(/['"]([^'"]+)['"]/);
                                    if (stringMatch) {
                                        outputs.push(stringMatch[1]);
                                    }
                                } else {
                                    // It's an expression to evaluate
                                    currentPrintExpr = currentPrintExpr
                                        .replace(/\*\*/g, "Math.pow")
                                        .replace(/\/\//g, "Math.floor");
                                    
                                    outputs.push(eval(currentPrintExpr));
                                }
                            }
                        } catch (e) {
                            console.error("Error evaluating conditional in loop:", e);
                        }
                    }
                    
                    if (outputs.length === 0) {
                        verifiedAnswer = "None";
                    } else if (outputs.length === 1 && typeof outputs[0] === 'string') {
                        // If there's just one string output, return it directly
                        verifiedAnswer = outputs[0];
                    } else {
                        // Join multiple outputs with commas
                        verifiedAnswer = outputs.join(", ");
                    }
                    
                    console.log("Conditional loop verified:", verifiedAnswer);
                    return verifiedAnswer;
                }
            }
            
            // Simple loops that print each iteration
            if (question.includes("for") && question.includes("range") && question.includes("print(") && 
                !question.includes("if ")) {
                const loopRangeMatch = question.match(/for\s+(\w+)\s+in\s+range\((\d+)\):\s+print\((.+?)\)/);
                if (loopRangeMatch) {
                    const [_, varName, rangeEnd, printExpr] = loopRangeMatch;
                    const rangeLimit = parseInt(rangeEnd);
                    
                    // Execute the loop
                    let outputs = [];
                    for (let i = 0; i < rangeLimit; i++) {
                        // Replace the loop variable with current value
                        let expr = printExpr.replace(new RegExp(`\\b${varName}\\b`, 'g'), i);
                        
                        try {
                            // Evaluate the expression
                            expr = expr.replace(/\*\*/g, "Math.pow").replace(/\/\//g, "Math.floor");
                            outputs.push(eval(expr));
                        } catch (e) {
                            console.error("Error evaluating loop print expression:", e);
                        }
                    }
                    
                    if (outputs.length > 0) {
                        verifiedAnswer = outputs.join(", ");
                    }
                    
                    console.log("Loop output verified:", verifiedAnswer);
                    return verifiedAnswer;
                }
            }
            
            // Handle function with string indexing: def z(s): return s[1]
            const functionDefinitionMatch = question.match(/def\s+(\w+)\s*\((\w+)\):\s*return\s+\2\[(\d+)\]/);
            if (functionDefinitionMatch) {
                const [_, funcName, paramName, indexStr] = functionDefinitionMatch;
                const index = parseInt(indexStr);
                
                // Look for function call
                const functionCallMatch = question.match(new RegExp(`${funcName}\\s*\\(['"]([^'"]+)['"]\\)`, 'i'));
                if (functionCallMatch) {
                    const argValue = functionCallMatch[1];
                    if (index >= 0 && index < argValue.length) {
                        verifiedAnswer = argValue[index];
                    } else {
                        verifiedAnswer = "IndexError";
                    }
                    
                    console.log("Function with string indexing verified:", verifiedAnswer);
                    return verifiedAnswer;
                }
            }
            
            // Extract Python code and evaluate in JavaScript context
            
            // Create a map to track variables and their values
            const variables = {};
            
            // 1. Check for variable assignments and track them
            const assignmentPattern = /(\w+)\s*=\s*([^;=\n]+)/g;
            const assignments = Array.from(question.matchAll(assignmentPattern));
            
            // Process each assignment in sequence
            if (assignments.length > 0) {
                assignments.forEach(assignment => {
                    const varName = assignment[1].trim();
                    let expression = assignment[2].trim();
                    
                    // Replace any referenced variables with their current values
                    Object.keys(variables).forEach(key => {
                        const varRegex = new RegExp(`\\b${key}\\b`, 'g');
                        expression = expression.replace(varRegex, variables[key]);
                    });
                    
                    // Handle different types of expressions
                    if (expression.includes('"') || expression.includes("'")) {
                        // String assignment
                        const stringMatch = expression.match(/["']([^"']*)["']/);
                        if (stringMatch) variables[varName] = stringMatch[1];
                        
                        // Handle string indexing: p = 'banana'[2]
                        const indexMatch = expression.match(/["']([^"']*)["']\s*\[\s*(-?\d+)\s*\]/);
                        if (indexMatch) {
                            const [_, str, indexStr] = indexMatch;
                            const index = parseInt(indexStr);
                            if (index >= 0 && index < str.length) {
                                variables[varName] = str[index];
                            } else if (index < 0 && Math.abs(index) <= str.length) {
                                variables[varName] = str[str.length + index];
                            } else {
                                variables[varName] = "IndexError";
                            }
                        }
                    } else if (expression === "True") {
                        variables[varName] = true;
                    } else if (expression === "False") {
                        variables[varName] = false;
                    } else if (expression.includes("len(")) {
                        // Handle len() function
                        const lenMatch = expression.match(/len\(["']([^"']*)["']\)/);
                        if (lenMatch) {
                            variables[varName] = lenMatch[1].length;
                        }
                    } else if (expression.match(/^\d+$/)) {
                        // Simple numeric assignment
                        variables[varName] = parseInt(expression);
                    } else {
                        // Mathematical expression
                        try {
                            // Handle Python operators
                            let jsExpression = expression
                                .replace(/(\d+)\s*\*\*\s*(\d+)/g, (_, base, exp) => `Math.pow(${base}, ${exp})`)
                                .replace(/\/\//g, "/")  // Integer division
                                .replace(/(\w+)\s*\+=\s*(\d+)/g, (_, v, n) => {
                                    // Handle += operator
                                    if (variables[v] !== undefined) {
                                        return `${variables[v]} + ${n}`;
                                    }
                                    return expression;
                                })
                                .replace(/(\w+)\s*\*=\s*(\d+)/g, (_, v, n) => {
                                    // Handle *= operator
                                    if (variables[v] !== undefined) {
                                        return `${variables[v]} * ${n}`;
                                    }
                                    return expression;
                                })
                                .replace(/(\w+)\s*-=\s*(\d+)/g, (_, v, n) => {
                                    // Handle -= operator
                                    if (variables[v] !== undefined) {
                                        return `${variables[v]} - ${n}`;
                                    }
                                    return expression;
                                });
                            
                            // Replace variable references with their values
                            Object.keys(variables).forEach(key => {
                                const varRegex = new RegExp(`\\b${key}\\b`, 'g');
                                jsExpression = jsExpression.replace(varRegex, variables[key]);
                            });
                            
                            // Evaluate the expression
                            variables[varName] = eval(jsExpression);
                        } catch (e) {
                            console.error("Error evaluating expression:", e, expression);
                        }
                    }
                });
                
                // Find which variable the question is asking about
                const finalVarMatch = question.match(/what (?:is|does|will be|value of) (\w+) (?:equal|after|equals)/i) ||
                                      question.match(/what (?:is|does|will be) the (?:value|result) of (\w+)/i) ||
                                      question.match(/what is (\w+) (?:after|now)/i);
                
                if (finalVarMatch) {
                    const targetVar = finalVarMatch[1];
                    if (variables[targetVar] !== undefined) {
                        verifiedAnswer = variables[targetVar].toString();
                        // Handle boolean values properly
                        if (verifiedAnswer === "true") verifiedAnswer = "True";
                        if (verifiedAnswer === "false") verifiedAnswer = "False";
                    }
                }
            }
            
            // 2. Check for loop outputs
            const loopMatch = question.match(/(?:output of|result of):\s*for\s+(\w+)\s+in\s+range\((\d+)\):\s+print\((.+?)\)/i);
            if (loopMatch) {
                // Parse loop parameters
                const [_, varName, rangeEnd, printExpr] = loopMatch;
                const rangeValue = parseInt(rangeEnd);
                
                // Execute the loop and collect output
                let outputs = [];
                
                for (let i = 0; i < rangeValue; i++) {
                    // Replace loop variable in print expression
                    let currentExpr = printExpr.replace(new RegExp(`\\b${varName}\\b`, 'g'), i);
                    
                    // Evaluate the expression
                    try {
                        // Handle operators
                        currentExpr = currentExpr
                            .replace(/(\d+)\s*\*\*\s*(\d+)/g, (_, base, exp) => `Math.pow(${base}, ${exp})`)
                            .replace(/\/\//g, "/");
                        
                        outputs.push(eval(currentExpr));
                    } catch (e) {
                        console.error("Error evaluating loop expression:", e);
                        outputs.push("Error");
                    }
                }
                
                // Clean up and get the output format depending on the question
                if (question.includes("output of") || question.includes("result of")) {
                    verifiedAnswer = outputs.length > 1 ? outputs.join(", ") : outputs[0]?.toString() || "0";
                }
            }
            
            // 3. Check for print statements
            const printMatch = question.match(/print\((.*?)\)/);
            if (printMatch && !loopMatch) {
                const expression = printMatch[1];
                
                // Handle string operations
                if (expression.includes("'") || expression.includes('"')) {
                    // String operations
                    if (expression.includes("+")) {
                        // String concatenation
                        const concatMatch = expression.match(/["']([^"']*)["']\s*\+\s*["']([^"']*)["']/);
                        if (concatMatch) {
                            verifiedAnswer = concatMatch[1] + concatMatch[2];
                        }
                        
                        // String concatenation with repetition: 'is' + 'a' * 3
                        const concatRepeatMatch = expression.match(/["']([^"']*)["']\s*\+\s*["']([^"']*)["']\s*\*\s*(\d+)/);
                        if (concatRepeatMatch) {
                            const [_, str1, str2, times] = concatRepeatMatch;
                            verifiedAnswer = str1 + str2.repeat(parseInt(times));
                        }
                    } else if (expression.includes("*")) {
                        // String repetition
                        const repeatMatch = expression.match(/["']([^"']*)["']\s*\*\s*(\d+)/) || 
                                           expression.match(/(\d+)\s*\*\s*["']([^"']*)["']/);
                        if (repeatMatch) {
                            let str, times;
                            if (repeatMatch[2] && !isNaN(repeatMatch[2])) {
                                [_, str, times] = repeatMatch;
                            } else {
                                [_, times, str] = repeatMatch;
                            }
                            times = parseInt(times);
                            verifiedAnswer = str.repeat(times);
                        }
                    } else if (expression.includes("[")) {
                        // String indexing
                        const indexMatch = expression.match(/["']([^"']*)["']\s*\[\s*(-?\d+)\s*\]/);
                        if (indexMatch) {
                            const [_, str, indexStr] = indexMatch;
                            const index = parseInt(indexStr);
                            if (index >= 0 && index < str.length) {
                                verifiedAnswer = str[index];
                            } else if (index < 0 && Math.abs(index) <= str.length) {
                                verifiedAnswer = str[str.length + index];
                            } else {
                                verifiedAnswer = "IndexError";
                            }
                        }
                    }
                }
                // Handle numeric expressions
                else if (/[\d\+\-\*\/\%\(\)]/.test(expression)) {
                    // Replace Python-specific operators with JavaScript equivalents
                    let jsExpression = expression
                        .replace(/(\d+)\s*\*\*\s*(\d+)/g, (_, base, exponent) => 
                            `Math.pow(${base}, ${exponent})`)
                        .replace(/(\d+)\s*\/\/\s*(\d+)/g, (_, numerator, denominator) => 
                            `Math.floor(${numerator} / ${denominator})`)
                        .trim();
                    
                    // Replace variable references with their values
                    Object.keys(variables || {}).forEach(key => {
                        const varRegex = new RegExp(`\\b${key}\\b`, 'g');
                        jsExpression = jsExpression.replace(varRegex, variables[key]);
                    });
                    
                    try {
                        verifiedAnswer = eval(jsExpression).toString();
                    } catch (e) {
                        console.error("Error evaluating expression:", e);
                    }
                }
            }
            
            // 4. Check for function return values
            const functionDefinitionMatch2 = question.match(/def\s+(\w+)\s*\(([^)]*)\)\s*:\s*(.+?)\s*return\s+(.+?)(?:\s|$)/);
            if (functionDefinitionMatch2) {
                const [_, funcName, params, body, returnExpr] = functionDefinitionMatch2;
                
                // Check if there's a function call in the question
                const functionCallMatch = question.match(new RegExp(`${funcName}\\s*\\(([^)]*)\\)`, 'i'));
                if (functionCallMatch) {
                    const args = functionCallMatch[1].split(',').map(arg => arg.trim());
                    const paramNames = params.split(',').map(param => param.trim());
                    
                    // Create a function using Function constructor
                    try {
                        const functionBody = `
                            ${paramNames.map((param, i) => `const ${param} = ${args[i] || 'undefined'};`).join('\n')}
                            ${body.includes('return') ? '' : body}
                            return ${returnExpr};
                        `;
                        const func = new Function(functionBody);
                        verifiedAnswer = func().toString();
                    } catch (e) {
                        console.error("Error evaluating function:", e);
                    }
                }
            }
            
            console.log("Original answer:", correctAnswer);
            console.log("Verified answer:", verifiedAnswer);
            
            return verifiedAnswer;
        } catch (error) {
            console.error("Error in verification:", error);
            return correctAnswer; // Fall back to original answer if verification fails
        }
    }
    
    // Function to generate options for a question based on its correct answer
    function generateOptions(questionData) {
        const { question, correctAnswer } = questionData;
        const questionLower = question.toLowerCase();
        let options = [correctAnswer]; // Start with the correct answer
        
        // Handle string indexing with concatenation: print('egg'[0] + 'egg'[1])
        if (questionLower.includes("print(") && questionLower.includes("[") && 
            questionLower.includes("+") && questionLower.includes("]")) {
            if (correctAnswer.length === 2 && correctAnswer[0] === correctAnswer[1]) {
                // For cases like "ee"
                options.push("e");
                options.push(correctAnswer + correctAnswer); // "eeee"
                options.push("IndexError");
            } else {
                options.push(correctAnswer[0]);
                options.push(correctAnswer + correctAnswer);
                options.push("IndexError");
            }
            
            return {
                question: questionData.question,
                options: [...new Set(options)], // Remove any duplicates
                correctIndex: 0
            };
        }
        
        // Handle string replace method
        if (questionLower.includes(".replace(") && correctAnswer.length > 0) {
            // For string replace method
            const originalString = question.match(/['"]([^'"]+)['"]/)?.[1] || "";
            options.push(originalString); // Original string
            options.push(correctAnswer + "s"); // Common error: extra letter
            options.push("Error"); // Error as option
            
            return {
                question: questionData.question,
                options: [...new Set(options)], // Remove any duplicates
                correctIndex: 0
            };
        }
        
        // Special case handling for function questions with return values
        if (questionLower.includes("def") && questionLower.includes("return") && 
            (questionLower.includes("z(") || questionLower.includes("what") && questionLower.includes("return"))) {
            // For string indexing function
            if (questionLower.includes("[1]") || questionLower.includes("s[1]")) {
                // Assuming correct answer is the second character of a string
                options.push("Error");
                options.push("None");
                // Add another character as option
                if (correctAnswer.length === 1) {
                    options.push(correctAnswer + "s");
                } else {
                    options.push("a");
                }
            } else {
                options.push("None");
                options.push("Error");
                options.push("undefined");
            }
            
            return {
                question: questionData.question,
                options: [...new Set(options)], // Remove any duplicates
                correctIndex: 0
            };
        }
        
        // Handle "None" as the correct answer (no output)
        if (correctAnswer === "None") {
            options.push("Error");
            options.push("0");
            options.push("undefined");
            
            return {
                question: questionData.question,
                options: options,
                correctIndex: 0
            };
        }
        
        // For string concatenation with repetition: print('is' + 'a' * 3)
        if (questionLower.includes("print(") && questionLower.includes("+") && questionLower.includes("*") && 
            correctAnswer.length > 2 && /is.+/.test(correctAnswer)) {
            const matches = correctAnswer.match(/^([a-z]+)([a-z])\2+$/i);
            if (matches) {
                const [_, prefix, repeatedChar] = matches;
                options.push(prefix + repeatedChar);               // e.g., "isa"
                options.push(prefix + " " + repeatedChar);         // e.g., "is a"
                options.push(prefix.charAt(0) + repeatedChar);     // e.g., "ia"
            } else {
                options.push("isa");
                options.push("is a");
                options.push("Error");
            }
            
            return {
                question: questionData.question,
                options: [...new Set(options)],
                correctIndex: 0
            };
        }
        
        // For loop output questions, handle the comma-separated format
        if (correctAnswer.includes(',') && (questionLower.includes("loop") || questionLower.includes("for i in range"))) {
            const values = correctAnswer.split(',').map(v => v.trim());
            
            // Create variations based on the correct sequence
            if (values.length > 1) {
                // Variation 1: Reverse the order or first few values
                if (values.length > 2) {
                    options.push([...values].reverse().slice(0, 3).join(', '));
                } else {
                    options.push([...values].reverse().join(', '));
                }
                
                // Variation 2: Off-by-one values
                const offByOneValues = values.map(v => {
                    const num = parseInt(v);
                    return isNaN(num) ? v : (num + 1).toString();
                });
                options.push(offByOneValues.slice(0, 3).join(', '));
                
                // Variation 3: Missing values or subset
                if (values.length > 3) {
                    options.push(values.slice(0, 2).join(', '));
                } else if (values.length === 3) {
                    options.push(values[0] + ", " + values[2]); // Skip middle value
                } else {
                    // If only 2 values, create a different variation
                    const doubledFirst = [values[0], values[0]].join(', ');
                    options.push(doubledFirst);
                }
                
                return {
                    question: questionData.question,
                    options: [...new Set(options)], // Remove any duplicates
                    correctIndex: 0
                };
            }
        }
        
        // Case 1: Numeric answers (including math operations)
        if (!isNaN(correctAnswer) && correctAnswer !== "True" && correctAnswer !== "False") {
            const numericAnswer = Number(correctAnswer);
            
            // Add options based on common computational errors
            if (question.includes("=") && !question.includes("==")) {
                // Variable assignment question
                
                // Keep original value (common error: forgetting to update variable)
                const originalValueMatch = question.match(/(\w+)\s*=\s*(\d+)/);
                if (originalValueMatch) {
                    options.push(originalValueMatch[2]);
                }
                
                if (questionLower.includes("+=")) {
                    // Addition assignment: add common computation errors
                    options.push((numericAnswer + 1).toString());
                    options.push((numericAnswer - 1).toString());
                } else if (questionLower.includes("*=")) {
                    // Multiplication assignment
                    options.push((numericAnswer / 2).toString());
                    options.push((numericAnswer + numericAnswer).toString());
                } else if (questionLower.includes("len(")) {
                    // Length function error
                    options.push((numericAnswer - 1).toString());
                    options.push((numericAnswer + 1).toString());
                } else {
                    // Generic assignment errors
                    options.push((numericAnswer * 2).toString());
                    options.push((numericAnswer / 2).toString());
                }
            }
            // Expression errors
            else if (question.includes("+")) {
                options.push((numericAnswer - 1).toString());
                options.push((numericAnswer * 2).toString());
            } else if (question.includes("*")) {
                options.push((numericAnswer + numericAnswer).toString());
                options.push((numericAnswer + 1).toString());
            } else if (question.includes("-")) {
                options.push((-numericAnswer).toString());
                options.push((numericAnswer + 2).toString());
            } else if (question.includes("/") || question.includes("//")) {
                options.push((numericAnswer * 2).toString());
                options.push((numericAnswer + 1).toString());
            } else if (question.includes("%")) {
                options.push((numericAnswer + 2).toString());
                options.push("0");
            } else {
                // Generic numeric options
                options.push((numericAnswer + 1).toString());
                options.push((numericAnswer - 1).toString());
                options.push((numericAnswer * 2).toString());
            }
            
            // Add more generic distractor options if needed
            while (options.length < 4) {
                // Add a reasonable variation
                const variation = Math.ceil(numericAnswer / 2);
                const newOption = (numericAnswer + variation).toString();
                if (!options.includes(newOption)) {
                    options.push(newOption);
                } else {
                    options.push((numericAnswer - variation).toString());
                }
            }
        }
        
        // Case 2: String output (string operations, concatenation, etc.)
        else if (typeof correctAnswer === 'string' && 
                 !["True", "False", "IndexError", "TypeError", "ValueError", "SyntaxError"].includes(correctAnswer)) {
            
            // For string length questions
            if (questionLower.includes("len(") || questionLower.includes("length")) {
                const len = correctAnswer.length || parseInt(correctAnswer);
                options.push((len + 1).toString());
                options.push((len - 1).toString());
                options.push((len * 2).toString());
            } 
            // For string indexing questions
            else if (questionLower.includes("[") && questionLower.includes("]")) {
                // Find the string being indexed
                const stringMatch = question.match(/["']([^"']*)["']/);
                if (stringMatch) {
                    const str = stringMatch[1];
                    // Add adjacent characters as options
                    const correctIndex = str.indexOf(correctAnswer);
                    if (correctIndex > 0) {
                        options.push(str[correctIndex - 1]);
                    }
                    if (correctIndex < str.length - 1) {
                        options.push(str[correctIndex + 1]);
                    }
                    // Add out of bounds error as an option
                    options.push("IndexError");
                }
            }
            // For string concatenation questions
            else if (questionLower.includes("+") && 
                    (questionLower.includes("'") || questionLower.includes('"'))) {
                // Find the strings being concatenated
                const stringsMatch = question.match(/["']([^"']*)["']\s*\+\s*["']([^"']*)["']/);
                if (stringsMatch) {
                    const [_, str1, str2] = stringsMatch;
                    options.push(str2 + str1); // Reversed concatenation
                    options.push(str1 + " " + str2); // With space
                    options.push(`"${str1}${str2}"`); // With quotes (common error)
                }
            }
            // For string repetition questions
            else if (questionLower.includes("*") && 
                    (questionLower.includes("'") || questionLower.includes('"'))) {
                // Find the string being repeated
                const repeatMatch = question.match(/["']([^"']*)["']\s*\*\s*(\d+)/) || 
                                  question.match(/(\d+)\s*\*\s*["']([^"']*)["']/);
                if (repeatMatch) {
                    let str, times;
                    if (repeatMatch[2] && !isNaN(repeatMatch[2])) {
                        [_, str, times] = repeatMatch;
                    } else {
                        [_, times, str] = repeatMatch;
                    }
                    times = parseInt(times);
                    
                    options.push(str.repeat(times - 1 || 1)); // One less repetition
                    options.push(str.repeat(times + 1)); // One more repetition
                    options.push(times + str); // Common mistake: treating * as concatenation
                }
            }
            
            // For function return value questions
            if (questionLower.includes("def") && questionLower.includes("return")) {
                options.push("None");
                options.push("Error");
                
                // Try to determine if the function returns a modified parameter
                const funcMatch = question.match(/def\s+\w+\(\s*(\w+)\s*\).*?return\s+(\w+)/);
                if (funcMatch && funcMatch[1] === funcMatch[2]) {
                    // Function returns its parameter - add the parameter as an option
                    const funcCallMatch = question.match(/\w+\((\d+)\)/);
                    if (funcCallMatch) {
                        options.push(funcCallMatch[1]);
                    }
                }
            }
            
            // Generic string distractors
            while (options.length < 4) {
                const genericOptions = ["Error", "None", correctAnswer + "s", correctAnswer.toUpperCase()];
                for (const opt of genericOptions) {
                    if (!options.includes(opt)) {
                        options.push(opt);
                        break;
                    }
                }
            }
        }
        
        // Case 3: Boolean expressions (True/False)
        else if (correctAnswer === "True" || correctAnswer === "False") {
            options.push(correctAnswer === "True" ? "False" : "True");
            options.push("None");
            options.push("Error");
        }
        
        // Case 4: Error messages
        else if (correctAnswer.includes("Error")) {
            options.push("None");
            options.push("0");
            
            // Try to determine what the non-error result might be
            if (questionLower.includes("[") && questionLower.includes("]")) {
                const indexMatch = question.match(/\[\s*(-?\d+)\s*\]/);
                if (indexMatch) {
                    const index = parseInt(indexMatch[1]);
                    options.push(index.toString());
                }
            } else if (questionLower.includes("/") || questionLower.includes("//")) {
                options.push("0");
            }
            
            options.push("undefined");
        }
        
        // Case 5: Function return value "None"
        else if (correctAnswer === "None") {
            options.push("()");
            options.push("0");
            options.push("Error");
        }
        
        // Ensure we have exactly 4 unique options
        options = [...new Set(options)]; // Remove duplicates
        
        // If we have fewer than 4 options, add generic distractors
        const genericOptions = ["None", "Error", "0", "undefined", "null", "NaN"];
        let i = 0;
        while (options.length < 4 && i < genericOptions.length) {
            if (!options.includes(genericOptions[i])) {
                options.push(genericOptions[i]);
            }
            i++;
        }
        
        // If we still need more options, add numeric variations
        if (options.length < 4 && !isNaN(correctAnswer)) {
            const numericAnswer = Number(correctAnswer);
            options.push((numericAnswer * 3).toString());
        }
        
        // If we still need more options, add string variations
        if (options.length < 4 && typeof correctAnswer === 'string' && correctAnswer.length > 0) {
            if (!options.includes(correctAnswer.toUpperCase())) {
                options.push(correctAnswer.toUpperCase());
            }
            if (!options.includes(correctAnswer + correctAnswer) && correctAnswer.length < 5) {
                options.push(correctAnswer + correctAnswer);
            }
            if (!options.includes(correctAnswer + "s")) {
                options.push(correctAnswer + "s");
            }
        }
        
        // If we have more than 4 options, trim to 4
        if (options.length > 4) {
            options = options.slice(0, 4);
        }
        
        // Final check for exactly 4 options
        if (options.length < 4) {
            // Add completely generic options as a last resort
            const lastResortOptions = ["x", "y", "z", "w", "42", "100", "-1"];
            while (options.length < 4) {
                const option = lastResortOptions[options.length % lastResortOptions.length];
                if (!options.includes(option)) {
                    options.push(option);
                }
            }
        }
        
        return {
            question: questionData.question,
            options: options,
            correctIndex: 0  // The correct answer is always at index 0 at this point
        };
    }

    // Function to fetch MCQ about a specific topic
    async function fetchMCQ() {
        // List of Python topics
        const topics = ["Variables", "Loops", "Conditionals", "String Manipulation", "Functions", "Operators"];
        
        // Get question history from localStorage
        const questionHistory = JSON.parse(localStorage.getItem('questionHistory'));
        
        // Choose topics that have fewer questions first
        const topicsByFrequency = topics.sort((a, b) => 
            (questionHistory[a]?.length || 0) - (questionHistory[b]?.length || 0)
        );
        
        // Select topics to try (prioritize less frequently used ones)
        const topicsToTry = [
            topicsByFrequency[0], // Least used topic
            topicsByFrequency[1], // Second least used topic
            ...topics.filter(t => !topicsByFrequency.slice(0, 2).includes(t)) // Other topics as fallback
        ];
        
        // Try generating questions for each topic until successful
        for (const topic of topicsToTry) {
            // Try up to 3 times per topic
            for (let attempt = 0; attempt < 3; attempt++) {
                const questionData = await generateQuestion(topic);
                
                if (questionData) {
                    try {
                        // Verify the answer is correct through execution
                        const verifiedAnswer = verifyPythonExecution(questionData);
                        
                        // Update the correct answer if verification found a different result
                        if (verifiedAnswer !== questionData.correctAnswer) {
                            console.log(`Correcting answer from "${questionData.correctAnswer}" to "${verifiedAnswer}"`);
                            questionData.correctAnswer = verifiedAnswer;
                        }
                        
                        // Generate options for the question
                        const mcqData = generateOptions(questionData);
                        
                        // Make sure we have exactly 4 unique options
                        if (mcqData.options.length !== 4) {
                            console.warn("Options count is not 4, skipping question");
                            continue;
                        }
                        
                        // Check all options are unique
                        const uniqueOptions = [...new Set(mcqData.options)];
                        if (uniqueOptions.length !== 4) {
                            console.warn("Options are not unique, skipping question");
                            continue;
                        }
                        
                        // Shuffle options
                        const shuffledOptions = [...mcqData.options];
                        shuffleArray(shuffledOptions);
                        
                        // Find new index of correct answer after shuffling
                        const correctIndex = shuffledOptions.indexOf(questionData.correctAnswer);
                        
                        // Ensure correctAnswer is actually in the options
                        if (correctIndex === -1) {
                            console.error("Correct answer not found in options, using fallback");
                            return getFallbackQuestion();
                        }
                        
                        return {
                            question: mcqData.question,
                            options: shuffledOptions,
                            correctIndex: correctIndex,
                            topic: topic
                        };
                    } catch (error) {
                        console.error("Error processing question:", error);
                        // Try the next iteration
                    }
                }
            }
        }
        
        // If all attempts fail, use a fallback question
        return getFallbackQuestion();
    }

    // Generate fallback questions with verified answers
    function getFallbackQuestion() {
        const fallbackQuestions = [
            {
                question: "What is the output of: print(2 ** 3)?",
                options: ["8", "6", "5", "Error"],
                correctIndex: 0,
                topic: "Operators"
            },
            {
                question: "How do you create a variable named 'age' with the value 12?",
                options: ["age = 12", "var age = 12", "age == 12", "12 -> age"],
                correctIndex: 0,
                topic: "Variables"
            },
            {
                question: "What does len('hello') return?",
                options: ["5", "4", "6", "'hello'"],
                correctIndex: 0,
                topic: "String Manipulation"
            },
            {
                question: "What will print(3 * 'abc') output in Python?",
                options: ["abcabcabc", "abc3", "3abc", "Error"],
                correctIndex: 0,
                topic: "String Manipulation"
            },
            {
                question: "Which symbol is used for single-line comments in Python?",
                options: ["#", "//", "/* */", "''"],
                correctIndex: 0,
                topic: "Variables"
            },
            {
                question: "What is the result of 10 % 3 in Python?",
                options: ["1", "3", "0", "10/3"],
                correctIndex: 0,
                topic: "Operators"
            },
            {
                question: "What will be the value of x after: x = 5; x += 2?",
                options: ["7", "5", "52", "2"],
                correctIndex: 0,
                topic: "Variables"
            },
            {
                question: "What is the output of: print('Hello'[0])?",
                options: ["H", "e", "Hello", "0"],
                correctIndex: 0,
                topic: "String Manipulation"
            },
            {
                question: "What does the following code print? if 10 > 5: print('Yes') else: print('No')",
                options: ["Yes", "No", "True", "False"],
                correctIndex: 0,
                topic: "Conditionals"
            },
            {
                question: "What will be the final value of count after this code: count = 0; for i in range(3): count += 1",
                options: ["3", "2", "0", "1"],
                correctIndex: 0,
                topic: "Loops"
            },
            {
                question: "What is the output of: print(True and False)?",
                options: ["False", "True", "None", "Error"],
                correctIndex: 0,
                topic: "Operators"
            },
            {
                question: "What is the result of: 'Python'[1:4]?",
                options: ["yth", "Pyt", "ytho", "ython"],
                correctIndex: 0,
                topic: "String Manipulation"
            },
            {
                question: "What would print(type(5)) display in Python?",
                options: ["<class 'int'>", "int", "Integer", "Number"],
                correctIndex: 0,
                topic: "Variables"
            },
            {
                question: "What is the output of: print(3 > 2 and 1 < 0)?",
                options: ["False", "True", "None", "Error"],
                correctIndex: 0,
                topic: "Conditionals"
            },
            {
                question: "What does the following loop print? for i in range(2): print(i)",
                options: ["0, 1", "1, 2", "0, 1, 2", "1, 0"],
                correctIndex: 0,
                topic: "Loops"
            },
            {
                question: "What will the following code print? for i in range(3): print(i * 2)",
                options: ["0, 2, 4", "2, 4, 6", "0, 1, 4", "0, 4, 6"],
                correctIndex: 0,
                topic: "Loops"
            },
            {
                question: "What is the value of x after: x = 5 + 3 * 2?",
                options: ["11", "16", "13", "8"],
                correctIndex: 0,
                topic: "Operators"
            },
            {
                question: "What will the following function return? def double(n): return n * 2",
                options: ["A doubled value", "None", "Error", "n * 2"],
                correctIndex: 0,
                topic: "Functions"
            },
            {
                question: "What does the function call double(3) return if the function is defined as: def double(n): return n * 2",
                options: ["6", "3", "None", "Error"],
                correctIndex: 0,
                topic: "Functions"
            },
            {
                question: "What is the output of: print('hello'[-1])?",
                options: ["o", "h", "hello", "IndexError"],
                correctIndex: 0,
                topic: "String Manipulation"
            },
            {
                question: "What will print('is' + 'a' * 3) display?",
                options: ["isaaa", "isa", "is a", "aisss"],
                correctIndex: 0,
                topic: "String Manipulation"
            },
            {
                question: "What will the following code print? for i in range(3): if i == 2: print('Yes')",
                options: ["Yes", "None", "Yes, Yes, Yes", "Error"],
                correctIndex: 0,
                topic: "Conditionals"
            },
            {
                question: "What will the following code print? for i in range(6): if i % 2 == 0: print(i ** 2)",
                options: ["0, 4, 16", "0, 4", "0, 2, 4", "0, 1, 4, 9, 16, 25"],
                correctIndex: 0,
                topic: "Loops"
            },
            {
                question: "What does z('bs') return if z is defined as: def z(s): return s[1]",
                options: ["b", "bs", "s", "Error"],
                correctIndex: 0,
                topic: "Functions"
            },
            {
                question: "What will print('egg'[0] + 'egg'[1]) display?",
                options: ["ee", "egg", "eegg", "e"],
                correctIndex: 0,
                topic: "String Manipulation"
            },
            {
                question: "What will the following code print? for i in range(4): if i == 0 or i == 3: print('Yes')",
                options: ["Yes, Yes", "Yes", "None", "Error"],
                correctIndex: 0,
                topic: "Conditionals"
            },
            {
                question: "What will result = 'banana'.replace('a', '') return?",
                options: ["bnn", "banana", "bnnn", "Error"],
                correctIndex: 0,
                topic: "String Manipulation"
            },
            {
                question: "What will the following code print? for i in range(6): print(i ** 2)",
                options: ["0, 1, 4, 9, 16, 25", "0, 4, 16", "1, 4, 9, 16, 25, 36", "0, 2, 4, 6, 8, 10"],
                correctIndex: 0,
                topic: "Loops"
            }
        ];
        
        // Return a random but reliable fallback question
        const question = fallbackQuestions[Math.floor(Math.random() * fallbackQuestions.length)];
        
        // Double-check that options array has exactly 4 items
        if (question.options.length !== 4) {
            question.options = question.options.slice(0, 4);
            // If needed, add more options to reach 4
            while (question.options.length < 4) {
                question.options.push("Error");
            }
        }
        
        return question;
    }
    
// Function to show feedback
function showFeedback(isCorrect, correctAnswer, explanation) {
    const feedbackElement = document.createElement('div');
    feedbackElement.className = `feedback ${isCorrect ? 'correct' : 'incorrect'}`;
    
    let feedbackContent = isCorrect 
        ? "<h4>✅ Correct! Well done!</h4>" 
        : `<h4>❌ Incorrect.</h4><p>The correct answer is: <strong>${correctAnswer}</strong></p>`;
        
    if (explanation) {
        feedbackContent += `<p class="explanation">${explanation}</p>`;
    }
    
    feedbackElement.innerHTML = feedbackContent;
    
    // Make sure questionContainer exists by using quizContainer as fallback
    const container = questionContainer || quizContainer;
    container.appendChild(feedbackElement);
    
    setTimeout(() => {
        feedbackElement.remove();
        if (isCorrect) {
            // Increment streak after a correct answer
            streak++;
            
            // Update progress tracking - award points for correct answer
            const user = firebase.auth().currentUser;
            if (user && window.CodeSafariProgressTracker) {
                console.log("Updating progress for user:", user.uid);
                // Award 10 points for each correct answer
                window.CodeSafariProgressTracker.updateExerciseProgress(10, true);
            } else {
                console.warn("Cannot update progress - no user logged in or progress tracker not available");
            }
            
            // Update streak display
            updateStreakDisplay();
            
            // Continue with next question
            loadNextQuestion();
        } else {
            // End streak if incorrect
            showGameOverScreen();
        }
    }, 2500);
}

// Update streak display
function updateStreakDisplay() {
    const streakDisplay = document.getElementById('streak-display');
    if (streakDisplay) {
        streakDisplay.textContent = `Current Streak: ${streak} | Best: ${Math.max(longestStreak, window.pythonQuizBestScore || 0)}`;
    }
}

// Show game over screen with score table
function showGameOverScreen() {
    clearInterval(timer); // Stop the timer
    
    // Update longest streak if current streak is better
    if (streak > longestStreak) {
        longestStreak = streak;
        // Save to localStorage
        localStorage.setItem('longestStreak', longestStreak.toString());
        
        // Update the global variable for database access
        window.pythonQuizBestScore = longestStreak;
        
        // Update progress with final score bonus
        const user = firebase.auth().currentUser;
        if (user && window.CodeSafariProgressTracker && streak > 0) {
            console.log("Updating final quiz score:", streak);
            // Award bonus points based on streak length
            const bonusPoints = Math.floor(streak * 2); // 2 bonus points per streak
            window.CodeSafariProgressTracker.updateExerciseProgress(bonusPoints, true);
        }
        
        // Dispatch an event that can be listened to by external code
        const event = new CustomEvent('bestScoreUpdated', { 
            detail: { score: longestStreak } 
        });
        document.dispatchEvent(event);
    }
    
    // Hide quiz container
    quizContainer.style.display = 'none';
    
    // Remove any existing game over screen
    const existingGameOver = document.getElementById('game-over-screen');
    if (existingGameOver) {
        existingGameOver.remove();
    }
    
    // Create game over screen with table
    const gameOverScreen = document.createElement('div');
    gameOverScreen.id = 'game-over-screen';
    
    // Get appropriate feedback message
    let feedback = "";
    if (streak >= 15) {
        feedback = "Fantastic job! You're a Python master!";
    } else if (streak >= 10) {
        feedback = "Outstanding work! Your Python knowledge is impressive!";
    } else if (streak >= 7) {
        feedback = "Great work! You have a solid understanding of Python!";
    } else if (streak >= 5) {
        feedback = "Good effort! Keep practicing to improve your Python skills.";
    } else if (streak >= 3) {
        feedback = "Nice start! With more practice, you'll improve your Python knowledge.";
    } else {
        feedback = "Keep learning! Python takes practice, but you'll get there!";
    }
    
    // Calculate total points earned this session
    const pointsEarned = (streak * 10) + (streak > longestStreak ? Math.floor(streak * 2) : 0);
    
    // Create table with scores
    gameOverScreen.innerHTML = `
        <div class="game-over-container">
            <h2>Game Over!</h2>
            <p class="feedback-message">${feedback}</p>
            <table class="score-table">
                <tr>
                    <th>Your Score</th>
                    <th>Best Score</th>
                    <th>Points Earned</th>
                </tr>
                <tr>
                    <td>${streak}</td>
                    <td>${Math.max(longestStreak, streak)}</td>
                    <td>${pointsEarned}</td>
                </tr>
            </table>
            <button id="restart-game-btn" class="restart-btn">Play Again</button>
        </div>
    `;
    
    // Add game over screen to the document
    document.body.appendChild(gameOverScreen);
    
    // Add event listener to restart button
    document.getElementById('restart-game-btn').addEventListener('click', () => {
        gameOverScreen.remove();
        quizStartSection.style.display = 'block';
        // Reset streak for next round
        streak = 0;
    });
    
    // Add styles for game over screen
    if (!document.getElementById('game-over-styles')) {
        const styleElement = document.createElement('style');
        styleElement.id = 'game-over-styles';
        styleElement.textContent = `
            #game-over-screen {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .game-over-container {
                background-color: white;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                text-align: center;
                max-width: 600px;
                width: 90%;
            }
            
            .score-table {
                width: 100%;
                margin: 20px auto;
                border-collapse: collapse;
                font-size: 1.1em;
            }
            
            .score-table th, .score-table td {
                padding: 12px;
                border: 1px solid #ddd;
                text-align: center;
            }
            
            .score-table th {
                background-color: #4caf50;
                color: white;
            }
            
            .score-table td {
                font-weight: bold;
                font-size: 1.3em;
            }
            
            .restart-btn {
                padding: 12px 24px;
                background-color: #4caf50;
                color: white;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-size: 1.1em;
                margin-top: 20px;
                transition: background-color 0.3s, transform 0.2s;
            }
            
            .restart-btn:hover {
                background-color: #45a049;
                transform: translateY(-2px);
            }
            
            .feedback-message {
                font-style: italic;
                color: #6c757d;
                margin-bottom: 20px;
                font-size: 1.1em;
            }
        `;
        document.head.appendChild(styleElement);
    }
}

// Function to preload quiz questions for buffer
async function preloadQuestions(count = 3) {
    console.log("Preloading questions in the background");
    
    // No loading indicator shown to user
    isLoadingQuestion = true;
    
    // Load just a few questions at a time to reduce initial wait time
    for (let i = 0; i < count; i++) {
        try {
            const question = await fetchMCQ();
            
            // Ensure the question has exactly 4 options
            if (question && question.options && question.options.length === 4) {
                quizQuestions.push(question);
            } else {
                console.warn("Skipping question with invalid options count:", question);
                // Use a fallback question instead
                quizQuestions.push(getFallbackQuestion());
            }
        } catch (error) {
            console.error("Error preloading question:", error);
            // Add a fallback question
            quizQuestions.push(getFallbackQuestion());
        }
    }
    
    isLoadingQuestion = false;
    return quizQuestions;
}

// Start Quiz
startQuizBtn.addEventListener('click', async () => {
    quizStartSection.style.display = 'none';
    quizContainer.style.display = 'block';
    
    // Remove any existing game over screen
    const existingGameOver = document.getElementById('game-over-screen');
    if (existingGameOver) {
        existingGameOver.remove();
    }
    
    currentQuestionIndex = 0;
    streak = 0;
    
    // Load longest streak from localStorage
    longestStreak = parseInt(localStorage.getItem('longestStreak') || '0');
    
    // Initialize/update best score for database access
    if (!window.pythonQuizBestScore || longestStreak > window.pythonQuizBestScore) {
        window.pythonQuizBestScore = longestStreak;
    }
    
    // Initialize user progress tracking if available
    const user = firebase.auth().currentUser;
    if (user && window.CodeSafariProgressTracker) {
        console.log("Quiz started - progress tracking enabled for user:", user.uid);
        // Ensure user document exists
        try {
            await window.CodeSafariProgressTracker.checkAndSetupUser();
        } catch (error) {
            console.warn("Could not setup user document:", error);
        }
    } else {
        console.warn("Progress tracking not available - user may not be logged in");
    }
    
    quizQuestions = [];
    
    // Show a message while loading initial questions
    questionText.textContent = "Loading your first Python question...";
    answerButtons.forEach(btn => {
        btn.disabled = true;
        btn.textContent = "...";
    });
    
    // Preload questions
    await preloadQuestions(5);
    
    loadNextQuestion();
    
    // Start loading more questions in background after a delay
    setTimeout(() => {
        if (quizQuestions.length < 8) {
            preloadQuestions(3);
        }
    }, 10000);
});

// Load Next Question
function loadNextQuestion() {
    // Reset loading state
    isLoadingQuestion = false;
    
    // If we're running low on questions, preload more in the background
    if (quizQuestions.length - currentQuestionIndex < 3 && !isLoadingQuestion) {
        setTimeout(() => {
            preloadQuestions(3);
        }, 500);
    }
    
    if (currentQuestionIndex >= quizQuestions.length) {
        // Show a temporary message while waiting for questions
        questionText.textContent = "Loading next question...";
        answerButtons.forEach(btn => {
            btn.disabled = true;
            btn.textContent = "...";
        });
        
        // Wait until we have a question
        const checkInterval = setInterval(() => {
            if (quizQuestions.length > currentQuestionIndex) {
                clearInterval(checkInterval);
                continueLoadingQuestion();
            }
        }, 500);
        return;
    } else {
        continueLoadingQuestion();
    }
}

// Continue loading the current question after we've ensured one is available
function continueLoadingQuestion() {
    clearInterval(timer); // Clear any existing timer
    
    // Show loading state
    questionText.textContent = "Loading next question...";
    answerButtons.forEach(btn => {
        btn.disabled = true;
        btn.textContent = "...";
        btn.className = 'btn answer-btn'; // Reset button styles
    });

    const questionData = quizQuestions[currentQuestionIndex];
    
    // Verify the question has exactly 4 options
    if (!questionData || !questionData.options || questionData.options.length !== 4) {
        console.warn("Skipping invalid question:", questionData);
        currentQuestionIndex++;
        loadNextQuestion();
        return;
    }
    
    // Update streak display
    updateStreakDisplay();
    
    // Update topic badge if it exists
    const topicBadge = document.getElementById('topic-badge');
    if (topicBadge && questionData.topic) {
        topicBadge.textContent = questionData.topic;
        topicBadge.style.display = 'inline-block';
    }

    // Display question with code formatting
    const formattedQuestion = formatPythonQuestion(questionData.question);
    questionText.innerHTML = formattedQuestion;
    
    // Double-check that the correct answer is in the options
    if (!questionData.options.includes(questionData.options[questionData.correctIndex])) {
        console.error("Correct answer mismatch detected, fixing...");
        // Use a fallback question instead
        quizQuestions[currentQuestionIndex] = getFallbackQuestion();
        continueLoadingQuestion();
        return;
    }
    
    // Use the parsed options array
    const options = [...questionData.options];
    const correctAnswer = options[questionData.correctIndex];

    answerButtons.forEach((button, index) => {
        if (index < options.length) {
            button.textContent = options[index];
            button.disabled = false;
            button.className = 'btn answer-btn';
            
            button.onclick = () => {
                // Stop the timer when an answer is selected
                clearInterval(timer);
                
                const isCorrect = index === questionData.correctIndex;
                
                button.classList.add(isCorrect ? 'correct' : 'incorrect');
                answerButtons.forEach(btn => btn.disabled = true);
                
                // Generate a simple explanation for feedback
                let explanation = "";
                if (questionData.question.includes("print(")) {
                    explanation = `In Python, this print statement outputs exactly what you see in the correct answer.`;
                } else if (questionData.question.includes("=") && !questionData.question.includes("==")) {
                    explanation = `This question tests your understanding of variable assignment in Python.`;
                } else if (questionData.question.includes("[") && questionData.question.includes("]")) {
                    explanation = `Remember that in Python, string indices start at 0. Negative indices count from the end.`;
                } else if (questionData.question.includes("for") && questionData.question.includes("range")) {
                    explanation = `In Python, range(n) generates numbers from 0 to n-1. The loop iterates once for each number.`;
                } else if (questionData.question.includes("if") && questionData.question.includes("else")) {
                    explanation = `Conditional statements execute different code blocks based on whether the condition is True or False.`;
                } else if (questionData.question.includes("def") && questionData.question.includes("return")) {
                    explanation = `Functions in Python return the value specified after the return keyword. If no return statement is present, None is returned.`;
                }
                
                showFeedback(isCorrect, correctAnswer, explanation);
            };
        }
    });
    
    // Start the timer for this question
    startQuestionTimer();
    
    // Increment question index for next time
    currentQuestionIndex++;
}

// Create streak display if it doesn't exist
function createStreakDisplay() {
    const streakDisplay = document.createElement('div');
    streakDisplay.id = 'streak-display';
    streakDisplay.className = 'streak-counter';
    streakDisplay.textContent = `Current Streak: 0 | Best: ${window.pythonQuizBestScore || longestStreak}`;
    
    // Insert after topic badge
    const topicBadge = document.getElementById('topic-badge');
    if (topicBadge && topicBadge.parentNode) {
        topicBadge.parentNode.insertBefore(streakDisplay, topicBadge.nextSibling);
    } else if (questionContainer) {
        questionContainer.insertBefore(streakDisplay, questionContainer.firstChild);
    }
    
    return streakDisplay;
}

// Format Python questions with syntax highlighting
function formatPythonQuestion(question) {
    // Find code snippets in the question
    const codeParts = question.match(/(print\(.+?\)|[a-zA-Z_]+\s*=.+?(?=;|\?|$)|.+?\[.+?\]|for.+?:.+?|if.+?:.+?else.+?:|def.+?:.+?return.+?)/g) || [];
    
    let formattedQuestion = question;
    
    // Replace code parts with formatted code
    codeParts.forEach(codePart => {
        if (codePart.length > 3) { // Avoid formatting very short bits
            formattedQuestion = formattedQuestion.replace(
                codePart, 
                `<code class="python-code">${codePart}</code>`
            );
        }
    });
    
    return formattedQuestion;
}

// Utility function to shuffle array
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// HTML structure creation (if elements don't exist)
function createQuizElements() {
    const mainContainer = document.getElementById('python-quiz-app') || document.body;
    
    if (!document.getElementById('quiz-start')) {
        const quizStartHTML = `
            <div id="quiz-start">
                <h2>Python Programming Quiz for Kids</h2>
                <p>Test your Python knowledge with questions until you get one wrong or run out of time!</p>
                <p>Topics include variables, loops, conditionals, string manipulation, and more.</p>
                <p>You have 30 seconds to answer each question. How long can you keep your streak going?</p>
                <p><strong>Points System:</strong> Earn 10 points for each correct answer, plus bonus points based on your streak!</p>
                <button id="start-quiz-btn">Start Quiz</button>
            </div>
        `;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = quizStartHTML;
        mainContainer.appendChild(tempDiv.firstElementChild);
    }
    
    if (!document.getElementById('quiz-container')) {
        const quizContainerHTML = `
            <div id="quiz-container" style="display: none;">
                <div id="question-timer" class="timer"><span>30</span> seconds left</div>
                <div class="quiz-info">
                    <span id="topic-badge" style="display: none;">Topic</span>
                    <span id="streak-display" class="streak-counter">Current Streak: 0 | Best: 0</span>
                </div>
                <div id="question-container">
                    <h3 id="question-text">Question text will appear here</h3>
                    <div id="answer-options">
                        <button class="btn answer-btn">Option 1</button>
                        <button class="btn answer-btn">Option 2</button>
                        <button class="btn answer-btn">Option 3</button>
                        <button class="btn answer-btn">Option 4</button>
                    </div>
                </div>
            </div>
        `;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = quizContainerHTML;
        mainContainer.appendChild(tempDiv.firstElementChild);
    }
}

// Add CSS for the quiz
function addQuizStyles() {
    if (document.getElementById('python-quiz-styles')) return;
    
    const styleElement = document.createElement('style');
    styleElement.id = 'python-quiz-styles';
    styleElement.textContent = `
        #quiz-start, #quiz-container {
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #fff;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        #quiz-container {
            display: none;
            position: relative;
        }
        
        .feedback {
            margin-top: 15px;
            padding: 15px;
            border-radius: 8px;
            text-align: left;
            font-weight: normal;
            animation: fadeIn 0.3s ease-in;
        }
        
        .feedback h4 {
            margin-top: 0;
            margin-bottom: 10px;
            font-weight: bold;
        }
        
        .feedback .explanation {
            font-style: italic;
            margin-top: 10px;
            font-size: 0.9em;
        }
        
        .feedback.correct {
            background-color: #d4edda;
            color: #155724;
            border: 1px solid #c3e6cb;
        }
        
        .feedback.incorrect {
            background-color: #f8d7da;
            color: #721c24;
            border: 1px solid #f5c6cb;
        }
        
        .answer-btn {
            margin: 8px 0;
            padding: 12px 15px;
            width: 100%;
            text-align: left;
            border: 1px solid #ddd;
            background-color: #f9f9f9;
            cursor: pointer;
            border-radius: 8px;
            transition: all 0.2s;
            font-size: 1em;
        }
        
        .answer-btn:hover {
            background-color: #e9e9e9;
            transform: translateY(-2px);
            box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        
        .answer-btn.correct {
            background-color: #d4edda;
            border-color: #c3e6cb;
            color: #155724;
            font-weight: bold;
        }
        
        .answer-btn.incorrect {
            background-color: #f8d7da;
            border-color: #f5c6cb;
            color: #721c24;
            text-decoration: line-through;
        }
        
        #question-container {
            margin-bottom: 25px;
            padding: 15px;
            background-color: #f8f9fa;
            border-radius: 8px;
            border-left: 5px solid #6c757d;
        }
        
        #question-text {
            font-size: 1.3em;
            margin-bottom: 20px;
            font-weight: 500;
            line-height: 1.4;
        }
        
        .python-code {
            background-color: #f1f1f1;
            padding: 2px 5px;
            border-radius: 4px;
            font-family: monospace;
            color: #d63384;
        }
        
        #start-quiz-btn {
            padding: 12px 24px;
            background-color: #4caf50;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 1.1em;
            transition: background-color 0.3s, transform 0.2s;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            display: block;
            margin: 20px auto;
        }
        
        #start-quiz-btn:hover {
            background-color: #45a049;
            transform: translateY(-2px);
        }
        
        #start-quiz-btn:active {
            transform: translateY(0);
        }
        
        .score-highlight {
            font-weight: bold;
            color: #4caf50;
            font-size: 1.2em;
        }
        
        #topic-badge {
            display: inline-block;
            padding: 5px 10px;
            background-color: #6c757d;
            color: white;
            border-radius: 20px;
            font-size: 0.8em;
            margin-bottom: 15px;
        }
        
        .streak-counter {
            display: inline-block;
            padding: 5px 10px;
            background-color: #17a2b8;
            color: white;
            border-radius: 20px;
            font-size: 0.8em;
            margin-left: 10px;
            margin-bottom: 15px;
        }
        
        .timer {
            background-color: #f8f9fa;
            padding: 8px 12px;
            border-radius: 8px;
            margin-bottom: 15px;
            font-size: 0.9em;
            text-align: center;
            border: 1px solid #dee2e6;
        }
        
        .timer span {
            font-weight: bold;
            font-size: 1.1em;
        }
        
        .timer.warning {
            background-color: #fff3cd;
            color: #856404;
            border-color: #ffeeba;
        }
        
        .timer.danger {
            background-color: #f8d7da;
            color: #721c24;
            border-color: #f5c6cb;
            animation: pulse 0.5s infinite alternate;
        }
        
        @keyframes pulse {
            from { opacity: 1; }
            to { opacity: 0.8; }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .quiz-info {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 15px;
        }
    `;
    document.head.appendChild(styleElement);
}

// Initialize the quiz
function initQuiz() {
    // Create elements if they don't exist
    createQuizElements();
    
    // Add styles
    addQuizStyles();
    
    // Try to load longest streak from localStorage
    longestStreak = parseInt(localStorage.getItem('longestStreak') || '0');
    
    // Initialize best score for database access
    window.pythonQuizBestScore = longestStreak;
    
    console.log("Python Quiz for Kids initialized successfully!");
    console.log("Progress tracking integration ready!");
}

// Initialize quiz on load
initQuiz();
});
