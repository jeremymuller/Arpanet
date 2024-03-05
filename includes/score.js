/*********
 * All timing will be handled here
 * So before sending the times to the synth to be played, it will first convert the time to the audioContext time
 *********/

class Score {

    // global timings
    static tempo = 120.0;
    static secondsPerBeat = 60.0 / Score.tempo;
    static timeSignature = 3;
    static bar = Score.timeSignature * Score.secondsPerBeat;

    static isPlaying = false;
    static scoreTime = 0;
    static startTime = 0;
    static timeline = [];

    // rhythms
    static r2 = Score.secondsPerBeat * 2;
    static r4 = Score.secondsPerBeat;
    static r8 = 0.5 * Score.secondsPerBeat;
    static r16 = 0.25 * Score.secondsPerBeat;
    static r32 = Score.r16 / 2.0;

    static r3 = Score.r4 * (1/3.0);
    static r5 = Score.r4 * (1/5.0);
    static r6 = Score.r4 * (1/6.0);

    static midiToFreq(note) {
        return 440 * Math.pow(2, ((note-69)/12.0));
    }

    static midiToRate(note) {
        return Math.pow(2, ((note-69)/12.0));
    }

    static atMM(mm) {
        // let seconds = Score.bar * (mm-1);
        // return seconds - Score.getPlayhead() + getNow();
        return Score.bar * (mm-1) - Score.startTime; // gives measures in playhead seconds
    }

    static getPlayhead() {
        return getNow() - Score.scoreTime;
    }

    // static toAudioContextTime(time) {
    //     return getNow() + Score.playhead + time;
    // }

    static coinFlip(probability) {
        return (Math.random() < probability);
    }

    static playMetronome(startTime, noteDuration, rate, endLoop) {
        if (Score.getPlayhead() <= startTime) {
            let beat = 0;
            let i = 0;
            let currentNote = startTime;
            while (currentNote < endLoop) {
                Score.playImpulseWave((beat == 0) ? 3000 : 2000, currentNote, noteDuration);
                beat = (beat+1) % Score.timeSignature;
                i++;
                currentNote = startTime + (i*rate);
            }
        }
    }

    /*** These are how to control the synths with correct timings ***/

    static playTriBitWave(note, startTime, duration) {
        triBitWave(note, startTime+getNow(), duration);
    }

    static playPulseWave(note, dutycycle, startTime, duration) {
        pulseWave(note, dutycycle, startTime+getNow(), duration);
    }

    static playNoiseWave(pitch, startTime, duration) {
        noiseWave(pitch, startTime+getNow(), duration);
    }

    static playImpulseWave(freq, startTime, duration) {
        impulseWave(freq, startTime+getNow(), duration);
    }

    /***************************************************************/

    static playRandomNoiseSequence(startTime, noteDuration, rate, endLoop) {
        // will pick random pitches
        // let r = ~~(Math.random() * 7);
        let randomPitches = [];
        for (let i = 0; i < endLoop/rate; i++) {
            randomPitches[i] = ~~(Math.random() * 7);
        } 
        Score.playNoiseSequence(randomPitches, startTime, noteDuration, rate, endLoop);
    }

    static playNoiseSequence(pitches, startTime, noteDuration, rate, endLoop) {
        if (Score.getPlayhead() <= startTime) {
            let i = 0;
            let currentNote = startTime;
            while (currentNote < endLoop) {
                let index = i % pitches.length;
                Score.playNoiseWave(pitches[index], currentNote, noteDuration);
                i++;
                currentNote = startTime + (i*rate);
            }
        }
    }

    static playPulseSequence(notes, dutycycles, startTime, noteDuration, rate, endLoop) {
        if (Score.getPlayhead() <= startTime) {
            let i = 0;
            let currentNote = startTime;
            while (currentNote < endLoop) {
                let index = i % notes.length;
                let duty = dutycycles[i % dutycycles.length];
                Score.playPulseWave(notes[index], duty, currentNote, noteDuration);
                i++;
                currentNote = startTime + (i*rate);
            }
        }
    }

    static playTriSequence(notes, startTime, noteDuration, rate, endLoop) {
        if (Score.getPlayhead() <= startTime) {
            let i = 0;
            let currentNote = startTime;
            while (currentNote < endLoop) {
                let index = i % notes.length;
                Score.playTriBitWave(notes[index], currentNote, noteDuration);
                i++;
                currentNote = startTime + (i*rate);
            }
        }
    }

    static playRhythmicSequence(rhythms, noisePitch, startTime, rate) {
        if (Score.getPlayhead() <= startTime) {
            let currentNote = startTime;
            for (let i = 0; i < rhythms.length; i++) {
                if (rhythms[i] != 0) {
                    if (i == rhythms.length-1)
                        rate *= 0.5;
                    Score.playNoiseWave(noisePitch, currentNote, rate * rhythms[i]);
                    currentNote += (rate * rhythms[i]);
                } else {
                    currentNote += rate;
                }
            }
        }
    }

    static playStaccatoRhythmicSequence(rhythms, noisePitch, startTime, rate) {
        if (Score.getPlayhead() <= startTime) {
            let currentNote = startTime;
            for (let i = 0; i < rhythms.length; i++) {
                if (rhythms[i] != 0) {
                        let r = rate * 0.5;
                    Score.playNoiseWave(noisePitch, currentNote, r * rhythms[i]);
                    currentNote += (rate * rhythms[i]);
                } else {
                    currentNote += rate;
                }
            }
        }
    }

    // TODO: generic sequencer
    static playSequence(notes, startTime, noteDuration, rate, endLoop) {
        if (Score.getPlayhead() <= startTime) {
            let i = 0;
            let currentNote = startTime;
            while (currentNote < endLoop) {
                let index = i % notes.length;
                squareWave(notes[index], currentNote, noteDuration);
                i++;
                currentNote = startTime + (i*rate);
            }
        }
    }

    static scheduleEvent(callback, time) {
        callback(time);
    }

    static init(startMM) {
        Score.isPlaying = true;
        Score.scoreTime = getNow();
        Score.startTime = Score.bar * (startMM-1); // in seconds

    }

    static rhythmMatrix631 = [5, 0, 0, 0, 0, 0, 2, 0, 0, 0, 3, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 2, 0, 1, 0, 1, 0, 0, 1, 0, 2, 0, 0, 1, 0, 1, 0, 3, 0, 0, 0, 0, 3, 0, 1, 0, 1];
    static rhythmMatrix631Staccato = [1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 1, 0, 1, 0, 1, 0, 0, 1, 0, 1, 1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 1, 0, 1];

    static play(startMM) {
        Score.init(startMM);

        Score.playMetronome(Score.atMM(1), Score.r16, Score.r4, Score.atMM(100));

        // Score.playRhythmicSequence(Score.rhythmMatrix631, 5, Score.atMM(2), Score.r16);
        // Score.playRhythmicSequence(Score.rhythmMatrix631, 5, Score.atMM(7), Score.r16);
        // Score.playStaccatoRhythmicSequence(Score.rhythmMatrix631Staccato, 5, Score.atMM(12), Score.r16);
        // Score.playStaccatoRhythmicSequence(Score.rhythmMatrix631Staccato, 5, Score.atMM(17), Score.r16);

        // // Score.playMetronome(Score.atMM(1), Score.r16, Score.r4, Score.atMM(100));
        // Score.playRhythmicSequence(Score.rhythmMatrix631, 2, Score.atMM(8), Score.r4);
        // Score.playRhythmicSequence(Score.rhythmMatrix631, 2, Score.atMM(28), Score.r8);

        // if (Score.coinFlip(0.5)) {
        //     Score.playRhythmicSequence(Score.rhythmMatrix631, 2, Score.atMM(38), Score.r8);
        //     Score.playRhythmicSequence(Score.rhythmMatrix631, 3, Score.atMM(48), Score.r8);
        // }
        // else {
        //     Score.playRhythmicSequence(Score.rhythmMatrix631Staccato, 4, Score.atMM(42), Score.r4);
        //     Score.playRhythmicSequence(Score.rhythmMatrix631Staccato, 6, Score.atMM(62), Score.r4);
        // }





        // pulseWave(72, 0.5, Score.atMM(2), Score.r4);
        // pulseWave(74, 0.5, Score.atMM(2)+Score.r4, Score.r4);
        // pulseWave(75, 0.5, Score.atMM(2)+Score.r2, Score.r4);

        // pulseWave(75, 0.5, Score.atMM(1), Score.r4);

        // Score.scheduleEvent((time) => {
        //     Score.playPulseSequence([77, 82, 80], [0.5, 0.125], time, Score.r16, Score.r16, Score.atMM(14));
        // }, Score.atMM(1));

        // Score.scheduleEvent((time) => {
        //     Score.playPulseSequence([56, 60, 62, 56+12, 60+12, 62+12], [0.125, 0.25, 0.5, 0.75, 0.5], time, Score.r32, Score.r32, time + Score.bar*4);

        // }, Score.atMM(1));


        // if (Math.random() < 0.5) {
        //     Score.playPulseSequence([56, 60, 62, 56+12, 60+12, 62+12], [0.125], Score.atMM(1), Score.r32, Score.r32, Score.atMM(2));
        //     Score.playPulseSequence([56, 60, 63, 56+12, 60+12, 63+12], [0.25], Score.atMM(2), Score.r32, Score.r32, Score.atMM(3));
        //     Score.playPulseSequence([56, 62, 63, 56+12, 62+12, 63+12], [0.5], Score.atMM(3), Score.r32, Score.r32, Score.atMM(4));
        //     Score.playPulseSequence([60, 62, 63, 60+12, 62+12, 63+12], [0.75], Score.atMM(4), Score.r32, Score.r32, Score.atMM(5));
            
        //     Score.playPulseSequence([56, 60, 67, 56+12, 60+12, 67+12], [0.125], Score.atMM(5), Score.r32, Score.r32, Score.atMM(6));
        //     Score.playPulseSequence([56, 62, 67, 56+12, 62+12, 67+12], [0.25], Score.atMM(6), Score.r32, Score.r32, Score.atMM(7));
        //     Score.playPulseSequence([60, 62, 67, 60+12, 62+12, 67+12], [0.5], Score.atMM(7), Score.r32, Score.r32, Score.atMM(8));
        //     Score.playPulseSequence([56, 63, 67, 56+12, 63+12, 67+12], [0.75], Score.atMM(8), Score.r32, Score.r32, Score.atMM(9));
        //     Score.playPulseSequence([60, 63, 67, 60+12, 63+12, 67+12], [0.125], Score.atMM(9), Score.r32, Score.r32, Score.atMM(10));
        //     Score.playPulseSequence([62, 63, 67, 62+12, 63+12, 67+12], [0.25], Score.atMM(10), Score.r32, Score.r32, Score.atMM(11));
        // } else {
        //     Score.playTriSequence([56, 60, 62, 56+12, 60+12, 62+12], Score.atMM(1), Score.r32, Score.r32, Score.atMM(2));
        //     Score.playTriSequence([56, 60, 63, 56+12, 60+12, 63+12], Score.atMM(2), Score.r32, Score.r32, Score.atMM(3));
        //     Score.playTriSequence([56, 62, 63, 56+12, 62+12, 63+12], Score.atMM(3), Score.r32, Score.r32, Score.atMM(4));
        //     Score.playTriSequence([60, 62, 63, 60+12, 62+12, 63+12], Score.atMM(4), Score.r32, Score.r32, Score.atMM(5));
         
        //     Score.playTriSequence([56, 60, 67, 56+12, 60+12, 67+12, 56-12, 60-12, 67-12, 56, 60, 67], Score.atMM(5), Score.r32, Score.r32, Score.atMM(6));
        //     Score.playTriSequence([56, 62, 67, 56+12, 62+12, 67+12, 56-12, 62-12, 67-12, 56, 62, 67], Score.atMM(6), Score.r32, Score.r32, Score.atMM(7));
        //     Score.playTriSequence([60, 62, 67, 60+12, 62+12, 67+12, 60-12, 62-12, 67-12, 60, 62, 67], Score.atMM(7), Score.r32, Score.r32, Score.atMM(8));
        //     Score.playTriSequence([56, 63, 67, 56+12, 63+12, 67+12, 56-12, 63-12, 67-12, 56, 63, 67], Score.atMM(8), Score.r32, Score.r32, Score.atMM(9));
        //     Score.playTriSequence([60, 63, 67, 60+12, 63+12, 67+12, 60-12, 63-12, 67-12, 60, 63, 67], Score.atMM(9), Score.r32, Score.r32, Score.atMM(10));
        //     Score.playTriSequence([62, 63, 67, 62+12, 63+12, 67+12, 62-12, 63-12, 67-12, 62, 63, 67], Score.atMM(10), Score.r32, Score.r32, Score.atMM(11));
        // }

        // Score.playRandomNoiseSequence(Score.atMM(1), Score.r32, Score.r16, Score.atMM(10));

        // if (Math.random() < 0.5) {
        //     Score.playSequence([70, 78], Score.atMM(30), Score.r16, Score.r16, Score.atMM(31) + Score.r4 * 3);
        //     Score.playSequence([72, 78], Score.atMM(31) + Score.r4 * 3, Score.r16, Score.r16, Score.atMM(33));
        // } else {
        //     Score.playSequence([70, 78], Score.atMM(30), Score.r16, Score.r16, Score.atMM(31));
        //     Score.playSequence([72, 78], Score.atMM(31), Score.r16, Score.r16, Score.atMM(31) + Score.r4*3);
        //     Score.playSequence([73, 78], Score.atMM(31) + Score.r4*3, Score.r16, Score.r16, Score.atMM(33));
        // }

        // Score.playSequence([75, 78], Score.atMM(33), Score.r16, Score.r16, Score.atMM(35) + Score.r4*3);

        // Score.playSequence([72, 74, 75, 77, 79], getNow(), 0.09, Score.r5, getNow() + Score.bar);
    }
}