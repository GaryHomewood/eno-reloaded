window.ENO = (function(){
    'use strict';

    const SAMPLES = {
        'Bass clarinet': [
            { note: 'B', octave: 2, file: 'samples/bass-clarinet/bass_clarinet-b2.wav'},
            { note: 'B', octave: 3, file: 'samples/bass-clarinet/bass_clarinet-b3.wav'},
            { note: 'B', octave: 4, file: 'samples/bass-clarinet/bass_clarinet-b4.wav'},
            { note: 'D', octave: 2, file: 'samples/bass-clarinet/bass_clarinet-d2.wav'},
            { note: 'D', octave: 3, file: 'samples/bass-clarinet/bass_clarinet-d3.wav'},
            { note: 'D', octave: 4, file: 'samples/bass-clarinet/bass_clarinet-d4.wav'},
            { note: 'D', octave: 5, file: 'samples/bass-clarinet/bass_clarinet-d5.wav'},
            { note: 'F', octave: 2, file: 'samples/bass-clarinet/bass_clarinet-f2.wav'},
            { note: 'F', octave: 3, file: 'samples/bass-clarinet/bass_clarinet-f3.wav'},
            { note: 'F', octave: 4, file: 'samples/bass-clarinet/bass_clarinet-f4.wav'},
            { note: 'G#', octave: 2, file: 'samples/bass-clarinet/bass_clarinet-g#2.wav'},
            { note: 'G#', octave: 3, file: 'samples/bass-clarinet/bass_clarinet-g#3.wav'},
            { note: 'G#', octave: 4, file: 'samples/bass-clarinet/bass_clarinet-g#4.wav'}
        ]
    };

    const OCTAVE = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    var app = {};
    //var audioContext = window.AudioContext || window.webkitAudioContext;
    var con = new (window.AudioContext || window.webkitAudioContext)();
    var loops = null;

    function flatToSharp(note) {
        switch (note) {
            case 'Bb': return 'A#';
            case 'Db': return 'C#';
            case 'Eb': return 'D#';
            case 'Gb': return 'F#';
            case 'Ab': return 'G#';
            default: return note;
        }
    }

    function noteValue(note, octave) {
        return octave * 12 + OCTAVE.indexOf(note);
    }

    function getNoteDistance(note1, octave1, note2, octave2) {
        return noteValue(note1, octave1) - noteValue(note2, octave2);
    }

    function getNearestSample(samples, note, octave) {
        let sortedSamples = samples.slice().sort((sampleA, sampleB) => {
            let distanceToA = Math.abs(getNoteDistance(note, octave, sampleA.note, sampleA.octave));
            let distanceToB = Math.abs(getNoteDistance(note, octave, sampleB.note, sampleB.octave));
            return distanceToA - distanceToB;
        });
        return sortedSamples[0];
    }

    function fetchSample(path) {
        return fetch(encodeURIComponent(path))
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => con.decodeAudioData(arrayBuffer));
    }

    function getSample(instrument, noteAndOctave) {
        let [, note, octave] = /^(\w[b#]?)(\d)$/.exec(noteAndOctave);
        note = flatToSharp(note);
        octave = parseInt(octave, 10);

        let samples = SAMPLES[instrument];
        let sample = getNearestSample(samples, note, octave);
        let distance = getNoteDistance(note, octave, sample.note, sample.octave);

        return fetchSample(sample.file)
            .then(audioBuffer =>
                ({
                    audioBuffer: audioBuffer,
                    distance: distance
                })
            );
    }

    app.player = function (instrument, note) {
        fetchSample('samples/AirportTerminal.wav')
            .then(
                convolverBuffer => {
                    let convolver = con.createConvolver();
                    convolver.buffer = convolverBuffer;
                    convolver.connect(con.destination);
                    app.playSample(instrument, note, convolver, 0, 1);
                }
            );
    };

    app.playSample = function (instrument, note, destination, delay = 0) {
        getSample(instrument, note)
            .then(({audioBuffer, distance}) => {
                let node = con.createBufferSource();
                node.buffer = audioBuffer;

                let playbackRate = Math.pow(2, distance / 12);
                node.playbackRate.value = playbackRate;

                node.connect(destination);
                node.start(con.currentTime + delay);
            });
    };

    app.playLoops = function (instrument, note, destination, loopLength, delay) {
        app.playSample(instrument, note, destination, delay);
        loops = setInterval(
            () => app.playSample(instrument, note, destination, delay),
            loopLength * 1000
        );
    };

    app.startLoops = function (instrument, note, loopLength, delay) {
        fetchSample('samples/AirportTerminal.wav')
            .then(
                convolverBuffer => {
                    let convolver = con.createConvolver();
                    convolver.buffer = convolverBuffer;
                    convolver.connect(con.destination);

                    app.playLoops('Bass clarinet', 'F2', convolver, 19.7, 4.0);
                    app.playLoops('Bass clarinet', 'Ab2', convolver, 17.8, 8.1);
                    app.playLoops('Bass clarinet', 'C3', convolver, 21.3, 5.6);
                    app.playLoops('Bass clarinet', 'Db3', convolver, 22.1, 12.6);
                    app.playLoops('Bass clarinet', 'Eb3', convolver, 18.4, 9.2);
                    app.playLoops('Bass clarinet', 'F3', convolver, 20.0, 14.1);
                    app.playLoops('Bass clarinet', 'Ab3', convolver, 17.7, 3.1);
                }
            );
    };

    app.stopLoops = function() {
        clearInterval(loops);
    };

    return app;
})();
