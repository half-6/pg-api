/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */

const $pgRepository = require('./../../lib/pg/pg-repository')(global.$config.pg);


describe('Unit Test -- pg/pg-repository.js',function () {
    describe('repository', ()=> {
        it('tables', async ()=> {
            const $db = await $pgRepository.build()
            const result = await $db.tables.user.select({$where:{account:"account_1"}});
            $logger.info(JSON.stringify(result));
            result.should.be.a.object;
        });
        it('composites', async ()=> {
            const $db = await $pgRepository.build()
            const result = await $db.composites.type_struct;
            $logger.info(JSON.stringify(result));
            result.should.be.a.object;
        });
        it('enums', async ()=> {
            const $db = await $pgRepository.build()
            const result = await $db.enums.type_gender;
            $logger.info(JSON.stringify(result));
            result.should.be.a.object;
        });
    });
});