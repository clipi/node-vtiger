/*                 NodeVtiger
                
Description:        Node vtiger webservice client library
Contributors:       marco.parronchi@tiwee.net
                    https://github.com/itag
License:            public domain: http://www.nolicense.org/

                    infos in /README.md
*/


(function() {
  var NodeVtigerWS, crypto, request, sys;

  crypto = require('crypto');

  sys = require('util');

  request = require('request');

  NodeVtigerWS = (function() {

    function NodeVtigerWS(url, username, accesskey, level) {
      var logger;
      if (level == null) {
        level = 'warning';
      }
      this._wsUrl = url + '/webservice.php';
      this._wsUsername = username;
      this._wsAccesskey = accesskey;
      this._wsToken = false;
      this._wsSessionName = false;
      this._wsUserId = false;
      this._isLogged = false;
      this._lastError = false;
      this.callback = false;
      this._default_headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Accept-Charset": "utf-8"
      };
      logger = require('basic-logger');
      logger.setLevel(level);
      this.log = new logger({
        prefix: "node-vtiger"
      });
      this.log.trace("NodeVtigerWS constructor");
    }

    NodeVtigerWS.prototype.__hasError = function(resultdata) {
      this.log.trace("hasError");
      if (resultdata != null) {
        if (resultdata.success === false) {
          this.log.error("erreur result= " + (JSON.stringify(resultdata.error)));
          this._lastError = resultdata.error;
          return true;
        }
      } else {
        this.log.error("__hasError: result data is null");
        this._lastError = {
          "error": {
            "code": "NULL_RESULT",
            "message": "Resultdata is null"
          }
        };
        return true;
      }
      this._lastError = null;
      return false;
    };

    NodeVtigerWS.prototype.__performCallback = function(err, result) {
      var callbackArguments, callbackFunction;
      this.log.trace("performCallback");
      if (this.callback != null) {
        callbackFunction = this.callback;
        callbackArguments = false;
        if (typeof callback === "object") {
          this.log.trace('callback is object');
          callbackFunction = this.callback["function"];
          callbackArguments = this.callback["arguments"];
        }
        if (typeof callbackFunction === "function") {
          return callbackFunction(err, result, callbackArguments);
        }
      } else {
        this.log.error('__performCallback without @callback');
        return false;
      }
    };

    NodeVtigerWS.prototype.__checkLogin = function() {
      this.log.trace("checkLogin");
      if (this._isLogged === false) {
        this.log.error("__checkLogin: isLogged = false, I quit");
        this._lastError = {
          "error": {
            "code": "NOT_LOGGED",
            "message": "Try to send a request without being logged"
          }
        };
        return false;
      } else {
        return true;
      }
    };

    NodeVtigerWS.prototype.__processResponse = function(error, response, body) {
      var resobj, result;
      this.log.trace("processResponse ");
      result = false;
      if (error) {
        this.log.error("request -> error");
        this._lastError = {
          "error": {
            "code": "REQUEST_ERROR",
            "message": "Error on request"
          }
        };
        this._lastError = error;
      } else if (response.statusCode === !200) {
        this.log.error("__processResponse: response.statusCode is not " + response.statusCode);
        this._lastError = {
          "error": {
            "code": "ERROR_REQUEST_STATUS_CODE",
            "message": "Error on request, statusCode = " + response.statusCode
          }
        };
      } else {
        resobj = JSON.parse(body);
        if (this.__hasError(resobj) === false) {
          result = resobj.result;
        }
      }
      this.__performCallback(this._lastError, result);
    };

    NodeVtigerWS.prototype.lastError = function() {
      return this._lastError;
    };

    NodeVtigerWS.prototype.doLogin = function(callback) {
      var params,
        _this = this;
      this.callback = callback;
      this.log.trace("doLogin: " + this._wsUsername + ", " + this._wsAccesskey);
      if (this._isLogged) {
        this.log.trace("Trying to log, but we a are logged");
        return this.__performCallback(null, true);
      }
      params = "?operation=getchallenge&username=" + this._wsUsername;
      this.log.trace(this._wsUrl + params);
      request(this._wsUrl + params, function(e, r, body) {
        var response;
        if (e) {
          _this.log.error("doLogin: request getChallenge -> error: " + (JSON.stringify(e)));
          _this._lastError = {
            "error": {
              "code": "ERROR_ON_REQUEST",
              "message": "Error on request (get challenge)"
            }
          };
          _this.__performCallback(_this._lastError, false);
          return false;
        } else if (r.statusCode !== 200) {
          _this.log.error("doLogin: request getChallenge, response.statusCode is " + r.statusCode);
          _this._lastError = {
            "error": {
              "code": "ERROR_REQUEST_STATUS_CODE",
              "message": "Error on request, statusCode = " + r.statusCode
            }
          };
          return _this.__performCallback(_this._lastError, false);
        }
        try {
          response = JSON.parse(body);
        } catch (ex) {
          _this.log.error(body);
          _this.log.error(ex);
          return _this.__performCallback(ex, null, _this.callback);
        }
        if (_this.__hasError(response)) {
          return _this.__performCallback(response, false);
        }
        if (response.result.token === false) {
          _this.log.error("doLogin: response.result.token is false");
          _this._lastError = {
            "error": {
              "code": "NO_TOKEN_AFTER_CHALLENGE",
              "message": "No token after challenge"
            }
          };
          return _this.__performCallback(_this._lastError, false);
        }
        _this._wsToken = response.result.token;
        _this.log.trace("POST @_wsUrl login " + _this._wsUsername);
        request.post({
          url: _this._wsUrl,
          headers: _this._default_headers,
          form: {
            operation: "login",
            username: _this._wsUsername,
            accessKey: crypto.createHash("md5").update(_this._wsToken + _this._wsAccesskey).digest("hex")
          }
        }, function(e, r, body) {
          var resobj, result;
          result = false;
          if (e) {
            _this.log.error("doLogin: login, request -> error: " + (JSON.stringify(error)));
            _this._lastError = {
              "error": {
                "code": "ERROR_ON_REQUEST",
                "message": "Error on request (post)"
              }
            };
          } else if (r.statusCode !== 200) {
            _this.log.error("doLogin: login, response.statusCode is " + r.statusCode);
            _this._lastError = {
              "error": {
                "code": "ERROR_REQUEST_STATUS_CODE",
                "message": "Error on request, statusCode = " + r.statusCode
              }
            };
          } else {
            resobj = JSON.parse(body);
            if (_this.__hasError(resobj) === false) {
              result = resobj.result;
              _this._isLogged = true;
              _this._wsSessionName = resobj.result.sessionName;
              _this.log.trace("sessionid=" + _this._wsSessionName);
              _this._wsUserId = resobj.result.userId;
            }
          }
          return _this.__performCallback(_this._lastError, result);
        });
      });
    };

    NodeVtigerWS.prototype.doQuery = function(query, callback) {
      var params,
        _this = this;
      this.callback = callback;
      this.log.trace('doQuery: ' + query);
      if (!this.__checkLogin()) {
        return this.__performCallback(this._lastError, false);
      }
      if (query.indexOf(";") === -1) {
        query += ";";
      }
      params = '?operation=query&sessionName=' + this._wsSessionName + '&query=' + encodeURI(query);
      this.log.trace(this._wsUrl + params);
      request(this._wsUrl + params, function(e, r, body) {
        return _this.__processResponse(e, r, body);
      });
    };

    NodeVtigerWS.prototype.doDescribe = function(module, callback) {
      var params,
        _this = this;
      this.callback = callback;
      this.log.trace('doDescribe ' + module);
      if (!this.__checkLogin()) {
        return this.__performCallback(this._lastError, false);
      }
      params = '?operation=describe&sessionName=' + this._wsSessionName + '&elementType=' + module;
      this.log.trace(this._wsUrl + params);
      request(this._wsUrl + params, function(e, r, body) {
        return _this.__processResponse(e, r, body);
      });
    };

    NodeVtigerWS.prototype.doListtypes = function(callback) {
      var params,
        _this = this;
      this.callback = callback;
      this.log.trace('doListtypes');
      if (!this.__checkLogin()) {
        return this.__performCallback(this._lastError, false);
      }
      params = '?operation=listtypes&sessionName=' + this._wsSessionName;
      this.log.trace(this._wsUrl + params);
      request(this._wsUrl + params, function(e, r, body) {
        return _this.__processResponse(e, r, body);
      });
    };

    NodeVtigerWS.prototype.doRetrieve = function(id, callback) {
      var params,
        _this = this;
      this.callback = callback;
      this.log.trace('doRetrieve: ' + id);
      if (!this.__checkLogin()) {
        return this.__performCallback(this._lastError, false);
      }
      params = '?operation=retrieve&sessionName=' + this._wsSessionName + '&id=' + id;
      this.log.trace(this._wsUrl + params);
      request(this._wsUrl + params, function(e, r, body) {
        return _this.__processResponse(e, r, body);
      });
    };

    NodeVtigerWS.prototype.doSync = function(modifiedTime, module, callback) {
      var params,
        _this = this;
      this.callback = callback;
      this.log.trace('doSync: ' + modifiedTime + ' ' + module);
      if (!this.__checkLogin()) {
        return this.__performCallback(this._lastError, false);
      }
      params = '?operation=sync&sessionName=' + this._wsSessionName + '&modifiedTime=' + modifiedTime;
      if (module) {
        params += '&elementType=' + module;
      }
      this.log.trace(this._wsUrl + params);
      request(this._wsUrl + params, function(e, r, body) {
        return _this.__processResponse(e, r, body);
      });
    };

    NodeVtigerWS.prototype.doDelete = function(id, callback) {
      var _this = this;
      this.callback = callback;
      this.log.trace('doDelete: ' + id);
      if (!this.__checkLogin()) {
        return this.__performCallback(this._lastError, false);
      }
      request.post({
        url: this._wsUrl,
        headers: this._default_headers,
        form: {
          operation: "delete",
          id: id,
          sessionName: this._wsSessionName
        }
      }, function(e, r, body) {
        return _this.__processResponse(e, r, body);
      });
    };

    NodeVtigerWS.prototype.doUpdate = function(valueMap, callback) {
      var _this = this;
      this.callback = callback;
      this.log.trace("doUpdate");
      if (!(valueMap.id != null)) {
        this._lastError = {
          "error": {
            "code": "ERROR_UPDATE_NO_ID",
            "message": "doUpdate without id"
          }
        };
        return this.__performCallback(this._lastError, false);
      }
      if (!this.__checkLogin()) {
        return this.__performCallback(this._lastError, false);
      }
      request.post({
        url: this._wsUrl,
        headers: this._default_headers,
        form: {
          "operation": "update",
          "sessionName": this._wsSessionName,
          "element": JSON.stringify(valueMap)
        }
      }, function(e, r, body) {
        return _this.__processResponse(e, r, body);
      });
    };

    NodeVtigerWS.prototype.doCreate = function(module, valueMap, callback) {
      var _this = this;
      this.callback = callback;
      this.log.trace("doCreate: module=" + module);
      if (!this.__checkLogin()) {
        return this.__performCallback(this._lastError, false);
      }
      if (valueMap.assigned_user_id == null) {
        valueMap.assigned_user_id = this._wsUserId;
      }
      request.post({
        url: this._wsUrl,
        headers: this._default_headers,
        form: {
          operation: "create",
          sessionName: this._wsSessionName,
          elementType: module,
          element: JSON.stringify(valueMap)
        }
      }, function(e, r, body) {
        return _this.__processResponse(e, r, body);
      });
    };

    return NodeVtigerWS;

  })();

  module.exports = NodeVtigerWS;

}).call(this);
