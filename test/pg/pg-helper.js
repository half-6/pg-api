/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */

const $pgHelper = require('./../../lib/pg/pg-helper')(global.$config.pg.connection);
const $select = require('./../resource/pg/select.json');
const $select_group = require('./../resource/pg/select_group.json');

describe('Unit Test -- pg/pg-helper.js',function () {
    describe('Select', ()=> {
        it('$select', (done)=> {
            $pgHelper.select("user",$select)
                .then(function (r) {
                        $logger.info(JSON.stringify(r));
                        r.should.be.a.object;
                        done();
                    }
                ).catch($myUtil.errorBack("Select",done));
        });
        it('$select_group', (done)=> {
            $pgHelper.select("user",$select_group)
                .then(function (r) {
                        $logger.info(r);
                        r.should.be.a.object;
                        done();
                    }
                ).catch($myUtil.errorBack("$select_group",done));
        });
        it('$selectById', (done)=> {
            $pgHelper.selectById("user",2)
                .then(function (r) {
                        $logger.info(r);
                        r.should.be.a.object;
                        done();
                    }
                ).catch($myUtil.errorBack("$selectById",done));
        });
    });
});