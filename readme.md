# Code Safari


## Project Structure
- `index.html` - Main entry point of the application
- `login.html` - User login page
- `signup.html` - User registration page
- `html.html` - Contains the main functions of our project including courses and learning features
- `auth.js` - Authentication related JavaScript
- `script.js` - Main JavaScript functionality for html page
- `script_index.js` - JavaScript specific to the index page
- `script1.js` - JavaScript for exercise feature functionality
- `script_bot.js` - JavaScript for chatbot feature functionality
- `style.css` - Main CSS styles
- `style_main.css` - CSS specific to the html page
- `styles_index.css` - CSS specific to the index page




## Firebase Integration
This project is integrated with Firebase for user authentication and data management. Ensure you set up a Firebase project and update the configuration in the appropriate JavaScript files.

## Development Requirements
- Python 3.x (for running the development server)
- Ollama CLI (for AI model deployment)

## Deploying AI Models

### Prerequisites
Before deploying the AI models, ensure you have the following installed:
- **Ollama CLI** ([Installation Guide](https://ollama.ai/docs/installation))

### Deploying the MCQ Model
1. **Install Ollama:**
   ```sh
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Verify Installation:**
   ```sh
   ollama --version
   ```

3. **Navigate to the `modelmcq` Folder** and ensure your model file (`Modelfile`) is correctly formatted.

4. **Build the Model:**
   ```sh
   ollama create mcqmodel -f Modelfile
   ```

5. **Run the Model:**
   ```sh
   ollama run mcqmodel
   ```

### Deploying the Chatbot Model
1. **Navigate to the `chatbot` Folder**
2. **Build the Chatbot Model:**
   ```sh
   ollama create gemma-2b-finetuned -f Modelfile
   ```
3. **Run the Chatbot Model:**
   ```sh
   ollama run gemma-2b-finetuned
   ```

4. **Start the FastAPI Server:**
   Install dependencies:
   ```sh
   pip install langchain langchain-community chromadb sentence-transformers ollama fastapi uvicorn
   ```

   Run the `rag_app.py` script using Python 3.x and ensure FastAPI is running correctly.

## Running the Application
To launch the web application, use Python's built-in HTTP server:
```sh
python -m http.server 5500
```
Then, open your browser and navigate to:
```
http://localhost:5500
```




