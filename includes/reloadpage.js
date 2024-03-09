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

    // socket = io.connect('http://192.168.0.98:8000'); // TP-Link
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
    
    // socket.emit('reload', data);
    publishIt('reload', data);
}

function publishIt(key, data) {

    // time test
    pubnub.time(function (status, response) {
        if (status.error) {
            // handle error if something went wrong based on the status object
        } else {
            console.log(response.timetoken);
        }
    });

    pubnub.publish({
        message: {
            [key]: data
        },
        channel: 'JeremyMuller_Arpanet',
        storeInHistory: false
        },
        function (status, response) {
            if (status.error) {
                // handle error
                console.log(status)
            } else {
                console.log(response.timetoken);
            }
    });
}

window.addEventListener("load", init);
