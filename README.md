# Vtiger API Connection Library for Node.js Applications

## Abstract

Node-vtiger, written in CoffeeScript, is a wrapper of Vtiger REST API in Node.js.<br />
I use it for a robot (node) which is doing automated tasks.

## Install

<pre>
  npm install node-vtiger
</pre>


## Test

Show how to use the module.<br />
The test is tranparent, it creates a lead, update, query, and delete it.<br />
The test use step module for serial execution.<br />

<pre>
    npm install step
    test/main.js url username accesskey
    test/main.js http://example.com/vtigercrm admin vHgFdsrFrdRdfR
</pre>

## Usage

VTiger webservice API: https://wiki.vtiger.com/index.php/Webservices_tutorials<br />

<pre>
    vtws = require('node-vtiger')
    VT_URL = 'http://example.com/vtigercrm'
    VT_USER = 'admin'
    VT_ACCESSKEY = 'rFtfsdRfTgUggY' # accesskey is in your vtiger user preferences
    LEVEL = 'debug' # level of logging (error||warning||warn||info||debug||trace)
                    # The log in the module are at the level trace

    client = new vtws(VT_URL, VT_USER, VT_ACCESSKEY, 'debug')
    client.doLogin(callback)
    client.doQuery(query, callback)
    client.doDescribe(module, callback)
    client.doRetrieve(id, callback)
    client.doUpdate(valuemap, callback)
    client.doCreate(valuemap, callback)
    client.doSync(modifiedTime, module, callback)
</pre>

Example with Step, the very useful control-flow node library:<br />
<pre>
    Step   = require 'step'
    client = new vtws(VT_URL, VT_USER, VT_ACCESSKEY, 'warning')

    Step(
        login = ->
            return client.doLogin this
    ,
        doQuery = (err, result) ->
            query = "SELECT * FROM Leads WHERE lead_no='LEA12345'"
            client.doQuery query, this
    ,
        doWhatYouWant = (err, result) ->
            console.log JSON.stringify result
    )
</pre>

## Acknowledgement

http://forge.vtiger.com/projects/vtwsclib <br />
http://vtiger.com <br />
http://nodejs.org <br />
http://coffeescript.org <br />
https://github.com/mikeal/request <br />
https://github.com/drd0rk/logger <br />
https://github.com/creationix/step <br />

## License

Public Domain & copyleft: http://www.nolicense.org<br />
<i>The software is provided "as is", without warranty of any kind.</i>

