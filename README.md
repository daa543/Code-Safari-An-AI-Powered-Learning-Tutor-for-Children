# Code-Safari-An-AI-Powered-Learning-Tutor-for-Children
# Overview of the Website

Our website is specially designed for kids aged 10 to 13 to learn Python programming in a simple, interactive, and fun way. In the website we have 6 features to help the user learn coding in python.

1. Video Lessons + Auto PDF Notes
Watch exciting video tutorials right on the website – and the website automatically turns the video lessons into easy-to-read PDF lecture notes just for you! Perfect for review and study.

2. AI Chatbot
Our AI chatbot powered by RAG + Gemma 2B. It answers all the users coding questions using emojis 😊 and can even generate code to help the user solve tricky problems.

3. AI Code Visualizer
Using Gemini 1.5 Flash-powered visualizer shows the user a simple visual explanation so the user can understand how the code what code is in the easiest way possible.

4. Generate MCQ Questions
It generates multiple choice questions made by our smart AI using CodeT5-small model. The user gets a timer that keeps running as long as they get the answers right. If the user answers wrong, it stops generating questions and shows your score and you can try again.

5. Debugging Detective Game
Our website gives the user a code with hidden bugs or missing parts, and the user have to find the mistake. Powered by LLaMA 3.2 3B, this game helps to practice more in coding and there is also a Hint button for a clue the user can use it, if they don't know the answer.

6. Generate Code Snippet
It generates and give the user a coding task question with a starting code, and the user have to complete the code! We used CodeGen 350M model and it also checks the user code's logic and syntax to make sure that the user is answering the question correctly.

## Project Structure
* index.html - Main entry point of the application
* login.html - User login page
* signup.html - User registration page
* html.html - Contains the main functions of our project including courses and learning features
* auth.js - Authentication related JavaScript
* script.js - Main JavaScript functionality for html page
* script_index.js - JavaScript specific to the index page
* script1.js - JavaScript for exercise feature functionality
* script_bot.js - JavaScript for chatbot feature functionality
* style.css - Main CSS styles
* style_main.css - CSS specific to the html page
* styles_index.css - CSS specific to the index page

## Firebase Integration
This project is integrated with Firebase for user authentication and data management. Ensure you set up a Firebase project and update the configuration in the appropriate JavaScript files.

## Development Requirements
Python 3.x (for running the development server)

Ollama CLI (for AI model deployment)

## Deploying AI models
### Prerequisites
Before deploying the AI models, ensure you have the following installed:

Ollama CLI [Installation Guide](https://ollama.com/download)

### Deploying the MCQ Model
1. Install Ollama:
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```
2. Verify Installation:
```bash
ollama --version
```
3. Navigate to the modelmcq Folder and ensure your model file (Modelfile) is correctly formatted.
4. 
5. Build the Model:
```bash
ollama create mcqmodel -f Modelfile
```
5. Run the model:
```bash
ollama run mcqmodel
```

## Deploying the Chatbot Model
1. Navigate to the chatbot Folder
2. Build the Chatbot Model:
```bash
ollama create gemma-2b-finetuned -f Modelfile
```
3. Run the Chatbot Model:
```bash
ollama run gemma-2b-finetuned
```
4. Start the FastAPI Server: Install dependencies:
```bash
pip install langchain langchain-community chromadb sentence-transformers ollama fastapi uvicorn
```
Run the rag_app.py script using Python 3.x and ensure FastAPI is running correctly.

## Running the Application

To launch the web application, use Python's built-in HTTP server:
```bash
python -m http.server 5500
```
Then, open your browser and navigate to:
```bash
http://localhost:5500
```
Here’s the result of the project:

[Watch Video](https://drive.google.com/file/d/1rq8n1TRkAkZZA3frPuEfSGABwWKDRSE8/view?usp=sharing)
