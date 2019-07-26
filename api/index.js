const axios = require('axios');
const utils = require('../utils/common');
const constants = require('../constants');
const logger = require('../utils/logger');

const mattermostUrl = utils.checkEnvVar(constants.MATTERMOST_SERVER)
const token = utils.checkEnvVar(constants.TOKEN)

// Get user list from mattermost
getUsersFromChannel = async (channelId) => {
    const data = await doGet(`${mattermostUrl}/api/v4/channels/${channelId}/members`)
    return data
}

// Get users by ids (needed because above API doesn't return usernames)
getUsersByIds = async (ids) => {
    const data = await doPost(`${mattermostUrl}/api/v4/users/ids`, ids)
    return data
}

// Post message to mattermost
sendPostToChannel = async (payload) => {
    const data = await doPost(`${mattermostUrl}/api/v4/posts`, payload)
    return data
}

// Get a user from user_id 
getUser = async (userId) => {
    const data = await doGet(`${mattermostUrl}/api/v4/users/${userId}`)
    return data
}

doGet = async (url) => {
    const options = {
        url,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
    }

    return await axios(options)
        .then((response) => {
            return response.data
        })
        .catch((error) => {
            logger.error(error);
            return error
        });
}

doPost = async (url, data) => {
    const options = {
        url,
        data,
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
        },
        json: true,
    }

    return await axios(options)
        .then((response) => {
            return response.data
        })
        .catch((error) => {
            logger.error(error);
            return error
        });
}

module.exports = {
    getUsersFromChannel,
    getUsersByIds,
    sendPostToChannel,
    getUser,
}