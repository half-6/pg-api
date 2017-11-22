'use strict';
/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */
const $api = require('./pg/pg-api');
const $helper = require('./pg/pg-helper');
module.exports = {
  api: $api,
  query: $helper
};
