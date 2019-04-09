const express = require('express')
const bodyParser = require('body-parser')

/* START APP CODE */

const {
  actionssdk,
  Image,
} = require('actions-on-google')

// Create an app instance
const app = actionssdk()

// Register handlers for Actions SDK intents

app.intent('actions.intent.MAIN', conv => {
  conv.ask('Hi, how is it going?')
  conv.ask(`Here's a picture of a cat`)
  conv.ask(new Image({
    url: 'https://developers.google.com/web/fundamentals/accessibility/semantics-builtin/imgs/160204193356-01-cat-500.jpg',
    alt: 'A cat',
  }))
})

app.intent('actions.intent.TEXT', (conv, input) => {
  if (input === 'bye' || input === 'goodbye') {
    return conv.close('See you later!')
  }
  conv.ask(`I didn't understand. Can you tell me something else?`)
})

/* END APP CODE */

//const expressApp = express().use(bodyParser.json())
//expressApp.get('/fulfillment', app)
//expressApp.listen(3000)


express().use(bodyParser.json(), app).listen(3000);
