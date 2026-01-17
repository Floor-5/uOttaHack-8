async function promptRequest(prompt, model='xiaomi/mimo-v2-flash:free', constraints='Use only one sentence to respond.') {
    // Prompt an AI model with a request using the Python backend
    return await fetch(
        'http://127.0.0.1:5000/api/prompt',
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt,
                model,
                constraints
            })
        }
    ).then(resp => resp.json());
}

async function getData() {
    // Stuff to do when button!
    try {
        promptRequest('What is the meaning of life?').then(data => {
            console.log(data);
            document.getElementById('display').innerText = data.message;
        })

        promptRequest('Why is the sky blue?').then(data => {
            console.log(data);
            document.getElementById('display').innerText = data.message;
        })

        promptRequest('2+2').then(data => {
            console.log(data);
            document.getElementById('display').innerText = data.message;
        })
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

async function promptAllModels(prompt, constraints='Use only one sentence to respond.') {
    return await fetch(
        'http://127.0.0.1:5000/api/prompt-all',
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                prompt,
                constraints
            })
        }
    ).then(resp => resp.json())
}

async function submitLesson() {
    // Get all user-submitted data
    lesson_topic = document.querySelector("#lesson_topic").value.trim()
    lesson_content = document.querySelector("#lesson_content").value.trim()
    loading_icon = document.querySelector("#loading")

    loading_icon.style.display = "block"

    if (lesson_topic == "" || lesson_content == "") {
        alert("Missing lesson input value");
        return undefined
    }

    // Make a POST request. Submits the lesson topic and user lesson overview to the backend, which will reply with AI-generated questions
    allQuestions = fetch(
        'http://127.0.0.1:5000/api/post-lesson',
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                topic: lesson_topic,
                lesson: lesson_content
            })
        }
    ).then(resp => resp.json())

    // Log the promise
    console.log(allQuestions)

    // Wait for the promise to resolve
    allQuestions.then((data) => {
        // Hide the loading indicators
        loading_icon.style.display = "none"
        document.querySelector("#questions").innerText = questionobj.questions.join("\n\n");

        // Parse the JSON inside the data
        parseddata = [];
        for(questionarray of data) {
            parseddata.append(JSON.parse(questionarray))
        }

        console.log(parseddata);
    });
    
    return data;
}