// Initialize app
var DoneIt = new Framework7();


// If we need to use custom DOM library, let's save it to $$ variable:
var $$ = Dom7;

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

DoneIt.onPageInit('sign_up', function (page) {
    $$('.sign-up-submit').on('click', function(){

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

            AWS.config.region = 'us-east-1'; // Region

            AWS.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: 'us-east-1:418de104-0559-4896-9217-83e02d33ee15'
            });

            AWSCognito.config.region = 'us-east-1';
            AWSCognito.config.credentials = new AWS.CognitoIdentityCredentials({
                IdentityPoolId: 'us-east-1:418de104-0559-4896-9217-83e02d33ee15'
            });

            var poolData = { 
                UserPoolId : 'us-east-1_xdOMAneGm',
                ClientId : '7ptcuuo7ui75r2rhlenl8svl6q'
            };
            var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);

            var attributeList = [];
            
            var dataEmail = {
                Name : 'email',
                Value : formData['username']
            };

            var attributeEmail = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataEmail);

            attributeList.push(attributeEmail);

            userPool.signUp(formData['username'], formData['password'], attributeList, null, function(err, result){
                if (err) {
                    DoneIt.alert(err);
                    return;
                }
                cognitoUser = result.user;
                console.log('user name is ' + cognitoUser.getUsername());
            });
        } else {
            console.log(errors)
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

// Option 2. Using one 'pageInit' event handler for all pages:
$$(document).on('pageInit', function (e) {
    // Get page data from event data
    var page = e.detail.page;

    if (page.name === 'about') {
        // Following code will be executed for page with data-page attribute equal to "about"
        DoneIt.alert('Here comes About page');
    }
})

// Option 2. Using live 'pageInit' event handlers for each page
$$(document).on('pageInit', '.page[data-page="about"]', function (e) {
    // Following code will be executed for page with data-page attribute equal to "about"
    DoneIt.alert('Here comes About page');
})