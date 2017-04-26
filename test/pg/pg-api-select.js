/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */
const $select= require('./../resource/pg/select.json');
describe('Unit Test -- api/pg-api.js(select)',function () {
    describe('select api', ()=> {
        it('select table', (done)=> {
            $chai.request(global.$app)
                .get(`/api/db/user/1`)
                .end(function (err,res) {
                    (err == null).should.be.true;
                    res.should.have.status(200);
                    res.should.be.a.json;
                    $logger.info(JSON.stringify(res.body) );
                    res.body.should.have.property('response');
                    done();
                })
        });
        it('select table by JSON', (done)=> {
            $chai.request(global.$app)
                .get(`/api/db/user`)
                .query({$q:JSON.stringify($select)})
                .end(function (err,res) {
                    (err == null).should.be.true;
                    res.should.have.status(200);
                    res.should.be.a.json;
                    $logger.info(JSON.stringify(res.body) );
                    res.body.should.have.property('response');
                    done();
                })
        });
        it('error test', (done)=> {
            $chai.request(global.$app)
                .get(`/api/db/user`)
                //.query({$q:JSON.stringify($select)})
                .end(function (err,res) {
                    (err == null).should.be.false;
                    res.should.have.status(400);
                    res.should.be.a.json;
                    $logger.info(JSON.stringify(res.body) );
                    res.body.should.have.property('response');
                    done();
                })
        });
        it('select view', (done)=> {
            $chai.request(global.$app)
                .get(`/api/db/v_test/1`)
                .end(function (err,res) {
                    (err == null).should.be.true;
                    res.should.have.status(200);
                    res.should.be.a.json;
                    $logger.info(JSON.stringify(res.body) );
                    res.body.should.have.property('response');
                    done();
                })
        });
    });
});