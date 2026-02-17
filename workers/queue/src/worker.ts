import { Worker, Queue } from "bullmq";

const redisConnection = {
  host: new URL(process.env.REDIS_URL ?? "redis://localhost:6379").hostname,
  port: Number(new URL(process.env.REDIS_URL ?? "redis://localhost:6379").port) || 6379,
};

// Email notification queue
const emailQueue = new Queue("email", { connection: redisConnection });

const emailWorker = new Worker(
  "email",
  async (job) => {
    console.log(`Processing email job ${job.id}:`, job.data);
    // Email sending will be implemented with @school-saas/email
  },
  { connection: redisConnection }
);

emailWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed`);
});

emailWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed:`, err);
});

console.log("Worker started, waiting for jobs...");

export { emailQueue };
