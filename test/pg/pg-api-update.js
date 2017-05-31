/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */
const $update= require('./../resource/pg/update.json');
const $update_city= require('./../resource/pg/update_city.json');
describe('Unit Test -- api/pg-api.js(update)',function () {
    describe('update user', ()=> {
        it('update table by JSON', (done)=> {
            $chai.request(global.$app)
                .patch(`/api/db/user`)
                .send($update)
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
    describe('update city', ()=> {
        it('update table by JSON', (done)=> {
            $chai.request(global.$app)
                .patch(`/api/db/city`)
                .send($update_city)
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