#!/usr/bin/env node

/**
 * Module dependencies.
 */
module.exports = app => {
  const $http = require('http');
  const $logger = global.$logger;
  const $server = $http.createServer(app);
  const $port = normalizePort(process.env.PORT || '3000');

  app.set('port', $port);
  $server.listen($port,function () {
     $logger.info(`Start application with ${process.env.NODE_ENV} model`);
  });

  $server.on('error', onError);
  $server.on('listening', onListening);

  /**
   * Normalize a port into a number, string, or false.
   */
  function normalizePort(val) {
    const port = parseInt(val, 10);

    if (isNaN(port)) {
      // named pipe
      return val;
    }

    if (port >= 0) {
      // port number
      return port;
    }

    return false;
  }

  /**
   * Event listener for HTTP server "error" event.
   */
  function onError(error) {
    if (error.syscall !== 'listen') {
      throw error;
    }
    const bind = typeof $port === 'string'
        ? 'Pipe ' + $port
        : 'Port ' + $port;
    // handle specific listen errors with friendly messages
    switch (error.code) {
      case 'EACCES':
        $logger.info(bind + ' requires elevated privileges');
        process.exit(1);
        break;
      case 'EADDRINUSE':
        $logger.info(bind + ' is already in use');
        process.exit(1);
        break;
      default:
        throw error;
    }
  }

  /**
   * Event listener for HTTP server "listening" event.
   */
  function onListening() {
    let addr = $server.address();
    const bind = typeof addr === 'string'
        ? 'pipe ' + addr
        : 'port ' + addr.port;
    $logger.info(`Listening on ${bind}`);
  }
};


