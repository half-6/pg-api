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
        $logger.error(e);
        res.status(400);
        res.err = e;
        let output = {meta: {status:res.statusCode,timestamp:new Date().toISOString().split('T').join(' '),message:res.err.message},response:null};
        res.json(output);
    }
    //endregion

    //region select
    function buildSelect() {
        $router.get("/:table",(req,res,next)=>{
            if(!req.query.$q)
            {
                buildError(res,new Error("Invalid json query"));
            }
            else
            {
                $pgHelper.select(req.params.table,JSON.parse(req.query.$q))
                    .then(function (r) {
                        buildSuccess(res,r);
                    })
                    .catch(function (e) {
                        buildError(res,e);
                    })
            }
        });
        $router.get("/:table/:id",(req,res,next)=>{
            $pgHelper.selectById(req.params.table,req.params.id)
                .then(function (r) {
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