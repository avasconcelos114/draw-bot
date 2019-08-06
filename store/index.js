const mongoose = require('mongoose');
const utils = require('../utils/common');
const constants = require('../constants');

// initialize mongoose connection
const mongoUsername = utils.checkEnvVar(constants.MONGO_USERNAME);
const mongoPassword = utils.checkEnvVar(constants.MONGO_PASSWORD);
const mongoServer = utils.checkEnvVar(constants.MONGO_SERVER);

mongoose.connect(`mongodb://${mongoUsername}:${mongoPassword}@${mongoServer}/admin`, {useNewUrlParser: true});

// Setting up Draw schema
const schema = new mongoose.Schema({
    timestamp: Number, // unix timestamp
    selectedUsers: Array, // list of users that *could* be drawed
    totalUsers: Array, // total list of members that could be picked (channel members)
    drawedUsers: Array, // users actually picked from draw
    triggerer: String // the user who initiated the draw
})

const DrawModel = mongoose.model('Draw', schema)

// Check mongoose connection
checkConnection = () => {
    return mongoose.connection.readyState;
}

// Create new draw
createDraw = async (draw) => {
    // selectedUsers & drawedUsers are initialized empty, and populated later on
    const newDraw = new DrawModel({
        timestamp: utils.generateTimestamp(),
        selectedUsers: [],
        totalUsers: draw.totalUsers,
        drawedUsers: [],
        triggerer: draw.triggerer
    })

    const data = await newDraw.save()
    return data
}

// Get full list of saves
getDraws = async () => {
    const draws = await DrawModel.find().exec()
    return draws
}

getDrawById = async (drawId) => {
    const draw = await DrawModel.findById(drawId)
    return draw
}

// Add all to selected
selectAllAvailable = async (drawId) => {
    const draw = await DrawModel.findById(drawId)
    const selectedUsers = Object.assign([], draw.totalUsers)
    const data = await draw.updateOne({
        selectedUsers
    })
    return data
}

// Unselect all users from draw
unselectAllUsers = async (drawId) => {
    const draw = await DrawModel.findById(drawId)
    const data = await draw.updateOne({
        selectedUsers: []
    })
    return data
}

// Adds a specific user to a draw
selectUser = async (userId, drawId) => {
    const draw = await getDrawById(drawId)
    const selectedUsers = draw.selectedUsers

    // checks if user isn't already saved in selectedUsers somehow
    if (selectedUsers.indexOf(userId) === -1) {
        selectedUsers.push(userId)
        const data = await draw.updateOne({selectedUsers})
        return data
    }
    return null
}

// Removes a specific user from a draw
removeUser = async (userId, drawId) => {
    const draw = await getDrawById(drawId)
    const selectedUsers = Object.assign([], draw.selectedUsers)
    
    if (selectedUsers.length > 0) {
        const index = selectedUsers.indexOf(userId);
        selectedUsers.splice(index, 1);
        const data = await draw.updateOne({ selectedUsers })
        return data
    }

    return null
}

// save draw results
saveDrawedUsers = async (drawId, drawedUsers) => {
    const draw = await DrawModel.findById(drawId)
    const data = await draw.updateOne({drawedUsers})
    return data
}

module.exports = {
    createDraw,
    getDraws,
    getDrawById,
    selectAllAvailable,
    saveDrawedUsers,
    removeUser,
    unselectAllUsers,
    selectUser,
    checkConnection,
}