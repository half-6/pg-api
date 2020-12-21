/**
 * Module Name:
 * Project Name: LinkFuture.pg-api
 * Created by Cyokin on 4/10/2017
 */
const $select= require('./../resource/pg/select.json');
const $select_distinct= require('./../resource/pg/select_distinct.json');
describe('Unit Test -- api/pg-api.js(function)',function () {
    after(() => {
        $logger.info("close server")
        //$chaiRequest.server.close()
    });
    describe('function api', ()=> {
        it('select functions email', (done)=> {
            $chaiRequest
                .get(`/api/db/func/f_check_email?$params=test@hotmail.com`)
                .end(function (err,res) {
                    (err == null).should.be.true;
                    res.should.have.status(200);
                    res.should.be.a.json;
                    res.body.should.have.property('response');
                    $logger.info(JSON.stringify(res.body) );
	                $assert(res.body.response.length > 0)
	                $assert(res.body.response[0].f_check_email===true)
                    done();
                })
        });
        it('select functions f_table', (done)=> {
            $chaiRequest
                .get(`/api/db/func/f_table?$params=1&$params=999`)
                .end(function (err,res) {
                    (err == null).should.be.true;
                    res.should.have.status(200);
                    res.should.be.a.json;
                    res.body.should.have.property('response');
                    $logger.info(JSON.stringify(res.body) );
                    $assert(res.body.response.length > 0)
                    $assert(res.body.response[0].account_id===1)
                    done();
                })
        });
        it('select functions exception', (done)=> {
            $chaiRequest
                .get(`/api/db/func/f_check_email1?$params=test@hotmail.com`)
                .end(function (err,res) {
                    (err != null).should.be.true;
                    res.should.have.status(400);
                    res.should.be.a.json;
                    $logger.info(JSON.stringify(res.body) );
                    res.body.should.have.property('response');
                    $assert(res.body.response === null)
                    $assert(res.body.meta.message === "specific function f_check_email1 does not exist")
                    done();
                })
        });
        it('select functions access denied', (done)=> {
            $chaiRequest
                .get(`/api/db/func/f_check_error`)
                .end(function (err,res) {
                    (err != null).should.be.true;
                    res.should.have.status(400);
                    res.should.be.a.json;
                    $logger.info(JSON.stringify(res.body) );
                    res.body.should.have.property('response');
                    $assert(res.body.response === null)
                    $assert(res.body.meta.message === "access denied for function f_check_error")
                    done();
                })
        });
    });
});
