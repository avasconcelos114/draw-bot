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
generateBasePayload = (drawData, users) => {
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
                url: `${chatbotUrl}/get_number`,
                context: {
                    drawId: drawData._id
                }
            }
        }
    ]

    const selectUserDrowndown = generateUserOptions(availableUsersData)
    if (selectUserDrowndown.length > 0) {
        actions.push({
            name: 'Add a user...',
            integration: {
                url: `${chatbotUrl}/add_user`,
                context: {
                    drawId: drawData._id,
                }
            },
            type: 'select',
            options: selectUserDrowndown
        }) 
    }

    const removeUserDrowndown = generateUserOptions(selectedUsersData)
    if (removeUserDrowndown.length > 0) {
        actions.push({
            name: 'Remove a user...',
            integration: {
                url: `${chatbotUrl}/remove_user`,
                context: {
                    drawId: drawData._id,
                }
            },
            type: 'select',
            options: removeUserDrowndown
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

// receives a draw data and generates payload to pick number of users to be drawn
// note: max draw number is based on (selectedUsers.length - 1)
generateDrawNumberPayload = (drawData) => {
    let payload;
    if (drawData.selectedUsers.length <= 1) {
        payload = {
            ephemeral_text: 'You need to select at least 2 users to be able to draw!'
        }
        return payload
    }

    const maxDrawNumber = drawData.selectedUsers.length - 1
    const options = []
    for (i = 1; i <= maxDrawNumber; i++) {
        // Mattermost requires options to be given in string values
        options.push({
            text: i.toString(), 
            value: i.toString(),
        })
    }

    payload = {
        props: {
            attachments: [
                {
                    text: 'Select number of users to draw!',
                    actions: [
                        {
                            name: 'Select number of users...',
                            integration: {
                                url: `${chatbotUrl}/draw`,
                                context: {
                                    drawId: drawData._id,
                                }
                            },
                            type: 'select',
                            options: options
                        },
                        {
                            name: 'Cancel',
                            integration: {
                                url: `${chatbotUrl}/base_draw`,
                                context: {
                                    drawId: drawData._id,
                                }
                            }
                        },
                    ]
                }
            ]
        }
    }

    return payload
}

generateDrawPayload = (drawId, drawedUsers, users) => {
    const drawedUsersData = getFullData(drawedUsers, users)
    const drawedUsersList = generateBulletList(drawedUsersData)

    const payload = {
        props: {
            attachments: [
                {
                    text: ':confetti_ball:  Congratulations to the winners! :tada:',
                    actions: [
                        {
                            name: 'Retry Draw',
                            integration: {
                                url: `${chatbotUrl}/base_draw`,
                                context: {
                                    drawId,
                                }
                            }
                        }
                    ],
                    fields: [
                        {
                            short: false,
                            title: '',
                            value: drawedUsersList
                        }
                    ]
                }
            ]
        }
    }
    return payload
}

// draws users randomly and return an array with the ids of users who have been picked
drawUsersFromNumber = (selectedUsers, numberOfDraws) => {
    const drawnUsers = []
    let drawCount = 0
    
    while(drawCount !== numberOfDraws) {
        const user = drawUser(drawnUsers, selectedUsers)
        drawnUsers.push(user)
        drawCount++
    }

    return drawnUsers
}

// returns the id of a user who has not been picked yet
drawUser = (drawnUsers, selectedUsers) => {
    const usersToDraw = selectedUsers.filter(user => !drawnUsers.includes(user));
    const user = usersToDraw[Math.floor(Math.random() * usersToDraw.length)];
    return user
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
generateUserOptions = (users) => {
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
    generateBasePayload,
    generateDrawNumberPayload,
    generateDrawPayload,
    drawUsersFromNumber,
}
