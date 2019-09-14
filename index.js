const express = require('express');

const api = require('./api');
const store = require('./store');
const logger = require('./utils/logger');
const utils = require('./utils/common');
const constants = require('./constants');

const app = express();

const port = utils.checkEnvVar(constants.PORT)

app.use(express.json())

/************************
 * General Stats API (more to be added)
 ***********************/
app.get('/connection', (req, res) => {
    const connection = store.checkConnection()
    res.send({connection})
})


/************************
 * Draw Functionality API
 ***********************/

// initial point triggered by slash command
app.get('/initialize', async (req, res) => {
    const reqData = req.query
    const reqOption = reqData.text 
    switch(reqOption) {
    case 'stats':
        const data = await store.getDraws()
        await api.sendPostToChannel({
            channel_id: reqData.channel_id,
            message: `There have been ${data.length} draws so far! :tada:`,
        })
        res.send()
        break
    case 'help':
        res.send({
            username: 'Draw bot',
            response_type: 'ephemeral',
            text: 'Run `/draw` to initiate a lottery draw!\n\nYou can also run `/draw stats` to view some basic statistics on this bot\'s usage'
        })
        break
    // If command not recognized, initiate draw sequence
    default:
        const triggerer = req.query.user_id

        // Getting total users that can be drawn (need to filter deactivated accounts based on delete_at date)
        const users = await api.getUsersFromChannel(reqData.channel_id)
        const totalUsers = []
        users.forEach(user => {
            if (!user.delete_at) {
                totalUsers.push(user.id);
            }
        });

        const triggererData = await api.getUser(triggerer)

        // refuse to run drawbot for people in single-person channels
            if (totalUsers.length <= 1) {
            await api.sendPostToChannel({
                channel_id: reqData.channel_id,
                message: 'You can only use the draw bot in channels with at least 2 users!'
            })
            res.send()
            return
        }

        const draw = await store.createDraw({ totalUsers, triggerer })

        const options = utils.generateBasePayload(draw, users)
        await api.sendPostToChannel({
            channel_id: reqData.channel_id,
            message: `A new draw has been started by @${triggererData.username}`,
            ...options
        })
        res.send()  
        break
    }
})

// Add a single user to selected list 
app.post('/add_user', async (req, res) => {
    const { context: { drawId, selected_option }, user_id } = req.body
    await checkIfTriggerer(drawId, user_id, () => res.send({ ephemeral_text: 'You do not have permissions to decide who gets drawed this time!' }))
    await store.selectUser(selected_option, drawId)
    const response = await getCurrentDrawStatus(drawId)

    res.send(response)
})

// Remove a single user to selected list 
app.post('/remove_user', async (req, res) => {
    const { context: { drawId, selected_option }, user_id } = req.body
    await checkIfTriggerer(drawId, user_id, () => res.send({ ephemeral_text: 'You do not have permissions to decide who gets drawed this time!' }))
    await store.removeUser(selected_option, drawId)
    const response = await getCurrentDrawStatus(drawId)

    res.send(response)
})

// Add all members to list
app.post('/add_all', async (req, res) => {
    logger.debug('/add_all called')
    let { context: { drawId }, user_id } = req.body
    await checkIfTriggerer(drawId, user_id, () => res.send({ ephemeral_text: 'You do not have permissions to decide who gets drawed this time!' }))
    await store.selectAllAvailable(drawId)
    const response = await getCurrentDrawStatus(drawId)
    
    res.send(response)
})

// Empty member list
app.post('/remove_all', async (req, res) => {
    logger.debug('/remove_all called')
    const { context: { drawId }, user_id } = req.body
    await checkIfTriggerer(drawId, user_id, () => res.send({ ephemeral_text: 'You do not have permissions to decide who gets drawed this time!' }))
    await store.unselectAllUsers(drawId)
    const response = await getCurrentDrawStatus(drawId)

    res.send(response)
})

// select number of users to be drawn from
app.post('/get_number', async (req, res) => {
    const { context: { drawId }, user_id } = req.body
    const draw = await store.getDrawById(drawId)
    await checkIfTriggerer(drawId, user_id, () => res.send({ephemeral_text: 'You do not have permissions to decide who gets drawed this time!'}))

    const triggererData = await api.getUser(draw.triggerer)

    const payload = utils.generateDrawNumberPayload(draw)
    let response = payload
    if (!payload.ephemeral_text) {
        response = {
            update: {
                message: `A new draw has been started by @${triggererData.username}`,
                ...payload
            }
        }
    }

    res.send(response)
})

app.post('/draw', async (req, res) => {
    logger.debug('/draw called')
    const { context: { drawId, selected_option }, user_id } = req.body
    await checkIfTriggerer(drawId, user_id, () => res.send({ ephemeral_text: 'You do not have permissions to decide who gets drawed this time!' }))
    const draw = await store.getDrawById(drawId)
    
    // Perform draw and save to store
    const drawedUsers = utils.drawUsersFromNumber(draw.selectedUsers, parseInt(selected_option))
    await store.saveDrawedUsers(drawId, drawedUsers)

    // Prepare response to be sent to Mattermost
    const users = await api.getUsersByIds(draw.totalUsers)
    const payload = utils.generateDrawPayload(drawId, drawedUsers, users)
    const triggererData = await api.getUser(draw.triggerer)

    const response = {
        update: {
            message: `A new draw has been started by @${triggererData.username}`,
            ...payload
        }
    }
    res.send(response)
})

// Should just return the current status of a given draw (with base payload)
app.post('/base_draw', async (req, res) => {
    const { context: { drawId }, user_id } = req.body
    await checkIfTriggerer(drawId, user_id, () => res.send({ ephemeral_text: 'You do not have permissions to decide who gets drawed this time!' }))
    const response = await getCurrentDrawStatus(drawId)
    res.send(response)
})

//  General function that prepares updated list of users
getCurrentDrawStatus = async (drawId) => {
    const draw = await store.getDrawById(drawId)

    const users = await api.getUsersByIds(draw.totalUsers)
    const triggererData = await api.getUser(draw.triggerer)

    const options = utils.generateBasePayload(draw, users)
    const response = {
        update: {
            message: `A new draw has been started by @${triggererData.username}`,
            ...options
        }
    }
    return response
}

// checks if the person interacting with draw is the person who triggered it
// TODO: perform additional check as to whether user is a sysadmin
checkIfTriggerer = async (drawId, userId, handleRejected) => {
    const draw = await store.getDrawById(drawId)
    if (draw.triggerer !== userId) {
        handleRejected()
    }
    return
}

app.listen(port, () => logger.debug(`bot listening on port ${port}!`))
