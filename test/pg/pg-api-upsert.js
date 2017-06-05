/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */
const $upsert= require('./../resource/pg/upsert.json');
const $upsert_bulk= require('./../resource/pg/upsert_bulk.json');
describe('Unit Test -- api/pg-api.js(insert)',function () {
    describe('upsert api', ()=> {
        it('upsert table by JSON', (done)=> {
            $chai.request(global.$app)
                .put(`/api/db/city/city_pkey`)
                .send($upsert)
                .end(function (err,res) {
                    (err == null).should.be.true;
                    res.should.have.status(200);
                    res.should.be.a.json;
                    $logger.info(JSON.stringify(res.body) );
                    res.body.response.should.have.length.above(0);
                    done();
                })
        });
        it('upsert bulk table by JSON', (done)=> {
            $chai.request(global.$app)
                .put(`/api/db/city/city_pkey`)
                .send($upsert_bulk)
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