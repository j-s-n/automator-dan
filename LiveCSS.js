try {
  var sock = new WebSocket('ws://localhost:8080');
  console.log('Connecting to ws://localhost:8080 for live CSS updates')
  sock.onmessage = function (msg) {
    console.log('Updating CSS');
    var sheet = document.getElementById('main-stylesheet');
    sheet.href = sheet.href.split('?')[0] + ('?noCache=' + Date.now());
  };
  window.addEventListener("onunload", sock.close);
} catch (err) {
  console.log('Unable to connect for live CSS updates')
}
