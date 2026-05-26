const { Worker } =
    require("bullmq");

const {
    connection,
} = require("../../lib/queue");

const {
    sendEmail,
} = require("../processors/email.processor");

const worker =
    new Worker(

        "emailQueue",

        async (job) => {

            return sendEmail(job);

        },

        {
            connection,
        }

    );

worker.on(
    "completed",
    (job) => {

        console.log(
            `Job ${job.id} completed`
        );

    }
);

worker.on(
    "failed",
    (job, err) => {

        console.log(
            `Job ${job.id} failed`,
            err
        );

    }
);

console.log(
    "Email Worker Running..."
);