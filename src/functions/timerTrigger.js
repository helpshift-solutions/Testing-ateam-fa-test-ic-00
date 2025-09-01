const { app } = require("@azure/functions");
const { TableClient } = require("@azure/data-tables");
const { QueueClient } = require("@azure/storage-queue");
const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const tableName = "TaskTable";
app.timer("taskCheckerTimer", {
  schedule: "0 */10 * * * *", // every 10 min
  handler: async (myTimer, context) => {
    const tableClient = TableClient.fromConnectionString(
      connectionString,
      tableName
    );
    const currentTime = new Date();
    const queueName = "taskqueue";
    const queueClient = new QueueClient(connectionString, queueName);
    await queueClient.createIfNotExists();
    let updatedCount = 0;
    for await (const task of tableClient.listEntities()) {
      const dueDate = new Date(task.dueDate);
      if (dueDate < currentTime && task.status !== "Overdue") {
        task.status = "Overdue";
        await tableClient.updateEntity(task, "Replace");
        updatedCount++;
        context.log(`:warning: Task "${task.taskName}" marked as Overdue`);
      }
    }
    // QueueProcessing
    const queueMessage = await queueClient.receiveMessages({
      numberOfMessages: 32,
    });
    for (const msg of queueMessage.receivedMessageItems) {
      const taskFromQueue = JSON.parse(
        Buffer.from(msg.messageText, "base64").toString()
      );
      const taskDueDate = new Date(taskFromQueue.dueDate);
      if (taskDueDate < currentTime) {
        context.log(
          `:outbox_tray: Dequeuing overdue task from queue: ${taskFromQueue.taskName}`
        );
        await queueClient.deleteMessage(msg.messageId, msg.popReceipt);
      }
    }
    context.log(
      `:white_check_mark: Timer check complete. Updated ${updatedCount} tasks.`
    );
  },
});
