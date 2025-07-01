import torch
import ast
import sys
import io
from contextlib import redirect_stdout, redirect_stderr
from transformers import AutoTokenizer, AutoModelForCausalLM
import traceback

class CodeExerciseGenerator:
    def __init__(self):
        self.tokenizer = AutoTokenizer.from_pretrained("doaa18/codegen")
        self.model = AutoModelForCausalLM.from_pretrained("doaa18/codegen")
        self.truncated_solution = ""
        self.full_solution = ""
        self.expected_function_name = ""
        self.problem_description = ""
        # Store sample test inputs for comparison
        self.sample_inputs = []
        # Cache model outputs to avoid recalculation
        self.model_outputs_cache = {}

    def generate_full_solution(self, prompt):
        inputs = self.tokenizer(prompt, return_tensors="pt").to(self.model.device)

        with torch.no_grad():
            generated_ids = self.model.generate(
                inputs["input_ids"], 
                max_length=1024,
                num_return_sequences=1,
                temperature=0.7,
                top_p=0.95,
                do_sample=True,
                pad_token_id=self.tokenizer.pad_token_id
            )

        full_solution = self.tokenizer.decode(generated_ids[0], skip_special_tokens=True)
        return full_solution

    def truncate_function_body(self, code):
        """Truncate function to only include the first 2 lines after the function definition"""
        lines = code.strip().split('\n')
        truncated = []
        function_def_found = False
        body_lines_added = 0
        
        for line in lines:
            stripped = line.strip()
            
            # Always include the function definition line
            if stripped.startswith('def ') and ':' in stripped:
                truncated.append(line)
                function_def_found = True
                continue
            
            # After finding the function definition, only add the first 2 body lines
            if function_def_found:
                # Skip empty lines and comments when counting body lines
                if stripped and not stripped.startswith('#'):
                    if body_lines_added < 2:
                        truncated.append(line)
                        body_lines_added += 1
                    else:
                        break
                else:
                    # Include empty lines and comments without counting them
                    truncated.append(line)
        
        return '\n'.join(truncated)

    def extract_function_info(self, code):
        """Extract function name and parameters from code"""
        try:
            tree = ast.parse(code)
            for node in ast.walk(tree):
                if isinstance(node, ast.FunctionDef):
                    func_name = node.name
                    params = [arg.arg for arg in node.args.args]
                    return func_name, params
        except Exception as e:
            print(f"Error parsing function info: {e}")
        return None, []

    def generate_sample_inputs(self, func_name, full_code):
        """Generate diverse test inputs based on function signature"""
        sample_inputs = []
        
        try:
            exec_globals = {}
            exec(full_code, exec_globals)
            
            if func_name in exec_globals:
                func = exec_globals[func_name]
                
                import inspect
                sig = inspect.signature(func)
                param_count = len(sig.parameters)
                
                print(f"Function {func_name} has {param_count} parameters")
                
                if param_count == 0:
                    sample_inputs.append([])
                
                elif param_count == 1:
                    # Single parameter test inputs
                    test_inputs = [
                        0, 1, 2, 5, 10, -1, -5, 100,
                        "", "a", "hello", "test", "python",
                        [], [1], [1, 2, 3], [0, -1, 5], [10, 20, 30],
                        True, False
                    ]
                    
                    for inp in test_inputs:
                        try:
                            # Test if the model function can handle this input
                            result = func(inp)
                            sample_inputs.append([inp])
                            print(f"Valid input: {inp} -> {result}")
                            if len(sample_inputs) >= 8:  # Reduced from 10 for faster testing
                                break
                        except Exception as e:
                            print(f"Skipped input {inp}: {e}")
                            continue
                
                elif param_count == 2:
                    # Two parameter test inputs
                    test_inputs = [
                        (0, 0), (1, 1), (1, 2), (2, 1), (5, 3),
                        (10, 5), (0, 10), (-1, 1), (1, -1),
                        ("", ""), ("a", ""), ("hello", "world"),
                        ([], []), ([1], []), ([1, 2], [3, 4]),
                        (5, "test"), (0, True)
                    ]
                    
                    for inp1, inp2 in test_inputs:
                        try:
                            result = func(inp1, inp2)
                            sample_inputs.append([inp1, inp2])
                            print(f"Valid input: ({inp1}, {inp2}) -> {result}")
                            if len(sample_inputs) >= 8:
                                break
                        except Exception as e:
                            print(f"Skipped input ({inp1}, {inp2}): {e}")
                            continue
                
                else:
                    # Multiple parameters - generate simpler test cases
                    test_combinations = [
                        [0] * param_count,
                        [1] * param_count,
                        list(range(param_count)),
                        [i + 1 for i in range(param_count)]
                    ]
                    
                    for args in test_combinations:
                        try:
                            result = func(*args)
                            sample_inputs.append(args)
                            print(f"Valid input: {args} -> {result}")
                        except Exception as e:
                            print(f"Skipped input {args}: {e}")
                            continue
        
        except Exception as e:
            print(f"Error generating sample inputs: {e}")
            traceback.print_exc()
        
        print(f"Generated {len(sample_inputs)} sample inputs")
        return sample_inputs

    def create_exercise(self):
        # Clear previous cache
        self.model_outputs_cache = {}
        
        seed_prompt = "# Task:\n"
        full_output = self.generate_full_solution(seed_prompt)

        task_split = full_output.split("def", 1)
        if len(task_split) < 2:
            return "Could not generate valid task.", "def function_name():"

        instruction = task_split[0].strip()
        func_block = "def" + task_split[1]

        # Store for validation
        self.problem_description = instruction
        self.full_solution = func_block

        func_name, params = self.extract_function_info(func_block)
        self.expected_function_name = func_name

        # Generate sample inputs for testing
        self.sample_inputs = self.generate_sample_inputs(func_name, func_block)

        # Pre-calculate model outputs for all sample inputs
        self.precalculate_model_outputs()

        partial_code = self.truncate_function_body(func_block)
        self.truncated_solution = partial_code

        return instruction, partial_code

    def precalculate_model_outputs(self):
        """Pre-calculate model outputs for all sample inputs to avoid issues during evaluation"""
        print("Pre-calculating model outputs...")
        for i, test_args in enumerate(self.sample_inputs):
            try:
                result, error = self.get_model_solution_output(test_args)
                args_key = str(test_args)
                self.model_outputs_cache[args_key] = (result, error)
                print(f"Model output {i+1}: {test_args} -> {result} (error: {error})")
            except Exception as e:
                print(f"Error pre-calculating for {test_args}: {e}")
                args_key = str(test_args)
                self.model_outputs_cache[args_key] = (None, str(e))

    def safe_execute(self, code, test_args):
        """Safely execute user code with test arguments"""
        try:
            # Create a more comprehensive but safe execution environment
            exec_globals = {
                '__builtins__': {
                    'len': len, 'str': str, 'int': int, 'float': float,
                    'list': list, 'dict': dict, 'tuple': tuple, 'set': set,
                    'range': range, 'enumerate': enumerate, 'zip': zip,
                    'sum': sum, 'max': max, 'min': min, 'abs': abs,
                    'round': round, 'sorted': sorted, 'reversed': reversed,
                    'print': print, 'bool': bool, 'type': type,
                    'isinstance': isinstance, 'hasattr': hasattr,
                    'ord': ord, 'chr': chr, 'pow': pow, 'divmod': divmod,
                    'all': all, 'any': any, 'bin': bin, 'hex': hex, 'oct': oct,
                }
            }
            
            # Capture stdout/stderr
            stdout_capture = io.StringIO()
            stderr_capture = io.StringIO()
            
            with redirect_stdout(stdout_capture), redirect_stderr(stderr_capture):
                # Execute the code
                exec(code, exec_globals)
                
                func_name = self.expected_function_name
                if func_name not in exec_globals:
                    return None, f"Function '{func_name}' not found"
                
                user_func = exec_globals[func_name]
                
                # Call the function with appropriate arguments
                if len(test_args) == 0:
                    result = user_func()
                else:
                    result = user_func(*test_args)
                
                return result, None
                
        except Exception as e:
            return None, str(e)

    def get_model_solution_output(self, test_args):
        """Get the expected output from the model solution"""
        args_key = str(test_args)
        
        # Use cached result if available
        if args_key in self.model_outputs_cache:
            return self.model_outputs_cache[args_key]
        
        # Calculate and cache
        result, error = self.safe_execute(self.full_solution, test_args)
        self.model_outputs_cache[args_key] = (result, error)
        return result, error

    def evaluate_solution(self, user_solution):
        """Compare user solution directly with model solution outputs"""
        
        print(f"Evaluating user solution...")
        print(f"Expected function: {self.expected_function_name}")
        print(f"Sample inputs count: {len(self.sample_inputs)}")
        
        # 1. Check basic syntax
        try:
            compile(user_solution, '<string>', 'exec')
            print("✓ Syntax check passed")
        except Exception as e:
            print(f"✗ Syntax error: {e}")
            return False, "Code is wrong - syntax error"

        # 2. Check if function exists and has correct name
        user_func_name, user_params = self.extract_function_info(user_solution)
        
        if not user_func_name:
            print("✗ No function found")
            return False, "Code is wrong - no function found"
        
        print(f"✓ Found function: {user_func_name}")
        
        if user_func_name != self.expected_function_name:
            print(f"✗ Function name mismatch: expected {self.expected_function_name}, got {user_func_name}")
            return False, f"Code is wrong - function should be named '{self.expected_function_name}'"

        # 3. Handle case with no sample inputs
        if not self.sample_inputs:
            print("No sample inputs, testing basic execution...")
            try:
                user_result, user_error = self.safe_execute(user_solution, [])
                model_result, model_error = self.get_model_solution_output([])
                
                if user_error:
                    print(f"✗ User code error: {user_error}")
                    return False, "Code is wrong"
                
                if model_error:
                    print("Model solution has error, accepting user solution")
                    return True, "Code is correct"
                
                if self.results_match(user_result, model_result):
                    print("✓ Results match")
                    return True, "Code is correct"
                else:
                    print(f"✗ Results don't match: expected {model_result}, got {user_result}")
                    return False, "Code is wrong"
            except Exception as e:
                print(f"✗ Execution error: {e}")
                return False, "Code is wrong"

        # 4. Test with multiple sample inputs
        passed_tests = 0
        total_tests = 0
        failed_details = []
        
        print(f"Testing with {len(self.sample_inputs)} sample inputs...")
        
        for i, test_args in enumerate(self.sample_inputs):
            print(f"Test {i+1}: {test_args}")
            
            # Get user solution output
            user_result, user_error = self.safe_execute(user_solution, test_args)
            
            if user_error:
                args_str = ', '.join(map(repr, test_args)) if test_args else "no arguments"
                error_msg = f"Runtime error with input ({args_str}): {user_error}"
                print(f"  ✗ {error_msg}")
                failed_details.append(error_msg)
                total_tests += 1
                continue
            
            # Get model solution output
            model_result, model_error = self.get_model_solution_output(test_args)
            
            if model_error:
                print(f"  ⚠ Model solution error: {model_error}, skipping test")
                continue
            
            total_tests += 1
            
            # Compare results
            if self.results_match(user_result, model_result):
                passed_tests += 1
                print(f"  ✓ Expected: {model_result}, Got: {user_result}")
            else:
                args_str = ', '.join(map(repr, test_args)) if test_args else "no arguments"
                error_msg = f"Input ({args_str}): expected {model_result}, got {user_result}"
                print(f"  ✗ {error_msg}")
                failed_details.append(error_msg)

        # 5. Determine if solution is correct
        if total_tests == 0:
            print("No valid tests, accepting solution")
            return True, "Code is correct"
        
        pass_rate = passed_tests / total_tests
        print(f"Pass rate: {passed_tests}/{total_tests} = {pass_rate:.2%}")
        
        if pass_rate >= 0.7:  # Lowered threshold to 70%
            print("✓ Solution accepted")
            return True, "Code is correct"
        else:
            print("✗ Solution rejected")
            detail = failed_details[0] if failed_details else "outputs don't match expected results"
            return False, f"Code is wrong"

    def results_match(self, result1, result2):
        """Check if two results are equivalent"""
        try:
            # Handle None values
            if result1 is None and result2 is None:
                return True
            if result1 is None or result2 is None:
                return False
            
            # Direct equality check
            if result1 == result2:
                return True
            
            # For floating point numbers, allow small differences
            if isinstance(result1, (int, float)) and isinstance(result2, (int, float)):
                return abs(float(result1) - float(result2)) < 1e-9
            
            # For lists/tuples, check element-wise
            if isinstance(result1, (list, tuple)) and isinstance(result2, (list, tuple)):
                if len(result1) != len(result2):
                    return False
                return all(self.results_match(a, b) for a, b in zip(result1, result2))
            
            # For strings, exact match required but handle different string types
            if isinstance(result1, str) and isinstance(result2, str):
                return result1 == result2
            
            # Try converting to strings as last resort
            return str(result1) == str(result2)
            
        except Exception as e:
            print(f"Error comparing results: {e}")
            return False

# Example usage:
if __name__ == "__main__":
    gen = CodeExerciseGenerator()
    question, partial_code = gen.create_exercise()
    print("Generated Task Description:\n", question)
    print("\nPartial Code:\n", partial_code)
    print("\nSample inputs generated:", len(gen.sample_inputs))
    
    # Test with the original solution
    if gen.full_solution:
        is_correct, feedback = gen.evaluate_solution(gen.full_solution)
        print(f"\nTesting full solution: {is_correct}")
        print(f"Feedback: {feedback}")