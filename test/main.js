
/*
        node-vtiger test

        Usage:
        test/main.js url username accesskey
        test/main.js http://example.com/vtigercrm admin vHgFdsrFrdRdfR

        You can find the accesskey in vtiger user "my preferences"

        local invocation, usually
        vtws = require 'node-vtiger'
*/


(function() {
  var TEST_MODIFIED_TIME, VT_ACCESSKEY, VT_URL, VT_USER, client, doCreateTest, doDeleteTest, doDescribeTest, doQueryTest, doRetreiveTest, doSyncTest, doUpdateTest, endTest, log, logger, nbErrors, vt_lead_test, vtws;

  vtws = require('../lib/nodevtiger.js');

  logger = require('basic-logger');

  logger.setLevel('debug');

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

  nbErrors = 0;

  console.log('test: create Vtiger_WSClient instance');

  client = new vtws(VT_URL, VT_USER, VT_ACCESSKEY, 'debug');

  client.doLogin(function(result) {
    log.debug('login ' + VT_URL + ' ' + VT_USER + ' ' + VT_ACCESSKEY);
    if (result === false) {
      return log.error('login->result is false, we are not logged');
    } else {
      return doCreateTest();
    }
  });

  doCreateTest = function() {
    var _this = this;
    log.debug('\n############################## test doCreate');
    return client.doCreate('Leads', vt_lead_test, function(result) {
      if (!result) {
        log.error("error");
        return nbErrors += 1;
      } else {
        log.debug(JSON.stringify(result, null, 4));
        vt_lead_test = result;
        return doUpdateTest();
      }
    });
  };

  doUpdateTest = function() {
    var _this = this;
    log.debug('\n############################## test doUpdate');
    log.debug('change lastname to "test UPDATE"');
    vt_lead_test.lastname = "test UPDATE";
    return client.doUpdate(vt_lead_test, function(result) {
      if (!result) {
        log.error("error");
        return nbErrors += 1;
      } else {
        log.debug(JSON.stringify(result, null, 4));
        vt_lead_test = result;
        return doQueryTest();
      }
    });
  };

  doQueryTest = function() {
    var query,
      _this = this;
    log.debug('\n############################## test doQuery');
    query = "SELECT * FROM Leads WHERE lead_no='" + vt_lead_test.lead_no + "'";
    log.debug(query);
    return client.doQuery(query, function(result) {
      if (!result) {
        log.error("error");
        return nbErrors += 1;
      } else {
        log.debug(JSON.stringify(result, null, 4));
        return doRetreiveTest();
      }
    });
  };

  doRetreiveTest = function() {
    var _this = this;
    log.debug('\n############################## test doRetrieve');
    log.debug("id= " + vt_lead_test.id);
    return client.doRetrieve(vt_lead_test.id, function(result) {
      if (!result) {
        log.error("error");
        return nbErrors += 1;
      } else {
        log.debug(JSON.stringify(result, null, 4));
        return doDeleteTest();
      }
    });
  };

  doDeleteTest = function() {
    var _this = this;
    log.debug('\n############################## test doDelete');
    log.debug("id= " + vt_lead_test.id);
    return client.doDelete(vt_lead_test.id, function(result) {
      if (!result) {
        log.error("error");
        return nbErrors += 1;
      } else {
        log.debug(JSON.stringify(result, null, 4));
        return doDescribeTest();
      }
    });
  };

  doDescribeTest = function() {
    var _this = this;
    log.debug('\n############################## test doDescribe Leads');
    return client.doDescribe('Leads', function(result) {
      if (!result) {
        log.error("error");
        return nbErrors += 1;
      } else {
        log.debug(JSON.stringify(result, null, 4));
        return doSyncTest();
      }
    });
  };

  doSyncTest = function() {
    var _this = this;
    log.debug('\n############################## test doSync');
    return client.doSync(TEST_MODIFIED_TIME, 'Leads', function(result) {
      if (!result) {
        log.error("error");
        return nbErrors += 1;
      } else {
        log.debug(JSON.stringify(result, null, 4));
        return endTest();
      }
    });
  };

  endTest = function() {
    log.debug("\n\nEnd of tests\n\n");
    if (nbErrors === 0) {
      return log.debug('Test completed without errors');
    } else {
      return log.error("############ " + nbErrors + " errors during test ##############################");
    }
  };

}).call(this);
