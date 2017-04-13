/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */
const $delete= require('./../resource/pg/delete.json');
describe('Unit Test -- api/pg-api.js',function () {
    describe('delete api', ()=> {
        it('delete table by id', (done)=> {
            $chai.request(global.$app)
                .delete(`/api/db/city/1`)
                .end(function (err,res) {
                    (err == null).should.be.true;
                    res.should.have.status(200);
                    res.should.be.a.json;
                    $logger.info(JSON.stringify(res.body) );
                    res.body.should.have.property('response');
                    done();
                })
        });
        it('delete table by JSON', (done)=> {
            $chai.request(global.$app)
                .delete(`/api/db/city`)
                .query({"$q":JSON.stringify($delete)})
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