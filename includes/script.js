//
// script.js
// by Jeremy Muller
// This is used to control the Arpanet devices
//

let startButton, text, wrapper;

// web socket
let socket;

// let clock;
let start = false;
let mm_offset = 0;
let noSleep = new NoSleep();
let metIndex = 0; // I have to use this because transport time isn't always accurate enough
let clickOn = false;
let pubnub;

let audioContext = null;
let mainVolume;
let scheduleAheadTime = 0.1; // How far ahead toschedule audio (sec)
// TODO: should i just add score.js and grab all the info from it?!?!

// global timings
let tempo = 120.0;
let secondsPerBeat = 60.0 / tempo;
let timeSignature = 3;
let bar = timeSignature * secondsPerBeat;

// rhythms
let r4 = secondsPerBeat;
let r8 = 0.5 * secondsPerBeat;
let r16 = 0.25 * secondsPerBeat;

let fundFreq = 200;
const scale = [60, 62, 63, 65, 67, 69, 70, 72];

const tonalityDiamond = [
    [1, 9/8, 5/4, 11/8, 3/2, 7/4], 
    [16/9, 1, 10/9, 11/9, 12/9, 14/9],
    [8/5, 9/5, 1, 11/10, 6/5, 7/5],
    [16/11, 18/11, 20/11, 1, 12/11, 14/11],
    [4/3, 9/6, 5/3, 11/6, 1, 7/6],
    [8/7, 9/7, 10/7, 11/7, 12/7, 1]
];

// let impulse = new Tone.NoiseSynth({
//     "noise": {
//         "type": "white"
//     },
//     "envelope": {
//         "attack": 0.005,
//         "decay": 0.1,
//         "sustain": 0,
//         "release": 0.1
//     }
// });

// let filter = new Tone.Filter({
//     "type": "bandpass",
//     "frequency": 1000,
//     "Q": 100,
//     "gain": 0
// }).toMaster();

// let boost = new Tone.Multiply(10);
// impulse.chain(filter, boost, Tone.Master);

// let metronome = new Tone.Loop(function (time) {
//     if (clickOn) {
//         if (metIndex == 0) filter.frequency.value = 3000;
//         else filter.frequency.value = 2000;
//         impulse.triggerAttackRelease(0.1, time, 0.9);
//     }
//     metIndex = (metIndex + 1) % 4;
// }, "4n");

function midiToFreq(note) {
    return 440 * Math.pow(2, ((note-69)/12.0));
}

function getNow() {
    return audioContext.currentTime + scheduleAheadTime;
}

function playMetronome(startTime, noteDuration, rate, endLoop) {
    if (Score.getPlayhead() <= startTime) {
        let beat = 0;
        let i = 0;
        let currentNote = startTime;
        while (currentNote < endLoop) {
            // only play the audible click if the toggle is on
            if (clickOn)
                playImpulseWave((beat == 0) ? 3000 : 2000, currentNote, noteDuration);

            beat = (beat+1) % Score.timeSignature;
            i++;
            currentNote = startTime + (i*rate);
        }
    }
}

function playImpulseWave(freq, startTime, duration) {
    impulseWave(freq, startTime+getNow(), duration);
}

function impulseWave(freq, startTime, duration) {
    let bufferSize = audioContext.sampleRate * 0.5;
    // let bufferSize = 1;
    let buffer = audioContext.createBuffer(2, bufferSize, audioContext.sampleRate);

    for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
        const data = buffer.getChannelData(channel);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1; //random samples so it's white noise
        }
    }


    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // let gain = audioContext.createGainNode();
    let env = audioContext.createGain();


    let filter = new BiquadFilterNode(audioContext, {frequency: freq, Q: 100, type: "bandpass"});
    let gain = audioContext.createGain();
    gain.gain.value = 20;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(env);
    env.connect(mainVolume);

    env.gain.setValueAtTime(1, startTime);
    env.gain.linearRampToValueAtTime(0, startTime+duration);


    source.start(startTime);
    source.stop(startTime+duration);

    // let squareClick = audioContext.createOscillator();
    // squareClick.type = "square";
    // squareClick.frequency.value = freq;

    // squareClick.connect(mainVolume);

    // squareClick.start(startTime);
    // squareClick.stop(startTime+duration);
}

function draw() {
    if (start) requestAnimationFrame(draw);

    // document.getElementsByTagName("p")[0].innerHTML = "audio context: " + Tone.now().toFixed(3);
    // document.querySelector('p').textContent = Tone.now().toFixed(3);


    // document.querySelector('span').textContent = "bars: " + Tone.Time(transport).toBarsBeatsSixteenths();

    // let transport = Tone.Transport.seconds.toFixed(3);
    // var time = Tone.Time(transport).toBarsBeatsSixteenths();
    // var index1 = time.indexOf(':');
    // var index2 = time.indexOf(':', index1 + 1);
    // var bars = time.slice(0, index1);
    // var beat = time.slice(index1 + 1, index2);

    // var b = parseInt(bars);
    // // document.getElementById("timer").innerHTML = ++b;
    // document.getElementById("timer").innerHTML = b;
    // if (b < 100) {
    //     if (b < 10) {
    //         document.getElementById("timer").innerHTML = "00" + bars + beat;
    //     } else {
    //         document.getElementById("timer").innerHTML = "0" + bars + beat;
    //     }
    // } else {
    //     document.getElementById("timer").innerHTML = "" + bars + beat;
    // }

    let beats = document.getElementsByClassName("beat");
    for (let i = 0; i < beats.length; i++) {
        beats[i].style.opacity = 0;
    }
}

function buttonAction() {
    // wrapper.remove();
    wrapper.style.display = "none";
    document.getElementById("timer").style.display = "inline";
    document.getElementById("resetButton").style.display = "inline";

    noSleep.enable();

    // Tone.Transport.start(Tone.now(), mm_offset);
    playMetronome(0+mm_offset, r16, r4, bar*100);
    start = true;
    publishIt(0+mm_offset);
    draw();
    // metronome.start();
}

function init() {
    audioContext = new AudioContext();

    // socket = io.connect('http://10.0.0.213:8000');
    // socket = io.connect('http://192.168.11.123:8000'); // Netgear flashrouter
    // socket = io.connect('http://192.168.0.98:8000'); // TP-Link
    // socket = io.connect('http://10.0.1.4:8000'); // apple router
    // socket = io.connect('http://10.42.0.179:8000'); // Pi router
    // socket = io.connect('http://localhost:8000');

    let w = window.innerWidth;
    let h = window.innerHeight;
    const data = {
        'width': w,
        'height': h
    };
    // socket.emit('window', data);
    publishIt('window', data);
    
    let draggableElems;
    draggableElems = document.querySelectorAll('.draggable');
    let draggies = [];
    let toggles = [];

    for (let i = 0; i < toggles.length; i++) {
        toggles[i] = false;
    }

    let g = 150; // * (4/3.0);
    for (let i = 0; i < draggableElems.length; i++) {
        let draggableElem = draggableElems[i];
        draggableElem.id = i;
        let draggie = new Draggabilly(draggableElem, {
            containment: true,
            grid: [g, g],
        });
        let randX = ~~(Math.random() * 6);
        let randY = ~~(Math.random() * 7);
        let pos = draggie.position;
        // console.log("rand x: " + randX + ", rand y: " + randY);
        // console.log("randX: " + randX);
        console.log("position: " + draggie.position.x + ", " + draggie.position.y);
        draggie.setPosition(pos.x + (randX*g), pos.y + (randY*g));
        draggie.on('staticClick', () => {
            if (toggles[i]) {
                draggableElems[i].style.background = '#555';
                draggableElems[i].style.opacity = 0.7;
                toggles[i] = false;
                
                // sending messages
                // socket.emit('noteOff', {'id': i});
                publishIt('noteOff', {'id': i});
            } else {
                draggableElems[i].style.background = '#F90';
                draggableElems[i].style.opacity = 1.0;
                toggles[i] = true;

                let posX = Math.round(draggie.position.x / g);
                let posY = Math.round(draggie.position.y / g);

                // let step = ~~((posX+1) / 7 * 12) - 1;
                // let fundFreq = midiToFreq(45 + step);

                // let freq = (8 - posY) * fundFreq; // fundamental Hz
                // let freq = tonalityDiamond[posY][posX] * fundFreq;
                // console.log("freq: " + freq);
                const data = {
                    'freq': 55,
                    // 'note': scale[i] + ((4-posY) * 12),
                    'id': i,
                    'position': [posX, posY]
                };
                
                // sending messages
                // socket.emit('noteOn', data);
                publishIt('noteOn', data);
            }
        });
        draggie.on('dragEnd', () => {
            // console.log("pointer moved");
            let posX = Math.round(draggie.position.x / g);
            let posY = Math.round(draggie.position.y / g);
            // let freq = tonalityDiamond[posY][posX] * fundFreq;
            const data = {
                // 'note': scale[i] + ((4-posY) * 12),
                'freq': 100,
                'id': i,
                'position': [posX, posY]
            }
            console.log(data['position']);
            // console.log("new position: " + draggie.position.x + ", " + draggie.position.y);
            // socket.emit('moved', data);
            publishIt('moved', data);
        });
        draggies.push(draggie);
    }

    // let dutySlider = document.querySelector('.duty-slider');
    let dutySlider = new Draggabilly(document.querySelector('.duty-slider'), {
        containment: true,
        axis: 'x',
        grid: [50, 50]
    });

    dutySlider.on('dragEnd', () => {
        // TODO: send duty cycles
        let duty = dutySlider.position.x / 50 / 8;
        if (duty == 0) duty = 0.05;
        const data = {
            'dutycycle' : duty
        };
        console.log(duty);
        // socket.emit('moved', data);
        publishIt('moved', data);
    });

    let gateSlider = new Draggabilly(document.querySelector('.gate-slider'), {
        containment: true,
        axis: 'x',
        grid: [25, 25]
    });

    gateSlider.on('dragEnd', () => {
        let gate = gateSlider.position.x / 25 / 10;
        const data = {
            'gatelength' : gate
        };
        console.log(gate);
        // socket.emit('moved', data);
        publishIt('moved', data);
    });

    let tempoSlider = new Draggabilly(document.querySelector('.tempo-slider'), {
        containment: true,
        axis: 'x',
        grid: [15, 15]
    });

    tempoSlider.on('dragEnd', () => {
        // TODO
        let tempo = tempoSlider.position.x / 15 * 2;
        const data = {
            'tempoRange' : tempo
        };
        console.log(tempo);
        // socket.emit('tempo', data);
        publishIt('tempo', data);
    });

    let modes = new Draggabilly(document.querySelector('.mode'), {
        containment: true,
        axis: 'x',
        grid: [75, 75]
    });

    modes.on('dragEnd', () => {
        let mode = modes.position.x / 75;
        const data = {
            'mode' : mode
        };
        console.log(mode);
        // socket.emit('modes', data);
        publishIt('modes', data);
    });



    // let draggie = new Draggabilly('.draggable');
    // draggie.setPosition(w/2, h/2);
    // draggie.dragEnd();

    // let seq = new Nexus.Sequencer('#sequencer', {
    //     'size': [w, h-50],
    //     'mode': 'toggle',
    //     'rows': 10,
    //     'columns': 5,
    //     'paddingRow': 2,
    //     'paddingColumn': 2
    // });


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

    // Subscribe
    // pubnub.addListener({
    //     message: function (m) {
    //         handleMessage(m);
    //     },
    //     presence: function (p) {
    //         console.log("occupancy: " + p.occupancy);
    //     }
    // });
    pubnub.subscribe({
        channels: ['JeremyMuller_Arpanet'],
        withPresence: false
    });
}

function reset() {
    start = false;
    publishIt(0);
    // metronome.stop();
    metIndex = 0;
    // Tone.Transport.stop();
    document.getElementById("resetButton").style.display = "none";
    wrapper.style.display = "inline";
    setTimeout(function () {
        document.getElementById("timer").innerHTML = "0";
        var beats = document.getElementsByClassName("beat");
        for (var i = 0; i < beats.length; i++) {
            beats[i].style.opacity = 0;
        }
    }, 100);
}

function inputChanged() {
    var v = document.getElementsByName("mm_num")[0].value;
    if (v == "") v = '0';
    mm_offset = Tone.Time(v+"m").toSeconds();
    console.log("seconds: " + mm_offset);
    document.getElementById("timer").innerHTML = v;
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
            // "number" : Math.floor(Math.random() * 360)
            [key]: data
            // "start": start,
            // "time": time
        },
        channel: 'JeremyMuller_Arpanet',
        storeInHistory: false
        },
        function (status, response) {
            if (status.error) {
                // handle error
                console.log(status)
            } else {
                // console.log("message published w/ server response: ", response);
                // console.log("message Published w/ timetoken", response.timetoken);
                console.log(response.timetoken);
            }
    });

    // pubnub.hereNow({
    //     channels: ['JeremyMuller_Orbitals'],
    //     includeUUIDs: true
    // },
    // function(status, response) {
    //     console.log(response);
    // });
}

window.addEventListener("load", init);
