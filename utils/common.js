const logger = require('./logger');
const {CHATBOT_SERVER} = require('../constants');


checkEnvVar = (variable) => {
    if (process.env[variable]) {
        return process.env[variable];
    }

    logger.error(`Error: the environment variable ${variable} has not been set!`)
    process.exit(1);
}
const chatbotUrl = checkEnvVar(CHATBOT_SERVER)

// receives draw data, and full data of totalUsers and generates an ephemeral payload for Mattermost
generatePayload = (drawData, users) => {
    // Get list of users not yet picked
    const availableUsers = getAvailableUsers(drawData.totalUsers, drawData.selectedUsers);

    // Get full data for selectedUsers & generate bullet points
    const selectedUsersData = getFullData(drawData.selectedUsers, users)
    const selectedUsersList = generateBulletList(selectedUsersData)

    // Get full data for availableUsers & generate bullet points
    const availableUsersData = getFullData(availableUsers, users)
    const availableUsersList = generateBulletList(availableUsersData)

    // Gets options for available users to be selected
    const actions = [
        {
            name: 'Add All',
            integration: {
                url: `${chatbotUrl}/add_all`,
                context: {
                    drawId: drawData._id,
                }
            }
        },
        {
            name: 'Remove All',
            integration: {
                url: `${chatbotUrl}/remove_all`,
                context: {
                    drawId: drawData._id,
                }
            }
        },
        {
            name: 'Draw!',
            integration: {
                url: `${chatbotUrl}/draw`,
                context: {
                    drawId: drawData._id
                }
            }
        }
    ]

    const availableUserOptions = generateAvailableUserOptions(availableUsersData)
    if (availableUserOptions.length > 0) {
        actions.push({
            name: 'Add a user...',
            integration: {
                url: `${chatbotUrl}/add_user`,
                context: {
                    drawId: drawData._id,
                }
            },
            type: 'select',
            options: availableUserOptions
        }) 
    }

    const payload = {
        props: {
            attachments: [
                {
                    actions,
                    fields: [
                        {
                            short: true,
                            title: 'Selected Users',
                            value: selectedUsersList
                        },
                        {
                            short: true,
                            title: 'Available Users',
                            value: availableUsersList
                        }
                    ]
                }
            ]
        }
    }

    return payload;
}

// get users available for selection (totalUsers - selectedUsers)
// Both arrays entered here are of type string[]
getAvailableUsers = (totalUsers, selectedUsers) => {
    if (totalUsers && totalUsers.length > 0) {
        let available = totalUsers.filter(user => !selectedUsers.includes(user));
        return available
    }
    return []
}

// generate bullet list to be added in Message Attachment Fields
generateBulletList = (users) => {
    let userList = ''
    users.forEach(user => {
        userList += `* ${user.username}\n`
    })
    return userList
}

// Generates options for available users to be selected in dropdown menu
generateAvailableUserOptions = (users) => {
    let options = []
    users.forEach(user => {
        options.push({
            text: user.username,
            value: user.id,
        })
    })
    return options
}

// Get full data of a string array of user_ids
getFullData = (userStrings, totalUsers) => {
    if (userStrings && userStrings.length > 0) {
        let fullData = totalUsers.filter(user => userStrings.includes(user.id));
        return fullData
    }
    return []
}

// Generate timestamp
generateTimestamp = () => {
    return Math.floor(new Date() / 1000)
}

module.exports = {
    checkEnvVar,
    generateTimestamp,
    getAvailableUsers,
    generatePayload,
}
