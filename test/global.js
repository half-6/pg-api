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
global.$logger = require('./../lib/utility/logger');
global.$myUtil = require('./../lib/utility/util');
global.$config = {
    pg:{
        "connection":"postgres://postgres:qazwsx123@192.168.1.2:5432/postgres",
        "tables":{
            "user":{
                 //select:true,
                 delete:false,
                 //insert:true,
                 //update:true,
                 columns:{
                    password:{"select":false,"where":true,"insert":false,"update":false}
                 }
            }
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
                    "select * from public.user where account_id=${id};",
                    "select * from public.city where id=${cityId}",
                    "insert into public.user(account,display_name) VALUES(${name1},${display_name1}),(${name2},${display_name2}) returning account_id",
                    "update public.user set price = ${price} where account=${name1}",
                    "delete from public.user where display_name=${deletename}",
                ],
                "method":["GET","post"]
            }
        }
    }
};
global.$app = require('./http/app');

global.$serverErrorVerify=(err,res)=>{
    (err != null).should.be.true;
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