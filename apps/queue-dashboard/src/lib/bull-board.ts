import { createBullBoard } from "@bull-board/api";
import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { ExpressAdapter } from "@bull-board/express";
import { Queue } from "bullmq";
import { DEPLOYMENT_QUEUE_NAME } from "@repo/contracts";
import { createBullConnection } from "./redis";

const deploymentQueue = new Queue(DEPLOYMENT_QUEUE_NAME, {
  connection: createBullConnection(),
});

const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath("/admin/queues");

createBullBoard({
  queues: [new BullMQAdapter(deploymentQueue)],
  serverAdapter,
});

export const bullBoardRouter = serverAdapter.getRouter();
