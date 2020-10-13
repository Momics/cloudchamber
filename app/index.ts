
function connectSocket() {
  var ws = new WebSocket('ws://localhost:8090');

  /**
   * Fires when the socket opens
   */
  ws.onopen = function() {
    console.log('onopen')
  };

  /**
   * Fires when a message is received over the socket
   */
  ws.onmessage = function(e) {
    const data = JSON.parse(e.data);
    console.log('onmessage:', data);
  };

  /**
   * Fires when the socket closes
   */
  ws.onclose = function(e) {
    console.log('Socket is closed. Reconnect will be attempted in 2 second.', e.reason);
    setTimeout(function() {
      connectSocket();
    }, 2000);
  };

  /**
   * Fires when an error occurs
   */
  ws.onerror = function(err) {
    console.error('Socket encountered error: ', err.message, 'Closing socket');
    ws.close();
  };
}

connectSocket();