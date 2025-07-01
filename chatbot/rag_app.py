from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Import your existing components
from langchain.llms import Ollama
from langchain.embeddings import SentenceTransformerEmbeddings
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA

# Initialize FastAPI app
app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Replace with specific origins in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load LLM
llm = Ollama(model="gemma-2b-finetuned", base_url="http://localhost:11434")

# Load vector store
embeddings = SentenceTransformerEmbeddings(model_name="all-mpnet-base-v2")
vectordb = Chroma(persist_directory="./vectordb", embedding_function=embeddings)
retriever = vectordb.as_retriever()

# Set up RAG chain
qa_chain = RetrievalQA.from_chain_type(llm=llm, chain_type="stuff", retriever=retriever)

# Define request models
class Message(BaseModel):
    role: str  # "user" or "assistant"
    content: str

class QuestionWithHistory(BaseModel):
    question: str
    history: Optional[List[Message]] = None

class QuestionRequest(BaseModel):
    question: str

# Define endpoints
@app.post("/ask")
async def ask_question(request: QuestionWithHistory):
    try:
        logger.info(f"Received question: {request.question}")
        
        if request.history and len(request.history) > 0:
            # Format history for context
            context = "\n\nConversation history:\n"
            for msg in request.history:
                prefix = "User" if msg.role == "user" else "Assistant"
                context += f"{prefix}: {msg.content}\n"
            
            # Add current question with context
            full_question = f"{context}\n\nCurrent question: {request.question}\n\nPlease answer directly to the current question using the conversation history for context."
            logger.info(f"Using history-aware question")
        else:
            # If no history provided, just use the question directly
            full_question = request.question
        
        # Run the chain
        result = qa_chain.run(full_question)
        
        # Basic validation
        if len(result) < 50 or "error" in result.lower():
            logger.warning(f"Got poor quality response: {result[:100]}...")
            return {"answer": "Oops! Couldn't find a good answer. Try rephrasing your question! 😅"}
        
        logger.info(f"Generated answer: {result[:100]}...")
        return {"answer": result}
    
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {"answer": "Yikes! Something broke. Try again! 😅"}

# For backward compatibility
@app.post("/ask_legacy")
async def ask_question_legacy(request: QuestionRequest):
    try:
        logger.info(f"Received legacy question: {request.question}")
        result = qa_chain.run(request.question)
        
        # Basic validation
        if len(result) < 50 or "error" in result.lower():
            return {"answer": "Oops! Couldn't find a good answer. Try again! 😅"}
        
        return {"answer": result}
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {"answer": "Yikes! Something broke. Try again! 😅"}

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)