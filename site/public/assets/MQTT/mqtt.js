var _mqttClient;
var _mqttCreds;

//#region EXPORTS */
exports.Init = async function InitMqttClient() {
    // Documentation: http://www.eclipse.org/paho/files/jsdoc/index.html
    await getCredentials();

    // create Client
    _mqttClient = new Paho.MQTT.Client(
        String(_mqttCreds.server),
        Number(_mqttCreds.websocketsPort),
        String(new Date().getTime())
    );
    _mqttCreds.server = _mqttCreds.port = _mqttCreds.sslPort = _mqttCreds.websocketsPort = null;

    // set callback handlers
    _mqttClient.onConnectionLost = onConnectionLost;
    _mqttClient.omMessageArrived = omMessageArrived;

    // set connection options
    var optionsConnect = {
        useSSL: true,
        userName: _mqttCreds.user,
        password: _mqttCreds.pwd,
        onSuccess: onConnect,
        onFailure: doFail
    }

    // connect the client to the server
    _mqttClient.connect(optionsConnect);
    _mqttCreds.user = _mqttCreds.pwd = null;

    return _mqttClient;
}

exports.Send = function SendData(message) {
    _mqttClient.send(
        String(_mqttCreds.topics[0]),
        String(message),
        2,
        false
    );
}
//#endregion EXPORTS */

//#region FUNCTIONS */
// failure callback handler
function doFail(e) {
	console.log(e);
}

// first succes for $.getJSON()
function doFirstSucces() {
	console.log("First success...");
}

// second succes for $.getJSON()
function doSecondSucces() {
	console.log("Second success...");
}

// mqtt client connected to the server
function onConnect() {
    console.log('Client connected to server.');

    // // Set subscribe options
    // var optionsSubscribe = {
    //     qos: 2,
    //     onFailure: doFail
    // }

    // // Subscribe to the topics
    // _mqttCreds.topics.forEach(topic => {
    //     _mqttClient.subscribe(topic, optionsSubscribe);
    //     console.log('Client subscribed to: ' + topic);
    // });
}

// mqqt client lost connection to the server
function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.log('Client lost connection: ' + responseObject.errorMessage);
    }
}

// message arrived from subscribed topic
function omMessageArrived(message) {
    console.log(`New message from ${message.destinationName}: ${message.payloadString}`);
}

async function getCredentials() {
    // 
    await $.getJSON('./loginMQTT.json', function(result) {
        doFirstSucces();
        _mqttCreds = result;
    })
    .done(doSecondSucces())
    .fail(doFail());
}
//#endregion FUNCTIONS */
