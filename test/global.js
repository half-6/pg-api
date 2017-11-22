/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */
process.env.PORT = 4000;
process.env.DEBUG="pg-api";

global.$chai = require('chai');
global.$chaiHttp = require('chai-http');
$chai.use($chaiHttp);
global.$should = $chai.should();
global.$assert = require('assert');
global.$expect = $chai.expect;

const $express = require('express');
global.$app = $express();
const $bodyParser = require('body-parser');
$app.use($bodyParser.json());
$app.use($bodyParser.urlencoded({ extended: false }));

global.$logger = require('./../lib/utility/logger');
global.$myUtil = require('./../lib/utility/util');
global.$config = {
    pg:{
        "connection":"postgres://yvbhpqowumfoav:377b5864babe3e4d1d62aadd30b96005b57bc17ffc1e716b0ae1e85ef82a4f6f@ec2-54-243-215-234.compute-1.amazonaws.com:5432/d6afttk3vvims0?ssl=true",
        "tables":{
            "user":{
                 //select:true,
                 delete:true,
                 //insert:true,
                 //update:true,
                 columns:{
                    password:{"select":false,"where":true,"insert":false,"update":false}
                 },
                 max_limit:10000,
                 limit:10
            },
            "company":{
                delete:false,
            }
        },
        "composites":{
            "type_struct":true
        },
        // "events":{
        //     onRequest:function () {
        //         $logger.info("onRequest =>",JSON.stringify(arguments));
        //     },
        //     on_select_city_request:function () {
        //         $logger.info("on_select_city_request =>",JSON.stringify(arguments));
        //     },
        //     onBuild:function () {
        //         $logger.info("onBuild =>",JSON.stringify(arguments));
        //     },
        //     on_select_city_build:function () {
        //         $logger.info("on_select_city_build =>",JSON.stringify(arguments));
        //     },
        //     onQuery:function () {
        //         $logger.info("onQuery =>",JSON.stringify(arguments));
        //     },
        //     on_select_city_query:function () {
        //         $logger.info("on_select_city_query =>",JSON.stringify(arguments));
        //     },
        //     onComplete:function () {
        //         $logger.info("onComplete =>",JSON.stringify(arguments));
        //     },
        //     on_select_city_complete:function () {
        //         $logger.info("on_select_city_complete =>",JSON.stringify(arguments));
        //     },
        //     on_delete_city_complete:function () {
        //         $logger.info("on_delete_city_complete =>",JSON.stringify(arguments));
        //     },
        // },
        "custom":{
            "find-user":{
                "query":[
                    "select * from public.user where account_id=${account_id};",
                    "select * from public.company where company_id=${company_id}",
                    "insert into public.user(account,display_name) VALUES(${account1},${display_name1}),(${account2},${display_name2}) returning account_id",
                    "update public.user set price = ${price} where account=${account1}",
                    "delete from public.user where display_name=${display_name2}",
                ],
                "method":["GET","post"]
            }
        }
    }
};

global.$pg = require('./../lib/index');
global.$pgQuery = $pg.query(global.$config.pg);
global.$pgApi = $pg.api(global.$config.pg);

$app.use("/api/db/",$pgApi);

global.$chaiRequest = $chai.request(global.$app);


global.$serverErrorVerify=(err,res)=>{
    (err !== null).should.be.true;
    $logger.info(err.message);
    res.should.have.status(500);
};
global.$error= function (name,done) {
    return function (err) {
        $logger.info(name,err);
        done();
    }
}
global.$success= function (name,done) {
    return function (err) {
        $logger.info(name,err);
        done();
    }
}
global.$async=function(fn)
{
    return (done) => {
        Promise
            .resolve(fn(done))
            .catch(done);
    };
};
