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

Session.set("sort", {sort: {title: 1}});
Session.set("sessionSort", {sort: {name: 1}});
Session.set("keywordFilter", "All");
Session.set("inSession")
Session.set("sessionsWatched", {})
Session.set("isDisplayed", {})
Session.set("isDisplayedSession", {})
Session.set("showAllPapers", false);
Session.set("showAllContributors", false);
Session.set("showAllAbstracts", true);
Session.set("showAllAuthors", true);
Session.set("showKeywords", true);
Session.set("showPaperSessions", true);
Session.set("withoutTwoApprovedSessions", false);
Session.set("withoutApprovedSession", false);
Session.set("withoutSession", false);
Session.set("showUnapprovedSessions", false);
Session.set("showValidSessions", false);
Session.set('paperSearchVal', "");
Session.set('sessionSearchVal', "");
Session.set('anonymousName', "Anonymous")

Meteor.startup(function (){
    Session.set("searchResults", []); //Papers.find({active:true}).fetch());
    Session.set("sessionSearchResults", []);//Template.SessionBuilder.sessions().fetch());
    // Maintain workspace count;
    Deps.autorun(function(x){
	Sessions.find().observeChanges({
	    removed: function(id){
		if(id in Session.get("sessionsWatched"))
		    removeFromWatchlist(id);
		var displayed = Session.get("isDisplayedSession");
		if(id in displayed){
//		    console.log("deleting session ", id);
		    delete displayed[id];
		    Session.set("isDisplayedSession", displayed);
		}
	    }
	});
    });
    
})

/* Helper functions */
function inputIsNotEmpty(){
    var searchValue = Session.get('paperSearchVal');
    return searchValue && searchValue.length > 0;
}

function sessionInputIsNotEmpty(){
    var searchValue = Session.get('sessionSearchVal');
    return searchValue && searchValue.length > 0;
}

function numPapersDisplayed(){
    if(!inputIsNotEmpty()){
	var count = 0;
	var d = Session.get("isDisplayed");
	for(var i in d){
	    if(d[i]) count++
	}
	return count;
    }else{
	// make sure also in search results
	var validIDs = Session.get("searchResults").map(function(x){return x._id});
	var count = 0;
	var d = Session.get("isDisplayed");
	for(var i in d){
	    if(d[i] && (validIDs.indexOf(i) !=-1)) count++
	}
	return count;
    }
}

function getSessions(){
    var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
    var sort = Session.get("sessionSort");
    var sessions = Sessions.find({name   : {$not: {$in: nullNames}}},
				 sort);
    return sessions;
}




Template.SessionBuilder.rendered = function(){
    console.log("rendered");
    $('#directions').hide();
    
    // accept dragged in sessions
    $('#sessionarea').droppable({
    	accept: '.session-item, .paper-item, .paper',// .session',
	hoverClass: 'ui-state-hover',
	greedy: true,
    	drop: function (e, u){
	    if(u.draggable.hasClass("paper-item")){
		// create a new session with this paper
		console.log("creating session with paper from paper list")
		var paperID = u.draggable.attr("id").split("-")[1];
		createSession(paperID, u.position);
	    }else if(u.draggable.hasClass("paper")){
		// paper from a workspace session
		var paperID = u.draggable.attr("id").split("-")[1];
		var sessionID = u.draggable.closest('div.session').attr("id");
		console.log("creating session with paper from workspace session")
//		console.log(paperID, sessionID);
		createSession(paperID, {top: u.position.top, left: u.position.left});
		removePaperFromSession(paperID, sessionID);
		$(u.draggable).remove()
	    }else {
		// must be a session being dragged into the workspace
		console.log("dragging a session into the workspace");
		var sessionID = u.draggable.attr("id").split("-")[1];
		addToWatchlist(sessionID, {top: u.position.top, left: u.position.left});
	    }
    	}});
}  

Template.sessionInList.rendered = function(){
    $('#session-list .session-item').draggable({
	zIndex: 2000,
	appendTo: '#sessionarea',
	helper: 'clone',
	start: function (e,u){
	    $(u.helper).addClass("dragged-session")
	},
	stop: function (){
	}});
};


Template.paperWithSessions.rendered = function(){
    $('#paper-deck .paper-item').draggable({
	zIndex: 3000,
	appendTo: '#sessionarea',
	helper: 'clone',
	start: function (e,u){
	    $(u.helper).addClass("dragged-wide-paper")
	},
	stop: function (){
	}});
}



Template.paperSession.rendered = function(){
    $('#paper-deck .session-item').draggable({
	zIndex: 2001,
	appendTo: '#sessionarea',
	helper: 'clone',
	start: function (e,u){
	    $(u.helper).addClass("dragged-wide-session")
	},
	stop: function (){
	}});
};

Template.paperInSession.rendered = function(){
    $('.session .paper').draggable({
	zIndex: 3000,
	appendTo: '#sessionarea',
	helper: 'clone',
	start: function(e, ui){
	    $(ui.helper).addClass("dragged-paper")
	},
	stop: function (){
	}});
}

Template.paper.rendered = function(){
    $('.session-item .paper-item').draggable({
	zIndex: 3000,
	appendTo: '#sessionarea',
	helper: 'clone',
	start: function(e, ui){
	    $(ui.helper).addClass("dragged-paper")
	},
	stop: function (){
	}});
}


Template.session.rendered = function(){
    $('#sessionarea .session').droppable({
    	accept: '.paper-item, .paper',
	hoverClass: 'ui-state-hover',
	greedy: true,
	tolerance: "pointer",
    	drop: function (e, u){
	    if(u.draggable.hasClass("paper-item")){
		// add paper to this session
		console.log("add paper to this session")
		var paperID = u.draggable.attr("id").split("-")[1];
		var sessionID = $(this).attr('id');
		addPaperToSession(paperID, sessionID);
	    }else if(u.draggable.hasClass("paper")){
		// move paper from another session to this
		console.log("move paper from another session into this one");
		var paperID = u.draggable.attr("id").split("-")[1];
		
		var sourceSessionID = u.draggable.closest('.session').attr("id");
		var targetSessionID = $(this).attr('id');
		if((typeof sourceSessionID == 'undefined') || (typeof targetSessionID == 'undefined')){
//		    console.log("unknown source/target. ignoring...");
		    return;
		}
		if(sourceSessionID == targetSessionID) {
//		    console.log("paper from session ", sourceSessionID, " dragged into itself");
		    return;
		}
//		console.log(paperID, sourceSessionID, targetSessionID);
		
		addPaperToSession(paperID, targetSessionID);
		removePaperFromSession(paperID, sourceSessionID);
		$(u.draggable).remove();
	    }

    	}});
    
     
  $('#sessionarea .session').draggable({
      stop: function() {
	  var id = $(this).attr('id');
	  var pos = $(this).position();
	  var watchedSessions = Session.get("sessionsWatched");
	  watchedSessions[id].position = pos;
	  Session.set("sessionsWatched", watchedSessions);
      },
      grid: [5, 5] 
  });
}


Template.paperSession.helpers({
    numPapersInSession:  function(){
	return this.papers.length;
    },
   
    watchedSession: function (){
	var watchedSessions = Session.get("sessionsWatched");
	return (this._id in watchedSessions);
    }
});


Template.SessionBuilder.helpers({

    watchedSession: function (){
	var watchedSessions = Session.get("sessionsWatched");
	return (this._id in watchedSessions);
    },
    
    pesOptions : function (){
	return Session.get("sort");
    },
    
    sesOptions : function (){
	return Session.get("sessionSort");
    },
    
    namedSession : function (){
	var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
	return nullNames.indexOf(this.name) == -1
    },
    
    sessionName : function(){
	var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
	
	if (nullNames.indexOf(this.name) != -1) return "Session not yet named";
	return this.name;
    },
    
    numPapersInSession : function(){
	return this.papers.length;
    },
    
    
    PapersIndex: function () { 
	return PapersIndex; 
    },

    SessionsIndex: function () { 
	return SessionsIndex; 
    },
    
    numPapersDisplayed : function (){
	return numPapersDisplayed();
    },
    
    numPapersNotInSession : function(){
	// DEPREC
	console.log("ran numPapersNotINSession");
	return papersNotInValidSessions().length;
	return 0; // TODO REACTIVE
	var ret = Papers.find({active: true});
	
	var papers = ret.fetch();
	return unsatPapers(papers, wellFormedSessions()).length
    },

    numPapersNotInApprovedSession : function(){
	// DEPREC
	return 0; // TODO REACTIVE
	var ret = Papers.find({active: true});
	var papers = ret.fetch();
	return unsatPapers(papers, approvedSessions()).length
    },
    
    numPapersNotInTwoApprovedSessions : function(){
	// DEPREC
	return 0; // TODO REACTIVE
	var ret = Papers.find({active: true});
	var papers = ret.fetch();
	return unsatKPapers(papers, approvedSessions(), 2).length
    },
    
    numUnapproved : function(){
	return 0; // TODO REACTIVE
	var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
	return Sessions.find({approved: false,
			      name: {$not: {$in: nullNames}}
			     }).count();;
    },
    
    numValid : function(){
	return 0; // TODO REACTIVE
	var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
	return Sessions.find(
 	    {
		name   : {$not: {$in: nullNames}},
		papers : {$exists:true}, 
 		$where:'this.papers.length>2'}).count();
    },
    
    hasDisplays : function(keywordOption){
	return true; // TODO TEST REACTIVE
	var papers;
	
	if(!inputIsNotEmpty()){
	    papers = Papers.find({active: true}).fetch();
	} else {
	    papers = Session.get("searchResults");
	}
	if(!papers) return;
	
	var keyword = keywordOption.toString();
	if(!keywordOption) keyword = Session.get('keywordFilter')
	
	if(keyword != "All"){
	    papers = papers.filter(function(x) { 
		return x.keywordList.indexOf(keyword) != -1});
	}
	
	var withoutApproved = Session.get("withoutApprovedSession");
	var withoutSession = Session.get("withoutSession");
	var withoutTwoApproved = Session.get("withoutTwoApprovedSessions");
    
	var count = 0;
	for(var i = 0; i < papers.length; i++){
	    if(count > 0) return count;
	    var p = papers[i];
	    var matchedSessions;
	    
	    if(!withoutApproved && !withoutSession && !withoutTwoApproved) {
	    count++;
		continue;
	    }else if(withoutSession && !withoutApproved && !withoutTwoApproved){
		matchedSessions =  wellFormedSessions();
	    }else {
	    matchedSessions =  approvedSessions();
	    }
	    
	    if(!withoutTwoApproved){
		if(unsatPapers([p], matchedSessions).length > 0) count++;
	    }else{
		if(unsatKPapers([p], matchedSessions, 2).length > 0) count++;
	    }
	}
	
	return count;
    },

    countDisplays : function(keywordOption){
	// NO LONGER USED
	return 0; //TODO TEST REACTIVE
	var papers;
	console.log("Called");
	if(!inputIsNotEmpty()){
	    var ret = Papers.find({active: true});
	    
	    // ret.observeChanges({
	    // 	added: function (id, fields) {
	    // 	    console.log("", 'added', id, fields);
	    // 	},
		
	    // 	changed: function (id, fields) {
	    // 	    console.log("", 'changed', id, fields);
	    // 	},
		
	    // 	movedBefore: function (id, before) {
	    // 	    console.log("", 'movedBefore', id, before);
	    // 	},
		
	    // 	removed: function (id) {
	    // 	    console.log("", 'removed', id);
	    // 	}
	    // });
	    
	    papers = ret.fetch();
	} else {
	    papers = Session.get("searchResults");
	    console.log(papers);
	}
	
	if(!papers) return;
	
	var keyword = keywordOption.toString();
	if(!keywordOption) keyword = Session.get('keywordFilter')
	
	if(keyword != "All"){
	    papers = papers.filter(function(x) { return x.keywordList.indexOf(keyword) != -1});
	}
	
	var withoutApproved = Session.get("withoutApprovedSession");
	var withoutTwoApproved = Session.get("withoutTwoApprovedSessions");
	var withoutSession = Session.get("withoutSession");
	
	var count = 0;
	for(var i = 0; i < papers.length; i++){
	    var p = papers[i];
	    var matchedSessions;
	    
	    if(!withoutApproved && !withoutSession && !withoutTwoApproved) {
		count++;
		continue;
	    }else if(withoutSession && !withoutApproved && !withoutTwoApproved){
		matchedSessions =  wellFormedSessions();
	    }else {
		matchedSessions =  approvedSessions();
	    }
	    
	    if(!withoutTwoApproved){
		if(unsatPapers([p], matchedSessions).length > 0) count++;
	    }else{ // without two approved
		if(unsatKPapers([p], matchedSessions, 2).length > 0) count++;
	    }
	}
	
	return count;
    },
    
    papers : function(){
	var sort = Session.get("sort");
	var papers = Papers.find({active: true}, sort);
	// papers.observeChanges({
	//     added: function (id, fields) {
	// 	console.log("", 'added', id, fields);
	//     },
	    
	//     changed: function (id, fields) {
	// 	console.log("", 'changed', id, fields);
	//     },
	    
	//     movedBefore: function (id, before) {
	// 	console.log("", 'movedBefore', id, before);
	//     },
	    
	//     removed: function (id) {
	// 	console.log("", 'removed', id);
	//     }
	// });
	
	return papers;
    },

    searchResults : function() {
	// makes the search reactive
	console.log("checking results..")
	var results = Session.get("searchResults").map(function(x){return x._id});
	var papers =  Papers.find({_id: {$in: results},
				   active: true});
	
	return papers;
	//return Session.get("searchResults")
    },
    
    sessionSearchResults : function(){
	// makes the search reactive
	var results = Session.get("sessionSearchResults").map(function(x){return x._id});
	return Sessions.find({_id: {$in: results}});
//	return Session.get("sessionSearchResults");
    },
    
    passPaperFilters : function (){
	var withoutApproved = Session.get("withoutApprovedSession");
	var withoutTwoApproved = Session.get("withoutTwoApprovedSessions");
	var withoutSession = Session.get("withoutSession");
	var matchedSessions; 
		
	// only return accepted papers
	if(!this.active) {
	    updateIsDisplayed(this._id, false);
	    return false;
	}
	
	// only return papers that have the set keyword
	if(Session.get('keywordFilter') != "All" && 
	   this.keywordList.indexOf(Session.get('keywordFilter')) == -1){
	    
	    updateIsDisplayed(this._id, false);
	    return false;
	}
	
	if(!withoutApproved && !withoutSession && !withoutTwoApproved) {
	    updateIsDisplayed(this._id, true);
	    return true;
	}else if(withoutSession && !withoutApproved && !withoutTwoApproved){
	    matchedSessions =  wellFormedSessions();
	}else {
	    matchedSessions =  approvedSessions();
	}
	if(!withoutTwoApproved){
	    var ret = unsatPapers([this], matchedSessions).length > 0
	    updateIsDisplayed(this._id, ret);
	    return ret;
	}else{
	    var ret = unsatKPapers([this], matchedSessions, 2).length > 0
	    updateIsDisplayed(this._id, ret);
	    return ret;
	}
    },
    
    passSessionFilters: function () {
	var showUnapproved = Session.get("showUnapprovedSessions");
	var showValid = Session.get("showValidSessions");
	var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
	var passed = (nullNames.indexOf(this.name) === -1)
	
	if(showValid) passed = passed && this.papers.length > 2;
	if(showUnapproved) passed = passed && !this.approved;
	
	updateIsDisplayedSession(this._id, passed);
	return passed;
    },
    
    sessionPapers : function() {
	var paperIDs = this.papers;
	var papers = Papers.find({_id: {$in: paperIDs}})

	return papers;
    },
    
    inputIsNotEmpty : function (){
	return inputIsNotEmpty()
    },
    
    searchKey : function (){
	return Session.get('paperSearchVal');
    },
    
    keywordStatus: function(){
	var filter = Session.get("keywordFilter");
	if(filter != "All"){
	    return " on '" + filter + "'";
	}
	return;
    },
    
    filterStatus: function(){
	if(Session.get("withoutTwoApprovedSessions")){
	    return " that aren't in two or more approved sessions";
	}else if(Session.get("withoutApprovedSession")){
	    return " that aren't in an approved session";
	}else if(Session.get("withoutSession")){
	    return " that aren't in a named session with 3+ papers";
	}
	return;
    },
    
    numSearchPapers : function(){
	return Session.get("searchResults").length;
    },

    numTotalPapers: function(){
	return Papers.find({active:true}).count();
    },
    
    sessionInputIsNotEmpty : function (){
	return sessionInputIsNotEmpty();
    },
    
    numSearchSessions: function(){
	return Session.get("sessionSearchResults").length;
    },
    
    numTotalSessions: function(){
	return getSessions().count();
    },
    
    getKeywordFilterText : function(){
	var filter = Session.get("keywordFilter");
	if(filter == "All") {
	    $('#keyword-filter').addClass('btn-default').removeClass('btn-primary');
	}else{
	    $('#keyword-filter').removeClass('btn-default').addClass('btn-primary');
	}
	return filter;
    },
    
    countAll : function (){
	var count = numPapersDisplayed();//countDisplays("All");
	return count;
    },

    countKeywordMatches : function (){
	var filter = this.toString();

	return countKeywordMatchesWithFilter(filter);
    },
    
    hasKeywordMatches : function (){
	var filter = this.toString();
	return hasKeywordMatchesWithFilter(filter);
    },

    countSelectedKeywordMatches : function (){
	var filter = Session.get("keywordFilter");
	return countKeywordMatchesWithFilter(filter);
    },
    
    getKeywords : function(){
	return personaList;
    },
    
    sessions : function(){
	return getSessions()
    },
    
    
    workspaceSessions : function(){
	var sessions =  Sessions.find();
	// sessions.observeChanges({
	//     added: function(id, fields){
	// 	console.log("workspaceSessions", "added", id);
	//     }
	// });
	return sessions;
	
    },
    /*  sessionName : function(){
	var session = Sessions.findOne({_id: this.toString()});
	if(session === undefined) 
	return false;
	return session.name;
	},
    */
    numSessions : function(){
	return getSessions().count()
    },
    
    numWorkspaceSessions : function(){
	 var watched = Session.get("sessionsWatched");
	 var size = 0;
	 for(var k in watched) {
	     size++;
	 }
	
	//return 0;
	// var sessions = Sessions.find();
	// sessions.observeChanges({
	//     added: function(id, fields){
	// 	console.log("numWorkspaceSessions", "added", id, fields);
	//     }
	// });

	// var currentSessions = sessions.fetch().map(function(x) {return x._id});
	// var watched = Session.get("sessionsWatched");
	// var size = 0;
	// for(var k in watched) {
	//     if(currentSessions.indexOf(k) != -1)
	// 	size++;
	// }
	return size;
    },
    
    
    numNamed : function(){
	var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
	return Sessions.find({name: {$not: {$in: nullNames}}}).count();
    },
    
    numNamedAndFiltered : function(){
	if(!sessionInputIsNotEmpty()){
	    var count = 0;
	    var d = Session.get("isDisplayedSession");
	    for(var i in d){
		if(d[i]) count++
	    }
	    return count;
	}else{
	    // search results
	    var validIDs = Session.get("sessionSearchResults").map(function(x){return x._id});
	    var count = 0;
	    var d = Session.get("isDisplayedSession");
	    for(var i in d){
		if(d[i] && (validIDs.indexOf(i) !=-1)) count++
	    }
	    return count;
	}
    },
    
    sessionSearchKey: function(){
	return Session.get('sessionSearchVal');
    },

    sessionFilterStatus: function(){
	var unapproved = Session.get("showUnapprovedSessions");
	var valid = Session.get("showValidSessions");
	if(unapproved && valid)
	    return " that have 3+ papers and are unapproved";
	else if(unapproved && !valid){
	    return " that are unapproved";
	}else if(!unapproved && valid){
	    return " that have 3+ papers";
	}else {
	    return "";
	}
    },
    
    numUnnamed : function(){
	var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
	return Sessions.find({name: {$in: nullNames}}).count();
    }
});


countKeywordMatchesWithFilter = function countKeywordMatchesWithFilter(filter){
    //    console.log("count keyword matches");
    if(filter == "All") return numPapersDisplayed();
    
    var isDisplayed = Session.get("isDisplayed");
    var filteredPapers = keywords[filter];

    for(var p in isDisplayed){
	isDisplayed[p] = isDisplayed[p] && (filteredPapers.indexOf(p) != -1);
    }
    
    if(!inputIsNotEmpty()){
	var count = 0;
	var d = isDisplayed;
	for(var i in d){
	    if(d[i]) count++
	}
	return count;
    }else{
	// make sure also in search results
	var validIDs = Session.get("searchResults").map(function(x){return x._id});
	var count = 0;
	var d = isDisplayed;
	for(var i in d){
		if(d[i] && (validIDs.indexOf(i) !=-1)) count++
	}
	return count;
    }
}


hasKeywordMatchesWithFilter = function hasKeywordMatchesWithFilter(filter){
    if(filter == "All") return true;
    
    var isDisplayed = Session.get("isDisplayed");
    var filteredPapers = keywords[filter];


    for(var p in isDisplayed){
	isDisplayed[p] = isDisplayed[p] && (filteredPapers.indexOf(p) != -1);
    }


    
    if(!inputIsNotEmpty()){
	var count = 0;
	var d = isDisplayed;
	for(var i in d){
	    if(d[i]) return true;
	}
	return false;
    }else{
	// make sure also in search results
	var validIDs = Session.get("searchResults").map(function(x){return x._id});
	var count = 0;
	var d = isDisplayed;
	for(var i in d){
	    if(d[i] && (validIDs.indexOf(i) !=-1)) return true;
	}
	return false;
    }
}

function updateIsDisplayed(paperID, isDisplayed){
    var displayed = Session.get("isDisplayed");
    displayed[paperID] = isDisplayed;
    Session.set("isDisplayed", displayed);
}

function updateIsDisplayedSession(sessionID, isDisplayed){
    var displayed = Session.get("isDisplayedSession");
    displayed[sessionID] = isDisplayed;
    Session.set("isDisplayedSession", displayed);
}


/********************************************************************
* Session Template Helpers
********************************************************************/
Template.session.helpers({
    top : function (){
	var watchedSessions = Session.get("sessionsWatched");
	return watchedSessions[this._id].position.top;
    },
    
    left: function (){
	var watchedSessions = Session.get("sessionsWatched");
	return watchedSessions[this._id].position.left;
    },

    sessionName : function(){
	var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
	if (nullNames.indexOf(this.name) != -1) return "Session not yet named";
	return this.name;
    },

    sessionPapers : function(){
	var paperIDs = this.papers;
	var papers = Papers.find({_id: {$in: paperIDs}});

	return papers.fetch().sort(function (a, b) { return paperIDs.indexOf(a._id) - paperIDs.indexOf(b._id)});
    },
    
    named : function(){
	var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
	if(nullNames.indexOf(this.name) != -1)
	    return 'text-danger';
	else return false
    },
    
    isCollapsed : function(){
	var watchedSessions = Session.get("sessionsWatched");
	return watchedSessions[this._id].isCollapsed;
	//	return $(this)[0].isCollapsed;
    },
    
    getContributors : function(){
	return this.contributors.map(function(x){
	    return x.author}).filter(function(value, index,self){	
		return self.indexOf(value) === index;
	    }).map(function(x) { return shortenName(x)}).join(', ');
    },
    
    numPapersInSession: function(){
	return this.papers.length;
    }
    
});

Template.session.events({
    'click .session-label' : function (e, u){
	$(e.target).parent().siblings('.session-label-edit').show();
	$('.name-session').focus();
	$(e.target).parent().hide();
    },
    
    'click .edit-session-title' : function (e, u){
	var $session = $(e.target).closest('div.session');
	var sessionID = $session.attr('id');
	var name = $(e.target).siblings('.name-session').val();
	updateSessionName(sessionID, name);
	$(e.target).closest('.session-label-edit').hide();
	$session.find('.session-label-heading').show();
    },
    
    //updates name field in session as user types
    'focus .name-session' : function(e, template){
	if($(e.target).attr('placeholder') != "Session not yet named")
	    $(e.target).attr('value', $(e.target).attr('placeholder'));
    },

    'blur .name-session' : function(e, template){
	var $session = $(e.target).closest('div.session');
	var sessionID = $session.attr('id');
	var name = $(e.target).val();
	updateSessionName(sessionID, name);
	$(e.target).closest('.session-label-edit').hide();
	$session.find('.session-label-heading').show();
    },
    
    
    'keyup .name-session' : function(e, template){
	if(e.which == 13){ // enter
    	    var $session = $(e.target).closest('div.session');
    	    var sessionID = $session.attr('id');
    	    var name = $(e.target).val();
    	    updateSessionName(sessionID, name);
    	    $(e.target).closest('.session-label-edit').hide();
    	    $session.find('.session-label-heading').show();
    	}
    },
});



function shortenName(name){
    var na = name.split(" ");
    if(na.length > 1){
	return na[0] + " " + na[na.length-1][0] + ".";
    }else{
	return na;
    }
}

/*******************************************************************
Session (in session list) template helpers
********************************************************************/

Template.sessionInList.helpers({

    sessionName : function(){
	var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
	if (nullNames.indexOf(this.name) != -1) return "Session not yet named";
	return this.name;
    },

    numPapersInSession : function(){
	return this.papers.length;
    },

    watchedSession : function (){
	var watchedSessions = Session.get("sessionsWatched");
	return (this._id in watchedSessions);
    },
    
    
    sessionPapers : function (){
	var paperIDs = this.papers;
	//	return Papers.find({_id: {$in: paperIDs}})
	//var paperIDs = this.papers;
	return Papers.find({_id: {$in: paperIDs}}).fetch().sort(function (a, b) { return paperIDs.indexOf(a._id) - paperIDs.indexOf(b._id)});
	
    },
    papersCollapsed : function(){
	return !Session.get("showAllPapers");
    },
    contributorsCollapsed : function(){
	return !Session.get("showAllContributors");
    },
    getContributors : function(){
	return this.contributors.map(function(x){
	    return x.author}).filter(function(value, index,self){	
		return self.indexOf(value) === index;
	    }).map(function(x) { return shortenName(x)}).join(', ');
    }
});


Template.sessionInList.events({
    'click .session-item':function(e, u){
	if($(e.target).hasClass("morelink")){
	    return;
	}
	
	toggleDetails($(e.target).closest('.session-item').find('.session-paper-container'), '.toggle-papers');
	toggleDetails($(e.target).closest('.session-item').find('.contributors'), '.toggle-contributors');
	
    },
    
    'click .watch-session-button': function(e, u){
	e.stopPropagation();
	var id = $(e.target).attr("id");
	id = id.split("-")[1];
	addToWatchlist(id);
    },
    
    'click .unwatch-session-button': function(e, u){
	e.stopPropagation();
	var id = $(e.target).attr("id");
	id = id.split("-")[1];
	removeFromWatchlist(id);
    }
    
});

Template.paperSession.events({
    'click .unwatch-session-button': function(e, u){
	e.stopPropagation();
	var id = $(e.target).attr("id");
	id = id.split("-")[1];
	removeFromWatchlist(id);
    }
});
/*******************************************************************
Paper (in paper list) template helpers
********************************************************************/



Template.paperWithSessions.events({
    'click .paper-item': function(e, u){
	if($(e.target).hasClass("morelink")){
	    return;
	}

	// expand all details
	toggleDetails($(e.target).closest('.paper-item').find('.abstract'), '.toggle-abstracts');
	toggleDetails($(e.target).closest('.paper-item').find('.keywords'), '.toggle-keywords');
	toggleDetails($(e.target).closest('.paper-item').find('.authors-container'), '.toggle-authors');
	toggleDetails($(e.target).closest('.paper-item').find('.paper-sessions'), '.toggle-paper-sessions');
    }
});

function toggleDetails(e, button){
    if(e.hasClass("hidden")){
	e.removeClass("hidden").addClass("show");
	return;
    }
    if(!button){
	e.removeClass("show").addClass("hidden");
	return;
    }
    if($(button).hasClass("btn-info")){
	e.removeClass("show").addClass("hidden");
	return;
    }
}


Template.paper.helpers({
    displayKeywords: function(){
	var ret = "";
	for(var k = 0; k < this.keywordList.length-1; k++){
	    ret += this.keywordList[k] + ", "
	}
	ret +=this.keywordList[this.keywordList.length-1]
	return ret;
    },
    institution : function() {
	if(this.primary.institution != "")
	    return this.primary.institution;
	else{
	    return this.primary.dept.split(",")[0];
	}
    },
    getAbstract: function(){
	var abstract = this.abstract;
	var showChar = 300;
	var ellipsestext = "...";
	var moretext = "more";
	var lesstext = "less";
        if(abstract.length > showChar) {
            var c = abstract.substr(0, showChar);
            var h = abstract.substr(showChar, abstract.length - showChar);
	    
            var html = c+'<span class="moreellipses">'+ellipsestext+ '&nbsp;</span><span class="morecontent"><span>'+h+'</span>&nbsp;<a class="morelink">'+ moretext+'</a></span>';
	    
	    return html;
        }else{
	    return abstract;
	}
    }
    
});

Template.paperInSession.helpers({
    displayKeywords: function(){
	var ret = "";
	for(var k = 0; k < this.keywordList.length-1; k++){
	    ret += this.keywordList[k] + ", "
	}
	ret +=this.keywordList[this.keywordList.length-1]
	return ret;
    },
    institution : function() {
	if(this.primary.institution != "")
	    return this.primary.institution;
	else{
	    return this.primary.dept.split(",")[0];
	}
    },
    getAbstract: function(){
	var abstract = this.abstract;
	var showChar = 300;
	var ellipsestext = "...";
	var moretext = "more";
	var lesstext = "less";
        if(abstract.length > showChar) {
            var c = abstract.substr(0, showChar);
            var h = abstract.substr(showChar, abstract.length - showChar);
	    
            var html = c + '<span class="moreellipses">'+ellipsestext+'&nbsp;</span><span class="morecontent"><span>' + h + '</span>&nbsp;<a class="morelink">' + moretext + '</a></span>';
	    
	    return html;
        }else{
	    return abstract;
	}
    }
});	

Template.paperInSession.events({
    'click .paper': function(e, u){
	if($(e.target).hasClass("morelink")){
	    return;
	}
	
	e.stopPropagation();
	toggleDetails($(e.target).closest('.paper').find('.abstract'));
	toggleDetails($(e.target).closest('.paper').find('.keywords'));
	toggleDetails($(e.target).closest('.paper').find('.authors-container'));
    },
    
    'click .remove-paper-button' : function(e){
	e.stopPropagation();
	var paperID = $(e.target).closest('li').attr("id");
	paperID = paperID.split("-")[1];
	var sessionID = $(e.target).closest('div.session').attr("id");
	removePaperFromSession(paperID, sessionID);
	$(e.target).remove();
    },
    
    
});

Template.paper.events({
    'click .paper-item': function(e, u){
	if($(e.target).hasClass("morelink")){
	    return;
	}
	e.stopPropagation();
	toggleDetails($(e.target).closest('.paper-item').find('.abstract'));
	toggleDetails($(e.target).closest('.paper-item').find('.keywords'));
	toggleDetails($(e.target).closest('.paper-item').find('.authors-container'));
    }
});

Template.paperWithSessions.helpers({
    paperSessions : function(){
	var sessionIDs = this.sessions;
	var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
	var sessions = Sessions.find({_id: {$in: sessionIDs},
				      name: {$not: {$in: nullNames}}
				     })
	// sessions.observeChanges({
	//     added: function(id, fields){
	// 	console.log("paperSessions", "added", id);
	//     }
	// });
	
	return sessions;
    },
    
    numSessionsPaperIsIn : function(){
	var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
	var sessionIDs = this.sessions;
	return Sessions.find({_id: {$in: sessionIDs},
			      name: {$not: {$in: nullNames}}
			     }).count()
    },
    
    abstractCollapsed : function(){
	return !Session.get('showAllAbstracts');
    },
    
    authorsCollapsed : function(){
	return !Session.get('showAllAuthors');
    },
    
    keywordsCollapsed : function () {
	return !Session.get('showKeywords');
    },

    paperSessionsCollapsed : function(){
	return !Session.get('showPaperSessions');
    },
    
    author : function (){
	return this.authors;
    },
    
    institution : function() {
	if(this.primary.institution != "")
	    return this.primary.institution;
	else{
	    return this.primary.dept.split(",")[0];
	}
    },
    displayKeywords: function(){
	var ret = "";
	for(var k = 0; k < this.keywordList.length-1; k++){
	    ret += this.keywordList[k] + ", "
	}
	ret +=this.keywordList[this.keywordList.length-1]
	return ret;
    },
    getAbstract: function(){
	var abstract = this.abstract;
	var showChar = 300;
	var ellipsestext = "...";
	var moretext = "more";
	var lesstext = "less";
        if(abstract.length > showChar) {
            var c = abstract.substr(0, showChar);
            var h = abstract.substr(showChar, abstract.length - showChar);
	    
            var html = c + '<span class="moreellipses">' + ellipsestext+ '&nbsp;</span><span class="morecontent"><span>' + h + '</span>&nbsp;<a class="morelink">' + moretext + '</a></span>';
	    
	    return html;
        }else{
	    return abstract;
	}
    }
    
    

});

/*******************************************************************
Session template helpers
********************************************************************/

/********************************************************************
* Session Builder Event Mappings
********************************************************************/
Template.SessionBuilder.events({
    'click .morelink': function(e, u){
	e.stopPropagation();
        if($(e.target).hasClass("less")) {
            $(e.target).removeClass("less");
            $(e.target).html('more');
        } else {
            $(e.target).addClass("less");
            $(e.target).html('less');
        }
        $(e.target).parent().prev().toggle();
        $(e.target).prev().toggle();
        return false;
    },

    'click #directions-icon': function(){
	$('#directions').slideToggle();
	if($('#directions-icon').hasClass("fa-question-circle")){
	    $('#directions-icon').switchClass("fa-question-circle", "fa-chevron-circle-up");
	} else {
	    $('#directions-icon').switchClass("fa-chevron-circle-up", "fa-question-circle");
	}
    },
    
    'keyup .paper-search-input input': function (e) {
	clearTimeout(Session.get('paperSearchTimer'));
	var ms = 300;
	var val = $(e.target).val();
	var timer = setTimeout(function(){
	    let cursor = PapersIndex.search(val);
	    Session.set('paperSearchVal', val);

	    console.log(cursor.fetch());
	    console.log(cursor.fetch().filter(function(x){ return x.active}))

	    Session.set('searchResults', cursor.fetch().filter(function(x){ return x.active}));

	    console.log("search results: " + Session.get('searchResults'))
	}, ms);
	Session.set('paperSearchTimer', timer); 
    },
    
    'keyup .session-search-input input' : function (e) {
	clearTimeout(Session.get('sessionSearchTimer'));
	var ms = 300;
	var val = $(e.target).val();
	var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
	
	var timer = setTimeout(function(){
	    let cursor = SessionsIndex.search(val);
	    Session.set('sessionSearchVal', val);
	    Session.set("sessionSearchResults", cursor.fetch().filter(function(x){return nullNames.indexOf(x.name) == -1}));
	}, ms);
	Session.set('sessionSearchTimer', timer); 
    },
    
    'click .show-all-link': function(){
	Session.set("withoutTwoApprovedSessions", false);
	Session.set("withoutApprovedSession", false);
	Session.set("withoutSession", false);
	removeFilter('.without-two-approved', 'btn-default', 'btn-warning');
	removeFilter('.without-approved', 'btn-default', 'btn-warning');
	removeFilter('.without-session', 'btn-default', 'btn-warning');
	
	Session.set("keywordFilter", "All");
    },
    
    'click .show-all-session-link': function(){
	Session.set("showUnapprovedSessions", false);
	Session.set("showValidSessions", false);
	removeFilter('.unapprovedSessions', 'btn-default', 'btn-warning');
	removeFilter('.validSessions', 'btn-default', 'btn-warning');
    },
    
    'click .abs-link' : function(e){
	if($(e.target).siblings('.abstract').hasClass("hidden")){
	    $(e.target).siblings('.abstract').removeClass("hidden").addClass("show");
	}else{
	    $(e.target).siblings('.abstract').removeClass("show").addClass("hidden");
	}
    },
    
    'click .pis-link' : function(e){
//	$(e.target).parent().parent().find('div.session-paper-container').toggle();
    },
    
    'click .unapprovedSessions': function(){
	toggleFilter("showUnapprovedSessions", '.unapprovedSessions',
		     'btn-default', 'btn-warning');
    },
    
    'click .validSessions': function(){
	toggleFilter("showValidSessions", '.validSessions',
		     'btn-default', 'btn-warning');
    },
    
    'click .without-approved' : function (){
	toggleFilter("withoutApprovedSession", '.without-approved',
		     'btn-default', 'btn-warning');
    },
    
    'click .without-two-approved' : function (){
	toggleFilter("withoutTwoApprovedSessions", '.without-two-approved',
		     'btn-default', 'btn-warning');
    },
    
    'click .without-session' : function (){
	toggleFilter("withoutSession", '.without-session',
		     'btn-default', 'btn-warning');
    },
    
    'click .toggle-abstracts' : function(){
	toggleButton('showAllAbstracts', '#paper-deck .paper .abstract',
		     '.toggle-abstracts', 'btn-info', 'btn-success');
    },

    'click .toggle-keywords' : function(){
	toggleButton('showKeywords', '#paper-deck .paper .keywords',
		     '.toggle-keywords', 'btn-info', 'btn-success');
    },

    'click .toggle-authors' : function(){
	toggleButton('showAllAuthors', '#paper-deck .paper .authors-container',
		     '.toggle-authors', 'btn-info', 'btn-success');
    },
    
    'click .toggle-paper-sessions' : function(){
	toggleButton('showPaperSessions', '#paper-deck .paper-sessions',
		     '.toggle-paper-sessions', 'btn-info', 'btn-success');
    },
    
    'click .toggle-papers' : function(){
	toggleButton('showAllPapers', '#session-list .session-paper-container',
		     '.toggle-papers', 'btn-info', 'btn-success');
    },

    'click .toggle-contributors' : function(){
	toggleButton('showAllContributors', '#session-list .session-contributors',
		     '.toggle-contributors', 'btn-info', 'btn-success');
    },
    
    
    'click .finish-session-button' : function(e){
	var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
	if(nullNames.indexOf($(e.target).siblings().find('.session-label').text()) != -1) {
	    var r = confirm("This session is unnamed and will thus be destroyed. If you want to save it, 'cancel' and name it.");
	    if(!r) return;
	}
	
	var sessionID = $(e.target).closest('div.session').attr("id");
	
	removeFromWatchlist(sessionID);
    },
    
    'click .remove-session-button' : function(e){
	var r = confirm("This session will be removed globally from the list of candidate sessions. Continue?");
	if(r){
	    var sessionID = $(e.target).closest('div.session').attr("id");
	    var papers = Sessions.findOne({_id: sessionID}).papers;
	    for(var p in papers){
		removePaperFromSession(papers[p], sessionID);
	    }
	}
    },
    
    'click .approve-session-button' : function(e){
	if (this.approved) {
	    $(e.target).closest('div.session').find('input[name="approval"]').prop('checked', true);
	}else{
	    if(this.name == "") {
		$(e.target).closest('div.session').find('.session-label-edit').show();
		$(e.target).closest('div.session').find('.session-label-heading').hide();

		$('.name-session').focus();
		return;
	    }
	    $(e.target).closest('div.session').find('input[name="approval"]').prop('checked', false);
	}
	$(e.target).closest('div.session').find('div.approval').toggle();
    },
    
    //Collapse Session and makes them unsortable until expanded
    'click .collapser' : function(e, u){
	var id = $(e.target).closest('div.session').attr('id');
	//	var session = Sessions.findOne({_id: id});
	var watchedSessions = Session.get("sessionsWatched");
	watchedSessions[id].isCollapsed = !watchedSessions[id].isCollapsed;
	Session.set("sessionsWatched", watchedSessions);
	logAction('collapse', {sessionID: id});
    },
    
    'click input[type=checkbox]': function(e, u){
	var numChecked = $(e.target).parent().find('input[name="approval"]:checked').length;
	var sessionID = $(e.target).closest('div.session').attr("id");
	if (numChecked == 3){
	    Sessions.update({_id: sessionID},
			    {$set: {approved: true},
			     $push: {contributors : logSessionAction('approve')}
			    });
	    logAction('approve', {sessionID: sessionID});
	    // toggle the approve 
	    $(e.target).closest('div.session').find('.approve-session-button').trigger('click');
	}else{
	    if(Sessions.findOne({_id: sessionID}).approved){
		// TODO: inefficient?
		logAction('unapprove', {sessionID: sessionID});
		Sessions.update({_id: sessionID},
				{$set: {approved: false}});
	    }
	}
    },
    
   
    'click .keyword-option' : function (e, u) {
	Session.set("keywordFilter", $(e.target).text().substring(0, $(e.target).text().indexOf(" (")));

//	console.log("clicked keyword-option")
//	console.log($(e.target).text())
//	console.log(Session.get("keywordFilter"))
    },
    
    'click #sessionSortAZ' : function(){
 	Session.set("sessionSort", {sort: {name: 1}});
    },
    
    'click #sessionSortMost' : function(){
 	Session.set("sessionSort", {sort: {numPapers: -1}});
    },

    'click #sessionSortFewest' : function(){
 	Session.set("sessionSort", {sort: {numPapers: 1}});
    },
});


/********************************************************************
* Creates new session, adds it to collection, and updates Papers    *
********************************************************************/

logAction = function logAction(act, params){
    var userId = null;
    var author = Session.get('anonymousName');
    var time = new Date().getTime();
    
    if(Meteor.user() != null) {
	userId = Meteor.user()._id;
	author = Meteor.user().profile.name;
    }
    var log = new ActionLog(userId, author, time, act, params);
    
    Meteor.call('logAction', log, function(err, ret){
	if(err) console.log(err);
    });
//    Logs.insert(log);
}

function logSessionAction(act){
    var userId = null;
    var author = Session.get('anonymousName');
    var time = new Date().getTime();
    if(Meteor.user() != null) {
	userId = Meteor.user()._id;
	author = Meteor.user().profile.name;
    }
    var log = ({ 
	userId: userId,
	author: author,
	timestamp: time,
	action: act
    })
    return log;
}

function createPaperIndex(x){
    var paper = Papers.findOne({_id: x});
    return paper._id + " " + paper.title + " " + 
    	paper.keywords + " " + paper.authors.map(function(y){ 
    	    return y.givenName + " " + y.familyName}).join(" ");
}

function createPaperIndices(paperIDs){
    return paperIDs.map(function (x){
	return createPaperIndex(x);
    });
}

updateSessionName = function updateSessionName(sessionID, name){
    if(Sessions.findOne({_id: sessionID}).name == name.toLowerCase()) return;
    
    Sessions.update({_id: sessionID},
		    {$set: {name: name.toLowerCase(),
			    approved: false},
		     $push: {contributors : logSessionAction('name')}
		    });
    logAction('name', {name: name.toLowerCase(), sessionID: sessionID});
}

createSession = function createSession(paperID, position) {
    var papers = [paperID];
    var session = new ConfSession(papers);
    session.contributors.push(logSessionAction('create'));
    session.paperIndex = createPaperIndices(papers);
    var sessionID = Sessions.insert(session);
    logAction('create', {paperID: paperID, sessionID: sessionID});
    
    updateInSession(paperID, true);
    updateSessionList(paperID, sessionID, true);
    
    // add to personal watch list
    addToWatchlist(sessionID, position);
    return sessionID;
}

removePaperFromSession = function removePaperFromSession(paperID, sessionID) {
    var session = Sessions.findOne({_id : sessionID});
//    console.log("session", session, paperID, sessionID);
    if(!session) return;
    if(session.papers.indexOf(paperID) == -1){
	console.log("Paper not in session, ignoring...");
	return;
    }
    
    // take it out of the session object
    Sessions.update({_id: sessionID}, 
		    {
			$pull: {papers: paperID,
			        paperIndex : createPaperIndex(paperID)},
			$set: {approved: false},
			$push: {contributors : logSessionAction('remove')},
			$inc: {numPapers: -1}
		    });
    logAction('remove', {paperID: paperID, sessionID: sessionID});
        
    // take it out of the paper object
    updateSessionList(paperID, sessionID, false);   
    
    // check for empty session
    var session = Sessions.findOne({_id: sessionID});
    if(!('papers' in session) || session.papers.length === 0){
	// TODO: remove session from UI, or reactive?
	
	//   remove it from session
	Sessions.remove(sessionID);
	logAction('remove-session', {sessionID: sessionID});
	
	//   remove session from watchlist
	removeFromWatchlist(sessionID);
    }
}

addPaperToSession = function addPaperToSession(paperID, sessionID){
    var session = Sessions.findOne({_id : sessionID});
    if(!session) return;
    // if already in session, do nothing
    if(session.papers.indexOf(paperID) != -1){
	console.log("Paper already in session, ignoring...");
	return;
    }
    
    updateInSession(paperID, true);
    Sessions.update({_id: sessionID},
		    {$set: {approved: false},
		     $push: {contributors : logSessionAction('add'),
			     papers: paperID,
			     paperIndex: createPaperIndex(paperID)
			    },
		     $inc: {numPapers: 1}
		    });
    logAction('add', {paperID: paperID, sessionID: sessionID});
    updateSessionList(paperID, sessionID, true);
}

/********************************************************************
* Convenience function used to update items in the session watchlist*
********************************************************************/
function addToWatchlist(sessionID, position){
    var watchlist = Session.get("sessionsWatched");
    watchlist[sessionID] = {position: position || {top: 55, left: 15},
			    isCollapsed : false };
    
    logAction('addToWatchlist', {sessionID: sessionID});
    Session.set("sessionsWatched", watchlist);
}

function removeFromWatchlist(sessionID){
    var watchlist = Session.get("sessionsWatched");
    delete watchlist[sessionID];
    logAction('removeFromWatchlist', {sessionID: sessionID});
    Session.set("sessionsWatched", watchlist);
}

/********************************************************************
* Convenience function used to update items in the Papers Collection*
********************************************************************/
function updateInSession(paperID, inSession){
  Papers.update({_id: paperID}, 
    {$set:
      {inSession: inSession}
  });
}

function updateSessionList(paperID, sessionID, adding){
  if (adding){
    Papers.update({_id: paperID}, 
      {$addToSet:
        {sessions: sessionID}
    });
  } else {
    
    Papers.update({_id: paperID}, 
      {$pull:
        {sessions: sessionID}
    });

    // if no papers left in session..
      var paper = Papers.findOne({_id: paperID});
      if(!('sessions' in paper) || paper.sessions.length === 0)
	  updateInSession(paperID, false);
      
  }
}


/********************************************************************
 * Convenience function for toggles
********************************************************************/
function toggleButton(varToCheck, whatToToggle, button, defaultClass, pressedClass){
    $(whatToToggle).toggle();
    if(Session.get(varToCheck)){
	Session.set(varToCheck, false);
    }else{
	Session.set(varToCheck, true);
    }

    
    if($(button).hasClass(defaultClass))
	$(button).removeClass(defaultClass).addClass(pressedClass);
    else
	$(button).removeClass(pressedClass).addClass(defaultClass);
}

function toggleFilter(varToCheck, button, defaultClass, pressedClass){
    Session.set(varToCheck, !Session.get(varToCheck));
    
    if($(button).hasClass(defaultClass))
	$(button).removeClass(defaultClass).addClass(pressedClass);
    else
	$(button).removeClass(pressedClass).addClass(defaultClass);
}

function removeFilter(button, defaultClass, pressedClass){
    if($(button).hasClass(pressedClass)){
	$(button).removeClass(pressedClass).addClass(defaultClass);
    }
}

/********************************************************************
 * Convenience function for finding matching session
********************************************************************/
function wellFormedSessions(){
    var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
    return Sessions.find(
 	{
	    name   : {$not: {$in: nullNames}},
	    papers : {$exists:true}, 
 	    $where:'this.papers.length>2'}).fetch().map(function (x) { return x._id;});
}

function approvedSessions(){
    var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
    return Sessions.find(
 	{
	    name   : {$not: {$in: nullNames}},
	    approved : true,
	    papers : {$exists:true}, 
 	    $where:'this.papers.length>2'}).fetch().map(function (x) { return x._id;});
}

function unsatPapers(papers, matchedSessions){
      var papersWithout = [];
      for(var p in papers){
	  var inApproved = false;
	  for(var s in papers[p].sessions){
	      if(matchedSessions.indexOf(papers[p].sessions[s]) != -1){
		  inApproved = true;
		  break;
	      }
	  }
	  if(!inApproved) papersWithout.push(papers[p]);
      }
      return papersWithout;
}

function papersNotInValidSessions(){
    var nullNames = ["Session not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
    var papers = Papers.find({active:true});
    var sessions = Sessions.find({
	name   : {$not: {$in: nullNames}},
	papers : {$exists:true}, 
 	$where:'this.papers.length>2'
    });

    // sessions.observeChanges({
    // 	added: function (id, fields) {
    // 	    console.log("s", 'added', id, fields);
    // 	},
	
    // 	changed: function (id, fields) {
    // 	    console.log("s", 'changed', id, fields);
    // 	},
	
    // 	movedBefore: function (id, before) {
    // 	    console.log("s", 'movedBefore', id, before);
    // 	},
	
    // 	removed: function (id) {
    // 	    console.log("s", 'removed', id);
    // 	}
    // });


    var sessionIDs = sessions.map(function (s){
	return s._id;
    });

    // papers.observeChanges({
    // 	added: function (id, fields) {
    // 	    console.log("x", 'added', id, fields);
    // 	},
	
    // 	changed: function (id, fields) {
    // 	    console.log("x", 'changed', id, fields);
    // 	},
	
    // 	movedBefore: function (id, before) {
    // 	    console.log("x", 'movedBefore', id, before);
    // 	},
	
    // 	removed: function (id) {
    // 	    console.log("x", 'removed', id);
    // 	}
    // });
    

    var paperIDsNotInValidSession = [];
    
    papers.forEach( function(paper) {
	var sessionsPaperIsIn = paper.sessions;
	for(var i = 0; i < sessionsPaperIsIn.length; i++){
	    var sid = sessionsPaperIsIn[i]; // session id
	    if(sessionIDs.indexOf(sid) != -1){
		// are in a valid session;
		return;
	    }
	}
	paperIDsNotInValidSession.push(paper._id);
    });
    return paperIDsNotInValidSession;
}

function unsatKPapers(papers, matchedSessions, k){
    var papersWithout = [];
    for(var p in papers){
	var inApproved = 0;
	for(var s in papers[p].sessions){
	    if(matchedSessions.indexOf(papers[p].sessions[s]) != -1){
		inApproved++;
		if(inApproved >=k) break;
	    }
	}
	if(inApproved < k) papersWithout.push(papers[p]);
    }
    return papersWithout;
}
