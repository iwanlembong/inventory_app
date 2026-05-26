const { createClient } =
  require("redis");

const redis =
  createClient({

    url: process.env.REDIS_URL,

  });

redis.on(
  "error",
  (err) => {
    console.log(
      "Redis Error:",
      err
    );
  }
);

(async () => {

  await redis.connect();

  console.log(
    "Redis Connected"
  );

})();

module.exports = redis;