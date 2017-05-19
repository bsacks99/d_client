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

    return false
    cognitoUser = userPool.getCurrentUser();
    console.log(cognitoUser)
    if (cognitoUser != null) {
        cognitoUser.getSession(function(err, session) {
            if (err) {
                DoneIt.alert(err);
                return false;
            }
            console.log('session validity: ' + session.isValid());

            // NOTE: getSession must be called to authenticate user before calling getUserAttributes
            cognitoUser.getUserAttributes(function(err, attributes) {
                if (err) {
                    DoneIt.alert(err);
                } else {
                    // Do something with attributes
                }
            });

            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId : '...', // your identity pool id here
                Logins : {
                    // Change the key below according to the specific region your user pool is in.
                    'cognito-idp.us-east-1.amazonaws.com/us-east-1_xdOMAneGm' : session.getIdToken().getJwtToken()
                }
            });

            return true;
            // Instantiate aws sdk service objects now that the credentials have been updated.
            // example: var s3 = new AWS.S3();

        });
    }
    return false;
}

// Add view
var mainView = DoneIt.addView('.view-main', {
    // Because we want to use dynamic navbar, we need to enable it for this view:
    dynamicNavbar: true
});

// Handle Cordova Device Ready Event
$$(document).on('deviceready', function() {
    console.log("Device is ready!");
});


// Now we need to run the code that will be executed only for About page.

// Option 1. Using page callback for page (for "about" page in this case) (recommended way):

DoneIt.onPageInit('about', function (page) {


})

DoneIt.onPageInit('add_task', function (page) {


})

DoneIt.onPageInit('login', function (page) {

  // var pageContainer = $$(page.container);
  // pageContainer.find('.list-button').on('click', function () {
  //   var username = pageContainer.find('input[name="username"]').val();
  //   var password = pageContainer.find('input[name="password"]').val();
  //   // Handle username and password
  //   DoneIt.alert('Username: ' + username + ', Password: ' + password, function () {
  //     mainView.goBack();
  //   });
  // });
});  

DoneIt.onPageInit('index', function (page) {
    
    if(!checkAuthorizedUser()) {
        mainView.router.loadPage('login.html')
    }

})

DoneIt.onPageInit('tasks', function (page) {

    if(!checkAuthorizedUser()) {
        console.log("loading login")
        mainView.router.load({url: 'login.html'});
    } else {
        console.log(cognitoUser)
    }

})

DoneIt.onPageAfterAnimation('tasks', function (page) {

    if(!checkAuthorizedUser()) {
        console.log("loading login")
        mainView.router.load({url: 'login.html'});
    } else {
        console.log(cognitoUser)
    }

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
		DoneIt.hideIndicator();
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

    });
})

DoneIt.init()