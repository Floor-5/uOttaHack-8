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

async function setTopic(value = null) {
    // Send the specified topic to the backend, or the value of the #lesson_topic element, or the fallback topic
    let lesson_topic = (value ? value : (document.querySelector("#lesson_topic") ? document.querySelector("#lesson_topic").value.trim() : 'The basic model of a cell'))

    return await fetch('/api/post-topic', { method: "POST", headers: { "Content-Type": "application/json" }, body: 
        JSON.stringify({
            topic: lesson_topic
        })
    }).then(r => r.json())
}

async function submitLesson(lesson = null) {
    // This function submits a lesson, waits for a response and then afterwards returns the questions asked by each LLM.

    // Get all user-submitted data
    let lesson_content = (lesson ? lesson : (document.querySelector("#lesson_content") ? document.querySelector("#lesson_content").value.trim() : ''))

    // If the lesson content is missing
    if (lesson_content == "") {
        throw new Error("Missing lesson input value");
    }

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

    // Wait for the promise to resolve
    let data = await allQuestions;

    // Store the questions in a global variable
    questions = data;
    
    return questions;
}

async function submitAnswers(answers = []) {
    // Submits an array of answers to be processed by the backend. The length of the answers array must be equal to the globally stored questions array, both on the front and backend.
    
    // This function will return graded feedback
    return await fetch('/api/post-answers', { method: "POST", headers: { "Content-Type": "application/json" }, body: 
        JSON.stringify({
            answers
        })
    }).then(r => r.json())
}

function enterDoor() {
    const transition = document.getElementById("transition");
    const door = document.querySelector(".door");
    document.getElementById("whiteboard-text").style.display = "block";

    const btn = document.querySelector(".door-btn");
    const roomImage = document.getElementById("room-image");

    btn.disabled = true;

    // Start fade overlay
    transition.classList.remove("fade-in");
    transition.classList.add("fade-out");

    door.classList.add("vanish");

    setTimeout(() => {
        // Swap content behind the door
        document.querySelector(".door-title").innerText = "ROOM 1";
        document.getElementById("display").innerText = "You entered the whiteboard room!";
        document.body.style.backgroundColor = "#c2b280";
        roomImage.style.display = "block";
        document.getElementById("whiteboard-svg").style.display = "block";


        // Fade overlay back in
        transition.classList.remove("fade-out");
        transition.classList.add("fade-in");

        // Re-enable button after fade-in
        setTimeout(() => btn.disabled = false, 600);
    }, 600);
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function switchToClassroom() {
    const transition = document.getElementById("transition");
    const roomImage = document.getElementById("room-image");
    const classroomImage = document.getElementById("classroom-image");
    const whiteboardSvg = document.getElementById("whiteboard-svg");
    const whiteboardText = document.getElementById("whiteboard-text");
    const speechBubble = document.getElementById("speechBubble");
    // Start fade overlay
    transition.classList.remove("fade-in");
    transition.classList.add("fade-out");

    setTimeout(() => {
        // Swap to classroom
        document.querySelector(".door-title").innerText = "ROOM 2";
        document.getElementById("display").innerText = "You entered the classroom!";
        roomImage.style.display = "none";
        whiteboardSvg.style.display = "none";
        whiteboardText.style.display = "none";
        classroomImage.style.display = "block";
        speechBubble.style.display = "block";
    }, 600)

    // Fade overlay back in
    transition.classList.remove("fade-out");
    transition.classList.add("fade-in");

    // Show loading screen
    showLoadingScreen();
    await wait(3000); // show it for 3 seconds
    hideLoadingScreen();
}

let students = [];
class Student {
    constructor(eleid, name,top,left,width,imgpath) {
        this.eleid = eleid;
        this.name = name;
        this.img = null; // store the DOM element
        students.push(this);
        this.top = top 
        this.left = left 
        this.width = width 
        this.imgPath = imgpath
    }

    drawOnScreen() {
        if (this.img) this.img.remove();

        this.img = document.createElement("img");
        this.img.src = this.imgpath;
        this.img.id = this.eleid;
        this.img.style.position = "absolute";
        this.img.style.top = this.top;
        this.img.style.left = this.left;
        this.img.style.width = this.width;
        this.img.style.height = "auto";
        this.img.style.imageRendering = "pixelated";
        this.img.style.zIndex = 10;

        // Add it to the DOM
        document.body.appendChild(this.imgpath);
    }
}
// a 
let loadingInterval;

function showLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    const loadingText = document.getElementById("loading-text");
    let dots = 1;

    loadingScreen.style.display = "flex";

    // Animate dots
    loadingInterval = setInterval(() => {
        dots = dots % 3 + 1; // cycle 1 → 2 → 3 → 1
        loadingText.textContent = "Loading" + ".".repeat(dots);
    }, 500);
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById("loading-screen");
    clearInterval(loadingInterval);
    loadingScreen.style.display = "none";
}

