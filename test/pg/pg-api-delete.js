/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */
const $delete= require('./../resource/pg/delete.json');
const $insert= require('./../resource/pg/insert.json');
describe('Unit Test -- api/pg-api.js(delete)',function () {
    let account_id = null;
    before($async( async done=>{
        let result = await $pg_query.insert("user",$insert);
        account_id = result[0].account_id;
        done();
    }));
    describe('delete api', ()=> {
        it('delete table by id', (done)=> {
            $chai.request(global.$app)
                .delete(`/api/db/user/${account_id}`)
                .end(function (err,res) {
                    (err == null).should.be.true;
                    res.should.have.status(200);
                    res.should.be.a.json;
                    $logger.info(JSON.stringify(res.body) );
                    $expect(res.body.response).to.be.at.least(0);
                    done();
                })
        });
        it('delete table by JSON', (done)=> {
            $chai.request(global.$app)
                .delete(`/api/db/user`)
                .query({"$q":JSON.stringify($delete)})
                .end(function (err,res) {
                    (err == null).should.be.true;
                    res.should.have.status(200);
                    res.should.be.a.json;
                    $logger.info(JSON.stringify(res.body) );
                    $expect(res.body.response).to.be.at.least(0);
                    done();
                })
        });
        it('delete table by query', (done)=> {
            $chai.request(global.$app)
                .delete(`/api/db/user`)
                .query({"account_id":account_id})
                .end(function (err,res) {
                    (err == null).should.be.true;
                    res.should.have.status(200);
                    res.should.be.a.json;
                    $logger.info(JSON.stringify(res.body) );
                    $expect(res.body.response).to.be.at.least(0);
                    done();
                })
        });
        it('delete table(user) access denied', (done)=> {
            $chai.request(global.$app)
                .delete(`/api/db/company/1`)
                .end(function (err,res) {
                    (err == null).should.be.false;
                    res.should.have.status(400);
                    res.should.be.a.json;
                    $logger.info(JSON.stringify(res.body) );
                    $expect(res.body.response).to.be.at.least(0);
                    done();
                })
        });
    });
});