/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */
const $express = require('express');
const $app = $express();
const $www = require("./www");
const $pgApi = require("./../../lib/pg/pg-api")(global.$config.pg);
const $bodyParser = require('body-parser');

$app.use($bodyParser.json());
$app.use($bodyParser.urlencoded({ extended: false }));
$app.use("/api/db/",$pgApi);

module.exports =$app;