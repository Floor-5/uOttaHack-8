# Flask
from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
# File and data management
import time
import json
# Threads
import threading
from concurrent.futures import ThreadPoolExecutor

# Consistent strategy for querying AIs
import api_interface

MODELS = [
    "xiaomi/mimo-v2-flash:free",
    "xiaomi/mimo-v2-flash:free",
    "xiaomi/mimo-v2-flash:free",
    "deepseek/deepseek-v3.2",
    # "google/gemini-3-flash-preview",
    # "anthropic/claude-sonnet-4.5",
    #"openai/gpt-oss-120b", # Costs $$  ELIMINATED due to refusing instructions
    #"allenai/molmo-2-8b:free", # Eliminated due to refusing instructions
    "google/gemini-2.0-flash-lite-001" # Costs $$
]

# APP INIT
app = Flask(__name__)
CORS(app)

# HOME ROUTE
@app.route("/")
def home():
    return render_template("index.html")

# POST request for Direct AI agent prompt
@app.route('/api/prompt', methods=['POST'])
def execute_prompt():
    # Save the initial time and JSON arguments
    args = request.get_json()

    # Get the provided arguments
    prompt = args.get('prompt')
    model = args.get('model') or "xiaomi/mimo-v2-flash:free"
    constraints = args.get('constraints')

    return api_interface.prompt_AI(prompt, constraints, model, temperature=0)

# Topic Management
topic = "Basic structure of an atom" # What topic the user is responsible for teaching
lesson_overview = [] # A list of "subtopics" that the user must cover in order to get a good score
questions = [] # A list of questions asked by each model, anonymized so Gemini isn't biased

def promptAll(prompt: str, constraints: str):
    # Save the initial time
    init_time = time.time()

    def query_model(model):
        # Use the api_interface to prompt the AIs
        return api_interface.prompt_AI(
            prompt=prompt,
            constraints=constraints,
            model=model,
            temperature=0.2
        )

    # Use ThreadPoolExecutor to run all requests concurrently
    with ThreadPoolExecutor(max_workers=len(MODELS)) as executor:
        responseArray = list(executor.map(query_model, MODELS))

    return {
        "questions": [response["message"] for response in responseArray],
        "total_tokens": sum([response["tokens"] for response in responseArray]),
        "total_time": time.time() - init_time #time elapsed for all AI calls
    }

@app.route('/api/post-lesson', methods=["POST"])
def postLesson():
    global questions, lesson_overview, topic
    # Takes the user's input lesson data and returns AIs' questions
    # Save the JSON arguments
    args = request.get_json()
    lesson = args.get('lesson')
    topic = args.get('topic')

    # Append the first piece of data to the lesson overview (the user's input)
    lesson_overview.append(lesson) 
    
    print(lesson_overview)

    # Prompt all AI models concurrently.
    question_responses = promptAll(f'You are a middle school-level student learning about "${topic}"; The teacher\'s lesson is the following: "${lesson}".\nFind 5 questions to ask the teacher from easy to more challenging to push the teacher with their teaching skills.', constraints="Reply with a list of objects with key 'question' (str) and 'difficulty' (int from 0-3 where 0 is easy). The list should be contained in a single key, 'responses'.")

    print(question_responses)

    questions = question_responses['questions']
    return jsonify(question_responses)

def query_lesson_overview():
    # Gemini, acting as an expert on the topic, will generate a lesson overview
    response = api_interface.prompt_AI(
        prompt=('Generate a short lesson overview in an array for the topic "' + topic + '".'),
        constraints=('You are an expert on "' + topic + '" teaching at an intermediary level. If you choose to include any math, it should be in KaTeX format, surrounded by $.'),
        model="google/gemini-2.0-flash-lite-001"
    )

    return response

# RUNNER
if __name__ == "__main__":
    app.run(debug=True)