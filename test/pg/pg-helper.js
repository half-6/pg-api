/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */

const $pgHelper = require('./../../lib/pg/pg-helper')(global.$config.pg);
const $select = require('./../resource/pg/select.json');
const $select_group = require('./../resource/pg/select_group.json');

describe('Unit Test -- pg/pg-helper.js',function () {
    describe('Select', ()=> {
        it('$select', (done)=> {
            $pgHelper.select("user",$select)
                .then(function (r) {
                        $logger.info(JSON.stringify(r));
                        r.should.be.a.object;
                        r.data.should.have.length.above(0)
                        $assert(r.pager.total>0)
                        done();
                    }
                ).catch($myUtil.errorBack("$select",done));
        });
        it('$selectOne', (done)=> {
            $pgHelper.selectOne("user",$select)
                .then(function (r) {
                        $logger.info(JSON.stringify(r));
                        r.should.be.a.object;
                        done();
                    }
                ).catch($myUtil.errorBack("$selectOne",done));
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

        it('getSchema', async ()=> {
            const schema = await $pgHelper.getSchema();
            schema.tables.user.should.be.a.object;
            schema.tables.user.primary_key.should.have.length.same(1);
            schema.composites.type_struct.should.be.a.object;
            schema.enums.type_gender.columns.should.have.length.same(2);
            schema.functions.f_check_email.should.be.a.object;
            $expect(schema.functions.f_check_email.dataType).to.equal("boolean")
        });

        it('functions email', async ()=> {
            const ans = await $pgHelper.func("f_check_email",["test@hotmail.com"]);
            ans.should.have.length.above(0);
            $expect(ans[0].f_check_email).to.equal(true)
        });

        it('functions exception', async ()=> {
            try{
               await $pgHelper.func("f_check_email1",["test@hotmail.com"])
               throw new Error("expect throw no f_check_email1 exist error here")
            }
            catch (ex){
                $expect(ex.message).to.equal("specific function f_check_email1 does not exist")
            }
        });

        it('functions f_table', async ()=> {
            const ans = await $pgHelper.func("f_table", [1,999]);
            ans.should.have.length.above(0);
            $expect(ans[0].account_id).to.equal(1)
        });

        // it('functions f_cursor', async ()=> {
        //     let results = {};
        //     const ans = await $pgHelper.func("f_cursor",[results,1]);
        //     ans.should.have.length.above(0);
        //     $expect(ans[0].account_id).to.equal(1)
        // });
    });
});
