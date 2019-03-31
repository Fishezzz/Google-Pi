const express = require('express')
const app = express()
const port = 3000

// GET method route
app.get('/', function (req, res) {
  res.send('GET request to the homepage')
})

// POST method route
app.post('/', function (req, res) {
  res.send('POST request to the homepage')
})

app.all('/secret', function (req, res, next) {
  console.log('Accessing the secret section ...')
  next() // pass control to the next handler
})







// Helemaal vanonder
app.use(function (req, res, next) {
  res.status(404).send("Sorry can't find that!")
})

app.listen(port, () => console.log(`Example app listening on port ${port}!`))
