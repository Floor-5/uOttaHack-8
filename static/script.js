// DOM ELEMENTS
const loadingScreenSection = document.querySelector("#loading-screen")
const transitionElement = document.querySelector("#transition")
const mainMenuSection = document.querySelector("#main-menu")
const whiteboardSection = document.querySelector("#whiteboard")
const classroomSection = document.querySelector("#classroom")
const finalScoreSection = document.querySelector("#final-score")

const STUDENT_IMAGES = [
    '/static/sprites/blueWchair.png',
    '/static/sprites/greenWchair.png',
    '/static/sprites/pinkWchair.png',
    '/static/sprites/purpleWchair.png',
    '/static/sprites/redWchair.png',
    '/static/sprites/yellowWchair.png'
]

let questions = [
    /*{ // A single questioner object. These are grouped according to the LLM that asked them and remain in that order.
        "questions": [ 
            {
                question: "Why?", // The question to be asked to the user, as a string
                difficulty: 0, // 0 is easy, 3 is hard
            }
        ]
    }*/
];
let topic = ""; // Keep track of the topic for display purposes
let allow_advance = true; // Whether the user is allowed to advance to the next screen

async function setTopic(value = document.querySelector("#topic_input").value.trim()) {
    // Send the specified topic to the backend, or the value of the #topic_input element, or the fallback topic
    let lesson_topic = (value ? value : 'The basic atomic model')

    // Store the topic
    topic = lesson_topic;
    document.getElementById("board-text").placeholder = 'Write your lesson about "' + topic + '"';

    // Advance to the whiteboard
    goToWhiteboard();
    
    // Post the topic to the backend
    allow_advance = false; // Lock the user from advancing until the POST request is complete
    await fetch('/api/post-topic', { method: "POST", headers: { "Content-Type": "application/json" }, body: 
        JSON.stringify({
            topic: lesson_topic
        })
    })
    allow_advance = true;
}

async function submitLesson(lesson = document.querySelector("#board-text").value.trim()) {
    // This function submits a lesson, waits for a response and then afterwards returns the questions asked by each LLM.

    // Get all user-submitted data
    let lesson_content = (lesson ? lesson : '')

    // Make a POST request. Submits the lesson topic and user lesson overview to the backend, which will reply with AI-generated questions relating to the topic
    let allQuestions = fetch(
        '/api/post-lesson',
        {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                lesson: lesson_content
            })
        }
    ).then(resp => resp.json())

    // Show the loading screen
    showLoadingScreen();

    // Wait for the promise to resolve
    let data = await allQuestions;

    // Store the questions in a global variable
    questions = data;

    // Create a student for each question
    let studentcontainer = document.getElementById("students-area");
    studentcontainer.innerHTML = '';

    students = []
    for(q of questions){
        // Looping sequence of characters
        i = questions.indexOf(q) % STUDENT_IMAGES.length
        s = new Student('Asker', STUDENT_IMAGES[i], q)

        students.push(s)
        studentcontainer.append(s.getElement())
    }

    // Switch to the classroom
    whiteboardSection.style.display = "none";
    classroomSection.style.display = "block";

    hideLoadingScreen();
    
    // Axe the first question
    askQuestion(questions[0]);

    return questions;
}

async function submitAnswers(answers = []) {
    // Submits an array of answers to be processed by the backend. The length of the answers array must be equal to the globally stored questions array, both on the front and backend.
    
    showLoadingScreen()

    // This function will return graded feedback
    let grades = await fetch('/api/post-answers', { method: "POST", headers: { "Content-Type": "application/json" }, body: 
        JSON.stringify({
            answers
        })
    }).then(r => r.json())

    console.log(grades)

    // Set final score details
    document.getElementById("stamp-result").innerHTML = grades.letter_grade;
    document.getElementById("feedback").innerHTML = '';
    for(fb of grades.feedback) {
        let el = document.createElement("li");
        el.innerHTML = fb;
        document.getElementById("feedback").append(el);
    }

    // Show final score page
    classroomSection.style.display = "none";
    finalScoreSection.style.display = "block";
    hideLoadingScreen()
}

// Collect the answers in a friendly format
let answers = [];
function askQuestion(questionobj = {}) {
    // Displays a question in the screen and awaits the answer
    document.getElementById("questionAsk").innerHTML = questionobj.question;
    document.getElementById("questionAnswer").value = '';

    let studentEls = Array.from(document.querySelectorAll('.student'))
    studentEls.forEach(student => {
        student.classList.toggle('highlighted', false)
    })
    
    let ind = questions.indexOf(questionobj);
    studentEls[ind].classList.toggle('highlighted', true);
}

function confirmAnswer() {
    let ans = document.getElementById("questionAnswer").value;
    answers.push(ans);

    if(questions.length != answers.length){
        // Ask the next question
        askQuestion(questions[answers.length]);
    } else {
        // There are no more questions to ask, proceed.
        console.log(submitAnswers(answers))
    }
}

function doTransition(time = 1.5) {
    transitionElement.style.animation = ``;
    transitionElement.style.animation = `transitionFade ${time}s ease-in-out forwards`;
}

function goToWhiteboard() {
    doTransition()
    setTimeout(() => {
        mainMenuSection.style.display = "none";
        whiteboardSection.style.display = "block";
    }, 900)
}

async function goToFinalScore() {
    showLoadingScreen();

    // Make master model give final grade here. The following function is for once the promise resolves
    setTimeout(() => {
        classroomSection.style.display = "none";
        finalScoreSection.style.display = "block";

        hideLoadingScreen();
    }, 1000)
}

let students = [];
class Student {
    constructor(name, imgpath=null, question={question:""}) {
        this.name = name;

        if(imgpath !== null) {
            this.imgpath = imgpath;
        } else {
            this.imgpath = STUDENT_IMAGES[Math.floor(Math.random() * STUDENT_IMAGES.length)];
        }
        
        this.question = question; // A question object. This is a dynamic reference to a list element
    }

    getElement() {
        let img = document.createElement("img");
        img.src = this.imgpath;
        img.style.imageRendering = "pixelated";
        img.style.zIndex = 10;

        img.classList = ['student'];

        // Return the image element
        return img
    }
}

let loadingInterval;

function showLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    const loadingText = document.getElementById("loading-text");
    let dots = 1;

    loadingScreen.style.display = "flex";

    // Animate dots
    loadingInterval = setInterval(() => {
        dots = dots % 3 + 1; // cycle 1 → 2 → 3 → 1
        loadingText.textContent = "Thinking" + ".".repeat(dots);
    }, 500);
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    clearInterval(loadingInterval);
    loadingScreen.style.display = "none";
}

