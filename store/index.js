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
    triggerer: { // user that initiated draw
        user_id: String,
        username: String,
    }
})

const DrawModel = mongoose.model('Draw', schema)

// Check mongoose connection
checkConnection = () => {
    return mongoose.connection.readyState;
}

// Create new draw
createDraw = async () => {
    const newDraw = new DrawModel({
        timestamp: utils.generateTimestamp(),
        selectedUsers: [],
        totalUsers: [],
        drawedUsers: [],
        triggerer: {
            user_id: '',
            username: 'andre.tito'
        }
    })

    const data = await newDraw.save()
    return data
}

// Get full list of saves
getDraws = async () => {
    const draws = await DrawModel.find().exec()
    return draws
}

// Attach total user list to draw

// Get triggerer of draw

// Get how many times each user was picked (timeline) 

// Get top list of users that initiated drawing

module.exports = {
    createDraw,
    getDraws,
    checkConnection,
}