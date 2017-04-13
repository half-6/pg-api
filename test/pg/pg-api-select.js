/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */
describe('Unit Test -- api/pg-api.js',function () {
    describe('select api', ()=> {
        it('select table', (done)=> {
            $chai.request(global.$app)
                .get(`/api/db/city/1`)
                .end(function (err,res) {
                    (err == null).should.be.true;
                    res.should.have.status(200);
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