// Initialize app
var DoneIt = new Framework7();


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

var cognitoUser = null;

var checkAuthorizedUser = function() {

    var session = null
    cognitoUser = userPool.getCurrentUser();

    if (cognitoUser != null) {
        cognitoUser.getSession(function(err, sess) {
            if (err) {
                console.log(err);
                return false;
            }

            session = sess
            console.log('session validity: ' + sess.isValid());

            // NOTE: getSession must be called to authenticate user before calling getUserAttributes
            cognitoUser.getUserAttributes(function(err, attributes) {
                if (err) {
                    console.log(err);
                } else {
                    // Do something with attributes
                }
            });

            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId : 'us-east-1:418de104-0559-4896-9217-83e02d33ee15', // your identity pool id here
                Logins : {
                    // Change the key below according to the specific region your user pool is in.
                    'cognito-idp.us-east-1.amazonaws.com/us-east-1_xdOMAneGm' : sess.getIdToken().getJwtToken()
                }
            });
        });
    }
    try {
        if(session.isValid()) {
            return true;
        } else {
            return false;
        }
    } catch(e) {
        return false;
    }
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

//- One group, three buttons
$$('.main-menu').on('click', function () {
    var target = this;
    var buttons = [
        {
            text: 'Log Out',
            bold: true,
            onClick: function () {
                cognitoUser.signOut();
                mainView.router.load({url: 'login.html'});
            }
        }
    ];
    DoneIt.actions(target, buttons);
});

// Add view
var mainView = DoneIt.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
    console.log("Device is ready!");
});


DoneIt.onPageAfterAnimation('index tasks add_task group', function (page) {
    if(!checkAuthorizedUser()) {
        console.log("loading login")
        mainView.router.load({url: 'login.html', query: {req: page.url}});
    } else {
        console.log(cognitoUser)
    }

})

DoneIt.onPageInit('login', function (page) {

    redirect_to = page.query.req

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
                    mainView.router.load({url: redirect_to});
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

DoneIt.init()