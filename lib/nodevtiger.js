
/*                 NodeVtiger
                
Description:        Node vtiger webservice client library
Contributor:        marco.parronchi@tiwee.net
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
        level = 'debug';
      }
      this._wsUrl = url + '/webservice.php';
      this._wsUsername = username;
      this._wsAccesskey = accesskey;
      this._wsToken = false;
      this._wsSessionName = false;
      this._wsUserId = false;
      this._isLogged = false;
      this._lastError = false;
      this._default_headers = {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Accept-Charset": "utf-8"
      };
      this.__callback = false;
      logger = require('basic-logger');
      logger.setLevel(level);
      this.log = new logger({
        prefix: "node-vtiger"
      });
      this.log.debug("Vtiger_WSClient constructor");
    }

    NodeVtigerWS.prototype.__hasError = function(resultdata) {
      this.log.debug("hasError");
      if (resultdata != null) {
        if (resultdata.success === false) {
          this.log.error("erreur result= " + (JSON.stringify(resultdata.error)));
          this._lastError = resultdata.error;
          return true;
        }
      } else {
        this.log.error("result data is null");
        this._lastError = {
          "error": {
            "code": "NULL_RESULT",
            "message": "Resultdata is null"
          }
        };
        return true;
      }
      this._lastError = false;
      return false;
    };

    NodeVtigerWS.prototype.__performCallback = function(callback, result) {
      var callbackArguments, callbackFunction;
      this.log.debug("performCallback");
      if (callback != null) {
        callbackFunction = callback;
        callbackArguments = false;
        if (typeof callback === "object") {
          callbackFunction = callback["function"];
          callbackArguments = callback["arguments"];
        }
        if (typeof callbackFunction === "function") {
          return callbackFunction(result, callbackArguments);
        }
      }
    };

    NodeVtigerWS.prototype.__checkLogin = function() {
      this.log.debug("checkLogin");
      if (this._isLogged === false) {
        this.log.error("isLogged = false, I quit");
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
      this.log.debug("processResponse ");
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
        this.log.error("response.statusCode is not 200");
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
      return this.__performCallback(this.__callback, result);
    };

    NodeVtigerWS.prototype.lastError = function() {
      return this._lastError;
    };

    NodeVtigerWS.prototype.doLogin = function(callback) {
      var params,
        _this = this;
      if (callback == null) {
        callback = false;
      }
      this.log.debug("doLogin: " + this._wsUsername + ", " + this._wsAccesskey);
      this.__callback = callback;
      params = "?operation=getchallenge&username=" + this._wsUsername;
      this.log.debug(this._wsUrl + params);
      request(this._wsUrl + params, function(e, r, body) {
        var response;
        if (e) {
          _this.log.error("request -> error: " + (JSON.stringify(error)));
          _this._lastError = {
            "error": {
              "code": "ERROR_ON_REQUEST",
              "message": "Error on request (get challenge)"
            }
          };
          _this.__performCallback(_this.__callback, false);
          return false;
        } else if (r.statusCode !== 200) {
          _this.log.error("response.statusCode is " + r.statusCode);
          _this._lastError = {
            "error": {
              "code": "ERROR_REQUEST_STATUS_CODE",
              "message": "Error on request, statusCode = " + r.statusCode
            }
          };
          _this.__performCallback(_this.__callback, false);
          return false;
        }
        try {
          response = JSON.parse(body);
        } catch (ex) {
          _this.log.error(body);
          _this.log.error(ex);
          _this.__performCallback(_this.__callback, false);
          return false;
        }
        if (_this.__hasError(response)) {
          _this.__performCallback(_this.__callback, false);
          return false;
        }
        if (response.result.token === false) {
          _this._lastError = {
            "error": {
              "code": "NO_TOKEN_AFTER_CHALLENGE",
              "message": "No token after challenge"
            }
          };
          _this.__performCallback(_this.__callback, false);
          return false;
        }
        _this._wsToken = response.result.token;
        _this.log.debug("POST @_wsUrl login " + _this._wsUsername);
        return request.post({
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
            _this.log.error("request -> error: " + (JSON.stringify(error)));
            _this._lastError = {
              "error": {
                "code": "ERROR_ON_REQUEST",
                "message": "Error on request (post)"
              }
            };
          } else if (r.statusCode !== 200) {
            _this.log.error("response.statusCode is " + r.statusCode);
            _this._lastError = {
              "error": {
                "code": "ERROR_REQUEST_STATUS_CODE",
                "message": "Error on request, statusCode = " + r.statusCode
              }
            };
          } else {
            resobj = JSON.parse(body);
            if (_this.__hasError(resobj) === false) {
              result = true;
              _this._isLogged = true;
              _this._wsSessionName = resobj.result.sessionName;
              _this.log.debug("sessionid=" + _this._wsSessionName);
              _this._wsUserId = resobj.result.userId;
            }
          }
          return _this.__performCallback(_this.__callback, result);
        });
      });
      return this._isLogged;
    };

    NodeVtigerWS.prototype.doQuery = function(query, callback) {
      var params,
        _this = this;
      this.log.debug('doQuery: ' + query);
      this.__callback = callback;
      if (!this.__checkLogin()) {
        return this.__performCallback(this.__callback, false);
      } else {
        if (query.indexOf(";") === -1) {
          query += ";";
        }
        params = '?operation=query&sessionName=' + this._wsSessionName + '&query=' + escape(query);
        this.log.debug(this._wsUrl + params);
        return request(this._wsUrl + params, function(e, r, body) {
          return _this.__processResponse(e, r, body);
        });
      }
    };

    NodeVtigerWS.prototype.doDescribe = function(module, callback) {
      var params,
        _this = this;
      this.log.debug('doDescribe ' + module);
      this.__callback = callback;
      if (!this.__checkLogin()) {
        return this.__performCallback(this.__callback, false);
      } else {
        params = '?operation=describe&sessionName=' + this._wsSessionName + '&elementType=' + module;
        this.log.debug(this._wsUrl + params);
        return request(this._wsUrl + params, function(e, r, body) {
          return _this.__processResponse(e, r, body);
        });
      }
    };

    NodeVtigerWS.prototype.doRetrieve = function(id, callback) {
      var params,
        _this = this;
      this.log.debug('doRetrieve: ' + id);
      this.__callback = callback;
      if (!this.__checkLogin()) {
        return this.__performCallback(this.__callback, false);
      } else {
        params = '?operation=retrieve&sessionName=' + this._wsSessionName + '&id=' + id;
        this.log.debug(this._wsUrl + params);
        return request(this._wsUrl + params, function(e, r, body) {
          return _this.__processResponse(e, r, body);
        });
      }
    };

    NodeVtigerWS.prototype.doSync = function(modifiedTime, module, callback) {
      var params,
        _this = this;
      this.log.debug('doSync: ' + modifiedTime + ' ' + module);
      this.__callback = callback;
      if (!this.__checkLogin()) {
        return this.__performCallback(this.__callback, false);
      } else {
        params = '?operation=sync&sessionName=' + this._wsSessionName + '&modifiedTime=' + modifiedTime;
        if (module) {
          params += '&elementType=' + module;
        }
        this.log.debug(this._wsUrl + params);
        return request(this._wsUrl + params, function(e, r, body) {
          return _this.__processResponse(e, r, body);
        });
      }
    };

    NodeVtigerWS.prototype.doDelete = function(id, callback) {
      var _this = this;
      this.log.debug('doDelete: ' + id);
      this.__callback = callback;
      if (!this.__checkLogin()) {
        return this.__performCallback(this.__callback, false);
      } else {
        return request.post({
          url: this._wsUrl,
          headers: this._default_headers,
          form: {
            operation: "delete",
            id: id,
            sessionName: this._wsSessionName
          }
        }, function(e, r, body) {
          var resobj, result;
          result = false;
          if (e) {
            _this.log.error("request -> error: " + (JSON.stringify(error)));
            _this._lastError = {
              "error": {
                "code": "ERROR_ON_REQUEST",
                "message": "Error on request (post)"
              }
            };
          } else if (r.statusCode !== 200) {
            _this.log.error("response.statusCode is " + r.statusCode);
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
            }
          }
          return _this.__performCallback(_this.__callback, result);
        });
      }
    };

    NodeVtigerWS.prototype.doUpdate = function(valuemap, callback) {
      var _this = this;
      this.log.debug("doUpdate");
      if (!(valuemap != null)) {
        return;
      }
      this.__callback = callback;
      if (!this.__checkLogin()) {
        return this.__performCallback(this.__callback, false);
      } else {
        return request.post({
          url: this._wsUrl,
          headers: this._default_headers,
          form: {
            "operation": "update",
            "sessionName": this._wsSessionName,
            "element": JSON.stringify(valuemap)
          }
        }, function(e, r, body) {
          return _this.__processResponse(e, r, body);
        });
      }
    };

    NodeVtigerWS.prototype.doCreate = function(module, valuemap, callback) {
      var _this = this;
      this.log.debug("doCreate: module=" + module);
      this.__callback = callback;
      if (!this.__checkLogin()) {
        return this.__performCallback(this.__callback, false);
      } else {
        if (valuemap.assigned_user_id == null) {
          valuemap.assigned_user_id = this._wsUserId;
        }
        return request.post({
          url: this._wsUrl,
          headers: this._default_headers,
          form: {
            operation: "create",
            sessionName: this._wsSessionName,
            elementType: module,
            element: JSON.stringify(valuemap)
          }
        }, function(e, r, body) {
          return _this.__processResponse(e, r, body);
        });
      }
    };

    return NodeVtigerWS;

  })();

  module.exports = NodeVtigerWS;

}).call(this);
