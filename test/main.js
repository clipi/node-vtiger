/*
        node-vtiger test

        Usage:
        test/main.js url username accesskey
        test/main.js http://example.com/vtigercrm admin vHgFdsrFrdRdfR

        You can find the accesskey in vtiger user "my preferences"

        local invocation, usually
        vtws = require 'node-vtiger'
*/

var Step, TEST_MODIFIED_TIME, VT_ACCESSKEY, VT_URL, VT_USER, client, doCreate, doDelete, doDescribe, doQuery, doRetrieve, doSync, doUpdate, endOfTest, log, logger, login, vt_lead_test, vtws;

vtws = require('../lib/nodevtiger.js');

logger = require('basic-logger');

logger.setLevel('debug');

Step = require('step');

log = new logger({
  prefix: "test"
});

TEST_MODIFIED_TIME = '1340208309';

if (process.argv.length !== 5) {
  log.error("usage: test/main.js url username accesskey");
  process.exit(1);
}

VT_URL = process.argv[2];

VT_USER = process.argv[3];

VT_ACCESSKEY = process.argv[4];

vt_lead_test = {
  "salutationtype": "M.",
  "firstname": "John",
  "phone": "0123456789",
  "lastname": "The Test",
  "company": "Test Company"
};

console.log('###  Tests node-vtiger');

console.log('create Vtiger_WSClient instance');

client = new vtws(VT_URL, VT_USER, VT_ACCESSKEY, 'debug');

Step(login = function() {
  return client.doLogin(this);
}, doCreate = function(err, result) {
  log.debug('\n### doCreate');
  if (err) {
    log.error(err);
    return err;
  }
  return client.doCreate('Leads', vt_lead_test, this);
}, doUpdate = function(err, result) {
  if (err) {
    log.error(err);
    return err;
  }
  vt_lead_test = result;
  log.debug(JSON.stringify(result));
  log.debug('\n### doUpdate');
  log.debug('change lastname to "test UPDATE"');
  vt_lead_test.lastname = "test UPDATE";
  return client.doUpdate(vt_lead_test, this);
}, doQuery = function(err, result) {
  var query;
  if (err) {
    log.error(err);
    return err;
  }
  log.debug(JSON.stringify(result));
  log.debug('\n### doQuery');
  query = "SELECT * FROM Leads WHERE lead_no='" + vt_lead_test.lead_no + "'";
  return client.doQuery(query, this);
}, doRetrieve = function(err, result) {
  if (err) {
    log.error(err);
    return err;
  }
  log.debug(JSON.stringify(result));
  log.debug('\n### doRetrieve');
  log.debug("id= " + vt_lead_test.id);
  return client.doRetrieve(vt_lead_test.id, this);
}, doDelete = function(err, result) {
  if (err) {
    log.error(err);
    return err;
  }
  log.debug(JSON.stringify(result));
  log.debug('\n### doDelete');
  log.debug("id= " + vt_lead_test.id);
  return client.doDelete(vt_lead_test.id, this);
}, doDescribe = function(err, result) {
  if (err) {
    log.error(err);
    return err;
  }
  log.debug(JSON.stringify(result));
  log.debug('\n### doDescribe');
  return client.doDescribe('Emails', this);
}, doSync = function(err, result) {
  if (err) {
    log.error(err);
    return err;
  }
  log.debug(JSON.stringify(result));
  log.debug('\n### doSync');
  return client.doSync(TEST_MODIFIED_TIME, 'Leads', this);
}, endOfTest = function(err, result) {
  log.debug(JSON.stringify(result));
  return log.debug('### END OF TESTS ###');
});
