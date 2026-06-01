const fs = require('fs');
const path = require('path');

const logDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const appLogStream = fs.createWriteStream(path.join(logDir, 'app.log'), { flags: 'a' });

function appLog(event, payload) {
  const entry = {
    ts: new Date().toISOString(),
    event,
    payload: payload || null,
  };
  appLogStream.write(`${JSON.stringify(entry)}\n`);
}

module.exports = { appLog };
