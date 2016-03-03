var fs = require('fs'),
    process = require('child_process');

for (var i = 0; i < 10; i++) {
    // // Asynchronous Process Creation: child_process.exec(command[, options], callback)
    // // exec runs a command in a shell and buffers the output.
    // var ls = process.exec('node worker.js ' + i, function (err, stdout, stderr) {
    //     if (err) {
    //         console.log(error.stack);
    //         console.log('Error code: ' + error.code);
    //         console.log('Signal received: ' + error.signal);
    //     }
    //     console.log('stdout: ' + stdout);
    //     console.log('stderr: ' + stderr);
    // });

    // ls.on('exit', function (code) {
    //     console.log('Child process exited with exit code ' + code);
    // });

    // // Asynchronous Process Creation: child_process.spawn(command[, args][, options])
    // // spawn launches a new process with a given command
    // var ls = process.spawn('node', [ 'worker.js', i ]);

    // ls.stdout.on('data', function (data) {
    //     console.log('stdout: ' + data);
    // });

    // ls.stderr.on('data', function (data) {
    //     console.log('stderr: ' + data);
    // });

    // ls.on('close', function (code) {
    //     console.log('Child process exited with exit code ' + code);
    // });

    // exec() and spawn() both create processes, but they differ in what they return 
    //  - spawn() returns streams (stdout & stderr)
    //  - spawn() starts receiving the response as soon as the process starts executing
    //  - exec() returns a buffer with a max size
    //  - exec() waits for the process to end and tries to return all the buffered data at once
    //
    // spawn() should be used when the process returns large amount of data
    //

    // Asynchronous Process Creation: child_process.fork(modulePath[, args][, options])
    // fork is a special case of the spawn() functionality, it only creates Node processes

    var ls = process.fork('worker.js', [i]);

    ls.on('close', function (code) {
        console.log('Child process exited with exit code ' + code);
    });
}

