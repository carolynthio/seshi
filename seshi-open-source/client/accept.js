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

Template.accept.events({
    'click .submitAcceptedList' : function (){
	var paperIDs = $('.accept-text').val().trim().split('\n').map(function(x) { return x.trim()});
	
	Meteor.call('updateAccepted', paperIDs,
		    function(error, id){
			var count = Papers.find({active:true}).count()
			alert("We will work with " +  count + " accepted papers");
		    });
    }
    
});


activePapers = function(){
    return Papers.find({active: true});
}

Template.accept.helpers({
    activePapers: function(){
	return activePapers();
    },
    inactivePapers: function(){
	return Papers.find({active: false});
    },
    activeCount: function(){
	return activePapers().count();
    },
    paperCount: function(){
	return Papers.find().count();
    }
});
