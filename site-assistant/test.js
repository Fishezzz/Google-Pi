'use strict';

//#region INIT & CONFIG */
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
// var LED = new Gpio(25, 'out'); //use GPIO pin 4, and specify that it is output
var LedR = new Gpio(13, 'out'); //use GPIO pin 4, and specify that it is output
var LedG = new Gpio(6, 'out'); //use GPIO pin 4, and specify that it is output
var LedB = new Gpio(5, 'out'); //use GPIO pin 4, and specify that it is output
var Led1 = new Gpio(26, 'out');
var Led2 = new Gpio(19, 'out');
// var Led3 = new Gpio(13, 'out');
// var Led4 = new Gpio(6, 'out');
// var Led5 = new Gpio(5, 'out');
var Led6 = new Gpio(0, 'out');
var blinkInterval;

const express = require('express');
const PORT = 3000;

const record = require('node-record-lpcm16');
const Speaker = require('speaker');
const path = require('path');
const GoogleAssistant = require('google-assistant');
const speakerHelper = require('./examples/speaker-helper');
const readline = require('readline');

const config = {
    auth: {
        keyFilePath: path.resolve(__dirname, '../client_secret.json'),
        // where you want the tokens to be saved
        // will create the directory if not already there
        savedTokensPath: path.resolve(__dirname, './tokens.json'),
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
function blinkLED(count) {
    if (Led2.readSync() === 0) { //check the pin state, if the state is 0 (or off)
        Led2.writeSync(1);
        console.log('Turning on...');
    } else {
        Led2.writeSync(0);
        console.log('Turning off...');
    }
    count--;
    if (count==0) {
        clearInterval(blinkInterval);
    }
};
//#endregion FUNCTIONS */


//#region START CONVERSATION */
// starts a new conversation with the assistant
const startConversation = (conversation) => {
    // console.log('Say something!');
    // let openMicAgain = false; // optie 1 spraak

    //#region CONVERSATION */
    // setup the conversation
    conversation
    .on('audio-data', (data) => {
        // send the audio buffer to the speaker
        speakerHelper.update(data);
    })
    //#region  SPEECH ONLY */
    // .on('end-of-utterance', () => {
    //     // done speaking, close the mic
    //     record.stop();
    // })
    // .on('transcription', (data) => {
    //     // just to spit out to the console what was said (as we say it)
    //     console.log('Transcription:', data.transcription, ' --- Done:', data.done);
    // })
    // //#endregion SPEECH ONLY */
    .on('response', (text) => {
        // what the assistant said back
        console.log('Assistant Text Response:', text);
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
            //#region com.example.commands.MyDevices */
            case 'com.example.commands.MyDevices':
                console.log('reached actions.device.commands.OnOff');
                switch (params.device) {
                    case 'LED 1':
                        Led1.writeSync(params.status == 'ON' ? 1 : 0);
                    break;
                    case 'LED 2':
                        Led2.writeSync(params.status == 'ON' ? 1 : 0);
                    break;
                    case 'LED 3':
                        // Led3.writeSync(params.status == 'ON' ? 1 : 0);
                        LedR.writeSync(params.status == 'ON' ? 1 : 0);
                    break;
                    case 'LED 4':
                        // Led4.writeSync(params.status == 'ON' ? 1 : 0);
                        LedG.writeSync(params.status == 'ON' ? 1 : 0);
                    break;
                    case 'LED 5':
                        // Led5.writeSync(params.status == 'ON' ? 1 : 0);
                        LedB.writeSync(params.status == 'ON' ? 1 : 0);
                    break;
                    case 'LED 6':
                        Led6.writeSync(params.status == 'ON' ? 1 : 0);
                    break;
                    case 'ALL LEDS':
                        Led1.writeSync(params.status == 'ON' ? 1 : 0);
                        Led2.writeSync(params.status == 'ON' ? 1 : 0);
                        // Led3.writeSync(params.status == 'ON' ? 1 : 0);
                        // Led4.writeSync(params.status == 'ON' ? 1 : 0);
                        // Led5.writeSync(params.status == 'ON' ? 1 : 0);
                        LedR.writeSync(params.status == 'ON' ? 1 : 0);
                        LedG.writeSync(params.status == 'ON' ? 1 : 0);
                        LedB.writeSync(params.status == 'ON' ? 1 : 0);
                        Led6.writeSync(params.status == 'ON' ? 1 : 0);
                    break;
                }
            break;
            //#endregion action.devices.commands.OnOff */
            //#region com.example.commands.LEDColor */
            case 'com.example.commands.LEDColor':
                console.log('reached com.example.commands.LEDColor');
                if (params.device == 'RGB LED') {
                    switch (params.color) {
                        case 'blue':
                            LedR.writeSync(0);
                            LedG.writeSync(0);
                            LedB.writeSync(1);
                        break;
                        case 'red':
                            LedR.writeSync(1);
                            LedG.writeSync(0);
                            LedB.writeSync(0);
                        break;
                        case 'green':
                            LedR.writeSync(0);
                            LedG.writeSync(1);
                            LedB.writeSync(0);
                        break;
                        case 'yellow':
                            LedR.writeSync(1);
                            LedG.writeSync(1);
                            LedB.writeSync(0);
                        break;
                        case 'white':
                            LedR.writeSync(1);
                            LedG.writeSync(1);
                            LedB.writeSync(1);
                        break;
                        case 'black':
                            LedR.writeSync(0);
                            LedG.writeSync(0);
                            LedB.writeSync(0);
                        break;
                        default:
                            LedR.writeSync(0);
                            LedG.writeSync(0);
                            LedB.writeSync(0);
                        break;
                    }
                }
                else console.log('Wrong device.');
            break;
            //#endregion com.example.commands.LEDColor */
            //#region com.example.commands.BlinkLight */
            case 'com.example.commands.BlinkLight':
                console.log('reached com.example.commands.BlinkLight');
                var blinkCount = params.number*2;
                if (params.speed == 'SLOWLY') {
                    blinkInterval = setInterval(blinkLED(blinkCount), 1000);
                }
                else if (params.speed == 'QUICKLY') {
                    blinkInterval = setInterval(blinkLED(blinkCount), 250);
                } else {
                    blinkInterval = setInterval(blinkLED(blinkCount), 500);
                }
            break;
            //#endregion com.example.commands.BlinkLight */
        }
    })
    .on('ended', (error, continueConversation) => {
        // once the conversation is ended, see if we need to follow up
        if (error) {
            console.log('Conversation Ended Error:', error);
        }
        else if (continueConversation) {
            // openMicAgain = true; // optie 1 spraak
            promptForInput(); // optie 2 tekst
        } else {
            console.log('Conversation Complete');
            promptForInput();
            // conversation.end(); // optie 2 tekst
        }
    })
    .on('error', (error) =>  {
        // catch any errors
        console.log('Conversation Error:', error);
    })
    //#endregion CONVERSATION */

    //#region  MIC */
    // pass the mic audio to the assistant
    const mic = record.start({
        threshold: 0,
        recordProgram: 'arecord',
        device: 'plughw:1,0'
    });
    mic.on('data', (data) => {
        conversation.write(data)
    });
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
        // if (openMicAgain) {
        //     assistant.start(config.conversation); // optie 1 spraak
        // }
    });
    //#endregion SPEAKER */
};
//#endregion START CONVERSATION */

//#region TEXT INPUT */
const promptForInput = () => {
    // type what you want to ask the assistant
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    rl.question('Type your request: ', (request) => {
        // start the conversation
        config.conversation.textQuery = request;
        assistant.start(config.conversation, startConversation);

        rl.close();
    });
};
//#endregion TEXT INPUT */

//#region ASSISTANT */
// setup the assistant
const assistant = new GoogleAssistant(config.auth);
assistant
.on('ready', promptForInput) // optie 2 tekst
// .on('ready', () => {
//     assistant.start(config.conversation); // optie 1 spraak
// })
// .on('started', startConversation) // optie 1 spraak
.on('error', (error) => {
    console.log('Assistant Error:', error);
})
//#endregion ASSISTANT */
