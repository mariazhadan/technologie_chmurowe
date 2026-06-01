const mqtt = require('mqtt');

const mqttUrl = process.env.MQTT_URL || 'mqtt://mqtt:1883';
const client = mqtt.connect(mqttUrl);
const sseClients = new Set();
const topics = ['shipments/created', 'shipments/updated'];
const topicToEvent = {
  'shipments/created': 'shipment_created',
  'shipments/updated': 'shipment_updated',
};

function publish(topic, payload) {
  const message = JSON.stringify(payload);
  client.publish(topic, message);
}

function addSseClient(res) {
  sseClients.add(res);
}

function removeSseClient(res) {
  sseClients.delete(res);
}

function broadcast(event, payload) {
  const data = JSON.stringify(payload);
  for (const res of sseClients) {
    if (res.writableEnded) {
      sseClients.delete(res);
      continue;
    }
    res.write(`event: ${event}\n`);
    res.write(`data: ${data}\n\n`);
  }
}

client.on('connect', () => {
  client.subscribe(topics, (err) => {
    if (err) {
      console.error('MQTT subscribe error:', err);
    }
  });
});

const db = require('./db');
client.on('message', async (topic, message) => {
  console.log(`MQTT Received: ${topic} -> ${message.toString()}`); 
  const event = topicToEvent[topic];
  if (!event) {
    return;
  }

  let payload;
  try {
    payload = JSON.parse(message.toString());
  } catch (err) {
    console.error('MQTT JSON parse error:', err);
    return; }
  if (topic === 'shipments/created') {
    try {
       console.log('Attempting to insert shipment into DB...'); 
       const { id, title, origin, destination, status, created_by } = payload;
       
       const exists = await db.query('SELECT 1 FROM shipments WHERE id = $1', [id]);
       if (exists.rowCount === 0) {
         await db.query(
           'INSERT INTO shipments (id, title, origin, destination, status, created_by) VALUES ($1, $2, $3, $4, $5, $6)',
           [id, title, origin, destination, status || 'CREATED', created_by || 1] 
         );
         console.log(`Shipment #${id} inserted into DB.`); 
       } else {
         console.log(`Shipment #${id} already exists.`); 
       }
    } catch (dbErr) {
       console.error('MQTT persistence error:', dbErr);
    }
  }

  broadcast(event, payload);
});

module.exports = { publish, client, addSseClient, removeSseClient };
