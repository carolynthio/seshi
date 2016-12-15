/*
      Copyright (c) 2014-2016 Northwestern University

      Permission is hereby granted, free of charge, to any person obtaining a copy
      of this software and associated documentation files (the "Software"), to deal
      in the Software without restriction, including without limitation the rights
      to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
      copies of the Software, and to permit persons to whom the Software is
      furnished to do so, subject to the following conditions:
      The above copyright notice and this permission notice shall be included in all
      copies or substantial portions of the Software.

      THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
      IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
      FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
      AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
      LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
      OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
      SOFTWARE.
*/

Template.login.events({
    'click .showLogin': function(e, t){
	$('#loghere').toggle();
    },
    
    'submit #login-form' : function(e, t){
	e.preventDefault();
	
	var email = t.find('#login-email').value
	, password = t.find('#login-password').value;
	if(email =="" || password ==""){
	    alert("Please fill in all fields")
	    return;
	}
	// Trim and validate your fields here.... 
	
	// If validation passes, supply the appropriate fields to the
	// Meteor.loginWithPassword() function.
	Meteor.loginWithPassword(email, password, function(err){
	    if (err){
		// The user might not have been found, or their passwword
		// could be incorrect. Inform the user that their
		// login attempt has failed. 
		alert(err);
	    }
	    else{
		// The user has been logged in.
		Router.go('SessionBuilder');
	    }
	});
   
	return false; 
    },
    
    'submit #register-form' : function(e, t) {
	console.log("clicked");
	e.preventDefault();
	var email = t.find('#account-email').value
        , password = t.find('#account-password').value
	, name = t.find('#account-name').value;
	
	if(email == "" || password == "" || name =="") {
	    alert("Please fill in all the fields.");
	    return;
	}
	
	Meteor.call('checkSecret', t.find('#secret-code').value,
		    function(error, ret){
			if(ret){
			    console.log("trying to create user...")

			    Accounts.createUser({email: email, password : password, profile : {name: name}}, function(err){
				if (err) {
				    // Inform the user that account creation failed
				    alert(err);
				} else {
				    alert("Welcome, " + name + "! We will take you to Seshi in just a few moments."); 
				    Router.go('SessionBuilder');
				}
			    })
			}else{
			    alert(error);
			    return;
			}});
	return false;
    }
});






