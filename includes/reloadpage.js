//
// reloadpage.js
// by Jeremy Muller
// This is used to control the Arpanet devices
//


// web socket
let socket;

function buttonAction() {
    // wrapper.remove();
    wrapper.style.display = "none";
    document.getElementById("reloadButton").style.display = "inline";
}

function init() {
    audioContext = new AudioContext();

    socket = io.connect('http://192.168.0.98:8000'); // TP-Link
    // socket = io.connect('http://192.168.11.123:8000'); // Netgear flashrouter
    // socket = io.connect('http://10.0.1.4:8000'); // apple router
    // socket = io.connect('http://10.0.0.213:8000');
    // socket = io.connect('http://localhost:8000');
    // socket = io.connect('ws://localhost:8000');

    // // create button
    // startButton = document.createElement("button");
    // startButton.onclick = buttonAction;
    // text = document.createTextNode("Start");
    // startButton.appendChild(text);
    // startButton.className = "splash";
    // startButton.id = "startButton";
    // wrapper = document.createElement("div");
    // wrapper.className = "wrapper";
    // // wrapper.id = "container";
    // wrapper.appendChild(startButton);
    // document.body.appendChild(wrapper);

}

function reset() {
    const data = {
        'reload' : true
    };
    
    socket.emit('reload', data);
}

window.addEventListener("load", init);
