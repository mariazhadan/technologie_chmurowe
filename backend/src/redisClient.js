const { createClient } = require('redis');

const redisUrl = process.env.REDIS_URL;
let clientPromise;

function getRedisClient() {
  if (!redisUrl) {
    throw new Error('REDIS_URL is required');
  }

  if (!clientPromise) {
    const client = createClient({ url: redisUrl });

    client.on('error', (err) => {
      console.error('Redis client error:', err.message);
    });

    clientPromise = client.connect().then(() => client).catch((err) => {
      clientPromise = undefined;
      throw err;
    });
  }

  return clientPromise;
}

async function pingRedis() {
  const client = await getRedisClient();
  return client.ping();
}

async function incrementCacheProof() {
  const client = await getRedisClient();
  const key = 'xpo:cache-proof:hits';
  const hits = await client.incr(key);
  await client.expire(key, 3600);

  return {
    key,
    hits,
    ttlSeconds: await client.ttl(key),
  };
}

module.exports = { getRedisClient, pingRedis, incrementCacheProof };
