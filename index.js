module.exports = function(taskName) { 
    return require("./src/tasks/" + taskName + ".js");
}