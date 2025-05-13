const amqp = require('amqplib');
const axios = require('axios');
require('dotenv').config();

const RABBITMQ_URL = process.env.RABBITMQ_URL;
const EMAIL_URL = process.env.EMAIL_URL;

async function sendRequestToRoute(endpoint, requestType, data) {
  const url = `${EMAIL_URL}/${endpoint}`;

  try {
    const config = {
      method: requestType.toLowerCase(),
      url,
    };

    if (requestType.toLowerCase() != 'get') {
      config.data = data;
    }

    const response = await axios(config);
    return response;
  } catch (error) {
    console.error(`Error making request to ${url}:`, error);
    return null;
  }
}

async function consumeQueue(queueName) {
  const connection = await amqp.connect(RABBITMQ_URL);
  const channel = await connection.createChannel();

  await channel.assertQueue(queueName, { durable: true });

  console.log(`[${queueName}] Waiting for messages...`);

  channel.consume(queueName, async (msg) => {
    if (msg !== null) {
      try {
        const body = msg.content.toString();
        console.log(`[${queueName}] message:`, body);

        const data = JSON.parse(body);
        const endpoint = data.endpoint;
        const requestType = data.type;
        delete data.endpoint;
        delete data.type;

        console.log(`[${queueName}] forwarding ${requestType} → ${endpoint}`);
        await sendRequestToRoute(endpoint, requestType, data);

        channel.ack(msg);
      } catch (error) {
        console.error(`[${queueName}] Failed to process message:`, error);
        channel.nack(msg, false, false);
      }
    }
  });
}

// Export the function
module.exports = { consumeQueue };
