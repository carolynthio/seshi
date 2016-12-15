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

Router.configure({
    layoutTemplate: 'layout',
    loadingTemplate: 'loading',
});

Router.map(function() {
    this.route('SessionBuilder', 
	       {
		   waitOn: function () {
		       return [Meteor.subscribe('papers-sub'), 
			       Meteor.subscribe('sessions-sub')];
		   },
		   
		   action: function () {
		       if (this.ready())
			   this.render();
		       else
			   this.render('loading');
		   }
	       });

    //this.route('SessionBuilder');
    this.route('accept', 
	       {
		   waitOn: function () {
		       return Meteor.subscribe('papers-sub');
		   },
		   
		   action: function () {
		       if (this.ready())
			   this.render();
		       else
			   this.render('loading');
		   }
	       });
    
    this.route('login', {path:'/'});
    
    this.route('opty', 
	       {
		   waitOn: function () {
		       return [Meteor.subscribe('papers-sub'), 
			       Meteor.subscribe('sessions-sub')];
		   },
		   
		   action: function () {
		       if (this.ready())
			   this.render();
		       else
			   this.render('loading');
		   }
	       });
    
    this.route('stress', {
        path: '/stress/:workername/:interval',
        action: function() {
            console.log("my name is " + this.params.workername);
            Session.set('anonymousName', this.params.workername);
            Session.set('stressInterval', this.params.interval);
            startStressTest();
            Router.go('SessionBuilder');
        }
    });
});

Router.onBeforeAction('loading');
