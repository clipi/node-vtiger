###
        node-vtiger test

        Usage:
        test/main.js url username accesskey
        test/main.js http://example.com/vtigercrm admin vHgFdsrFrdRdfR

        You can find the accesskey in vtiger user "my preferences"

        local invocation, usually
        vtws = require 'node-vtiger'
###

vtws        = require '../lib/nodevtiger.js'
logger      = require 'basic-logger'
Step        = require 'step'

logger.setLevel 'debug'
log = new logger( prefix: "test")

TEST_MODIFIED_TIME  = '1340208309' # timestamp 2012-06-20

if process.argv.length isnt 5
    log.error "usage: test/main.js url username accesskey"
    process.exit 1

LOGGING_LEVEL       = 'debug'
VT_URL              = process.argv[2]
VT_USER             = process.argv[3]
VT_ACCESSKEY        = process.argv[4]

vt_lead_test    =
    "salutationtype": "M.",
    "firstname": "John",
    "phone": "0123456789",
    "lastname": "The Test",
    "company": "Test Company"

console.log '###  Tests node-vtiger'
console.log 'create NodeVtigerWS instance'
client = new vtws(VT_URL, VT_USER, VT_ACCESSKEY, LOGGING_LEVEL)

Step(
    login = ->
        return client.doLogin this
,
    doCreate = (err, result) ->
        log.debug('\n### doCreate')
        if err
            log.error err
            return err

        client.doCreate 'Leads', vt_lead_test, this
,
    doUpdate = (err, result) ->
        if err
            log.error err
            return err
            
        vt_lead_test = result
        log.debug JSON.stringify result
        log.debug('\n### doUpdate')
        log.debug 'change lastname to "test UPDATE"'
        vt_lead_test.lastname = "test UPDATE"
        
        client.doUpdate vt_lead_test, this
,
    doQuery = (err, result) ->
        if err
            log.error err
            return err
            
        log.debug JSON.stringify result
        log.debug('\n### doQuery')
        query = "SELECT * FROM Leads WHERE lead_no='#{vt_lead_test.lead_no}'"
        
        client.doQuery query, this
,
    doRetrieve = (err, result) ->
        if err
            log.error err
            return err
            
        log.debug JSON.stringify result
        log.debug('\n### doRetrieve')
        log.debug "id= #{vt_lead_test.id}"

        client.doRetrieve vt_lead_test.id, this
,
   doDelete = (err, result) ->
        if err
            log.error err
            return err
            
        log.debug JSON.stringify result
        log.debug('\n### doDelete')
        log.debug "id= #{vt_lead_test.id}"

        client.doDelete vt_lead_test.id, this
,
   doDescribe = (err, result) ->
        if err
            log.error err
            return err
            
        log.debug JSON.stringify result
        log.debug('\n### doDescribe')

        client.doDescribe 'Emails', this
,
   doSync = (err, result) ->
        if err
            log.error err
            return err
            
        log.debug JSON.stringify result
        log.debug('\n### doSync')

        client.doSync TEST_MODIFIED_TIME, 'Leads', this
,
    endOfTest = (err, result) ->
        log.debug JSON.stringify result
        log.debug '### END OF TESTS ###'
)
