const logger = require('./logger');

checkEnvVar = (variable) => {
    if (process.env[variable]) {
        return process.env[variable];
    }

    logger.error(`Error: the environment variable ${variable} has not been set!`)
    process.exit(1);
}

// Get list of non-seleted users (totalUsers - selectedUsers)

// check if user can modify post (if it's the one who triggered it, or if is a sysadmin)

// Generate timestamp
generateTimestamp = () => {
    return Math.floor(new Date() / 1000)
}

module.exports = {
    checkEnvVar,
    generateTimestamp,
}
