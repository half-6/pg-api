/**
 * Module Name:
 * Project Name: LinkFuture.NodeJS
 * Created by Cyokin on 1/11/2017
 */

/**
 * Created by zhangc01
 * on 1/9/2017.
 */
/**
 * Created by zhangc01
 * on 1/9/2017.
 */

const $pgHelper = require('./../../lib/pg/pg-helper')(global.$config.pg.connection);
const $select = require('./../resource/pg/select.json');
const $select_group = require('./../resource/pg/select_group.json');

describe('Unit Test -- pg/pg-helper.js',function () {
    describe('Select', ()=> {
        it('$select', (done)=> {
            $pgHelper.$db.conn.query("SELECT * from public.user where account_id = ANY(${id})",{id:[1,2]})
                .then(function (r) {
                        $logger.info(JSON.stringify(r));
                        $logger.info("got " + r.length + " records");
                        done();
                    }
                ).catch($myUtil.errorBack("Select",done));
        });
        // it('$query', (done)=> {
        //     let column = ["id,name"];
        //     $pgHelper.$db.conn.query("SELECT ${columns^} FROM ${table~} WHERE id = ${id}",{
        //         table:"city",
        //         columns:column.map($pgHelper.$pgp.as.name).join(),
        //         id:1
        //     })
        //         .then(function (r) {
        //                 $logger.info(JSON.stringify(r));
        //                 $logger.info("got " + r.length + " records");
        //                 done();
        //             }
        //         ).catch($util.errorBack("Select",done));
        // });

    });
});