const { app } = require("@azure/functions");

// Import your functions
require("./functions/httpTrigger1")(app);
// require("./functions/timerTrigger")(app);
