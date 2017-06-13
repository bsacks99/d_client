// Initialize app
var DoneIt = new Framework7();

// Add view
var mainView = DoneIt.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});


// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

AWSCognito.config.region = 'us-east-1';
AWSCognito.config.credentials = new AWS.CognitoIdentityCredentials({
    IdentityPoolId: 'us-east-1:418de104-0559-4896-9217-83e02d33ee15'
});

var poolData = { 
    UserPoolId : 'us-east-1_xdOMAneGm',
    ClientId : '7ptcuuo7ui75r2rhlenl8svl6q'
};
var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);

var cognitoUser = userPool.getCurrentUser()

if (cognitoUser === null) {
    mainView.router.load({url: 'login.html'});
}

var displayFormErrors = function(errors) {
    var count = 0;
    for (var key in errors) {
        if(count) break;
        // skip loop if the property is from prototype
        if (!errors.hasOwnProperty(key)) continue;
        msgs = errors[key]
        var messages = ''
        for(var i in msgs) {
            messages += '<p>'+msgs[i]+'</p>'
        }
        var field = $$('input[name="'+key+'"]');
        var popoverHTML = '<div class="popover">'+
                          '<div class="popover-inner">'+
                            '<div class="content-block">'+
                            messages
                            '</div>'+
                          '</div>'+
                        '</div>'
        DoneIt.popover(popoverHTML, field);
        count++;
    }
}

var renderTasksView = function(context, session) {
    console.log(context)
    var template = $$('#doneit_buttons_template').html()
 
    var compiledTemplate = Template7.compile(template)
    var output = compiledTemplate(context)

    $$('#donit_view').html(output)
}


var renderGroupView = function (context, session) {
    var template = $$('#group_template').html()
 
    var compiledTemplate = Template7.compile(template)
    var output = compiledTemplate(context)

    $$('#group_view').html(output)

    $$('.group-submit').on('click', function() {

        DoneIt.showIndicator();

        var constraints = {
            user: {
                email: {
                  message: "Please provide a valid email address"
                }
            }
        };

        if(context.show_group_input) {
            constraints['name'] = {
                format: {
                    pattern: /[a-zA-Z0-9-_.]{4,50}$/,
                    message: "Group names must be between 4 and 50 characters long, they can contain letters, numbers, dashes, underscores, and periods."
                }
            }
        }

        var formData = DoneIt.formToData('#group');

        var errors = validate(formData, constraints, {fullMessages: false})

        if (errors == undefined) {
            if(context.show_group_input) {

                var body = {
                    "name": formData['name'],
                    "creator": cognitoUser.username
                }

                var apigClient = apigClientFactory.newClient()
                var token = session.getIdToken().getJwtToken()

                apigClient.doneItGroupsPost({"Authorization": token }, body, {}).then(function(result){

                    if(result.status == 200) {
                        try {
                            group_id = result.data.group_id
                            group_name = formData['name']

                            var body = {
                                "group_id": group_id,
                                "member": cognitoUser.username
                            }

                            apigClient.doneItMembersPost({"Authorization": token }, body, {}).then(function(result){

                                if(result.status == 200) {
                                    console.log("created group membership")            
                                } 
                            }).catch( function(result){
                                console.log(result)
                            });

                            var body = {
                                "group_id": group_id,
                                "member": formData['user']
                            }
                            apigClient.inviteMemberPost({"Authorization": token }, body, {}).then(function(result){

                                if(result.status == 200) {
                                    console.log("invitation sent")   
                                    DoneIt.addNotification({
                                        title: 'Invitation Sent',
                                        message: 'You have invited ' + formData['user'] + ' to join ' + group_name
                                    });         
                                } 
                            }).catch( function(result){
                                console.log(result)
                            });

                            context.group_action_header = "Invite A Member"
                            context.group_button_label = "Send Invite"
                            context.group_name = group_name
                            context.group_id = group_id
                            context.show_group_input = false
                        } catch (e) {
                            console.log(e)
                        }             
                        DoneIt.hideIndicator()                   
                        renderGroupView(context, session)
                        
                    } 
                }).catch( function(result){
                    console.log(result)
                    DoneIt.hideIndicator()
                    renderGroupView(context, session)
                });
            } else {
                var apigClient = apigClientFactory.newClient()
                var token = session.getIdToken().getJwtToken()
                var body = {
                    "group_id": context.group_id,
                    "creator": cognitoUser.username,
                    "member": formData['user']
                }
                apigClient.inviteMemberPost({"Authorization": token }, body, {}).then(function(result){

                    if(result.status == 200) {
                        console.log("invitation sent")   
                        DoneIt.addNotification({
                            title: 'Invitation Sent',
                            message: 'You have invited ' + formData['user'] + ' to join ' + context.group_name
                        });         
                    } 
                }).catch( function(result){
                    console.log(result)
                });
                DoneIt.hideIndicator()                   
                renderGroupView(context, session)
            }

        } else {
            // show form errors
            DoneIt.hideIndicator();

            displayFormErrors(errors)

        }
    });
}

var initTaskView = function(session) {

    DoneIt.showIndicator();
    console.log("Initialize the Amazon API gateway client")
    var tasks = null
    var group_id = ''
    if(localStorage.getItem('group_id') != null) {
        group_id = localStorage.getItem('group_id')
    }
    var apigClient = apigClientFactory.newClient();
    var token = session.getIdToken().getJwtToken()

    var template_context = {
        "tasks": []
    }
    apigClient.tasksGet({'creator': cognitoUser.username, 'group_id': group_id, "Authorization": token }, {}, {}).then(function(result){

        if(result.status == 200) {
            try {
                template_context.tasks = result.data
                DoneIt.hideIndicator()                   
                renderTasksView(template_context, session)
            } catch (e) {
                console.log(e)
            }                                
        } 
    }).catch( function(result){
        console.log(result)
        DoneIt.hideIndicator()
        renderTasksView(template_context, session)
    });
}

var initAddTaskView = function(session) {

    $$('.add-task-submit').on('click', function() {

        DoneIt.showIndicator();

        var constraints = {
            name: {
                format: {
                    pattern: /[a-zA-Z0-9-_.\s]{4,50}$/,
                    message: "DoneIts must be between 4 and 50 characters long, they can contain spaces, letters, numbers, dashes, underscores, and periods."
                }
            }
            
        };

        var formData = DoneIt.formToData('#add_task');

        var errors = validate(formData, constraints, {fullMessages: false})

        if (errors == undefined) {

            var group_id = ''
            if(localStorage.getItem('group_id') != null) {
                group_id = localStorage.getItem('group_id')
            }

            var body = {
                "name": formData['name'],
                "group_id": group_id,
                "reoccuring": ($$('input[name="reoccuring"]').prop('checked'))? 'yes' : 'no',
                "creator": cognitoUser.username
            }

            var apigClient = apigClientFactory.newClient()
            var token = session.getIdToken().getJwtToken()

            apigClient.tasksPost({"Authorization": token }, body, {}).then(function(result){

                if(result.status == 200) {
                    try {

                        // var tasks = []
                        // if(localStorage.getItem('tasks') != null) {
                        //     tasks = JSON.parse(localStorage.getItem('tasks'))
                        // }

                        // body['done'] = false
                        // tasks.push(body)
                        // localStorage.setItem('tasks', JSON.stringify(tasks));

                        DoneIt.addNotification({
                            title: 'DoneIt Created',
                            message: 'You have created ' + formData['name']
                        });
                    } catch (e) {
                        console.log(e)
                    }             
                    DoneIt.hideIndicator()
                    
                } 
            }).catch( function(result){
                console.log(result)
                DoneIt.hideIndicator()
            });
        } else {
            // show form errors
            DoneIt.hideIndicator();

            displayFormErrors(errors)

        }
    });
}

var initGroupView = function(session) {
    DoneIt.showIndicator();
    console.log("Initialize the Amazon API gateway client")
    var group_id = null
    var group_name = null
    var group_id = null
    var apigClient = apigClientFactory.newClient();
    var token = session.getIdToken().getJwtToken()

    var template_context = {
        "group_action_header": "Create Your Group &amp; Invite A Member",
        "group_button_label": "Create Group &amp; Send Invite",
        "group_name": group_name,
        "group_id": group_id,
        "show_group_input": true,
        "members": []
    }

    apigClient.doneItMembersGet({'email': cognitoUser.username, "Authorization": token }, {}, {}).then(function(result){

        if(result.status == 200) {
            try {
                group_id = result.data.group_id
                localStorage.setItem('group_id', group_id);
            } catch (e) {
                console.log(e)
            }                                

            apigClient.doneItGroupsGet({'group_id': group_id, 'get_members': true, "Authorization": token }, {}, {}).then(function(result){

                if(result.status == 200) {
                    try {
                        group_name = result.data.group_name
                        localStorage.setItem('group_name', group_name);

                        template_context.group_action_header = "Invite A Member"
                        template_context.group_button_label = "Send Invite"
                        template_context.group_name = group_name
                        template_context.group_id = group_id
                        template_context.show_group_input = false
                        template_context.members=result.data.members
                        console.log(template_context)
                    } catch (e) {
                        console.log(e)
                    }             
                    DoneIt.hideIndicator()                   
                    renderGroupView(template_context, session)
                    
                } 
            }).catch( function(result){
                console.log(result)
                DoneIt.hideIndicator()
                renderGroupView(template_context, session)
            });
        } 
    }).catch( function(result){
        console.log(result)
        DoneIt.hideIndicator()
        renderGroupView(template_context, session)
    });
}

var GroupCheckLoop = function() {
    cognitoUser = userPool.getCurrentUser();
    if (cognitoUser != null) {
        cognitoUser.getSession(function(err, session) {
            if(session.isValid()) {
                if(localStorage.getItem('group_id') == null) {
                    var group_name = null
                    var group_id = null
                    var apigClient = apigClientFactory.newClient()
                    var token = session.getIdToken().getJwtToken()

                    apigClient.doneItMembersGet({'email': cognitoUser.username, "Authorization": token }, {}, {}).then(function(result){

                        if(result.status == 200) {
                            try {
                                group_id = result.data.group_id
                                localStorage.setItem('group_id', group_id);
                            } catch (e) {
                                console.log(e)
                            }                                

                            apigClient.doneItGroupsGet({'group_id': group_id, "Authorization": token }, {}, {}).then(function(result){

                                if(result.status == 200) {
                                    try {
                                        group_name = result.data.group_name
                                        localStorage.setItem('group_name', group_name);

                                    } catch (e) {
                                        console.log(e)
                                    }                                             
                                } 
                            }).catch( function(result){
                                console.log(result)
                            });
                        } 
                    }).catch( function(result){

                        apigClient.inviteMemberGet({'email': cognitoUser.username, "Authorization": token }, {}, {}).then(function(result){

                                if(result.status == 200) {
                                    try {
                                        invitation_id = result.data.invitation_id
                                        group_id = result.data.group_id
                                        group_name = result.data.group_name
                                        creator = result.data.creator
                                        
                                        DoneIt.modal({
                                            title:  'Group Invitation',
                                            text: creator + " invited to you join: "+ group_name + " group!",
                                            buttons: [{
                                                text: 'Cancel'
                                            },
                                            {
                                                text: 'Accept',
                                                onClick: function() {
                                                    
                                                    var body = {
                                                        "invitation_id": invitation_id,
                                                        "status": 'confirmed'
                                                    }
                                                    apigClient.inviteMemberPut({"Authorization": token }, body, {}).then(function(result){

                                                        if(result.status == 200) {
                                                            var body = {
                                                                "group_id": group_id,
                                                                "member": cognitoUser.username
                                                            }

                                                            apigClient.doneItMembersPost({"Authorization": token }, body, {}).then(function(result){

                                                                if(result.status == 200) {
                                                                    console.log("created group membership")  
                                                                    DoneIt.addNotification({
                                                                        title: 'Success',
                                                                        message: 'You are now a member of ' + group_name
                                                                    });           
                                                                } 
                                                            }).catch( function(result){
                                                                console.log(result)
                                                            });       
                                                        } 
                                                    }).catch( function(result){
                                                        console.log(result)
                                                    });
                                                }
                                            }]
                                        })
                                    } catch (e) {
                                        console.log(e)
                                    }                                             
                                } 
                            }).catch( function(result){
                                setTimeout(function(){
                                    if(localStorage.getItem('group_id') == null) {
                                        GroupCheckLoop();
                                    }      
                                }, 3000);
                                console.log(result)
                            });
                    });
                }
            }   
        });
    }
}

//- One group, three buttons
$$('.main-menu').on('click', function () {
    var target = this;
    var buttons = [
        {
            text: 'Log Out',
            bold: true,
            onClick: function () {
                try {
                    var poolData = { 
                        UserPoolId : 'us-east-1_xdOMAneGm',
                        ClientId : '7ptcuuo7ui75r2rhlenl8svl6q'
                    };
                    var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
                    cognitoUser = userPool.getCurrentUser();
                    cognitoUser.signOut();
                    localStorage.clear();
                } catch(e) {
                    console.log(e)
                }

                mainView.router.load({url: 'login.html'});
            }
        },
        {
            text: 'Add New DoneIt', 
            bold: true,
            onClick: function () {
                mainView.router.load({url: 'task_add.html'});
            }
        }    
    ];
    DoneIt.actions(target, buttons);
});

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
    console.log("Device is ready!");
    
    cognitoUser = userPool.getCurrentUser();
    if (cognitoUser != null) {
        cognitoUser.getSession(function(err, session) {
            if(session.isValid()) {
                setTimeout(function(){
                    console.log(localStorage.getItem('group_id'))
                    if(localStorage.getItem('group_id') == null) {
                        GroupCheckLoop();
                    }      
                }, 1000);
            }
        })
    }

});


DoneIt.onPageAfterAnimation('index tasks add_task group task log', function (page) {

    cognitoUser = userPool.getCurrentUser();

    if (cognitoUser != null) {
        cognitoUser.getSession(function(err, session) {
            if (err) {
                console.log(err);
                mainView.router.load({url: 'login.html', query: {req: page.url}});
                return false;
            }

            console.log('session validity: ' + session.isValid());
            if(session.isValid()) {
                switch(page.name) {
                    case 'group':
                        initGroupView(session)
                        break
                    case 'add_task':
                        initAddTaskView(session)
                        break
                    case 'tasks':
                        initTaskView(session)
                }
            } else {
                mainView.router.load({url: 'login.html', query: {req: page.url}});
            }    
        });
    }
})

DoneIt.onPageInit('login', function (page) {

    var redirect_to = 'index.html'
    if (page.query.req) {
        redirect_to = page.query.req
    }
    
    $$('.login-submit').on('click', function() {

        DoneIt.showIndicator();
        var constraints = {
            username: {
                presence: {message: "Please provide an email address"},
                email: {
                  message: "Please provide a valid email address"
                }
            },
            password: {
                presence: {message: "Please provide a password"}
            }
            
        };

        var formData = DoneIt.formToData('#login');

        var errors = validate(formData, constraints, {fullMessages: false})

        if (errors == undefined) {

            var authenticationData = {
                Username : formData['username'],
                Password : formData['password'],
            };
            var authenticationDetails = new AWSCognito.CognitoIdentityServiceProvider.AuthenticationDetails(authenticationData);
            var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);
            var userData = {
                Username : formData['username'],
                Pool : userPool
            };
            cognitoUser = new AWSCognito.CognitoIdentityServiceProvider.CognitoUser(userData);
            cognitoUser.authenticateUser(authenticationDetails, {
                onSuccess: function (result) {
                    DoneIt.hideIndicator();
                    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                        IdentityPoolId : 'us-east-1:418de104-0559-4896-9217-83e02d33ee15', // your identity pool id here
                        Logins : {
                            // Change the key below according to the specific region your user pool is in.
                            'cognito-idp.us-east-1.amazonaws.com/us-east-1_xdOMAneGm' : result.getIdToken().getJwtToken()
                        }
                    });
                    setTimeout(function(){
                        console.log(localStorage.getItem('group_id'))
                        if(localStorage.getItem('group_id') == null) {
                            GroupCheckLoop();
                        }      
                    }, 1000);
                    mainView.router.load({url: 'task.html'});
                },

                onFailure: function(err) {
                    DoneIt.hideIndicator();
                    console.log(err)
                    var errors = {'password': ["We were unable to sign you in. Please check your username and password."]}
                    displayFormErrors(errors)
                },

            });            
        } else {
            // show form errors
            DoneIt.hideIndicator();

            displayFormErrors(errors)
        }
    })
}) 

DoneIt.onPageInit('about', function (page) {


})

DoneIt.onPageInit('add_task', function (page) {

})

DoneIt.onPageInit('index', function (page) {

})

DoneIt.onPageInit('tasks', function (page) {

})

DoneIt.onPageInit('group', function (page) {
    // main handling done in renderGroupView
})

DoneIt.onPageInit('sign_up', function (page) {


    $$('.sign-up-submit').on('click', function() {

        DoneIt.showIndicator();

        var constraints = {
            username: {
                presence: {message: "Please provide an email address"},
                email: {
                  message: "Please provide a valid email address"
                }
            },
            password: {
                presence: {message: "Please provide a password"},
                format: {
                    pattern: /^(?=.*[0-9])(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{8,16}$/,
                    message: "Passwords must be 8-16 characters and contain at least one uppercase letters, lowercase letters, special characters and number."
                }
            },
            password2: {
                presence: {message: "Please confirm password"},
                equality: "password"
            }
            
        };

        var formData = DoneIt.formToData('#sign_up');

        var errors = validate(formData, constraints, {fullMessages: false})

        if (errors == undefined) {

            console.log("Initialize the Amazon Cognito credentials provider")

            var attributeList = [];
            
            var dataEmail = {
                Name : 'email',
                Value : formData['username']
            };

            var attributeEmail = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataEmail);

            attributeList.push(attributeEmail);

            userPool.signUp(formData['username'], formData['password'], attributeList, null, function(err, result) {

                DoneIt.hideIndicator();

                if (err) {
                    DoneIt.alert(err);
                    return;
                }
                cognitoUser = result.user;
                if(formData['username'] == cognitoUser.getUsername()) {
                    DoneIt.popup('.popup-confirm')
                }
            });
        } else {
            // show form errors
            DoneIt.hideIndicator();

            displayFormErrors(errors)

        }
    });

    $$('.confirm-submit').on('click', function() {
        DoneIt.showIndicator();

        var constraints = {
            confirmation_code: {
                presence: {message: "Please provide a confirmation code"}
            }
        };

        var formData = DoneIt.formToData('#confirm');

        var errors = validate(formData, constraints, {fullMessages: false})

        if (errors == undefined && cognitoUser) {
            cognitoUser.confirmRegistration(formData['confirmation_code'], true, function(err, result) {
                DoneIt.hideIndicator();
                DoneIt.closeModal('.popup-confirm', true)
                if (err) {
                    DoneIt.alert(err);
                    return;
                }
                console.log('call result: ' + result);
            });
        } else {
            // show form errors
            DoneIt.hideIndicator();

            displayFormErrors(errors)
        }

    });
})