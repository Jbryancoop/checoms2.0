const sendNotification = require('./sendNotification');
const onNewMessage = require('./onNewMessage');

exports.sendPushNotification = sendNotification.sendPushNotification;
exports.onNewMessage = onNewMessage.onNewMessage;
