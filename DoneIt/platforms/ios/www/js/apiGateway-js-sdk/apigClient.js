/*
 * Copyright 2010-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

var apigClientFactory = {};
apigClientFactory.newClient = function (config) {
    var apigClient = { };
    if(config === undefined) {
        config = {
            accessKey: '',
            secretKey: '',
            sessionToken: '',
            region: '',
            apiKey: undefined,
            defaultContentType: 'application/json',
            defaultAcceptType: 'application/json'
        };
    }
    if(config.accessKey === undefined) {
        config.accessKey = '';
    }
    if(config.secretKey === undefined) {
        config.secretKey = '';
    }
    if(config.apiKey === undefined) {
        config.apiKey = '';
    }
    if(config.sessionToken === undefined) {
        config.sessionToken = '';
    }
    if(config.region === undefined) {
        config.region = 'us-east-1';
    }
    //If defaultContentType is not defined then default to application/json
    if(config.defaultContentType === undefined) {
        config.defaultContentType = 'application/json';
    }
    //If defaultAcceptType is not defined then default to application/json
    if(config.defaultAcceptType === undefined) {
        config.defaultAcceptType = 'application/json';
    }

    
    // extract endpoint and path from url
    var invokeUrl = 'https://cn2jydw0q2.execute-api.us-east-1.amazonaws.com/dev';
    var endpoint = /(^https?:\/\/[^\/]+)/g.exec(invokeUrl)[1];
    var pathComponent = invokeUrl.substring(endpoint.length);

    var sigV4ClientConfig = {
        accessKey: config.accessKey,
        secretKey: config.secretKey,
        sessionToken: config.sessionToken,
        serviceName: 'execute-api',
        region: config.region,
        endpoint: endpoint,
        defaultContentType: config.defaultContentType,
        defaultAcceptType: config.defaultAcceptType
    };

    var authType = 'NONE';
    if (sigV4ClientConfig.accessKey !== undefined && sigV4ClientConfig.accessKey !== '' && sigV4ClientConfig.secretKey !== undefined && sigV4ClientConfig.secretKey !== '') {
        authType = 'AWS_IAM';
    }

    var simpleHttpClientConfig = {
        endpoint: endpoint,
        defaultContentType: config.defaultContentType,
        defaultAcceptType: config.defaultAcceptType
    };

    var apiGatewayClient = apiGateway.core.apiGatewayClientFactory.newClient(simpleHttpClientConfig, sigV4ClientConfig);
    
    
    
    apigClient.doneItGroupsGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        // Accepts: 'group_id', 'group_name'
        apiGateway.core.utils.assertParametersDefined(params, ['Authorization'], ['body']);
        
        var doneItGroupsGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/DoneItGroups').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, ['Authorization', ]),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, ['group_id', 'group_name']),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(doneItGroupsGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.doneItGroupsPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['Authorization', 'body'], ['body']);
        
        var doneItGroupsPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/DoneItGroups').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, ['Authorization', ]),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(doneItGroupsPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.doneItGroupsOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var doneItGroupsOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/DoneItGroups').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(doneItGroupsOptionsRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.doneItMembersGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['email', 'Authorization'], ['body']);
        
        var doneItMembersGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/DoneItMembers').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, ['Authorization']),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, ['email', ]),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(doneItMembersGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.doneItMembersPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['Authorization', 'body'], ['body']);
        
        var doneItMembersPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/DoneItMembers').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, ['Authorization', ]),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(doneItMembersPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.doneItMembersOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var doneItMembersOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/DoneItMembers').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(doneItMembersOptionsRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.inviteMemberGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['email', 'Authorization'], ['body']);
        
        var inviteMemberGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/InviteMember').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, ['Authorization']),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, ['email', ]),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(inviteMemberGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.inviteMemberPut = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['Authorization', 'body'], ['body']);
        
        var inviteMemberPutRequest = {
            verb: 'put'.toUpperCase(),
            path: pathComponent + uritemplate('/InviteMember').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, ['Authorization', ]),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(inviteMemberPutRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.inviteMemberPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['Authorization', 'body'], ['body']);
        
        var inviteMemberPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/InviteMember').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, ['Authorization', ]),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(inviteMemberPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.inviteMemberOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var inviteMemberOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/InviteMember').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(inviteMemberOptionsRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.tasksGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        // Accepts: 'creator', 'group_id', 'task_id'
        apiGateway.core.utils.assertParametersDefined(params, ['Authorization'], ['body']);
        
        var tasksGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/Tasks').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, ['Authorization', ]),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, ['creator', 'group_id', 'task_id']),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(tasksGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.tasksPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['Authorization', 'body'], ['body']);
        
        var tasksPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/Tasks').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, ['Authorization', ]),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(tasksPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.tasksOptions = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var tasksOptionsRequest = {
            verb: 'options'.toUpperCase(),
            path: pathComponent + uritemplate('/Tasks').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(tasksOptionsRequest, authType, additionalParams, config.apiKey);
    };
    

    return apigClient;
};
