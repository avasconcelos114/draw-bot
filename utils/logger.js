function debug(message) {
    const timestamp = new Date().toString()
    console.log('\x1b[36m%s\x1b[0m', `${timestamp} - ${message}`)
}

function error(message) {
    const timestamp = new Date().toString()
    console.error('\x1b[31m%s\x1b[0m', `${timestamp} - ${message}`)
}

module.exports = {
    error,
    debug,
}
