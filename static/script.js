async function getData() {
    try {
        const response = await fetch('http://127.0.0.1:5000/api/data');
        const data = await response.json(); //Convert JSON string to JS object
        console.log(data.message); // Outputs: "Connected to Python! "
        document.getElementById('display').innerText = data.message;
    } catch (error) {
        console.error('Error fetching data:', error);
    }
}

function enterDoor() {
    const transition = document.getElementById("transition");

    // Fade out
    transition.classList.add("active");

    setTimeout(() => {
        document.body.style.backgroundColor = "#2a2a2a";
        document.querySelector(".door-title").innerText = "";
        document.getElementById("display").innerText = "New screen";
        // fade in 
        transition.classList.remove("active");
    }, 600);
}
