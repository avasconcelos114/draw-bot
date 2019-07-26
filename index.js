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

/************************
 * General Stats API
 ***********************/
app.get('/connection', (req, res) => {
    const connection = store.checkConnection()
    res.send({connection})
})

app.get('/draw', async (req, res) => {
    const data = await store.getDraws()
    const response = {
        count: data.length,
        draws: data
    }
    res.send(response)
})

/************************
 * Draw Functionality API
 ***********************/

//  General function that prepares updated list of users
getUpdatedDraw = async (drawId) => {
    const draw = await store.getDrawById(drawId)

    const users = await api.getUsersByIds(draw.totalUsers)

    const options = utils.generatePayload(draw, users)
    const response = {
        update: options
    }
    return response
}

// initial point triggered by slash command
app.get('/initialize', async (req, res) => {
    const reqData = req.query
    const triggerer = req.query.user_id
    logger.debug(`received a new draw request from user_id=${triggerer}`)

    const membersData = await api.getUsersFromChannel(reqData.channel_id)
    const totalUsers = []
    // storing user_id values in a string array to spare mongoDB's store capacity
    membersData.forEach(member => {
        totalUsers.push(member.user_id)
    })
 
    const draw = await store.createDraw({ totalUsers, triggerer })
    const users = await api.getUsersByIds(draw.totalUsers)

    logger.debug('preparing a new post to send to Mattermost')
    const options = utils.generatePayload(draw, users)
    await api.sendPostToChannel({
        channel_id: reqData.channel_id,
        ...options
    })
    res.send({})
})

// Add a single user to selected list 
app.post('/add_user', async (req, res) => {
    const {drawId, selected_option} = req.body.context
    await store.selectUser(selected_option, drawId)
    const response = await getUpdatedDraw(drawId)

    res.send(response)
})

// Add all members to list
app.post('/add_all', async (req, res) => {
    logger.debug('/add_all called')
    let { context: { drawId } } = req.body
    await store.selectAllAvailable(drawId)
    const response = await getUpdatedDraw(drawId)
    
    res.send(response)
})

// Empty member list
app.post('/remove_all', async (req, res) => {
    logger.debug('/remove_all called')
    const { context: { drawId } } = req.body
    await store.unselectAllUsers(drawId)
    const response = await getUpdatedDraw(drawId)

    res.send(response)
})

// draw random user from list (id)
app.post('/draw', async (req, res) => {
    console.log(req.body)
})

app.listen(port, () => logger.debug(`bot listening on port ${port}!`))
