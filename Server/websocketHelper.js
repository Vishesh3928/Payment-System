const WebSocket = require('ws');
const webSocketClients = new Map();

function broadcastNotification(user_id, notification) {
    // console.log(user_id , notification)
    const client = webSocketClients.get(user_id.toString());
    if (client && client.readyState === WebSocket.OPEN) {
        console.log(`Sending notification to user ${user_id}`);
        client.send(JSON.stringify(notification));
    }
}

module.exports = {
    webSocketClients,
    broadcastNotification,
};
