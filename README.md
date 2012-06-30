# Vtiger API Connection Library for Node.js Applications

## Abstract

Node-vtiger is a wrapper of Vtiger REST API in Node.js.

## Install

<pre>
  npm install node-vtiger
</pre>

or

<pre>
  git clone git://github.com/clipi/node-vtiger.git 
  cd node-vtiger
  npm link
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
