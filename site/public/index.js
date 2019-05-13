//#region INIT & CONFIG */
const express = require('express');
const app = express();
const port = 3000;
const { hostname } = require('os');

const record = require('node-record-lpcm16');
const Speaker = require('speaker');
const path = require('path');
const GoogleAssistant = require('google-assistant');
const speakerHelper = require('./examples/speaker-helper');

const i2c = require('i2c-bus');
const TC74_ADDR = 0b1001000;

var Gpio = require('onoff').Gpio;
var Led1 = new Gpio(26, 'out');
var Led2 = new Gpio(19, 'out');
var Led3 = new Gpio(13, 'out'); // LedB
var Led4 = new Gpio(6, 'out');  // LedG
var Led5 = new Gpio(5, 'out');  // LedR
var Led6 = new Gpio(0, 'out');

var blinkInterval1, blinkInterval2, blinkInterval3, blinkInterval4, blinkInterval5, blinkInterval6;
var blinkCount1, blinkCount2, blinkCount3, blinkCount4, blinkCount5, blinkCount6 = 0;
var readTempSensor = false;
var temperature;
var IsSpeech;
var request;

var server = app.listen(port, hostname, () => {
    console.log(`Server running at http://${hostname}:${port}/`);
});    
var io = require('socket.io').listen(server, () => {
    console.log('socket.io running on server');
});    

const config = {
    auth: {
        keyFilePath: path.resolve(__dirname, '../../client_secret.json'),
        // where you want the tokens to be saved
        // will create the directory if not already there
        savedTokensPath: path.resolve(__dirname, '../tokens.json'),
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
    }
};
//#endregion INIT & CONFIG */

//#region FUNCTIONS */
function blinkLED1() {
    if (Led1.readSync() === 0) {
        Led1.writeSync(1);
        console.log('Turning on LED1...');
    }
    else {
        Led1.writeSync(0);
        console.log('Turning off LED1...');
    }

    blinkCount1--;
    if (blinkCount1 == 0) {
        clearInterval(blinkInterval1);
    }
}

function blinkLED2() {
    if (Led2.readSync() === 0) {
        Led2.writeSync(1);
        console.log('Turning on LED2...');
    }
    else {
        Led2.writeSync(0);
        console.log('Turning off LED2...');
    }

    blinkCount2--;
    if (blinkCount2 == 0) {
        clearInterval(blinkInterval2);
    }
}

function blinkLED3() {
    if (Led3.readSync() === 0) {
        Led3.writeSync(1);
        console.log('Turning on LED3...');
    }
    else {
        Led3.writeSync(0);
        console.log('Turning off LED3...');
    }

    blinkCount3--;
    if (blinkCount3 == 0) {
        clearInterval(blinkInterval3);
    }
}

function blinkLED4() {
    if (Led4.readSync() === 0) {
        Led4.writeSync(1);
        console.log('Turning on LED4...');
    }
    else {
        Led4.writeSync(0);
        console.log('Turning off LED4...');
    }

    blinkCount4--;
    if (blinkCount4 == 0) {
        clearInterval(blinkInterval4);
    }
}

function blinkLED5() {
    if (Led5.readSync() === 0) {
        Led5.writeSync(1);
        console.log('Turning on LED5...');
    }
    else {
        Led5.writeSync(0);
        console.log('Turning off LED5...');
    }

    blinkCount5--;
    if (blinkCount5 == 0) {
        clearInterval(blinkInterval5);
    }
}

function blinkLED6() {
    if (Led6.readSync() === 0) {
        Led6.writeSync(1);
        console.log('Turning on LED6...');
    }
    else {
        Led6.writeSync(0);
        console.log('Turning off LED6...');
    }
    
    blinkCount6--;
    if (blinkCount6 == 0) {
        clearInterval(blinkInterval6);
    }
}
//#endregion FUNCTIONS */

//#region ACTIONS */
const ComExampleCommandsMyDevices = (params) => {
    console.log('reached actions.device.commands.MyDevices');

    switch (params.device) {
        case 'LED 1':
            Led1.writeSync(params.status == 'ON' ? 1 : 0);
        break;
        case 'LED 2':
            Led2.writeSync(params.status == 'ON' ? 1 : 0);
        break;
        case 'LED 3':
            Led3.writeSync(params.status == 'ON' ? 1 : 0);
        break;
        case 'LED 4':
            Led4.writeSync(params.status == 'ON' ? 1 : 0);
        break;
        case 'LED 5':
            Led5.writeSync(params.status == 'ON' ? 1 : 0);
        break;
        case 'LED 6':
            Led6.writeSync(params.status == 'ON' ? 1 : 0);
        break;
        case 'ALL LEDS':
            Led1.writeSync(params.status == 'ON' ? 1 : 0);
            Led2.writeSync(params.status == 'ON' ? 1 : 0);
            Led3.writeSync(params.status == 'ON' ? 1 : 0);
            Led4.writeSync(params.status == 'ON' ? 1 : 0);
            Led5.writeSync(params.status == 'ON' ? 1 : 0);
            Led6.writeSync(params.status == 'ON' ? 1 : 0);
        break;
        default:
        break;
    }
}

const ComExampleCommandsTemperatureHome = (params) => {
    console.log('reached com.example.commands.TemperatureHome');
    if (params.device == 'TEMP SENSOR') {
        readTempSensor = true;
        const i2c1 = i2c.openSync(1);
        temperature = i2c1.readByteSync(TC74_ADDR, 0) + '°C';
        i2c1.closeSync();
    }
}

const ComExampleCommandsBlinkLight = (params) => {
    console.log('reached com.example.commands.BlinkLight');
    var delay;

    switch (params.device) {
        case 'SLOWLY':
            delay = 1000;
        break;
        case 'QUICKLY':
            delay = 250;
        break;
        default:
            delay = 500;
        break;
        default:
        break;
    }

    switch (params.device) {
        case 'LED 1':
            blinkCount1 = params.number * 2;
            blinkInterval1 = setInterval(blinkLED1, delay);
        break;
        case 'LED 2':
            blinkCount2 = params.number * 2;
            blinkInterval2 = setInterval(blinkLED2, delay);
        break;
        case 'LED 3':
            blinkCount3 = params.number * 2;
            blinkInterval3 = setInterval(blinkLED3, delay);
        break;
        case 'LED 4':
            blinkCount4 = params.number * 2;
            blinkInterval4 = setInterval(blinkLED4, delay);
        break;
        case 'LED 5':
            blinkCount5 = params.number * 2;
            blinkInterval5 = setInterval(blinkLED5, delay);
        break;
        case 'LED 6':
            blinkCount6 = params.number * 2;
            blinkInterval6 = setInterval(blinkLED6, delay);
        break;
        case 'ALL LEDS':
        default:
            blinkCount1 = blinkCount2 = blinkCount3 = blinkCount4 = blinkCount5 = blinkCount6 = params.number * 2;
            blinkInterval1 = setInterval(blinkLED1, delay);
            blinkInterval2 = setInterval(blinkLED2, delay);
            blinkInterval3 = setInterval(blinkLED3, delay);
            blinkInterval4 = setInterval(blinkLED4, delay);
            blinkInterval5 = setInterval(blinkLED5, delay);
            blinkInterval6 = setInterval(blinkLED6, delay);
        break;
    }
}

const ComExampleCommandsLEDColor = (params) => {
    console.log('reached com.example.commands.LEDColor');
    if (params.device == 'RGB LED') {
        switch (params.color) {
            case 'blue':
                Led5.writeSync(0);
                Led4.writeSync(0);
                Led3.writeSync(1);
            break;
            case 'red':
                Led5.writeSync(1);
                Led4.writeSync(0);
                Led3.writeSync(0);
            break;
            case 'green':
                Led5.writeSync(0);
                Led4.writeSync(1);
                Led3.writeSync(0);
            break;
            case 'yellow':
                Led5.writeSync(1);
                Led4.writeSync(1);
                Led3.writeSync(0);
            break;
            case 'white':
                Led5.writeSync(1);
                Led4.writeSync(1);
                Led3.writeSync(1);
            break;
            case 'black':
            default:
                Led5.writeSync(0);
                Led4.writeSync(0);
                Led3.writeSync(0);
            break;
        }
    }
    else console.log('Wrong device.');
}
//#endregion ACTIONS */

//#region START CONVERSATION */
// starts a new conversation with the assistant
const startConversation = (conversation) => {
    console.log('Say something!');

    //#region CONVERSATION */
    // setup the conversation
    conversation
    .on('audio-data', (data) => {
        // send the audio buffer to the speaker
        speakerHelper.update(data);
    })
    .on('end-of-utterance', () => {
        // done speaking, close the mic
        record.stop();
    })
    .on('transcription', (data) => {
        // just to spit out to the console what was said (as we say it)
        console.log('Transcription:' + data.transcription + ' --- Done:' + data.done);
        if (data.done) {
            request = data.transcription;
        }
    })
    .on('response', (text) => {
        // what the assistant said back
        if (text != "") {
            if (readTempSensor) {
                console.log('Assistant Text Response:', text + temperature);
                io.emit('message', { Request: request, Response: text + temperature });
                readTempSensor = false;
            } else {
                console.log('Assistant Text Response:', text);
                io.emit('message', { Request: request, Response: text });
            }
        }
        else {
            io.emit('message', { Request: request, Response: "Sorry, I didn't get that. Can you say it again?" });
        }
    })
    .on('volume-percent', (percent) => {
        // if we've requested a volume level change, get the percentage of the new level
        console.log('New Volume Percent:', percent);
    })
    .on('device-action', (action) => {
        // if you've set this device up to handle actions, you'll get that here
        var command = action.inputs[0].payload.commands[0].execution[0].command;
        var params = action.inputs[0].payload.commands[0].execution[0].params;
        console.log(command);
        console.log(params);
        switch (command) {
            case 'com.example.commands.MyDevices':
                ComExampleCommandsMyDevices(params);
            break;
            case 'com.example.commands.TemperatureHome':
                ComExampleCommandsTemperatureHome(params);
            break;
            case 'com.example.commands.BlinkLight':
                ComExampleCommandsBlinkLight(params);
            break;
            case 'com.example.commands.LEDColor':
                ComExampleCommandsLEDColor(params);
            break;
            default:
            break;
        }
    })
    .on('ended', (error, continueConversation) => {
        // once the conversation is ended, see if we need to follow up
        if (error) {
            console.log('Conversation Ended Error:', error);
        }
        else {
            console.log('Conversation Complete');
        }
    })
    .on('error', (error) => {
        // catch any errors
        record.stop();
        console.log(config.conversation.textQuery);
        console.log('Conversation Error:', error);
    })
    //#endregion CONVERSATION */

    //#region  MIC */
    // pass the mic audio to the assistant
    if (IsSpeech) {
        const mic = record.start({
            threshold: 0.5,
            silence: 1.0,
            verbose: true,
            recordProgram: 'arecord',
            device: 'plughw:1,0'
        });
        mic.on('data', (data) => {
            conversation.write(data)
        });
    }
    //#endregion MIC */

    //#region  SPEAKER */
    // setup the speaker
    const speaker = new Speaker({
        channels: 1,
        sampleRate: config.conversation.audio.sampleRateOut
    });
    speakerHelper.init(speaker);
    speaker
    .on('open', () => {
        console.log('Assistant Speaking');
        speakerHelper.open();
    })
    .on('close', () => {
        console.log('Assistant Finished Speaking');
    })
    //#endregion SPEAKER */
};
//#endregion START CONVERSATION */

//#region TEXT INPUT */
const promptForInput = (data) => {
    IsSpeech = false;
    config.conversation.textQuery = data;
    assistant.start(config.conversation);
    config.conversation.textQuery = undefined;
};
//#endregion TEXT INPUT */

//#region ASSISTANT */
// setup the assistant
const assistant = new GoogleAssistant(config.auth);
assistant
.on('started', startConversation)
.on('error', (error) => {
    console.log('Assistant Error:', error);
})
//#endregion ASSISTANT */

//#region SERVER */
app.get('/', function (req, res, next) {
    res.sendFile(__dirname + '/index.html');
});

app.use(express.static(path.join(__dirname, '/assets/')));

io.on('connection', (socket) => {
    console.log('client connected to socket');
    socket.on('textInput', (data) => {
        request = data;
        promptForInput(data);
    });
    socket.on('IsSpeech', (checked) => {
        IsSpeech = checked;
        assistant.start(config.conversation);
    });
});
//#endregion SERVER */
