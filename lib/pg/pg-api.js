/**
 * Module Name:pg-api
 * Project Name: LinkFuture.NodeJS
 * Created by Cyokin on 2/20/2017
 */

const $express = require('express');
const $router = $express.Router();
const $logger = require('./../utility/logger');
module.exports = meta =>{
    let $pgHelper;
    init();
    //region wrapper output message
    function buildSuccess(res) {
        return body=>{
            let response = (typeof body === "string")?JSON.parse(body):body;
            let output = {meta: {status:res.statusCode,timestamp:new Date().toISOString().split('T').join(' '),message:"success"},response:response};
            res.json(output);
        }
    }
    function nextHandler(err, req, res, next) {
        if(err)
        {
            $logger.info(err);
            res.status(400);
            res.err = err;
            let output = {meta: {status:res.statusCode,timestamp:new Date().toISOString().split('T').join(' '),message:res.err.message},response:null};
            res.json(output);
        }
    }
    //endregion

    //region select
    function build() {
        $router.all("/:table",(req,res,next)=>{
            let action;
            switch (req.method) {
                case "GET":
                    if(!req.query.$q) throw new Error("Invalid json query");
                    action = $pgHelper.select(req.params.table, JSON.parse(req.query.$q));
                    break;
                case "DELETE":
                    if(!req.query.$q) throw new Error("Invalid json query");
                    action = $pgHelper.delete(req.params.table, JSON.parse(req.query.$q));
                    break;
                case "PATCH":
                    if(!req.body) throw new Error("Invalid json query");
                    action = $pgHelper.update(req.params.table, req.body);
                    break;
                case "POST":
                    if(!req.body) throw new Error("Invalid json query");
                    action = $pgHelper.insert(req.params.table, req.body);
                    break;
                default:
                    throw new Error("Specific HTTP Method not support yet");
            }
            action.then(buildSuccess(res)).catch(next);
        },nextHandler);
        $router.all("/:table/:id",(req,res,next)=>{
            let action;
            switch (req.method) {
                case "GET":
                    action = $pgHelper.selectById(req.params.table, JSON.parse(req.params.id));
                    break;
                case "DELETE":
                    action = $pgHelper.deleteById(req.params.table, JSON.parse(req.params.id));
                    break;
                default:
                    throw new Error("Specific HTTP Method not support yet");
            }
            action.then(buildSuccess(res)).catch(next);
        },nextHandler);
    }
    //endregion

    function init() {
        $pgHelper = require('./pg-helper')(meta);
        build();
    }

    return $router;
};