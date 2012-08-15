// rascar server
"use strict";
var http = require('http');
var ctr35 = require('ctr35');
require('bonescript');

var ctr35Session = ctr35.Session({
  username: 'admin',
  password: 'wVv8U8wljc8vdqZ',
});

var latestStatusJSON;

var blinkLEDTimers = {};
function blinkLED(pinNo, duration) {
  var pin = bone['USR'+pinNo];
  clearTimeout(blinkLEDTimers[pinNo]);
  pinMode(pin, 'out');
  digitalWrite(pin, 1);
  blinkLEDTimers[pinNo] = setTimeout(function () { digitalWrite(pin, 0); }, duration || 200);
}

function json_pretty(json) {
  return JSON.stringify(JSON.parse(json), null, 2);
}

function update_status(statusJSON) {
  latestStatusJSON = statusJSON;
  console.log('Status updated', new Date);
  blinkLED(3);
  //console.log('status ->', JSON.stringify(JSON.parse(statusJSON), null, 2));
}

function poll_status(pollInterval) {
  ctr35Session.status(['wan', 'wlan.clients', /*'stats',*/ 'dhcpd.leases'], function (err, statusJSON) {
    if (err) console.error('Failed to read CTR-35\'s status:', err.trace || String(err));
    else update_status(statusJSON);
    setTimeout(function () { poll_status(pollInterval); }, pollInterval);
  });
}

// Start polling for status with A0 pause time
global.setup = function () {
  poll_status(3000);
}

// Start web server
var httpServer = http.createServer(function (req, res) {
  if (req.method === 'GET' && req.url === '/ctr35-status') {
    blinkLED(2, 100);
    res.writeHead(200, {'Content-Type': 'application/json'});
    //res.end(latestStatusJSON);
    res.end(json_pretty(latestStatusJSON));
  } else {
    res.writeHead(404, {'Content-Type': 'application/json'});
    res.end('{"error":"Not found"}');
  }
}).listen(8000, '0.0.0.0', function () {
  console.log('HTTP server is listening on 0.0.0.0:80');
});
