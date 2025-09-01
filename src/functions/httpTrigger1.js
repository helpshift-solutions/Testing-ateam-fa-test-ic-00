const { app } = require("@azure/functions");
const { TableClient } = require("@azure/data-tables");
const { QueueClient } = require("@azure/storage-queue");
const { BlobServiceClient } = require("@azure/storage-blob");

const connectionString = process.env.AZURE_STORAGE_CONNECTION_STRING;
const tableName = "TaskTable";
const queueName = "taskqueue";
const blobContainerName = "taskfiles";

app.http("addTaskHttp", {
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (request, context) => {
    const tableClient = TableClient.fromConnectionString(
      connectionString,
      tableName
    );
    await tableClient.createTable();

    if (request.method === "GET") {
      return {
        status: 200,
        headers: { "Content-Type": "text/html" },
        body: `
                    <html>
                      <head><title>Add Task</title></head>
                      <body style="font-family: Arial; margin: 40px;">
                        <h2>Add a New Task</h2>
                        <form method="POST" action="/api/addTaskHttp" enctype="multipart/form-data">
                          <label>Task Name:</label><br/>
                          <input type="text" name="taskName" placeholder="Enter task name" required/><br/><br/>
                            
                          <label>Due Date (UTC):</label><br/>
                          <input type="datetime-local" name="dueDate" required/><br/><br/>
                          
                          <button type="submit">Add Task</button>

                          <label>Upload File:</label>
                          <input type="file" name="taskFile"/><br/><br/>

                        </form>
                      </body>
                    </html>
                `,
      };
    }

    if (request.method === "POST") {
      let body;
      const contentType = request.headers.get("content-type") || "";

      if (contentType.includes("application/json")) {
        body = await request.json();
      } else {
        // Parse form data
        // const formData = await request.text();
        // body = Object.fromEntries(new URLSearchParams(formData));
        const formData = await request.formData();
        body = {
          taskName: formData.get("taskName"),
          dueDate: formData.get("dueDate"),
        };
        //blob storage
        const file = formData.get("taskFile");
        if (file && file.size > 0) {
          const blobServiceClient =
            BlobServiceClient.fromConnectionString(connectionString);
          const containerClient =
            blobServiceClient.getContainerClient(blobContainerName);
          await containerClient.createIfNotExists();

          const blobClient = containerClient.getBlockBlobClient(file.name);
          await blobClient.uploadData(await file.arrayBuffer());
          context.log(`📂 File "${file.name}" uploaded to blob storage`);
        }
      }
      const { taskName, dueDate } = body;

      if (!taskName || !dueDate) {
        return { status: 400, body: "Please provide taskName and dueDate." };
      }

      const rowKey = Date.now().toString();
      const taskEntity = {
        partitionKey: "tasks",
        rowKey,
        taskName,
        dueDate: new Date(dueDate).toISOString(),
        status: "Pending",
      };

      await tableClient.createEntity(taskEntity);

      const queueClient = new QueueClient(connectionString, queueName);
      await queueClient.createIfNotExists();
      await queueClient.sendMessage(
        Buffer.from(JSON.stringify(taskEntity)).toString("base64")
      );

      return {
        status: 200,
        headers: { "Content-Type": "text/html" },
        body: `
                    <html>
                      <body style="font-family: Arial; margin: 40px;">
                        <h2>✅ Task Added Successfully!</h2>
                        <p><b>Task:</b> ${taskName}</p>
                        <p><b>Due:</b> ${dueDate}</p>
                        <a href="/api/addTaskHttp"> Add another task</a>
                      </body>
                    </html>
                `,
      };
    }
  },
});
