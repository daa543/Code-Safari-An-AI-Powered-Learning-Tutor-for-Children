from flask import Flask, request, jsonify
from flask_cors import CORS
from codegen_model import CodeExerciseGenerator
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for cross-origin requests

# Initialize the AI model
generator = CodeExerciseGenerator()

@app.route("/generate", methods=["GET"])
def generate():
    """Generate a new coding exercise using the AI model"""
    try:
        logger.info("=== GENERATING NEW CODING EXERCISE ===")
        problem, truncated = generator.create_exercise()
        
        # Log the generated exercise details
        logger.info(f"Generated exercise with {len(generator.sample_inputs)} sample inputs")
        logger.info(f"Expected function: {generator.expected_function_name}")
        logger.info(f"Problem description length: {len(problem)} chars")
        logger.info(f"Truncated solution:\n{truncated}")
        
        return jsonify({
            "problem": problem, 
            "truncated": truncated,
            "status": "success",
            "function_name": generator.expected_function_name,
            "sample_count": len(generator.sample_inputs)
        })
        
    except Exception as e:
        logger.error(f"Error generating problem: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return jsonify({
            "error": f"Failed to generate problem: {str(e)}",
            "status": "error"
        }), 500

@app.route("/evaluate", methods=["POST"])
def evaluate():
    """Evaluate user's solution against the AI model"""
    try:
        data = request.get_json()
        user_code = data.get("user_code", "")
        
        logger.info("=== EVALUATING USER SOLUTION ===")
        logger.info(f"User code length: {len(user_code)} characters")
        
        if not user_code.strip():
            logger.info("Empty code submitted")
            return jsonify({
                "is_correct": False,
                "feedback": "Please enter your code before checking",
                "suggested_code": getattr(generator, 'truncated_solution', ''),
                "feedback_type": "empty"
            })
        
        logger.info("Comparing user solution with AI model solution...")
        logger.info(f"Expected function name: {generator.expected_function_name}")
        logger.info(f"Available sample inputs: {len(generator.sample_inputs)}")
        
        # Compare with model solution
        is_correct, feedback = generator.evaluate_solution(user_code)
        
        logger.info(f"=== EVALUATION RESULT ===")
        logger.info(f"Result: {is_correct}")
        logger.info(f"Feedback: {feedback}")
        
        feedback_type = "correct" if is_correct else "incorrect"
        
        response = {
            "is_correct": is_correct,
            "feedback": feedback,
            "feedback_type": feedback_type,
            "suggested_code": getattr(generator, 'truncated_solution', ''),
            "sample_inputs_total": len(generator.sample_inputs)
        }
        
        logger.info(f"Sending response: {response}")
        return jsonify(response)
        
    except Exception as e:
        logger.error(f"Error evaluating solution: {str(e)}")
        logger.error(f"Full traceback: {traceback.format_exc()}")
        return jsonify({
            "is_correct": False,
            "feedback": "Code evaluation failed - please try again",
            "feedback_type": "evaluation_error",
            "suggested_code": getattr(generator, 'truncated_solution', ''),
            "error_details": str(e)
        }), 500

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": generator is not None,
        "has_current_problem": bool(getattr(generator, 'problem_description', '')),
        "timestamp": __import__('datetime').datetime.now().isoformat()
    })

@app.route("/debug", methods=["GET"])
def debug_info():
    """Debug endpoint to check generator state"""
    try:
        debug_data = {
            "has_problem": bool(getattr(generator, 'problem_description', '')),
            "has_solution": bool(getattr(generator, 'full_solution', '')),
            "function_name": getattr(generator, 'expected_function_name', ''),
            "sample_inputs_count": len(getattr(generator, 'sample_inputs', [])),
            "sample_inputs": getattr(generator, 'sample_inputs', [])[:3],  # Show first 3
            "problem_description": (getattr(generator, 'problem_description', '')[:200] + "...") if len(getattr(generator, 'problem_description', '')) > 200 else getattr(generator, 'problem_description', ''),
            "model_cache_size": len(getattr(generator, 'model_outputs_cache', {}))
        }
        
        return jsonify(debug_data)
    except Exception as e:
        logger.error(f"Debug endpoint error: {str(e)}")
        return jsonify({"error": str(e)}), 500

@app.route("/test_model", methods=["GET"])
def test_model():
    """Test endpoint to verify model solution works"""
    try:
        if not generator.full_solution:
            return jsonify({"error": "No model solution available"}), 400
        
        test_results = []
        for i, test_args in enumerate(generator.sample_inputs[:5]):  # Test first 5 inputs
            result, error = generator.get_model_solution_output(test_args)
            test_results.append({
                "input": test_args,
                "output": result,
                "error": error
            })
        
        return jsonify({
            "model_solution": generator.full_solution,
            "test_results": test_results,
            "total_inputs": len(generator.sample_inputs)
        })
        
    except Exception as e:
        logger.error(f"Model test error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    print("🚀 Starting AI Coding Exercise Server...")
    print("🤖 Loading AI model...")
    
    try:
        # Test if the model loads properly
        test_gen = CodeExerciseGenerator()
        print("✅ AI model loaded successfully!")
        print(f"📡 Server running on http://localhost:5000")
        print("🎯 Available endpoints:")
        print("   GET  /generate - Generate new problem")
        print("   POST /evaluate - Check solution")
        print("   GET  /health   - Health check")
        print("   GET  /debug    - Debug info")
        print("   GET  /test_model - Test model solution")
        
        app.run(host="0.0.0.0", port=5000, debug=True)
        
    except Exception as e:
        print(f"❌ Error starting server: {e}")
        print("💡 Make sure you have all required dependencies installed:")
        print("   pip install flask flask-cors torch transformers")
        raise