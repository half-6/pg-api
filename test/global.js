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