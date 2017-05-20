/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */
describe('Unit Test -- api/pg-api.js(custom)',function () {
    describe('custom api', ()=> {
        it('custom', (done)=> {
            $chai.request(global.$app)
                .get("/api/db/find-user")
                .query(
                    {
                        id:1,
                        cityId:3,
                        deletename:"myName",
                        name1:"myName",
                        display_name1:"1213",
                        name2:"myName",
                        display_name2:"1213"
                    })
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