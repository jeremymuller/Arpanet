//
// app.js
// by Jeremy Muller
// To be used in my piece "Arpanet" for mobile devices
//

/************* variables *************/
let startButton, text, wrapper;

let socket;

let anyOn = false;
let noteId;
let play = false;

let globalClock = 0;

let noSleep = new NoSleep();
let pubnub;

let audioContext = null;
let unlocked = false;
let lookahead = 25.0; // 100; // How frequently to call scheduling function (in milliseconds)
let scheduleAheadTime = 0.1; // How far ahead to schedule audio (sec)

let latency = 0.05; // when a note is pressed it will schedule slightly into the future which will introduce latency
let mainVolume; // I'll use this to control overall dynamics, crescendo/decrescendo, etc

let nextNoteTime = 0;
let currentNote = 0;

let notesInQueue = [];
let eventsTimeline = [];
let drawEvents = [];

// global timings
let tempo = 120.0;
const centerTempo = 120.0; // unchanging 
let secondsPerBeat = 60.0 / tempo;
let scoreTime = 0;

let isPlaying = false;
let isFirstTime = true;
let fundFreq = 55;
let arpLength = 5;
let currentHarmony = 0;
let dutycycle = 0.5;
const scale = [100, 200, 300, 400, 500];
let arpRhythm = 0.25;
let gateLength = 0.5;
let whichMode = 0;

let backgrounds = ['#000000', '#111111', '#222222', '#333333', '#444444', '#555555', '#666666', '#777777', '#888888', '#999999', '#AAAAAA', '#BBBBBB', '#CCCCCC', '#DDDDDD', '#EEEEEE', '#FFFFFF'];
let currentBGColor = backgrounds[0];

const harmonies = [
    [1, 2, 4],
    [1, 3, 9],
    [1, 5, 25],

    [1, 3, 5, 15],
    [1, 2, 3, 6],
    [1, 2, 5, 10],

    [2, 3, 4, 6, 12],
    [2, 3, 6, 9, 18],
    [2, 5, 10, 25, 50],
    [2, 4, 5, 10, 20],
    [3, 5, 15, 25, 75],
    [3, 5, 9, 15, 45],

    [1, 2, 5, 10, 25, 50],
    [1, 3, 5, 15, 25, 75],
    [1, 2, 3, 4, 6, 12],
    [1, 2, 4, 5, 10, 20],
    [1, 3, 5, 9, 15, 45],
    [1, 2, 3, 6, 9, 18],

    [2, 3, 5, 6, 10, 15, 30],

    [3, 5, 9, 15, 25, 45, 75, 225],
    [2, 3, 4, 6, 9, 12, 18, 36],
    [1, 2, 3, 5, 6, 10, 15, 30],
    [2, 4, 5, 10, 20, 25, 50, 100],

    [1, 2, 3, 4, 6, 9, 12, 18, 36],
    [1, 2, 4, 5, 10, 20, 25, 50, 100],
    [1, 3, 5, 9, 15, 25, 45, 75, 225],

    [2, 3, 5, 6, 9, 10, 15, 18, 30, 45, 90],
    [2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60],
    [2, 3, 5, 6, 10, 15, 25, 30, 50, 75, 150],
    [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 30, 60],
    [1, 2, 3, 5, 6, 9, 10, 15, 18, 30, 45, 90],
    [1, 2, 3, 5, 6, 10, 15, 25, 30, 50, 75, 150],
    [2, 3, 4, 5, 6, 9, 10, 12, 15, 18, 20, 30, 36, 45, 60, 90, 180],
    [1, 2, 3, 4, 5, 6, 9, 10, 12, 15, 18, 20, 30, 36, 45, 60, 90, 180],
    [2, 3, 4, 5, 6, 10, 12, 15, 20, 25, 30, 50, 60, 75, 100, 150, 300],
    [2, 3, 5, 6, 9, 10, 15, 18, 25, 30, 45, 50, 75, 90, 150, 225, 450],
    [1, 2, 3, 4, 5, 6, 10, 12, 15, 20, 25, 30, 50, 60, 75, 100, 150, 300],
    [1, 2, 3, 5, 6, 9, 10, 15, 18, 25, 30, 45, 50, 75, 90, 150, 225, 450],
    [2, 3, 4, 5, 6, 9, 10, 12, 15, 18, 20, 25, 30, 36, 45, 50, 60, 75, 90, 100, 150, 180, 225, 300, 450, 900],
    [1, 2, 3, 4, 5, 6, 9, 10, 12, 15, 18, 20, 25, 30, 36, 45, 50, 60, 75, 90, 100, 150, 180, 225, 300, 450, 900],

    [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 25, 30, 40, 50, 60, 75, 100, 120, 150, 200, 300, 600],
    [1, 2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 30, 36, 40, 45, 60, 72, 90, 120, 180, 360],
    [2, 3, 4, 5, 6, 8, 9, 10, 12, 15, 18, 20, 24, 25, 30, 36, 40, 45, 50, 60, 72, 75, 90, 100, 120, 150, 180, 200, 225, 300, 360, 450, 600, 900, 1800]
];

console.log(harmonies[42]);

function addEvent(timeline, callback, time, options) {
    timeline.push({"time": time, "callback": callback, "opts": options});
    // callback(time);
}

// function drawLoop() {
//     // if (start) requestAnimationFrame(drawLoop);

//     if (audioContext) {
    
//         while (drawEvents.length && drawEvents[0].time <= audioContext.currentTime) {
//             const event = drawEvents[0];
//             if (event && playhead - event.time <= 0.25) {
//                 metIndex = event.beat;
//                 event.callback();
//                 drawEvents.splice(0, 1);
//             }
//         }    
//     }

//     if (start && drawEvents.length > 0) 
//         requestAnimationFrame(drawLoop);
// }

function scheduleNextEvent() {
    if (start) {
        while (eventsTimeline.length && eventsTimeline[0].time < getPlayhead() + scheduleAheadTime) {
            // remove past events and prevents scheduling negative times for web audio
            if (eventsTimeline[0].time - getPlayhead() < 0) {
                eventsTimeline.splice(0, 1);
            } else {
                // console.log("time: " + eventsTimeline[0].time);
                // console.log("playhead + schedule ahead: " + (getPlayhead()+scheduleAheadTime));
                let beat = eventsTimeline[0].beat;
    
                // only play the audible click if the toggle is on
                if (clickOn) {
                    // eventsTimeline[0].callback((beat == 0) ? 3000 : 2000, eventsTimeline[0].time - getPlayhead(), r16);
                    let time = eventsTimeline[0].time - getPlayhead();
                    eventsTimeline[0].callback(time, beat);
                }
                
                eventsTimeline.splice(0, 1);
            }
        }

        setTimeout(scheduleNextEvent, lookahead);
    }
}


/************** synths **************/

function noiseWave(pitch, startTime, duration) {
    const sr = [100, 500, 1000, 2000, 4000, 8000, 10000];

    let bufferSize = 2 * audioContext.sampleRate; // 2 seconds (might need more)
    let downsampleBuffer = audioContext.createBuffer(2, bufferSize, audioContext.sampleRate);

    let interval = ~~(audioContext.sampleRate / sr[pitch]);
    let int = interval;
    let randCrush = [];
    let r = Math.random() * 2 - 1;
    for (let i = 0; i < bufferSize; i++) {
        randCrush[i] = r;
        interval--;
        if (interval < 0) {
            r = Math.random() * 2 - 1;
            interval = int;
        }
    }

    for (let channel = 0; channel < downsampleBuffer.numberOfChannels; channel++) {
        let output = downsampleBuffer.getChannelData(channel);
        // let interval = ~~(audioContext.sampleRate / sr[pitch]);

        // let int = interval;
        // let randCrush = Math.random() * 2 - 1;
        for (let i = 0; i < bufferSize; i++) {
            output[i] = randCrush[i];
            // output[i] = randCrush;
            // interval--;
            // if (interval < 0) {
            //     randCrush = Math.random() * 2 - 1;
            //     interval = int;
            // }
        }
    }
    
    let noiseCrush = audioContext.createBufferSource();
    noiseCrush.buffer = downsampleBuffer;
    noiseCrush.loop = true;

    noiseCrush.connect(mainVolume);

    noiseCrush.start(startTime);
    noiseCrush.stop(startTime+duration);
}

function triBitWave(note, startTime, duration) {
    let bufferSize = 512;
    let triangleBuffer = audioContext.createBuffer(2, bufferSize, audioContext.sampleRate);
    let triData = [8, 9, 10, 11, 12, 13, 14, 15, 15, 14.58, 14.58, 13.1, 11.46, 9.88, 8.7, 7.66, 6.64, 5.7, 4.76, 3.82, 2.88, 2.18, 1.46, 0.76, 0, 0, 1, 2, 3, 4, 5, 6, 7];

    // normalize
    for (let i = 0; i < triData.length; i++) {
        let tmp = triData[i];
        triData[i] = tmp / 15.0;
    }

    // populate buffer
    for (let channel = 0; channel < triangleBuffer.numberOfChannels; channel++) {
        let triOutput = triangleBuffer.getChannelData(channel);
        for (let i = 0; i < bufferSize; i++) {
            let index = ~~(i / 16); // drop decimal get only int
            triOutput[i] = triData[index];
        }
    }

    const source = audioContext.createBufferSource();
    source.buffer = triangleBuffer;
    source.loop = true;

    let rateAdjustment = 440 / (audioContext.sampleRate / bufferSize); // this gives us what 440 Hz will be
    source.playbackRate.value = rateAdjustment * Score.midiToRate(note); 

    let env = audioContext.createGain();
    env.connect(mainVolume);

    env.gain.setValueAtTime(1, startTime+0.07);
    env.gain.linearRampToValueAtTime(0, startTime+duration);

    source.connect(env);
    source.start(startTime);
    source.stop(startTime+duration);
}

let source = null;
const pulseBufferSize = 512;

function pulseWaveAttack(freq, dutycycle, startTime) {
    let pulseBuffer = audioContext.createBuffer(2, pulseBufferSize, audioContext.sampleRate);

    let offset = pulseBufferSize * dutycycle;
    // switch(dutycycle) {
    //     case 0.5:
    //         offset = pulseBufferSize / 2; // 50%
    //         break;
    //     case 0.25:
    //         offset = pulseBufferSize / 4; // 25%
    //         break;
    //     case 0.125:
    //         offset = pulseBufferSize / 8; // 12.5%
    //         break;
    //     case 0.75:
    //         offset = pulseBufferSize /2 + pulseBufferSize / 4;
    //         break;
    //     default:
    //         offset = pulseBufferSize / 2;
    //         break;
    // }

    for (let channel = 0; channel < pulseBuffer.numberOfChannels; channel++) {
        const buffer = pulseBuffer.getChannelData(channel);
        for (let i = 0; i < pulseBufferSize; i++) {
            buffer[i] = (i < offset) ? 0 : 1;
        }
    }

    // const source = audioContext.createBufferSource();
    source = audioContext.createBufferSource();
    source.buffer = pulseBuffer;
    source.loop = true;

    // let rateAdjustment = 440 / (audioContext.sampleRate / pulseBufferSize); // this gives us what 440 Hz will be
    // source.playbackRate.value = rateAdjustment * Score.midiToRate(note); 

    setFrequency(freq, startTime);

    if (whichMode != 1) {
        mainVolume.gain.setValueAtTime(1, startTime);
    } else {
        mainVolume.gain.setValueAtTime(0.2, startTime);
        if (Math.random() < 0.25) {
            mainVolume.gain.setValueAtTime(1, startTime);
        }
    }

    source.connect(mainVolume);

    source.start(startTime);
}

function pulseWaveRelease(time) {
    source.stop(time);
}

function setPitch(note, time) {
    let rateAdjustment = 440 / (audioContext.sampleRate / pulseBufferSize); // this gives us what 440 Hz will be
    source.playbackRate.setValueAtTime(rateAdjustment * Score.midiToRate(note), time); 
}

function setFrequency(freq, time) {
    let rateAdjustment = 440 / (audioContext.sampleRate / pulseBufferSize); // this gives us what 440 Hz will be
    source.playbackRate.setValueAtTime(rateAdjustment * (freq/440.0), time); 
}

// function pulseWave(note, dutycycle, startTime, duration) {
//     let pulseBufferSize = 512;
//     let pulseBuffer = audioContext.createBuffer(2, pulseBufferSize, audioContext.sampleRate);

//     let offset;
//     switch(dutycycle) {
//         case 0.5:
//             offset = pulseBufferSize / 2; // 50%
//             break;
//         case 0.25:
//             offset = pulseBufferSize / 4; // 25%
//             break;
//         case 0.125:
//             offset = pulseBufferSize / 8; // 12.5%
//             break;
//         case 0.75:
//             offset = pulseBufferSize /2 + pulseBufferSize / 4;
//             break;
//         default:
//             offset = pulseBufferSize / 2;
//             break;
//     }

//     for (let channel = 0; channel < pulseBuffer.numberOfChannels; channel++) {
//         const buffer = pulseBuffer.getChannelData(channel);
//         for (let i = 0; i < pulseBufferSize; i++) {
//             buffer[i] = (i < offset) ? 0 : 1;
//         }
//     }

//     // const source = audioContext.createBufferSource();
//     source.buffer = pulseBuffer;
//     source.loop = true;

//     let rateAdjustment = 440 / (audioContext.sampleRate / pulseBufferSize); // this gives us what 440 Hz will be
//     source.playbackRate.value = rateAdjustment * Score.midiToRate(note); 

//     source.connect(mainVolume);

//     source.start(startTime);
//     source.stop(startTime+duration);
// }

function squareWave(note, startTime, duration) {
    let square = audioContext.createOscillator();
    let env = audioContext.createGain();
    square.type = "square";
    square.frequency.value = Score.midiToFreq(note);

    // square.connect(audioContext.destination);
    square.connect(env);
    env.connect(mainVolume);
    square.start(startTime);
    square.stop(startTime+duration);

    let attack = 0.001;
    env.gain.linearRampToValueAtTime(0, startTime);
    env.gain.linearRampToValueAtTime(1, startTime+attack);
    // env.gain.linearRampToValueAtTime(0, startTime+duration-.5);

}

/*****************************/
/********* functions *********/
/*****************************/

function getNow() {
    return audioContext.currentTime + latency;
}

function getScheduleNow() {
    return audioContext.currentTime + scheduleAheadTime;
}

function getPlayhead() {
    return getNow() - scoreTime;
}

function setCurrentHarmony(h) {
    currentHarmony = h % harmonies.length;
}

function nextNote() {
    secondsPerBeat = 60.0 / tempo;

    nextNoteTime += arpRhythm * secondsPerBeat;

    // currentNote = ~~(Math.random() * arpLength);
    // currentNote = (currentNote + 1) % arpLength;
    currentNote = (currentNote + 1) % harmonies[currentHarmony].length;
    // if (currentNote == 0)
    //     currentNote = arpLength-1;
    // else
    //     currentNote--;
}

function scheduleNote(freq, time) {
    if (isPlaying) {
        // only need this if I'm drawing
        notesInQueue.push({
            'note': currentNote,
            'freq': freq,
            'time': time
        });

        pulseWaveAttack(freq, dutycycle, time);
        pulseWaveRelease(time + secondsPerBeat*(arpRhythm*gateLength));
    }
}

function scheduler() {
    while (nextNoteTime < getScheduleNow()) {
        let harm = harmonies[currentHarmony];
        let h = harm[currentNote];
        arpRhythm = 0.25;
        switch (whichMode) {
            case 0:            
                scheduleNote(fundFreq * h, nextNoteTime);
                break;
            case 1:            
                h = h < 25 ? h : h/2.0;
                scheduleNote(fundFreq * h, nextNoteTime);
                break;
            case 2:
                arpRhythm *= 8 / harm.length;
                scheduleNote(fundFreq * h, nextNoteTime);
                break;
            case 3:
                scheduleNote(fundFreq * 64 / h, nextNoteTime); // subharmonics // first tried multiplying by 50
                break;
            default:
                scheduleNote(fundFreq * h, nextNoteTime);
        }
        nextNote();
    }

    // if (isPlaying)
    setTimeout(scheduler, lookahead);
}

function buttonAction() {
    // everything that needs to happen when you press start
    if (!unlocked) {
        // play silent buffer to unlock the audio
        let buffer = audioContext.createBuffer(1, 1, 22050);
        let node = audioContext.createBufferSource();
        node.buffer = buffer;
        node.start(0);
        unlocked = true;
    }

    console.log("STARTED");
    wrapper.remove();
    play = true;

    noSleep.enable();

    scoreTime = getNow();
    // conductor();
    // metronome.start(); 

    // this adds metronome to events timeline
    // playArp(atMM(1), r16, r4, atMM(50));
    // scheduleNextEvent();
    // drawLoop();


    // squarePlay(75, getNow(), 2);
    // playSequence([60, 62, 63, 65], getNow(), 0.09, Score.r4, getNow() + Score.bar);
    // playSequence([72, 74, 75, 77, 79], getNow(), 0.09, Score.r5, getNow() + Score.bar);

    // web socket connect
    // socket = io.connect('http://10.0.0.213:8000');
    // socket = io.connect('http://192.168.0.98:8000'); // TP-Link
    // socket = io.connect('http://192.168.11.123:8000'); // Netgear flashrouter
    // socket = io.connect('http://10.0.1.4:8000'); // apple router
    // socket = io.connect('http://10.42.0.179:8000'); // Pi router
    // socket = io.connect('http://localhost:8000');
    // socket = io.connect('ws://localhost:8000');

    // socket.on('moved', (data) => {
    //     if (data['dutycycle'] != undefined) {
    //         dutycycle = data['dutycycle'];
    //         console.log("duty!!");
    //     }
    //     if (data['gatelength'] != undefined) {
    //         gateLength = data['gatelength'];
    //     }

    //     if (noteId == data['id']) {
    //         // setFrequency(data['freq'], audioContext.currentTime);
    //         let pos = data['position'];
    //         currentNote = 0;
    //         setCurrentHarmony(pos[0] + pos[1] * 6);
    //     }
    // });

    // socket.on('tempo', (data) => {
    //     let randRange = Math.random() * (data['tempoRange']*2) - data['tempoRange'];
    //     // console.log("randrange: " + randRange);
    //     tempo = centerTempo + randRange;
    //     console.log("tempo: " + tempo); 
    // });

    // socket.on('modes', (data) => {
    //     console.log("mode: " + data['mode']);
    //     whichMode = data['mode'];
    // });

    // socket.on('reload', (data) => {
    //     if (data['reload'])
    //         location.reload();
    // });

    // Subscribe
    pubnub.addListener({
        message: function (m) {
            handleMessage(m);
        },
        presence: function (p) {
            console.log("occupancy: " + p.occupancy);
        }
    });
    pubnub.subscribe({
        channels: ['JeremyMuller_Arpanet'],
        withPresence: true
    });

}

function drawLoop() {
    requestAnimationFrame(drawLoop);

    if (audioContext) {
        let currentTime = audioContext.currentTime;
        // console.log("time: " + currentTime);

        while(notesInQueue.length && notesInQueue[0].time < currentTime) {
            const event = notesInQueue[0];
            if (event && currentTime - event.time <= 0.25) {
                // currentNote = notesInQueue[0].note;
                // let rInd = ~~(Math.random() * backgrounds.length);
                // document.body.style.backgroundColor = backgrounds[rInd];
                document.body.style.backgroundColor = backgrounds[event.note];
                currentBGColor = backgrounds[event.note];
                
                // scene.background = new THREE.Color(backgrounds[event.note]);


                notesInQueue.splice(0, 1);
            }
        }
    }
}

function noteOn(data) {
    if (anyOn) {
        if (Math.random() < 0.5) {
            // setFrequency(data['freq'], audioContext.currentTime);
            fundFreq = data['freq'];
            noteId = data['id'];
            let pos = data['position'];
            currentNote = 0;
            setCurrentHarmony(pos[0] + pos[1] * 6);
        }
    } else {
        // pulseWaveAttack(data['freq'], 0.5, audioContext.currentTime)
        noteId = data['id'];
        nextNoteTime = getNow();
        console.log("app.js noteOn: " + data);
        isPlaying = true;
        fundFreq = data['freq'];
        let pos = data['position'];
        currentNote = 0;
        setCurrentHarmony(pos[0] + pos[1] * 6);
        if (isFirstTime) {
            scheduler();
            isFirstTime = false;
        }
    }
    // pulseWave(60, 0.5, audioContext.currentTime, Score.r4);
    anyOn = true;
}

function noteOff(data) {
    console.log("app.js noteOff: " + data);
    if (noteId == data['id']) {
        isPlaying = false;
        // pulseWaveRelease(getNow());
        anyOn = false;
    }
}

function moved(data) {
    if (data['dutycycle'] != undefined) {
        dutycycle = data['dutycycle'];
        console.log("duty!!");
    }
    if (data['gatelength'] != undefined) {
        gateLength = data['gatelength'];
        
    }
    
    if (data['id'] != undefined && noteId == data['id']) {
        // setFrequency(data['freq'], audioContext.currentTime);
        let pos = data['position'];
        currentNote = 0;
        setCurrentHarmony(pos[0] + pos[1] * 6);
    }
}

function setTempo(data) {
    let randRange = Math.random() * (data['tempoRange']*2) - data['tempoRange'];
    // console.log("randrange: " + randRange);
    tempo = centerTempo + randRange;
    console.log("tempo: " + tempo); 
}

function modes(data) {
    console.log("mode: " + data['mode']);
    whichMode = data['mode'];
}

function reload(data) {
    if (data['reload'])
        location.reload();
}

/************** helpers **************/

function init() {

    audioContext = new AudioContext();

    mainVolume = audioContext.createGain();
    mainVolume.gain.value = 1;
    mainVolume.connect(audioContext.destination);

    document.body.style.backgroundColor = '#000';

    // create button
    startButton = document.createElement("button");
    startButton.onclick = buttonAction;
    text = document.createTextNode("Tap to connect");
    startButton.appendChild(text);
    startButton.className = "splash";
    wrapper = document.createElement("div");
    wrapper.className = "wrapper";
    wrapper.id = "container";
    wrapper.appendChild(startButton);
    document.body.appendChild(wrapper);

    requestAnimationFrame(drawLoop);
}

function cleanUp() {
    pubnub.unsubscribe({
        channels: ['JeremyMuller_Arpanet']
    });
}

function handleMessage(m) {
    console.log("message: " + JSON.stringify(m.message));

    if (m.message.hasOwnProperty("noteOn")) noteOn(m.message['noteOn']);
    if (m.message.hasOwnProperty("noteOff")) noteOff(m.message['noteOff']);
    if (m.message.hasOwnProperty("moved")) moved(m.message['moved']);
    if (m.message.hasOwnProperty("tempo")) setTempo(m.message['tempo']);
    if (m.message.hasOwnProperty("modes")) modes(m.message['modes']);
    if (m.message.hasOwnProperty("reload")) reload(m.message['reload']);
}

window.addEventListener("load", init);
