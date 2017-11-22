/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */
describe('Unit Test -- api/pg-api.js(custom)',function () {
    describe('custom api', ()=> {
        it('custom', (done)=> {
            let query = {
                account_id:1,
                company_id:1,
                account1:"account1",
                display_name1:"display_name1",
                account2:"account2",
                display_name2:"display_name2",
                price:999,
            };
            $chai.request(global.$app)
                .get("/api/db/find-user")
                .query(query)
                .end(function (err,res) {
                    (err == null).should.be.true;
                    res.should.have.status(200);
                    res.should.be.a.json;
                    $logger.info(JSON.stringify(res.body) );
                    res.body.should.have.property('response');
                    $assert(res.body.response.data.length===5,"length failed");
                    $assert(res.body.response.data[0][0].account_id===query.account_id,"account_id failed");
                    $assert(res.body.response.data[1][0].company_id===query.company_id,"company_id failed");
                    done();
                })
        });
    });
});