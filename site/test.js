/* Self Hosted Express Server */
const express = require('express');
const bodyParser = require('body-parser');
/* Self Hosted Express Server */

const { dialogflow, actionssdk } = require('actions-on-google')

const app = dialogflow();
const hostname = 'localhost';
const port = 3000;

/* Scaling with middleware */
class Helper {
	constructor(conv) {
		this.conv = conv;
	}
  
	func1() {
		this.conv.ask(`What's up?`);
	}
}
  
app.middleware((conv) => {
	conv.helper = new Helper(conv);
});

app.intent('Default Welcome Intent', (conv) => {
	conv.helper.func1();
});
/* Scaling with middleware */

// ... app code here
app.intent('com.example.intents.MAIN', (conv, input) => {
	conv.data.someProperty = 'someValue';
});

app.intent('comp.example.intents.MyDevices', conv => {
	conv.data.someProperty = 'someValue';
});

app.intent('com.example.intents.BlinkLight', conv => {
	conv.data.someProperty = 'someValue';
});

app.intent('com.example.intents.LEDColor', conv => {
	conv.data.someProperty = 'someValue';
});

app.catch((conv, error) => {
	console.error(error);
	conv.ask('I encountered a glitch. Can you say that again?');
});

/* Self Hosted Express Server */
const expressApp = express().use(bodyParser.json());
expressApp.post('/fulfillment', app);
expressApp.get('/fulfillment',app);
expressApp.listen(port, hostname, () => {
	console.log(`Server Running at http://${hostname}:${port}`);
});
/* Self Hosted Express Server */
