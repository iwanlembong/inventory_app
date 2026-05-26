exports.sendEmail =
  async (job) => {

    console.log(
      "Sending email..."
    );

    console.log(job.data);

    await new Promise(
      (resolve) =>
        setTimeout(resolve, 3000)
    );

    console.log(
      "Email sent!"
    );

    return true;

  };