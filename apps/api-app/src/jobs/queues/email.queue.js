const { Queue } =
  require("bullmq");

const {
  connection,
} = require("../../lib/queue");

const emailQueue =
  new Queue(
    "emailQueue",
    {
      connection,
    }
  );

module.exports = {
  emailQueue,
};