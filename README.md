# Vtiger API Connection Library for Node.js Applications

## Abstract

Node-vtiger, written in CoffeeScript, is a wrapper of Vtiger REST API in Node.js.
I use it for a robot witch is doing automated task

## Install

<pre>
  npm install node-vtiger
</pre>


## Test

<pre>
    test/main.js url username accesskey
    test/main.js http://example.com/vtigercrm admin vHgFdsrFrdRdfR
</pre>

## Usage

<pre>
    vtws = require('node-vtiger')
    VT_URL = 'http://example.com/vtigercrm'
    VT_USER = 'admin'
    VT_ACCESSKEY = 'rFtfsdRfTgUggY' # accesskey is in your vtiger user preferences
    client = new vtws(VT_URL, VT_USER, VT_ACCESSKEY, 'debug')
    client.doLogin(callback)
    client.doQuery(query, callback)
    client.doDescribe(module, callnack)
    client.doRetrieve(id, callback)
    client.doUpdate(valuemap, callback)
    client.doCreate(valuemap, callback)
    client.doSync(modifiedTime, module, callback)
    client.doInvoke(callback, method, params) # not tested
</pre>

## Acknowledgement

http://forge.vtiger.com/projects/vtwsclib/ <br />
http://vtiger.com <br />
http://nodejs.org <br />
http://coffeescript.org <br />
https://github.com/mikeal/request/ <br />
http://expressjs.com <br />
https://github.com/drd0rk/logger <br />

## Licence

public domain: http://www.nolicense.org
