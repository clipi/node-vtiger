# Usage:
#
# test/main.js url username accesskey
# test/main.js http://example.com/vtigercrm admin vHgFdsrFrdRdfR
#
# You can find the accesskey in vtiger user "my preferences"

vtws        = require('../lib/nodevtiger.js')
logger      = require 'basic-logger'
logger.setLevel 'debug'

log = new logger( prefix: "test")


VT_URL              = ''
VT_USER             = ''
VT_ACCESSKEY        = ''
VT_LEAD_TEST_NO     = 'CIB4472'
VT_LEAD_TEST_ID     = '2x4808'

if process.argv.length isnt 5
    log.error "usage: test/main.js url username accesskey"
    process.exit 1
    
VT_URL              = process.argv[2]
VT_USER             = process.argv[3]
VT_ACCESSKEY        = process.argv[4]

vt_lead_test    =
    "salutationtype": "M.",
    "firstname": "John",
    "phone": "0123456789",
    "lastname": "The Test",
    "company": "Test Company"

nbErrors = 0

console.log 'test: create Vtiger_WSClient instance'

client = new vtws(VT_URL, VT_USER, VT_ACCESSKEY, 'debug')

client.doLogin( (result) ->
    log.debug VT_URL
    if result is false
        log.error 'error, we are not logged'
    else
        doCreateTest()
)

doCreateTest = () ->
    log.debug('\n############################## test doCreate')
    client.doCreate('Leads', vt_lead_test
    , (result) =>
        if not result
            log.error "error"
            nbErrors += 1
        else
            log.debug JSON.stringify(result, null, 4)
            log.debug '________________________________'
            vt_lead_test = result
            doUpdateTest()
    )

doUpdateTest = () ->
    log.debug('\n############################## test doUpdate')
    log.debug 'change lastname to "test UPDATE"'
    vt_lead_test.lastname = "test UPDATE"
    client.doUpdate( vt_lead_test
    , (result) =>
        if not result
            log.error "error"
            nbErrors += 1
        else
            log.debug JSON.stringify(result, null, 4)
            vt_lead_test = result
            doQueryTest()
    )

doQueryTest =  ->
    log.debug('\n############################## test doQuery')
    query = "SELECT * FROM Leads WHERE lead_no='#{vt_lead_test.lead_no}'"
    log.debug query
    client.doQuery(query
    , (result) =>
        if not result
            log.error "error"
            nbErrors += 1
        else
            log.debug JSON.stringify(result, null, 4)
            log.debug '________________________________'
            doRetreiveTest()
    )

doRetreiveTest = ->
    log.debug('\n############################## test doRetrieve')
    log.debug "id= #{vt_lead_test.id}"
    client.doRetrieve(vt_lead_test.id
    , (result) =>
        if not result
            log.error "error"
            nbErrors += 1
        else
            log.debug JSON.stringify(result, null, 4)
            log.debug '________________________________'
            doDeleteTest()
    )

doDeleteTest = ->
    log.debug('\n############################## test doDelete')
    log.debug "id= #{vt_lead_test.id}"
    client.doDelete(vt_lead_test.id
    , (result) =>
        if not result
            log.error "error"
            nbErrors += 1
        else
            log.debug JSON.stringify(result, null, 4)
            log.debug '________________________________'
            doDescribeTest()
    )


doDescribeTest = ->
    log.debug('\n############################## test doDescribe')
    client.doDescribe( 'Leads'
    , (result) =>
        if not result
            log.error "error"
            nbErrors += 1
        else
            log.debug JSON.stringify(result, null, 4)
            endTest()
    )

endTest = ->
    log.debug "\n\nEnd of tests\n\n"
    if nbErrors is 0
        log.debug 'Test completed without errors'
    else
        log.error "############ #{nbErrors} errors during test ##############################"