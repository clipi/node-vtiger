###                 NodeVtiger
                
Description:        Node vtiger webservice client library
Contributor:        marco.parronchi@tiwee.net
                    https://github.com/itag
License:            public domain: http://www.nolicense.org/

                    infos in /README.md
###

crypto  = require 'crypto'
sys     = require 'util'
request = require 'request'

class NodeVtigerWS

    constructor: (url, username, accesskey, level='warning' ) ->
        @_wsUrl             = url + '/webservice.php'
        @_wsUsername        = username
        @_wsAccesskey       = accesskey
        @_wsToken           = false
        @_wsSessionName     = false
        @_wsUserId          = false
        @_isLogged          = false
        @_lastError         = false
        @callback           = false
        
        @_default_headers   =
            "Accept":           "application/json"
            "Content-Type":     "application/json"
            "Accept-Charset":   "utf-8"
        
        logger  = require 'basic-logger'
        logger.setLevel level
        @log                = new logger( prefix: "node-vtiger")
        @log.trace "NodeVtigerWS constructor"
        
    # check if the response from vtigerws has an error "success":false
    # store the error in _lastError
    __hasError: (resultdata) ->
        @log.trace "hasError"
        if resultdata?
            if resultdata.success is false
                @log.error "erreur result= #{ JSON.stringify(resultdata.error) }"
                @_lastError = resultdata.error
                return true
        else
            @log.error "__hasError: result data is null"
            @_lastError = 
                "error":
                    "code":     "NULL_RESULT"
                    "message":  "Resultdata is null"
            return true
        @_lastError = null
        return false
    
    # execute callback directly or
    # with arguments if the callback is in the form
    # {function:callback, arguments:{'arg1' : 'value1'...}
    __performCallback: (err, result) ->
        @log.trace "performCallback"
        if @callback?
            callbackFunction = @callback
            callbackArguments = false
            if typeof (callback) is "object"
                @log.trace 'callback is object'
                callbackFunction = @callback.function
                callbackArguments = @callback.arguments
            return callbackFunction err, result, callbackArguments  if typeof (callbackFunction) is "function"
        else
            @log.error '__performCallback without @callback'
            return false
    
    # check if we are logged
    __checkLogin: ->
        @log.trace "checkLogin"
        if @_isLogged is false
            @log.error "__checkLogin: isLogged = false, I quit"
            @_lastError = 
                "error":
                    "code":     "NOT_LOGGED"
                    "message":  "Try to send a request without being logged"
            return false
        else
            return true
    
    # process the respone after a request get or post
    __processResponse: (error, response, body)->
        @log.trace "processResponse "
        result = false
        if error
            @log.error "request -> error"
            @_lastError = 
                "error":
                    "code":     "REQUEST_ERROR"
                    "message":  "Error on request"
            @_lastError = error
        else if response.statusCode is not 200
            @log.error "__processResponse: response.statusCode is not #{ response.statusCode }"
            @_lastError = 
                "error":
                    "code":     "ERROR_REQUEST_STATUS_CODE"
                    "message":  "Error on request, statusCode = #{ response.statusCode }"
        else
            resobj = JSON.parse(body)
            result = resobj.result if @__hasError(resobj) is false
        @__performCallback(@_lastError, result)
        return
    
    lastError: ->
        return @_lastError
        
    doLogin: (@callback) ->
        @log.trace "doLogin: #{ @_wsUsername }, #{ @_wsAccesskey }"

        if @_isLogged
            @log.trace "Trying to log, but we a are logged"
            return @__performCallback(null, true)
        
        params = "?operation=getchallenge&username=#{@_wsUsername}"
        @log.trace @_wsUrl + params
        request @_wsUrl + params , (e, r, body) =>
            if e
                @log.error "doLogin: request getChallenge -> error: #{ JSON.stringify(error) }"
                @_lastError = 
                    "error":
                        "code":     "ERROR_ON_REQUEST"
                        "message":  "Error on request (get challenge)"
                @__performCallback(@_lastError, false)
                return false
                
            else if r.statusCode isnt 200
                @log.error "doLogin: request getChallenge, response.statusCode is #{ r.statusCode }"
                @_lastError = 
                    "error":
                        "code":     "ERROR_REQUEST_STATUS_CODE"
                        "message":  "Error on request, statusCode = #{ r.statusCode }"
                return @__performCallback(@_lastError, false)
            
            # paranoid check
            try
                response = JSON.parse body
            catch ex
                @log.error body
                @log.error ex
                return @__performCallback(ex, null, @callback)
                
            if @__hasError(response)
                return @__performCallback(response, false)
                
            if response.result.token is false
                @log.error "doLogin: response.result.token is false"
                @_lastError = 
                    "error":
                        "code":     "NO_TOKEN_AFTER_CHALLENGE"
                        "message":  "No token after challenge"
                return @__performCallback(@_lastError, false)
                
            @_wsToken = response.result.token
            
            @log.trace "POST @_wsUrl login #{@_wsUsername}"
            request.post
                url: @_wsUrl
                headers: @_default_headers
                form:
                    operation: "login"
                    username: @_wsUsername
                    accessKey: crypto.createHash("md5").update(@_wsToken + @_wsAccesskey).digest("hex")
            , (e, r, body) =>
                result = false
                if e
                    @log.error "doLogin: login, request -> error: #{ JSON.stringify(error) }"
                    @_lastError = 
                        "error":
                            "code":     "ERROR_ON_REQUEST"
                            "message":  "Error on request (post)"

                else if r.statusCode isnt 200
                    @log.error "doLogin: login, response.statusCode is #{ r.statusCode }"
                    @_lastError = 
                        "error":
                            "code":     "ERROR_REQUEST_STATUS_CODE"
                            "message":  "Error on request, statusCode = #{ r.statusCode }"
                else
                    resobj = JSON.parse(body)  
                    if @__hasError(resobj) is false
                        result = resobj.result
                        @_isLogged  = true
                        @_wsSessionName = resobj.result.sessionName
                        @log.trace "sessionid=" + @_wsSessionName
                        @_wsUserId    = resobj.result.userId
                return @__performCallback(@_lastError, result)
                
            # avoid coffeescript to generate the return request and break async
            # equivalent to 'return undefined'
            return
        return
    
    # query = " SELECT * FROM Leads WHERE lead_no = 'LEA883' "
    doQuery: (query, @callback) ->
        @log.trace 'doQuery: ' + query
        return @__performCallback(@_lastError, false) if not @__checkLogin()
        query += ";" if query.indexOf(";") is -1
        params = '?operation=query&sessionName=' + @_wsSessionName + '&query=' + escape(query)
        @log.trace @_wsUrl + params
        request @_wsUrl + params , (e, r, body) =>
            return @__processResponse(e, r, body)
        return
    
    # Information about fields of the module, permission to create, delete, update records
    doDescribe: (module, @callback) ->
        @log.trace 'doDescribe ' + module
        return @__performCallback(@_lastError, false) if not @__checkLogin()
        params = '?operation=describe&sessionName=' + @_wsSessionName + '&elementType=' + module
        @log.trace @_wsUrl + params
        request @_wsUrl + params , (e, r, body) =>
            return @__processResponse(e, r, body)
        return
        
    # Listtypes (itag contribution)
    # module = module name
    doListtypes: (module, @callback) ->
        @log.trace 'doListtypes: ' + module
        return @__performCallback(@_lastError, false) if not @__checkLogin()
        params = '?operation=listtypes&sessionName=' + @_wsSessionName + '&elementType=' + module
        @log.trace @_wsUrl + params
        request @_wsUrl + params , (e, r, body) =>
            return @__processResponse(e, r, body)
        return
        
    # Retrieve information of existing record of the module.
    # id = <moduleid>'x'<recordid>
    doRetrieve: (id, @callback) ->
        @log.trace 'doRetrieve: ' + id
        return @__performCallback(@_lastError, false) if not @__checkLogin()
        params = '?operation=retrieve&sessionName=' + @_wsSessionName + '&id=' + id
        @log.trace @_wsUrl + params
        request @_wsUrl + params , (e, r, body) =>
            return @__processResponse(e, r, body)
        return
            
    # Sync will return a SyncResult object containing details of changes after modifiedTime.
    doSync: (modifiedTime, module, @callback) ->
        @log.trace 'doSync: ' + modifiedTime + ' ' + module
        return @__performCallback(@_lastError, false) if not @__checkLogin()
        params = '?operation=sync&sessionName=' + @_wsSessionName + '&modifiedTime=' + modifiedTime
        params += '&elementType=' + module if module
        @log.trace @_wsUrl + params
        request @_wsUrl + params , (e, r, body) =>
            return @__processResponse(e, r, body)
        return

    # Delete a record
    # id = <moduleid>'x'<recordid>
    doDelete: (id, @callback) ->
        @log.trace 'doDelete: ' + id
        return @__performCallback(@_lastError, false) if not @__checkLogin()
        request.post
            url: @_wsUrl
            headers: @_default_headers
            form:
                operation: "delete"
                id: id
                sessionName: @_wsSessionName
        , (e, r, body) =>
            return @__processResponse(e, r, body)
        return

    # Update a record
    doUpdate: (valueMap, @callback) ->
        @log.trace "doUpdate"
        if not valueMap.id?
            @_lastError = 
                "error":
                    "code":     "ERROR_UPDATE_NO_ID"
                    "message":  "doUpdate without id"
            return @__performCallback(@_lastError, false)
        return @__performCallback(@_lastError, false) if not @__checkLogin()
        request.post
            url: @_wsUrl
            headers: @_default_headers
            form:
                "operation":        "update"
                "sessionName":     @_wsSessionName
                "element":          JSON.stringify(valueMap)
        , (e, r, body) =>
            return @__processResponse(e, r, body)
        return
    
    # Create a record, a moduleName must be provided
    doCreate: (module, valueMap, @callback) ->
        @log.trace "doCreate: module=" + module 
        return @__performCallback(@_lastError, false) if not @__checkLogin()
        valueMap.assigned_user_id = @_wsUserId  unless valueMap.assigned_user_id?
        request.post
            url: @_wsUrl
            headers: @_default_headers
            form:
                operation: "create"
                sessionName: @_wsSessionName
                elementType: module
                element: JSON.stringify(valueMap)
        , (e, r, body) =>
            return @__processResponse(e, r, body)
        return

module.exports = NodeVtigerWS
