const express = require('express');
const bodyParser = require('body-parser');

const api = require('./api');
const store = require('./store');
const logger = require('./utils/logger');
const utils = require('./utils/common');
const constants = require('./constants');

const app = express();

const port = utils.checkEnvVar(constants.PORT)

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ 'extended': 'true' }))

// Check mongoose connection
app.get('/connection', (req, res) => {
    const connection = store.checkConnection()
    res.send({connection})
})

app.get('/draw', async (req, res) => {
    const data = await store.getDraws()
    res.send({ data })
})

// listen to slash command
app.get('/initialize', async (req, res) => {
    const draw = await store.createDraw()
    

})

// Add all members to list
app.post('/add_all', (req, res) => {

})

// Empty member list
app.post('/remove_all', (req, res) => {

})

// draw random user from list (id)
app.post('/draw', (req, res) => {
    const body = req.body
})
    // if user already in selectedUsers array, draw again

app.listen(port, () => logger.debug(`bot listening on port ${port}!`))
