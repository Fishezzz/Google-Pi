
//import data from './data/data.json';
var Gpio = require('onoff').Gpio; //include onoff to interact with the GPIO
var LED = new Gpio(25, 'out'); //use GPIO pin 4, and specify that it is output
var LedR = new Gpio(5, 'out'); //use GPIO pin 4, and specify that it is output
var LedG = new Gpio(6, 'out'); //use GPIO pin 4, and specify that it is output
var LedB = new Gpio(13, 'out'); //use GPIO pin 4, and specify that it is output
//var blinkInterval = setInterval(blinkLED, 250); //run the blinkLED function every 250ms

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
 // console.log('Say something!');
 // let openMicAgain = false;

  conversation
    // send the audio buffer to the speaker
    .on('audio-data', (data) => {
      speakerHelper.update(data);
    })
    // done speaking, close the mic
    //.on('end-of-utterance', () => record.stop())
    // just to spit out to the console what was said (as we say it)
    //.on('transcription', data => console.log('Transcription:', data.transcription, ' --- Done:', data.done))
    // what the assistant said back
    .on('response', text => console.log('Assistant Text Response:', text))
    // if we've requested a volume level change, get the percentage of the new level
    .on('volume-percent', percent => console.log('New Volume Percent:', percent))
    // the device needs to complete an action
    .on('device-action', action => {
      console.log(action.inputs[0].payload.commands[0].execution[0].command);
      console.log(action.inputs[0].payload.commands[0].execution[0].params);
      if(action.inputs[0].payload.commands[0].execution[0].command=='com.example.actions.LEDcolor')
      {
         var params =action.inputs[0].payload.commands[0].execution[0].params;
         if(params.device=='RGB LED')
         {
          switch(params.color) {
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
            case 'white':
              LedR.writeSync(0); //set pin state to 0 (turn LED off)
              LedG.writeSync(0); //set pin state to 0 (turn LED off)
              LedB.writeSync(0); //set pin state to 0 (turn LED off)
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
      if (error) console.log('Conversation Ended Error:', error);
      else if (continueConversation) { promptForInput();}
      else {
      console.log('Conversation Complete');
      promptForInput();
      //conversation.end();
      }
    })
    // catch any errors
    .on('error', (error) => {
      console.log('Conversation Error:', error);
    });

  // pass the mic audio to the assistant
  const mic = record.start({ threshold: 0, recordProgram: 'arecord', device: 'plughw:1,0' });
  mic.on('data', data => conversation.write(data));

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
      //if (openMicAgain) assistant.start(config.conversation);
    });
};

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

// setup the assistant
assistant
  .on('ready', promptForInput)
  //.on('started', startConversation)
  .on('error', (error) => {
    console.log('Assistant Error:', error);
  });

/*
app.get('/',(req, res) =>
    res.json(data)
);

app.post('/NewItem',(req, res) =>
    res.send(`a post request with / route on port ${PORT}`)
);

app.put('/Item',(req, res) =>
    res.send(`a put request with / route on port ${PORT}`)
);

app.delete('/Item',(req, res) =>
    res.send(`a delete request with / route on port ${PORT}`)
);

app.listen(PORT,()=>{
    console.log(`your server is running on port ${PORT}`);
    console.log(data);
}
);
*/

/*
function blinkLED() { //function to start blinking
    if (LED.readSync() === 0) { //check the pin state, if the state is 0 (or off)
      LED.writeSync(1); //set pin state to 1 (turn LED on)
    } else {
      LED.writeSync(0); //set pin state to 0 (turn LED off)
    }
  }

  function endBlink() { //function to stop blinking
    clearInterval(blinkInterval); // Stop blink intervals
    LED.writeSync(0); // Turn LED off
    LED.unexport(); // Unexport GPIO to free resources
  }

  setTimeout(endBlink, 5000); //stop blinking after 5 seconds
  */
