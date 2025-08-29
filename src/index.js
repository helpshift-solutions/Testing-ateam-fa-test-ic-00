const { app } = require("@azure/functions");

// Import your functions
require("./src/functions/httptrigger")(app);
require("./src/functions/timertrigger")(app);
