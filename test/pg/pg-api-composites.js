/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */
describe('Unit Test -- api/pg-api.js(composites)',function () {
    describe('composites api', ()=> {
        it('composites', (done)=> {
            $chai.request(global.$app)
                .get("/api/db/composite/type_struct")
                .end(function (err,res) {
                    $logger.info(JSON.stringify(res.body) );
                    (err == null).should.be.true;
                    res.should.have.status(200);
                    res.should.be.a.json;
                    res.body.should.have.property('response');
                    done();
                })
        });
        it('enum', (done)=> {
            $chai.request(global.$app)
                .get("/api/db/enum/type_gender")
                .end(function (err,res) {
                    $logger.info(JSON.stringify(res.body) );
                    (err == null).should.be.true;
                    res.should.have.status(200);
                    res.should.be.a.json;
                    res.body.should.have.property('response');
                    done();
                })
        });
    });
});