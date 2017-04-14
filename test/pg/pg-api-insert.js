/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */
const $insert= require('./../resource/pg/insert.json');
const $insert_bulk= require('./../resource/pg/insert_bulk.json');
describe('Unit Test -- api/pg-api.js',function () {
    describe('insert api', ()=> {
        it('insert table by JSON', (done)=> {
            $chai.request(global.$app)
                .post(`/api/db/user`)
                .send($insert)
                .end(function (err,res) {
                    (err == null).should.be.true;
                    res.should.have.status(200);
                    res.should.be.a.json;
                    $logger.info(JSON.stringify(res.body) );
                    res.body.response.should.have.length.above(0);
                    done();
                })
        });
        it('insert bulk table by JSON', (done)=> {
            $chai.request(global.$app)
                .post(`/api/db/user`)
                .send($insert_bulk)
                .end(function (err,res) {
                    (err == null).should.be.true;
                    res.should.have.status(200);
                    res.should.be.a.json;
                    $logger.info(JSON.stringify(res.body) );
                    res.body.response.should.have.length.above(0);
                    done();
                })
        });
    });
});