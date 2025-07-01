from flask import Flask, render_template, request, jsonify
from codegen_model import CodeExerciseGenerator
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)
generator = CodeExerciseGenerator()

@app.route("/")
def index():
    return render_template("html.html")   # serve html.html at root

@app.route("/login")
def login():
    return render_template("login.html")   # serve login.html

@app.route("/signup")
def signup():
    return render_template("signup.html")  # serve signup.html

@app.route("/generate", methods=["GET"])
def generate():
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
            "status": "success"
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
    try:
        data = request.get_json()
        user_code = data.get("user_code", "")
        
        logger.info("=== EVALUATING USER SOLUTION ===")
        logger.info(f"User code:\n{user_code}")
        
        if not user_code.strip():
            logger.info("Empty code submitted")
            return jsonify({
                "is_correct": False,
                "feedback": "Please enter your code before checking",
                "suggested_code": generator.truncated_solution,
                "feedback_type": "empty"
            })
        
        logger.info("Comparing user solution with model solution...")
        logger.info(f"User code length: {len(user_code)} characters")
        logger.info(f"Expected function name: {generator.expected_function_name}")
        logger.info(f"Available sample inputs: {len(generator.sample_inputs)}")
        
        # Compare with model solution
        is_correct, feedback = generator.evaluate_solution(user_code)
        
        logger.info(f"=== EVALUATION RESULT ===")
        logger.info(f"Result: {is_correct}")
        logger.info(f"Feedback: {feedback}")
        logger.info(f"Total sample inputs tested: {len(generator.sample_inputs)}")
        
        # Simple feedback type
        feedback_type = "correct" if is_correct else "incorrect"
        
        response = {
            "is_correct": is_correct,
            "feedback": feedback,
            "feedback_type": feedback_type,
            "suggested_code": generator.truncated_solution,
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
            "suggested_code": generator.truncated_solution if hasattr(generator, 'truncated_solution') else "",
            "error_details": str(e)  # Include error details for debugging
        }), 500

@app.route("/debug", methods=["GET"])
def debug_info():
    """Debug endpoint to check generator state"""
    try:
        debug_data = {
            "has_problem": bool(generator.problem_description),
            "has_solution": bool(generator.full_solution),
            "function_name": generator.expected_function_name,
            "sample_inputs_count": len(generator.sample_inputs),
            "sample_inputs": generator.sample_inputs[:3] if generator.sample_inputs else [],  # Show first 3
            "problem_description": generator.problem_description[:200] + "..." if len(generator.problem_description) > 200 else generator.problem_description,
            "full_solution": generator.full_solution,
            "truncated_solution": generator.truncated_solution,
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
    app.run(host="localhost", port=5000, debug=True)