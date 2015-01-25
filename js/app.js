/*****
 Summary
 ******/
// Global conf /variable [CONF]
// Initialisation [INIT]
// Utils [TOOL]
// Controllers [CTRL]
// Network [NETW]
// Views [VIEW]
// Pages [PAGE]

/*****
 [CONF]
 ******/

var BASE_URL = "s/";
var LOGIN_URL = BASE_URL+"login/";
var jsonContentType = "application/json; charset=utf-8";

/*****
 [INIT]
 ******/

var token = "";

/*****
 [TOOL]
 ******/

logDebug = function (message){
    console.log(message);
};

logError = function (message){
    showMsg("Oops !", message, "error");
};

logInfo = function (message){
    showMsg("Hey !", message, "info");
};

showMsg = function (title, message, type){
    $("#msg").html('<div class="alert alert-'+type+'"><strong>'+title+'</strong> '+message+'<button type="button" class="close" data-dismiss="alert">x</button></div>')
};

removeMsg = function(){
    $("#msg").html('');
};

startWait = function (){
    document.getElementById("throbber").style.visibility = "visible";
};

stopWait = function (){
    document.getElementById("throbber").style.visibility = "hidden";
};

postJson = function (url, data, callback, statusCode, headers){
    startWait();
    $.ajax({
        url: url,
        type: "POST",
        dataType: "json",
        contentType: jsonContentType,
        data: data,
        success: callback,
        error: function (request, textStatus, errorThrown){
            logDebug(textStatus + ":" + errorThrown);
        },
        complete: function () {
            stopWait();
        },
        statusCode: statusCode,
        headers: headers
    });
};

postJsonWithToken = function(url, data, callback, statusCode){
    postJson(url, data, callback, statusCode, {"X-AuthKey":getToken()});
};

getJsonWithToken = function(url, callback, statusCode){
    startWait();
    $.ajax({
        url: url,
        type: "GET",
        dataType: "json",
        success: callback,
        error: function(request, textStatus, errorThrown){
            logDebug(textStatus+" : "+errorThrown);
        },
        complete: function(){
            stopWait();
        },
        statusCode : statusCode,
        headers : {"X-AuthKey":getToken()}
    });
};

deleteWithToken = function(url, callback, statusCode){
    startWait();
    $.ajax({
        url: url,
        type: "DELETE",
        dataType: "json",
        success: callback,
        error: function(request, textStatus, errorThrown){
            logDebug(textStatus+" : "+errorThrown);
        },
        complete: function(){
            stopWait();
        },
        statusCode : statusCode,
        headers : {"X-AuthKey":getToken()}
    });
};

setToken = function(value){
    token = value;
    if(typeof localStorage!='undefined') {
        sessionStorage.token = token;
    }
};

getToken = function(){
    if(typeof localStorage!='undefined') {
        return sessionStorage.token;
    }else{
        return token;
    }
};

prompt = function (title, text, ok, cancel, $modal){
    var prompt = {
        title : title,
        text : text,
        ok : ok,
        cancel : cancel
    };
    var modalInstance = $modal.open({
        templateUrl: 'prompt.html',
        controller: promptModalCtrl,
        resolve: {
            prompt : function(){
                return prompt;
            }
        }
    });
    return modalInstance;
};

/*****
 [CTRL]
 ******/

loginCtrl = function ($scope, $state, $modal){
    removeMsg();
    $scope.clickSignin = function(){
        var modalInstance = prompt("Check Credentials",
            "Are thos credential correct ? "+$scope.name+" / "+$scope.password+" ?",
            "Yes",
            "No",
            $modal
        );
        modalInstance.result.then(function () {
            signin($scope.name, $scope.password, $scope, $state, $modal);
        });
    };
};

helloCtrl = function ($scope, $stateParams, $state){
    removeMsg();
    if(!('ontouchstart' in window))
    {
        $scope.helloBtnTooltip = "ToolTip";
    }
    if (getToken() == ""){
        unknownCredential($scope, $state);
    }
    $scope.showHello = function(){
        alert("hello "+$stateParams.name);
    }
};

promptModalCtrl = function ($scope, $modalInstance, prompt){
    $scope.prompt = prompt;
    $scope.ok = function () {
        $modalInstance.close();
    };

    $scope.cancel = function () {
        $modalInstance.dismiss('cancel');
    };
};

/*****
 [NETW]
 ******/

signin = function (name, password, $scope, $state, $modal){
    if (name == "test"){ //DEBUG
        openHello(name, $scope, $state);
        return;
    }
    postJson(
        LOGIN_URL,
        '{"name": "'+name+'", "password": "'+password+'"}',
        function(data, textStatus, request) {
            setToken(request.getResponseHeader("X-AuthKey"));
            openHello(name, $scope, $state);
        },
        {
            404: function() {
                var modalInstance = prompt("Unknown credentials",
                    "These credentials does not exist, do you want to create it ?",
                    "Yes",
                    "No",
                    $modal
                );
                modalInstance.result.then(function () {
                    alert("this should create the "+name);
                });

            },
            403: function(){
                unknownCredential($scope, $state);
            }
        }
    )
};

/*****
 [PAGE]
 ******/

var pageLogin = "/";
var pageHello = "/h/";

unknownCredential = function($scope, $state) {
    changePage('login', $scope, $state);
};

changePage = function(page, $scope, $state, params){
    //$location.path(page);
    $state.go(page, params);
    //$scope.$apply();
};

openHello = function(name, $scope, $state){
    changePage('hello', $scope, $state, {'name' : name});
};

angular.module('app', ['ui.bootstrap', 'ui.router'], function($stateProvider, $urlRouterProvider) {
    $urlRouterProvider.otherwise(pageLogin);
    $stateProvider
        .state('login', {
            url: pageLogin,
            templateUrl: 'login.html',
            controller: loginCtrl
        })
        .state('hello', {
            url: pageHello+':name',
            templateUrl: 'hello.html',
            controller: helloCtrl
        });
});