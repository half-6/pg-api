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

const $pgHelper = require('./../../lib/pg/pg-helper')(global.$config.pg);
const $select = require('./../resource/pg/select.json');
const $select_group = require('./../resource/pg/select_group.json');

describe('Unit Test -- pg/pg-tester.js',function () {
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
        it('INSERT', (done)=> {
            let column = ["id,name"];
            $pgHelper.$db.conn.result("INSERT INTO public.user (display_name,account,struct) VALUES (${display_name},${account},(${name}::varchar,${supplier_id}::int4[],${price}::numeric)::type_struct)",{
                display_name:"234",
                account:"234",
                name:"234",
                supplier_id:[2,3],
                price:100
            })
                .then(function (r) {
                        $logger.info(JSON.stringify(r));
                        $logger.info("INSERT " + r.rowCount + " records");
                        done();
                    }
                ).catch($myUtil.errorBack("INSERT",done));
        });

    });
});