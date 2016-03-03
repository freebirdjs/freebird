var cluster = require('cluster');

// Node.js also has the cluster module and also allows to create processes
// "A single instance of Node runs in a single thread. To take advantage of 
// multi-core systems the user will sometimes want to launch a cluster of 
// Node processes to handle the load".

if (cluster.isMaster) {
    console.log('Master forking!');
    for (var i = 0; i < 5; i++) {
        cluster.fork();
    }
} else {
    console.log('Child process running!');
}

cluster.on('online', function (worker) {
    console.log('Worker ' + worker.process.pid + ' is online.');
});

// From the example you can notice that the cluster module is imported, 
// once imported you can call fork() method to create a new child process, 
// after calling fork() the same process will run but as a child, to distinguish 
// if the process is running as a Master or child the cluster module has the 
// isMaster() and isWorker() methods.