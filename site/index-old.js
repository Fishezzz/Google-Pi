import express from 'express';
var Gpio = require('onoff').Gpio;

var LED = new Gpio(25, 'out');
var LedR = new Gpio(5, 'out');
var LedG = new Gpio(6, 'out');
var LedB = new Gpio(13, 'out');

const app = express();
const PORT = 3000;
var server = app.listen(PORT);
var io = require('socket.io').listen(server);

const record = require('node-record-lpcm16');
const Speaker = require('speaker');
const path = require('path');
const GoogleAssistant = require('google-assistant');
const speakerHelper = require('./examples/speaker-helper');
const readline = require('readline');

const config = {
    auth: {
        keyFilePath: path.resolve(__dirname, '/home/pi/Downloads/client_secret_77242431490-ioc2e07e06825hl7samhc1u27vpsitnf.apps.googleusercontent.com.json'),
        // where you want the tokens to be saved
        // will create the directory if not already there
        savedTokensPath: path.resolve(__dirname, '/home/pi/express/express-app/token.json'),
    },
    // this param is optional, but all options will be shown
    conversation: {
        audio: {
            encodingIn: 'LINEAR16', // supported are LINEAR16 / FLAC (defaults to LINEAR16)
            sampleRateIn: 16000, // supported rates are between 16000-24000 (defaults to 16000)
            encodingOut: 'LINEAR16', // supported are LINEAR16 / MP3 / OPUS_IN_OGG (defaults to LINEAR16)
            sampleRateOut: 24000, // supported are 16000 / 24000 (defaults to 24000)
        },
        lang: 'en-US', // language code for input/output (defaults to en-US)
    },
};

const assistant = new GoogleAssistant(config.auth);

// starts a new conversation with the assistant
const startConversation = (conversation) => {
    // setup the conversation and send data to it
    // for a full example, see `examples/mic-speaker.js`
    console.log('Say something!');
    let openMicAgain = false;

    conversation
        // send the audio buffer to the speaker
        .on('audio-data', (data) => {
            speakerHelper.update(data);
        })
        // done speaking, close the mic
        .on('end-of-utterance', () => {
            record.stop();
        })
        // just to spit out to the console what was said (as we say it)
        .on('transcription', (data) => {
            console.log('Transcription:', data.transcription, ' --- Done:', data.done);
        })
        // what the assistant said back
        .on('response', text => {
            if (text != "") {
                console.log('Assistant Text Response:', text);
                io.emit('message', text);
            }
        })
        // if we've requested a volume level change, get the percentage of the new level
        .on('volume-percent', (percent) => {
            console.log('New Volume Percent:', percent);
        })
        // the device needs to complete an action
        .on('device-action', (action) => {
            console.log(action.inputs[0].payload.commands[0].execution[0].command);
            console.log(action.inputs[0].payload.commands[0].execution[0].params);
            if (action.inputs[0].payload.commands[0].execution[0].command == 'com.example.actions.LEDcolor') {
                var params = action.inputs[0].payload.commands[0].execution[0].params;
                if (params.device == 'RGB LED') {
                    switch (params.color) {
                        case 'blue':
                            LedR.writeSync(0); //set pin state to 0 (turn LED off)
                            LedG.writeSync(0); //set pin state to 0 (turn LED off)
                            LedB.writeSync(1); //set pin state to 1 (turn LED on)
                            break;
                        case 'red':
                            LedR.writeSync(1); //set pin state to 1 (turn LED on)
                            LedG.writeSync(0); //set pin state to 0 (turn LED off)
                            LedB.writeSync(0); //set pin state to 0 (turn LED off)
                            break;
                        case 'green':
                            LedR.writeSync(0); //set pin state to 0 (turn LED off)
                            LedG.writeSync(1); //set pin state to 1 (turn LED on)
                            LedB.writeSync(0); //set pin state to 0 (turn LED off)
                            break;
                        case 'yellow':
                            LedR.writeSync(1); //set pin state to 1 (turn LED on)
                            LedG.writeSync(1); //set pin state to 1 (turn LED on)
                            LedB.writeSync(0); //set pin state to 0 (turn LED off)
                            break;
                        case 'white':
                            LedR.writeSync(1); //set pin state to 1 (turn LED on)
                            LedG.writeSync(1); //set pin state to 1 (turn LED on)
                            LedB.writeSync(1); //set pin state to 1 (turn LED on)
                            break;
                        default:
                            LedR.writeSync(0); //set pin state to 0 (turn LED off)
                            LedG.writeSync(0); //set pin state to 0 (turn LED off)
                            LedB.writeSync(0); //set pin state to 0 (turn LED off)
                            break;
                        // code block
                    }
                }
                else console.log("fout device")
            }
       })
        // once the conversation is ended, see if we need to follow up
        .on('ended', (error, continueConversation) => {
            if (error) {
                console.log('Conversation Ended Error:', error);
            }
            else if (continueConversation) {
                openMicAgain = true;
            } else {
                console.log('Conversation Complete');
            }
        })
        // catch any errors
        .on('error', (error) => {
            console.log(config.conversation.textQuery);
            console.log('Conversation Error:', error);
        });

    // pass the mic audio to the assistant
    const mic = record.start({
        threshold: 0.5,
        silence: 1.0,
        recordProgram: 'arecord', 
        device: 'plughw:1,0'
    });
    mic.on('data', (data) => {
        conversation.write(data);
        //assistant.start(config.conversation);
    });

    // setup the speaker
    const speaker = new Speaker({
        channels: 1,
        sampleRate: config.conversation.audio.sampleRateOut,
    });
    speakerHelper.init(speaker);
    speaker
        .on('open', () => {
            console.log('Assistant Speaking');
            speakerHelper.open();
        })
        .on('close', () => {
            console.log('Assistant Finished Speaking');
            if (openMicAgain) assistant.start(config.conversation);
        });
};

const promptForInput = (pData) => {
    config.conversation.textQuery = pData;
    assistant.start(config.conversation);
    config.conversation.textQuery = undefined;
};


// setup the assistant
assistant
    .on('ready', () => {
        // start a conversation!
        assistant.start(config.conversation);
    })
    .on('started', startConversation)
    .on('error', (error) => {
        console.log('Assistant Error:', error);
    });


app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/index.html');
});

app.use(express.static(path.join(__dirname, 'public')));

io.on('connection', function (socket) {
    socket.on('textInput', function (data) {
        promptForInput(data);
    });
});