/**
 * Module Name:pg-api
 * Project Name: LinkFuture.NodeJS
 * Created by Cyokin on 2/20/2017
 */

const $express = require('express');
const $router = $express.Router();
const $logger = require('./../utility/logger');
module.exports = conn =>{
    let $pgHelper;
    init();
    //region wrapper output message
    function buildSuccess(res,body) {
        let response = (typeof body === "string")?JSON.parse(body):body;
        let output = {meta: {status:res.statusCode,timestamp:new Date().toISOString().split('T').join(' '),message:"success"},response:response};
        res.json(output);
    }
    function buildError(res,e) {
        $logger.info(e);
        res.status(400);
        res.err = e;
        let output = {meta: {status:res.statusCode,timestamp:new Date().toISOString().split('T').join(' '),message:res.err.message},response:null};
        res.json(output);
    }
    //endregion

    //region select
    function buildSelect() {
        $router.all("/:table",(req,res,next)=>{
            if(!req.query.$q)
            {
                buildError(res,new Error("Invalid json query"));
            }
            else
            {
                let action;
                switch (req.method) {
                    case "GET":
                        action = $pgHelper.select(req.params.table, JSON.parse(req.query.$q));
                        break;
                    case "DELETE":
                        action = $pgHelper.delete(req.params.table, JSON.parse(req.query.$q));
                        break;
                    case "PATCH":
                        action = $pgHelper.update(req.params.table, JSON.parse(req.query.$q));
                        break;
                    default:
                        throw new Error("Specific HTTP Method not support yet");
                }
                action.then(function (r) {
                    buildSuccess(res,r);
                })
                .catch(function (e) {
                    buildError(res,e);
                })
            }
        });
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
            action.then(function (r) {
                buildSuccess(res,r);
            })
            .catch(function (e) {
                buildError(res,e);
            })
        });
    }
    //endregion

    function init() {
        $pgHelper = require('./pg-helper')(conn);
        buildSelect();
    }

    return $router;
};