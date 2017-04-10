# PG-API
RESTful API for PostgreSQL

## Installation

The easiest way to install acorn is with [`npm`][npm].

[npm]: https://www.npmjs.com/

```sh
npm install linkfuture-pg-api
```


## Usage

```nodejs
const $pgApi = require("./pg/pg-api")($config.config.pg.connection);
app.use("/api/db/",$pgApi);
```