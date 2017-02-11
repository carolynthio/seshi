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
Session.set('anonymousName', "Anonymous");

Session.set("showAllGenders", true);
Session.set("showAllLeadership", true);
Session.set("showAllStudentLikes", true);
Session.set("showAllStudentDislikes", true);
Session.set("showAllRoleDistribution", true);
Session.set("showAllCommitment", true);
Session.set("studentRosterFile", {});
Session.set("manualMode", false);
Session.set("suggestedMode", true);
Session.set("classAvgGender", "");
Session.set("classAvgLeadership", "");
Session.set("constraintsList", "");
Session.set("missingFields", false);
Session.set('availability', '');
Session.set('leadership', '');
Session.set('genderbalance', '');
Session.set('studentLikes', '');
Session.set('studentDislikes', '');
Session.set('roleDistribution', '');
Session.set('commitment', '');

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
    	accept: '.session-item, .paper-item, .paper .team',// .session',
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
	    $(u.helper).addClass("dragged-session");
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

// Making the teams box draggable
// Template.team.rendered = function(){
    // $('#sessionarea .team').draggable({
    //   stop: function() {
    //     var id = $(this).attr('id');
    //     var pos = $(this).position();
    //   },
    //   // grid: [418, 112]
    //   grid: [20, 20]
    // });

//     var sortlists = $(".teamColumn").sortable({
//      connectWith : ".teamColumn",
//      items       : ".team:not(.excludeThisCss)",
//      tolerance   : 'pointer',
//      revert      : 'invalid',
//      forceHelperSize: true
//
// })
  // }

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

    // student roster
    students: function() {
      return Students.find().fetch();
      // return Session.get("students");
    },

    missingFields: function (){
      return Session.get("missingFields");
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
  },
  creatingTeams() {
    return Template.instance().creatingTeams.get();
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

Template.studentRoster.helpers({
  genderCollapsed : function(){
    return !Session.get('showAllGenders');
  },
  leadershipCollapsed : function(){
    return !Session.get('showAllLeadership');
  },
  studentLikesCollapsed : function(){
    return !Session.get('showAllStudentLikes');
  },
  studentDislikesCollapsed : function(){
    return !Session.get('showAllStudentDislikes');
  },
  roleDistributionCollapsed : function(){
    return !Session.get('showAllRoleDistribution');
  },
  commitmentCollapsed : function(){
    return !Session.get('showAllCommitment');
  },
  isLeader: function(leader) {
    return leader === "1";
  },
  isEither: function(leader) {
    return leader == "-1";
  },
  isFemale: function(gender) {
    return gender === "1";
  },
  scheduleArray: function(s) {
    var array = [s['sun8a'],s['sun9a'],s['sun10a'],s['sun11a'],s['sun12p'],s['sun1p'],s['sun2p'],s['sun3p'],s['sun4p'],s['sun5p'],s['sun6p'],s['sun7p'],s['sun8p'],
  				s['mon8a'],s['mon9a'],s['mon10a'],s['mon11a'],s['mon12p'],s['mon1p'],s['mon2p'],s['mon3p'],s['mon4p'],s['mon5p'],s['mon6p'],s['mon7p'],s['mon8p'],
  				s['tues8a'],s['tues9a'],s['tues10a'],s['tues11a'],s['tues12p'],s['tues1p'],s['tues2p'],s['tues3p'],s['tues4p'],s['tues5p'],s['tues6p'],s['tues7p'],s['tues8p'],
  				s['wed8a'],s['wed9a'],s['wed10a'],s['wed11a'],s['wed12p'],s['wed1p'],s['wed2p'],s['wed3p'],s['wed4p'],s['wed5p'],s['wed6p'],s['wed7p'],s['wed8p'],
  				s['thur8a'],s['thur9a'],s['thur10a'],s['thur11a'],s['thur12p'],s['thur1p'],s['thur2p'],s['thur3p'],s['thur4p'],s['thur5p'],s['thur6p'],s['thur7p'],s['thur8p'],
  				s['fri8a'],s['fri9a'],s['fri10a'],s['fri11a'],s['fri12p'],s['fri1p'],s['fri2p'],s['fri3p'],s['fri4p'],s['fri5p'],s['fri6p'],s['fri7p'],s['fri8p'],
  				s['sat8a'],s['sat9a'],s['sat10a'],s['sat11a'],s['sat12p'],s['sat1p'],s['sat2p'],s['sat3p'],s['sat4p'],s['sat5p'],s['sat6p'],s['sat7p'],s['sat8p']];
    return array.toString();
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

// THIS WORKS YAY
// Meteor.call('callPython', 3, "1,2,3,4,5,6,7",
//   function(error, result) {
//     if (error) {
//       console.log(error);
//     }
//     console.log("woo: " + result);
//     Session.set('teams', result); // not sure
//     console.log("teams: " + Session.get('teams')); // nothing prints
//   });

Template.studentRoster.rendered = function(){
    // make each student in roster draggable within list
  //   var sortlists = $(".student-names").sortable({
  //    connectWith : ".student-names",
  //    items       : ".student:not(.each-student)",
  //    tolerance   : 'pointer',
  //    revert      : 'invalid',
  //    forceHelperSize: true
   //
  //  });
  var studentList = $(".draggable-student").draggable({
    connectToSortable: '.student-names',
    helper: 'clone',
    revert: 'invalid',
    zIndex: 2000,
    start: function (e,u){
      console.log($(u.helper));
        $(u.helper).addClass("dragged-wide-student");
        u.helper.children(".student-attribute").removeClass("show").addClass("hidden");
        $(u.helper).attr("id", "student-" +u.helper.context.id);
  	},
    stop: function (e, ui){
      // console.log($('.student-' + ui.helper.context.id).length);
      if ($('.student-' + ui.helper.context.id).length > 0) {
        $(ui.helper.context).addClass("already-dropped-student");
        $(ui.helper.context).draggable('disable');
      }
  	}
  });
  if (Session.get("suggestedMode")) {
    $(".draggable-student").draggable('disable');
  }
};

Template.studentRoster.events({
  // Click student to display more info
  'click .student-details' : function(e) {
    toggleDetails($(e.target).parents('.student').find('.student-gender'), '.toggle-gender');
    toggleDetails($(e.target).parents('.student').find('.student-leadership'), '.toggle-leadership');
    toggleDetails($(e.target).parents('.student').find('.student-studentLikes'), '.toggle-studentLikes');
    toggleDetails($(e.target).parents('.student').find('.student-studentDislikes'), '.toggle-studentDislikes');
    toggleDetails($(e.target).parents('.student').find('.student-roleDistribution'), '.toggle-roleDistribution');
    toggleDetails($(e.target).parents('.student').find('.student-commitment'), '.toggle-commitment');
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

    'click .toggle-gender' : function(){
    toggleButton('showAllGenders', '#paper-deck .student .student-gender',
         '.toggle-gender', 'btn-info', 'btn-success');
    },

    'click .toggle-leadership' : function(){
    toggleButton('showAllLeadership', '#paper-deck .student .student-leadership',
         '.toggle-leadership', 'btn-info', 'btn-success');
    },

    'click .toggle-studentLikes' : function(){
    toggleButton('showAllStudentLikes', '#paper-deck .student .student-studentLikes',
         '.toggle-studentLikes', 'btn-info', 'btn-success');
    },

    'click .toggle-studentDislikes' : function(){
    toggleButton('showAllStudentDislikes', '#paper-deck .student .student-studentDislikes',
         '.toggle-studentDislikes', 'btn-info', 'btn-success');
    },
    'click .toggle-roleDistribution' : function(){
    toggleButton('showAllRoleDistribution', '#paper-deck .student .student-roleDistribution',
         '.toggle-roleDistribution', 'btn-info', 'btn-success');
    },
    'click .toggle-commitment' : function(){
    toggleButton('showAllCommitment', '#paper-deck .student .student-commitment',
         '.toggle-commitment', 'btn-info', 'btn-success');
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
      var id = $(e.target)[0].id;
      if (id != "myonoffswitch") {
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
      }
      // Manual and Suggested switch
      else {
        // It is manual
        if ($('#' + id+ ':checked').length == 0) {
          console.log("IT IS manual");
          Session.set("manualMode", true);
          Session.set("suggestedMode", false);
          $(".draggable-student").draggable('enable');
          $('#listOfConstraintRow').css("display", "none");
          $('#optimizeTeamsButton').html('Create Teams');
          $('.teamColumn').empty();
          $('#teamsFilter').addClass("hidden");
          $('#teamsFilter').html("Hide Details");
        }
        // It is suggested
        else {
          Session.set("suggestedMode", true);
          Session.set("manualMode", false);
          console.log("IT IS Suggested");
          $(".draggable-student").draggable('disable');
          $('#listOfConstraintRow').css("display", "block");
          $('#optimizeTeamsButton').html('Create Teams');
          $(".already-dropped-student").removeClass("already-dropped-student");
          $('.teamColumn').empty();
          $('#teamsFilter').addClass("hidden");
          $('#teamsFilter').html("Hide Details");

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

    // Tab functionality for team boxes
    'click .tabs .tab-links a' : function(e)  {
        var currentAttrValue = e.target.getAttribute('href');

        // Show/Hide Tabs
        $('.tabs ' + currentAttrValue).show().siblings().hide();

        // Change/remove current tab to active
        $(e.target).parent('li').addClass('active').siblings().removeClass('active');

        var id = $(e.target)[0].hash;

        console.log(id);
        // render calendar within tab
        $(id).fullCalendar('render');

        e.preventDefault();
    },
    'click .showSchedule' : function(e) {
      var currentAttrValue = e.target.getAttribute('href');
      if (Session.get("suggestedMode")) {
        $('.tabs ' + currentAttrValue).toggle();
      } else {
        $(currentAttrValue).toggle();
      }

      // render calendar within tab
      $(currentAttrValue).fullCalendar('render');

      e.preventDefault();
    },
    'click .showTeamDetail' : function(e) {
      var currentAttrValue = e.target.getAttribute('href');
      $('.tabs ' + currentAttrValue).toggle();

      if ($('.tabs ' + currentAttrValue).hasClass("active")) {
        $('.tabs ' + currentAttrValue).parent().children().closest(".tab1").addClass("active");
        $('.tabs ' + currentAttrValue).removeClass("active");

      } else {
        $('.tabs ' + currentAttrValue).parent().children().closest(".active").removeClass("active");
        $('.tabs ' + currentAttrValue).addClass("active");
      }

      e.preventDefault();
    },

    'click .each-student' : function(e) {
      // Only allow swaps on suggestedMode
      if (Session.get("suggestedMode")) {
        var className = $(e.target)[0].classList[0];
        $('.suggestedSwaps').removeClass('suggestedSwaps');
        if (className != "swap") {
          $('.clickedStudent').removeClass('clickedStudent');
          $(e.target).addClass('clickedStudent');

          $('.swap').css("display", "none");
          $(e.target).find('.swap').css({"display": "block", "color":"#1FBA95"});
        }
      }
    },

    'click .swap' : function(e) {
      var student = $(e.target).parent()[0];
      var name = student.getAttribute("name");
      var gender = student.getAttribute("gender");
      var leadership = student.getAttribute("leadership");
      var schedule = student.getAttribute("schedule");

      Meteor.call('swapStudents', name, gender, leadership, schedule, "'" + Session.get("teams") + "'",Session.get("constraintsList"),
        function(error, result) {
          if (error) {
            console.log(error);
          }

          // Result is a string representation of list of tuples (student dict, score)
          console.log("SWAPPING STUDENTS FUNCTION CALL: " + result);

          var resultAsString = result.split(" $ ");
          var suggestedSwaps = [];

          // Convert string representation back into an object
          for (i = 0; i < resultAsString.length-1; i++) {
            var dict_score = resultAsString[i].split(" & ");
            dict_score[0] = JSON.parse(dict_score[0]);
            dict_score[1] = parseFloat(dict_score[1]);
            suggestedSwaps.push(dict_score[0]); // Only push the student object since it is already in sorted order
          }

          console.log("SUGGESTED SWAPS!!!!!!!!!!!!!!!");
          console.log(suggestedSwaps);

          for (j = 0; j < suggestedSwaps.length; j++) {
            var listElement = 'li[name=\"' + suggestedSwaps[j].name + '\"]';
            $(listElement).addClass("suggestedSwaps");
            var gender, leadership;
            if (suggestedSwaps[j].gender == 1) {
              gender = "Female";
            } else {
              gender = "Male";
            }
            if (suggestedSwaps[j].leadership == 1) {
              leadership = "Leader";
            } else {
              leadership = "Follower";
            }
            var modalPopover =
            "<div>" +
              "<div>" + gender + "</div>" +
              "<div>" + leadership + "</div>" +
              "<hr>" +
              "<div class=\"swapButtons\">" +
                "<button class=\"swapButton\" name=\""+ suggestedSwaps[j].name +"\">Swap</button>" +
                "<button class=\"cancelSwap\">Cancel</button>" +
              "</div>" +
            "</div>";
            var modalTitle = "<div>" + suggestedSwaps[j].name + "</div>";
            $(listElement).attr("data-placement", "top");
            $(listElement).attr("data-trigger", "manual");
            $(listElement).attr("data-html", "true");
            $(listElement).attr("data-toggle", "popover");
            $(listElement).attr("data-content", modalPopover);
            $(listElement).attr("title", modalTitle);

          }
      });
    },
    'click .cancelSwap' : function(e) {
      $(".popover").popover("hide");
    },

    'click .swapButton' : function(e) {
      var swappingWith = $('.clickedStudent');
      var name = $(e.target)[0].name;
      var currentElement = $("li[name=" + name + "]");

      var swappingWithList = swappingWith.parent("ul");
      var currentElementList = currentElement.parent("ul");

      $(currentElement).remove().addBack().appendTo(swappingWithList);
      $(swappingWith).remove().addBack().appendTo(currentElementList);

      // Updating information of each team on swap - swappingWithList
      var students = [];
      $('#' + swappingWithList[0].id + ' li').each(function(i) {
        var eachStudent = {};
        eachStudent.name = this.getAttribute("name");
        eachStudent.schedule = this.getAttribute("schedule");
        eachStudent.gender = this.getAttribute("gender");
        eachStudent.leadership = this.getAttribute("leadership");
        students.push(eachStudent);
       //  console.log(this); // prints out each li
      });
      // TODO: May need to also pass in constraintsList once UI is set up
      var scoreAndSched = []
      var ulElement = swappingWithList[0].id;
      Meteor.call('updateTeams', JSON.stringify(students), Session.get("classAvgGender"),
                   Session.get("classAvgLeadership"), Session.get("constraintsList"),
        function(error, result) {
          if (error) {
            console.log(error);
          }
          scoreAndSched = result.split(" & ");

          // Updates score
          $('#' + ulElement).parents('.team').children('.team-header').children('.compatibility').text((parseFloat(scoreAndSched[0])*100).toFixed(1));

          // Update calendar
          var schedule = JSON.parse(scoreAndSched[1]);
          var eventList = []
          for (k=0; k < schedule.length; k++) {
            var startTime = 8;
            for (m=0; m < schedule[k].length; m++) {
              var eachDayArray = schedule[k];
              if (eachDayArray[m]) {
                var newEvent = {
                  title: " ",
                  start: startTime.toString() + ":00",
                  end: (startTime+1).toString() + ":00",
                  dow: [k]
                };
                eventList.push(newEvent);
              }
              startTime++;
            }
          }
          var tabId = $('#' + ulElement).parents('.tabs').children().children('.tab3')[0].id;
          $( '#' + tabId ).fullCalendar('removeEvents');
          $( '#' + tabId ).fullCalendar('addEventSource', eventList);
      });
      //////////////////////////////////////////////////////// Now with currentElementList
      students = [];
      $('#' + currentElementList[0].id + ' li').each(function(i) {
        var eachStudent = {};
        eachStudent.name = this.getAttribute("name");
        eachStudent.schedule = this.getAttribute("schedule");
        eachStudent.gender = this.getAttribute("gender");
        eachStudent.leadership = this.getAttribute("leadership");
        students.push(eachStudent);
       //  console.log(this); // prints out each li
      });
      // TODO: May need to also pass in constraintsList once UI is set up
      scoreAndSched = []
      ulElement = currentElementList[0].id;
      Meteor.call('updateTeams', JSON.stringify(students), Session.get("classAvgGender"),
                   Session.get("classAvgLeadership"), Session.get("constraintsList"),
        function(error, result) {
          if (error) {
            console.log(error);
          }

          scoreAndSched = result.split(" & ");

          // Updates score
          $('#' + ulElement).parents('.team').children('.team-header').children('.compatibility').text((parseFloat(scoreAndSched[0])*100).toFixed(1));

          // Update calendar
          var schedule = JSON.parse(scoreAndSched[1]);
          var eventList = []
          for (k=0; k < schedule.length; k++) {
            var startTime = 8;
            for (m=0; m < schedule[k].length; m++) {
              var eachDayArray = schedule[k];
              if (eachDayArray[m]) {
                var newEvent = {
                  title: " ",
                  start: startTime.toString() + ":00",
                  end: (startTime+1).toString() + ":00",
                  dow: [k]
                };
                eventList.push(newEvent);
              }
              startTime++;
            }
          }
          var tabId = $('#' + ulElement).parents('.tabs').children().children('.tab3')[0].id;
          $( '#' + tabId ).fullCalendar('removeEvents');
          $( '#' + tabId ).fullCalendar('addEventSource', eventList);
      });
    },

    'mouseenter .suggestedSwaps' : function(e) {
      $(e.target).popover("show");

    },

    'mouseleave .popover' : function(e) {
      $(e.target).popover('hide');
    },

    'mouseleave .suggestedSwaps' : function(e) {
      setTimeout(function () {
            if (!$(".popover:hover").length) {
                $(e.target).popover("hide");
            }
        }, 500);
    },

    'mouseenter .constraint' : function(e) {
      $(e.target).popover("show");
    },

    'mouseleave .constraint' : function(e) {
      $(e.target).popover("hide");
    },

    // collapse each team
    'click .team-header' : function(e) {
      $(e.target).next(".tabs").slideToggle();
      $('.team-title').blur();
    },

    'click .team-title' : function(e) {
      var editable = $(e.target);
      setTimeout(function() {
        editable.trigger('focus');
      }, 200);
    }
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

/* Navigation Bar */
Template.navBar.events({
  'click .sidebar' : function (){
    $(function () {
        var SideBAR;
        SideBAR = (function () {
            function SideBAR() {}

            SideBAR.prototype.expandMyMenu = function () {
                return $("nav.sidebar").removeClass("sidebar-menu-collapsed").addClass("sidebar-menu-expanded");
            };

            SideBAR.prototype.collapseMyMenu = function () {
                return $("nav.sidebar").removeClass("sidebar-menu-expanded").addClass("sidebar-menu-collapsed");
            };

            SideBAR.prototype.showMenuTexts = function () {
                return $("nav.sidebar ul a span.expanded-element").show();
            };

            SideBAR.prototype.hideMenuTexts = function () {
                return $("nav.sidebar ul a span.expanded-element").hide();
            };

            SideBAR.prototype.showActiveSubMenu = function () {
                $("li.active ul.level2").show();
                return $("li.active a.expandable").css({
                    width: "100%"
                });
            };

            SideBAR.prototype.hideActiveSubMenu = function () {
                return $("li.active ul.level2").hide();
            };

            SideBAR.prototype.adjustPaddingOnExpand = function () {
                $("ul.level1 li a.expandable").css({
                    padding: "1px 4px 4px 0px"
                });
                return $("ul.level1 li.active a.expandable").css({
                    padding: "1px 4px 4px 4px"
                });
            };

            SideBAR.prototype.resetOriginalPaddingOnCollapse = function () {
                $("ul.nbs-level1 li a.expandable").css({
                    padding: "4px 4px 4px 0px"
                });
                return $("ul.level1 li.active a.expandable").css({
                    padding: "4px"
                });
            };

            SideBAR.prototype.ignite = function () {
                return (function (instance) {
                    return $("#justify-icon").click(function (e) {
                        if ($(this).parent("nav.sidebar").hasClass("sidebar-menu-collapsed")) {
                            instance.adjustPaddingOnExpand();
                            instance.expandMyMenu();
                            instance.showMenuTexts();
                            instance.showActiveSubMenu();
                            $(this).css({
                                color: "#000"
                            });
                        } else if ($(this).parent("nav.sidebar").hasClass("sidebar-menu-expanded")) {
                            instance.resetOriginalPaddingOnCollapse();
                            instance.collapseMyMenu();
                            instance.hideMenuTexts();
                            instance.hideActiveSubMenu();
                            $(this).css({
                                color: "#FFF"
                            });
                        }
                        return false;
                    });
                })(this);
            };

            return SideBAR;

        })();
        return (new SideBAR).ignite();
    });
  }
});
Template.SessionBuilder.onCreated( () => {
  Template.instance().creatingTeams = new ReactiveVar( true );
});

Template.constraints.onCreated(function() {
  var parentInstance = this.view.parentView.templateInstance();
  this.creatingTeams = parentInstance.creatingTeams;
})

Template.constraints.events({
  'click #constraintsButton': function() {
		Modal.show('constraintModalTemplate');

    // Availability constraint
		if(Session.get('availability') == ''){
			var new_row = document.createElement('tr');
			new_row.setAttribute("class", "clickable-row");

			// console.log(childSnapshot.key);
			var table = document.getElementById("remainingConstraints");
			var name_cell = document.createElement('td');
			name_cell.setAttribute("id", 'availability');
			name_cell.appendChild(document.createTextNode('availability' + ": "));
			new_row.appendChild(name_cell);
			table.appendChild(new_row);
			var constraintModifier = document.getElementById("constrainttochange");
			constrainttitle.innerHTML = "";
			var add_button = document.getElementById("add_button");
			add_button.style.visibility = "hidden" ;
			var remove_button = document.getElementById("removeButton");
			remove_button.style.visibility = "hidden";

		}
		else{
			var constraintvalue = Session.get('availability');
			var table = document.getElementById("currentconstraints");
      var weightsTable = document.getElementById("weightsOfCurrentConstraints");
			var new_row = document.createElement('tr');
			new_row.setAttribute("class", "clickable-cons");

			// console.log(childSnapshot.key);
			var name_cell = document.createElement('td');
			name_cell.setAttribute("id", 'availability');
			name_cell.appendChild(document.createTextNode('availability' + ": " + constraintvalue));
			new_row.appendChild(name_cell);
			table.appendChild(new_row);

      // Adding the weights to the current constraint
      var weight_row = document.createElement('tr');
      var weightValue = $('#constraints-td').children('[constraint="availability"]')[0].getAttribute("weight");
      weight_row.setAttribute("class", "weights");
      var input_cell = document.createElement('input');
      input_cell.setAttribute("type", "text");
      input_cell.setAttribute("name", "availability");
      input_cell.setAttribute("style", "height: 20px;");
      input_cell.setAttribute("value", weightValue);
      weight_row.appendChild(input_cell);
      weightsTable.appendChild(weight_row);

		}

    // leadership constraint
		if(Session.get('leadership') == ''){
			var new_row = document.createElement('tr');
			new_row.setAttribute("class", "clickable-row");

			var table = document.getElementById("remainingConstraints");
			var name_cell = document.createElement('td');
			name_cell.setAttribute("id", 'leadership');
			name_cell.appendChild(document.createTextNode('leadership' + ": "));
			new_row.appendChild(name_cell);
			table.appendChild(new_row);
			var constraintModifier = document.getElementById("constrainttochange");
			constrainttitle.innerHTML = "";
			var add_button = document.getElementById("add_button");
			add_button.style.visibility = "hidden" ;
			var remove_button = document.getElementById("removeButton");
			remove_button.style.visibility = "hidden";

		}
		else{
			var constraintvalue = Session.get('leadership');
			var table = document.getElementById("currentconstraints");
      var weightsTable = document.getElementById("weightsOfCurrentConstraints");
			var new_row = document.createElement('tr');
			new_row.setAttribute("class", "clickable-cons");

			// console.log(childSnapshot.key);
			var name_cell = document.createElement('td');
			name_cell.setAttribute("id", 'leadership');
			name_cell.appendChild(document.createTextNode('leadership' + ": " + constraintvalue));
			new_row.appendChild(name_cell);
			table.appendChild(new_row);

      // Adding the weights to the current constraint
      var weight_row = document.createElement('tr');
      var weightValue = $('#constraints-td').children('[constraint="leadership"]')[0].getAttribute("weight");
      weight_row.setAttribute("class", "weights");
      var input_cell = document.createElement('input');
      input_cell.setAttribute("type", "text");
      input_cell.setAttribute("name", "availability");
      input_cell.setAttribute("style", "height: 20px;");
      input_cell.setAttribute("value", weightValue);
      weight_row.appendChild(input_cell);
      weightsTable.appendChild(weight_row);

		}

    // gender balance constraint
		if(Session.get('genderbalance') == ''){
			var new_row = document.createElement('tr');
			new_row.setAttribute("class", "clickable-row");

			// console.log(childSnapshot.key);
			var table = document.getElementById("remainingConstraints");
			var name_cell = document.createElement('td');
			name_cell.setAttribute("id", 'genderbalance');
			name_cell.appendChild(document.createTextNode('genderbalance' + ": "));
			new_row.appendChild(name_cell);
			table.appendChild(new_row);
			var constraintModifier = document.getElementById("constrainttochange");
			constrainttitle.innerHTML = "";
			var add_button = document.getElementById("add_button");
			add_button.style.visibility = "hidden" ;
			var remove_button = document.getElementById("removeButton");
			remove_button.style.visibility = "hidden";

		}
		else{
			var constraintvalue = Session.get('genderbalance');
			var table = document.getElementById("currentconstraints");
      var weightsTable = document.getElementById("weightsOfCurrentConstraints");
			var new_row = document.createElement('tr');
			new_row.setAttribute("class", "clickable-cons");

			// console.log(childSnapshot.key);
			var name_cell = document.createElement('td');
			name_cell.setAttribute("id", 'genderbalance');
			name_cell.appendChild(document.createTextNode('genderbalance' + ": " + constraintvalue));
			new_row.appendChild(name_cell);
			table.appendChild(new_row);

      // Adding the weights to the current constraint
      var weight_row = document.createElement('tr');
      var weightValue = $('#constraints-td').children('[constraint="genderbalance"]')[0].getAttribute("weight");
      weight_row.setAttribute("class", "weights");
      var input_cell = document.createElement('input');
      input_cell.setAttribute("type", "text");
      input_cell.setAttribute("name", "availability");
      input_cell.setAttribute("style", "height: 20px;");
      input_cell.setAttribute("value", weightValue);
      weight_row.appendChild(input_cell);
      weightsTable.appendChild(weight_row);
		}

    // Student likes constraintvalue
    if(Session.get('studentLikes') == ''){
			var new_row = document.createElement('tr');
			new_row.setAttribute("class", "clickable-row");

			// console.log(childSnapshot.key);
			var table = document.getElementById("remainingConstraints");
			var name_cell = document.createElement('td');
			name_cell.setAttribute("id", 'studentLikes');
			name_cell.appendChild(document.createTextNode('studentLikes' + ": "));
			new_row.appendChild(name_cell);
			table.appendChild(new_row);
			var constraintModifier = document.getElementById("constrainttochange");
			constrainttitle.innerHTML = "";
			var add_button = document.getElementById("add_button");
			add_button.style.visibility = "hidden" ;
			var remove_button = document.getElementById("removeButton");
			remove_button.style.visibility = "hidden";

		}
		else{
			var constraintvalue = Session.get('studentLikes');
			var table = document.getElementById("currentconstraints");
      var weightsTable = document.getElementById("weightsOfCurrentConstraints");
			var new_row = document.createElement('tr');
			new_row.setAttribute("class", "clickable-cons");

			// console.log(childSnapshot.key);
			var name_cell = document.createElement('td');
			name_cell.setAttribute("id", 'studentLikes');
			name_cell.appendChild(document.createTextNode('studentLikes' + ": " + constraintvalue));
			new_row.appendChild(name_cell);
			table.appendChild(new_row);

      // Adding the weights to the current constraint
      var weight_row = document.createElement('tr');
      var weightValue = $('#constraints-td').children('[constraint="studentLikes"]')[0].getAttribute("weight");
      weight_row.setAttribute("class", "weights");
      var input_cell = document.createElement('input');
      input_cell.setAttribute("type", "text");
      input_cell.setAttribute("name", "availability");
      input_cell.setAttribute("style", "height: 20px;");
      input_cell.setAttribute("value", weightValue);
      weight_row.appendChild(input_cell);
      weightsTable.appendChild(weight_row);
		}

    // Student dislikes constraintvalue
    if(Session.get('studentDislikes') == ''){
      var new_row = document.createElement('tr');
      new_row.setAttribute("class", "clickable-row");

      // console.log(childSnapshot.key);
      var table = document.getElementById("remainingConstraints");
      var name_cell = document.createElement('td');
      name_cell.setAttribute("id", 'studentDislikes');
      name_cell.appendChild(document.createTextNode('studentDislikes' + ": "));
      new_row.appendChild(name_cell);
      table.appendChild(new_row);
      var constraintModifier = document.getElementById("constrainttochange");
      constrainttitle.innerHTML = "";
      var add_button = document.getElementById("add_button");
      add_button.style.visibility = "hidden" ;
      var remove_button = document.getElementById("removeButton");
      remove_button.style.visibility = "hidden";

    }
    else{
      var constraintvalue = Session.get('studentDislikes');
      var table = document.getElementById("currentconstraints");
      var weightsTable = document.getElementById("weightsOfCurrentConstraints");
      var new_row = document.createElement('tr');
      new_row.setAttribute("class", "clickable-cons");

      // console.log(childSnapshot.key);
      var name_cell = document.createElement('td');
      name_cell.setAttribute("id", 'studentDislikes');
      name_cell.appendChild(document.createTextNode('studentDislikes' + ": " + constraintvalue));
      new_row.appendChild(name_cell);
      table.appendChild(new_row);

      // Adding the weights to the current constraint
      var weight_row = document.createElement('tr');
      var weightValue = $('#constraints-td').children('[constraint="studentDislikes"]')[0].getAttribute("weight");
      weight_row.setAttribute("class", "weights");
      var input_cell = document.createElement('input');
      input_cell.setAttribute("type", "text");
      input_cell.setAttribute("name", "availability");
      input_cell.setAttribute("style", "height: 20px;");
      input_cell.setAttribute("value", weightValue);
      weight_row.appendChild(input_cell);
      weightsTable.appendChild(weight_row);
    }

    // Student dislikes constraintvalue
    if(Session.get('roleDistribution') == ''){
      var new_row = document.createElement('tr');
      new_row.setAttribute("class", "clickable-row");

      // console.log(childSnapshot.key);
      var table = document.getElementById("remainingConstraints");
      var name_cell = document.createElement('td');
      name_cell.setAttribute("id", 'roleDistribution');
      name_cell.appendChild(document.createTextNode('roleDistribution' + ": "));
      new_row.appendChild(name_cell);
      table.appendChild(new_row);
      var constraintModifier = document.getElementById("constrainttochange");
      constrainttitle.innerHTML = "";
      var add_button = document.getElementById("add_button");
      add_button.style.visibility = "hidden" ;
      var remove_button = document.getElementById("removeButton");
      remove_button.style.visibility = "hidden";

    }
    else{
      var constraintvalue = Session.get('roleDistribution');
      var table = document.getElementById("currentconstraints");
      var weightsTable = document.getElementById("weightsOfCurrentConstraints");
      var new_row = document.createElement('tr');
      new_row.setAttribute("class", "clickable-cons");

      // console.log(childSnapshot.key);
      var name_cell = document.createElement('td');
      name_cell.setAttribute("id", 'roleDistribution');
      name_cell.appendChild(document.createTextNode('roleDistribution' + ": " + constraintvalue));
      new_row.appendChild(name_cell);
      table.appendChild(new_row);

      // Adding the weights to the current constraint
      var weight_row = document.createElement('tr');
      var weightValue = $('#constraints-td').children('[constraint="roleDistribution"]')[0].getAttribute("weight");
      weight_row.setAttribute("class", "weights");
      var input_cell = document.createElement('input');
      input_cell.setAttribute("type", "text");
      input_cell.setAttribute("name", "availability");
      input_cell.setAttribute("style", "height: 20px;");
      input_cell.setAttribute("value", weightValue);
      weight_row.appendChild(input_cell);
      weightsTable.appendChild(weight_row);
    }

    // Set total weight
    var weightsTable = document.getElementById("weightsOfCurrentConstraints");
    // console.log(weightsTable);
    document.getElementById("totalWeight").value = 0;
    for (var i = 0, row; row = weightsTable.rows[i]; i++) {
      if (row.children[0].value.length != 0) {
        document.getElementById("totalWeight").value = parseFloat(document.getElementById("totalWeight").value)
                                                            + parseFloat(row.children[0].value);
      }
    }

	},
  'click #teamsFilter' : function(event, template) {
    if (event.target.innerHTML == "Show Team Details") {
      $('.li-attribute').removeClass("hidden");
      $('#teamsFilter').html("Hide Details");
    } else {
      $('.li-attribute').addClass("hidden");
      $('#teamsFilter').html("Show Team Details");
    }
  },
  'click #optimizeTeamsButton': function(event, template) {
    $('.teamColumn').empty(); // Clear contents of teams
    template.creatingTeams.set( false );
    Session.set("missingFields", false);
    if (($('#numStudentsLo').val() != "") && ($('#numStudentsHi').val() != "") &&
      (Students.find({"name": {$exists: true, $ne: ""}}).count() != 0) && Session.get("suggestedMode")) {

      var constraintList = [];
      $('#constraints-td .constraint-tag').each(function(i) {
        var eachConstraint = [];
        eachConstraint.push(this.getAttribute("constraint"));
        eachConstraint.push(this.getAttribute("value"));
        eachConstraint.push(this.getAttribute("weight"));
        constraintList.push(eachConstraint);
      });

      var listOfStudents = JSON.stringify(Students.find({"name": {$exists: true, $ne: ""}}).fetch());
      var constraints = JSON.stringify(constraintList);
      console.log(constraints);
      // Meteor.call('callPython', $('#numStudentsLo').val(), studentNames,
      Meteor.call('createTeams', $('#numStudentsLo').val(), $('#numStudentsHi').val(),listOfStudents, constraints,
        function(error, result) {
          if (error) {
            console.log(error);
          }
          template.creatingTeams.set( true );
          console.log("woo: " + result);
          Session.set("teams", result);
          var listOfJsonStrings = result.split(" $ ");
          var listOfTeams = [];

          // Convert string representation back into an object
          for (i = 0; i < listOfJsonStrings.length-1; i++) {
            listOfTeams.push(JSON.parse(listOfJsonStrings[i]));
          }
          Session.set("classAvgGender", listOfTeams[0].class_avg_gender);
          Session.set("classAvgLeadership", listOfTeams[0].class_avg_leadership);
          Session.set("constraintsList", constraints);

          for (i=0; i < listOfTeams.length; i++) {
            var team =
              "<div class=\"team\" id=\"team" + i + "\">" +
                "<div class=\"team-header\">" +
                  "<div class=\"team-title\" contentEditable=\"true\" style=\"float: left\">Team "+ i + "</div>" +
                  "<div class=\"compatibility\">" + (parseFloat(listOfTeams[i].score) * 100).toFixed(1) + "%</div>" +
                  "<i href=\"#tab3_" + i +"\" style=\"margin-left: 5px\" class=\"fa fa-calendar showSchedule\" aria-hidden=\"true\"></i>" +
                  // "<i href=\"#tab2_" + i + "\" style=\"margin-left: 5px\" class=\"fa fa-info-circle showTeamDetail\" aria-hidden=\"true\"></i>" +
                  // "</div>" +
                "</div>" +
                "<div class=\"tabs\">" +
                  // "<ul class=\"tab-links\">" +
                  //     "<li class=\"active\"><a href=\"#tab1_" + i +"\">Names</a></li>" +
                  //     // "<li><a href=\"#tab2_" + i +"\">General</a></li>" +
                  //     "<li><a href=\"#tab3_" + i +"\">Availability</a></li>" +
                  // "</ul>" +

                  "<div class=\"tab-content\">" +
                      "<div id=\"tab1_" + i +"\" class=\"tab active tab1\">" +
                          "<ul class=\"student-names each-team\" id=\"studentNames" + i + "\">" +

                          "</ul>" +
                      "</div>" +

                      "<div id=\"tab2_" + i +"\" class=\"tab tab2\">" +

                      "</div>" +

                      "<div id=\"tab3_" + i +"\" class=\"tab tab3\">" +
                      "</div>" +
                  "</div>" +
                "</div>" +
              "</div>";


              // alternate between columns
              if (i%2 == 0) {
                $('#teamColumn1').append(team);
              } else {
                $('#teamColumn2').append(team);
              }

              // Team information
              var studentTable = document.createElement('table');
              for (j = 0; j < listOfTeams[i].member.length; j++) {
                var student = listOfTeams[i].member[j];
                var studentRow = document.createElement('tr');
                studentRow.setAttribute("class", "attributeRow");
                var studentName = document.createElement('td');
                studentName.innerHTML = student.name;
                studentName.setAttribute("class", "studentTableAttribute tableName");
                studentRow.appendChild(studentName);

                var studentGender = document.createElement('td');
                studentGender.setAttribute("class", "studentTableAttribute tableGender");

                if (student.gender == 1) {
                  studentGender.innerHTML = "Female";
                } else {
                  studentGender.innerHTML = "Male";
                }
                studentRow.appendChild(studentGender);

                var studentLeadership = document.createElement('td');
                studentLeadership.setAttribute("class", "studentTableAttribute tableLeadership");

                if (student.leadership == 1) {
                  studentLeadership.innerHTML = "Leader";
                } else if (student.leadership == -1) {
                  studentLeadership.innerHTML = "Either";
                }else {
                  studentLeadership.innerHTML = "Prefer not to lead";
                }
                studentRow.appendChild(studentLeadership);

                var studentRoles = document.createElement('td');
                studentRoles.setAttribute("class", "studentTableAttribute tableRoles");
                studentRoles.innerHTML = student.role;
                studentRow.appendChild(studentRoles);

                studentTable.appendChild(studentRow);
              }
              $('#tab2_' + i).append(studentTable);


              // TODO: Add if statement about constraintList
              console.log("THIS IS THE CURRENT TEAM ****************");
              var currentTeam = JSON.stringify(listOfTeams[i]);

              Meteor.call("checkConstraintViolation", currentTeam, constraints, i,
              function(error, result) {
                if (error) {
                  console.log(error);
                }

                constraintsViolated = result.split(",");
                // Result is not null
                if (constraintsViolated[0] != "") {
                  var index = constraintsViolated[constraintsViolated.length-1];
                  var constraintViolation = "<i style=\"color:#FFCC00; margin-left:5px;\" class=\"constraint constraint-" + index + " fa fa-exclamation-triangle\" aria-hidden=\"true\"></i>";
                  var teamHeader = '#team' + index + ' .team-header';
                  $(teamHeader).append(constraintViolation);
                  var constraintIcon = ".constraint-"+index;
                  var modalPopover = "<div>";
                  for(i = 0; i < constraintsViolated.length-1; i++) {
                    modalPopover += "<div style=\"color:black\">" + constraintsViolated[i] + "</div>"
                  }
                  modalPopover += "</div>";
                  var modalTitle = "<div style=\"color:black\">Constraints Violated</div>";
                  $(constraintIcon).attr("data-placement", "top");
                  $(constraintIcon).attr("data-trigger", "manual");
                  $(constraintIcon).attr("data-html", "true");
                  $(constraintIcon).attr("data-toggle", "popover");
                  $(constraintIcon).attr("data-content", modalPopover);
                  $(constraintIcon).attr("title", modalTitle);
                }

              });


              // Append student to each team
              for (j=0; j < listOfTeams[i].member.length; j++) {
                var member = listOfTeams[i].member[j];
                var gender;
                var leadership;
                if (member.gender == 1) {
                  gender = "Female";
                } else {
                  gender = "Male";
                }

                if (member.leadership == 1) {
                  leadership = "Leader";
                } else if (member.leadership == -1) {
                  leadership = "Either";
                } else {
                  leadership = "Prefer not to lead";
                }

                var student =
                  "<li class=\"each-student student\"" +
                  "name=\""+ member.name +"\"" +
                  "gender=\""+ member.gender +"\"" +
                  "leadership=\""+ member.leadership +"\"" +
                  "schedule=\""+ member.student_schedule.toString() +"\"" +
                  "role=\"" + member.role + "\">" +
                    // finalArray[i][j] +
                    listOfTeams[i].member[j].name +
                    "<div style=\"float: right; font-size:10px;\" class=\"li-attribute\">"+ gender + " -- " + leadership + " -- " + member.role +"</div>" +
                    "<i class=\"swap fa fa-exchange\" aria-hidden=\"true\" style=\"float:right;margin-right: 10px;margin-top: 3px;\"></i>" +
                  "</li>";

                var studentNames = "#studentNames" + i
                $(studentNames).append(student);
              }

              // Creating events to calendar
              var eventList = []
              for (k=0; k < listOfTeams[i].overlappingSchedule.length; k++) {
                var startTime = 8;
                for (m=0; m < listOfTeams[i].overlappingSchedule[k].length; m++) {
                  var eachDayArray = listOfTeams[i].overlappingSchedule[k];
                  if (eachDayArray[m]) {
                    var newEvent = {
                      title: " ",
                      start: startTime.toString() + ":00",
                      end: (startTime+1).toString() + ":00",
                      dow: [k]
                    };
                    eventList.push(newEvent);
                  }
                  startTime++;
                }
              }

              // Create calendar for each tab
              $( '#tab3_'+i ).fullCalendar({
                    defaultView: 'agendaWeek',
                    aspectRatio: 2,
                    header : false,
                    allDaySlot: false,
                    columnFormat: 'ddd',
                    slotDuration: "00:60:00",
                    displayEventTime: false,
                    minTime: "08:00:00", //8am
                    maxTime: "21:00:00", //9pm
                    events: eventList
              });

          }

          // each student in the team
          var sortlists = $(".student-names").sortable({
           connectWith : ".student-names",
           items       : ".student",
           tolerance   : 'pointer',
           revert      : 'invalid',
           forceHelperSize: true,
           placeholder: "placeholder",
           forcePlaceholderSize: true,
           // Updating information of each team on drop
           update: function () {
             var ul = this;
             console.log(this); // prints out each ul
             var students = [];
             $(this).parents().children().closest('.tab2').find('table').empty();
             $('#' + this.id + ' li').each(function(i) {
               var eachStudent = {};
               eachStudent.name = this.getAttribute("name");
               eachStudent.schedule = this.getAttribute("schedule");
               eachStudent.student_schedule = this.getAttribute("schedule").split(",").map(function(item) {
                                                                                              return parseInt(item, 10);
                                                                                            }); // for checkConstraintViolation
               eachStudent.gender = this.getAttribute("gender");
               eachStudent.leadership = this.getAttribute("leadership");

               var infoTable = $(ul).parents().children().closest('.tab2').find('table');

               // Updating information tab2
               var studentRow = document.createElement('tr');
               studentRow.setAttribute("class", "attributeRow");
               var studentName = document.createElement('td');
               studentName.innerHTML = this.getAttribute("name");
               studentName.setAttribute("class", "studentTableAttribute tableName");
               studentRow.appendChild(studentName);

               var studentGender = document.createElement('td');
               studentGender.setAttribute("class", "studentTableAttribute tableGender");

               if (this.getAttribute("gender") == 1) {
                 studentGender.innerHTML = "Female";
               } else {
                 studentGender.innerHTML = "Male";
               }
               studentRow.appendChild(studentGender);

               var studentLeadership = document.createElement('td');
               studentLeadership.setAttribute("class", "studentTableAttribute tableLeadership");

               if (this.getAttribute("leadership") == 1) {
                 studentLeadership.innerHTML = "Leader";
               } else if (this.getAttribute("leadership") == -1){
                 studentLeadership.innerHTML = "Either";
               }else {
                 studentLeadership.innerHTML = "Prefer not to lead";
               }
               studentRow.appendChild(studentLeadership);

               var studentRoles = document.createElement('td');
               studentRoles.setAttribute("class", "studentTableAttribute tableRoles");
               studentRoles.innerHTML = this.getAttribute("role");
               studentRow.appendChild(studentRoles);

               infoTable.append(studentRow);

               students.push(eachStudent);
              //  console.log(this); // prints out each li
             });
             var team = {}
             team.member = students;
             team.class_avg_gender = Session.get("classAvgGender");
             team.class_avg_leadership = Session.get("classAvgLeadership");
            //  team.constraintsList = []; //TODO: may need to fix
            //  team.overlappingSchedule = []; //TODO: may need to fix
             var scoreAndSched = []
             var ulElement = this.id;
             Meteor.call('updateTeams', JSON.stringify(students), Session.get("classAvgGender"),
                          Session.get("classAvgLeadership"), Session.get("constraintsList"),
               function(error, result) {
                 if (error) {
                   console.log(error);
                 }

                 scoreAndSched = result.split(" & ");
                 console.log(scoreAndSched);

                 // Updates score
                 $('#' + ulElement).parents('.team').children('.team-header').children('.compatibility').text((parseFloat(scoreAndSched[0])*100).toFixed(1) + "%");

                 // Update calendar
                 var schedule = JSON.parse(scoreAndSched[1]);
                 var eventList = []
                 for (k=0; k < schedule.length; k++) {
                   var startTime = 8;
                   for (m=0; m < schedule[k].length; m++) {
                     var eachDayArray = schedule[k];
                     if (eachDayArray[m]) {
                       var newEvent = {
                         title: " ",
                         start: startTime.toString() + ":00",
                         end: (startTime+1).toString() + ":00",
                         dow: [k]
                       };
                       eventList.push(newEvent);
                     }
                     startTime++;
                   }
                 }
                 var tabId = $('#' + ulElement).parents('.tabs').children().children('.tab3')[0].id;
                 $( '#' + tabId ).fullCalendar('removeEvents');
                 $( '#' + tabId ).fullCalendar('addEventSource', eventList);
             });
              // Meteor.call("checkConstraintViolation", JSON.stringify(team), Session.get("constraintsList"), ulElement.slice(-1), function(error, result) {
              //   if (error) {
              //     console.log(error);
              //   }
              //   $('#' + ulElement).parents().children('.team-header').children().closest(".constraint").remove();
              //   constraintsViolated = result.split(",");
              //   console.log(constraintsViolated);
              //   // Result is not null
              //   if (constraintsViolated[0] != "") {
              //     var index = constraintsViolated[constraintsViolated.length-1];
              //     var constraintViolation = "<i style=\"color:#FFCC00; margin-left:5px;\" class=\"constraint constraint-" + index + " fa fa-exclamation-triangle\" aria-hidden=\"true\"></i>";
              //     var teamHeader = '#team' + index + ' .team-header';
              //     $(teamHeader).append(constraintViolation);
              //     var constraintIcon = ".constraint-"+index;
              //     var modalPopover = "<div>";
              //     for(i = 0; i < constraintsViolated.length-1; i++) {
              //       modalPopover += "<div style=\"color:black\">" + constraintsViolated[i] + "</div>"
              //     }
              //     modalPopover += "</div>";
              //     var modalTitle = "<div style=\"color:black\">Constraints Violated</div>";
              //     $(constraintIcon).attr("data-placement", "top");
              //     $(constraintIcon).attr("data-trigger", "manual");
              //     $(constraintIcon).attr("data-html", "true");
              //     $(constraintIcon).attr("data-toggle", "popover");
              //     $(constraintIcon).attr("data-content", modalPopover);
              //     $(constraintIcon).attr("title", modalTitle);
              //   }
              //
              // });

           }

         });

         var dropped = $(".student-names").droppable({
            drop : function(event,ui) {
              // may change later to just be objects
                 ui.helper.children(".student-details").hide();
                 ui.helper.children(".student-attribute").removeClass("show").addClass("hidden");
                 ui.helper.css("height", "22px");
            }
         });

        });
        // console.log("outside meteor.call: " + Session.get('teams'));
        $('#teamsFilter').removeClass("hidden");

    } // End if -- Manual Mode
    else if(($('#numStudentsLo').val() != "")  &&
      (Students.find({"name": {$exists: true, $ne: ""}}).count() != 0) && Session.get("manualMode")){
        template.creatingTeams.set( true );
      var numberOfStudents = Students.find({"name": {$exists: true, $ne: ""}}).count();
      var numberOfTeams = Math.ceil(numberOfStudents / $('#numStudentsLo').val());
      for (i=0; i < numberOfTeams; i++) {
        var team =
          "<div class=\"team\" id=\"team" + i + "\">" +
            "<div class=\"team-header\">" +
              "<div class=\"team-title\" contentEditable=\"true\" style=\"float: left\">Team "+ i + "</div>" +
              "<div class=\"compatibility\"></div>" +
              "<i href=\"#calendar_" + i +"\" style=\"margin-left: 5px\" class=\"fa fa-calendar showSchedule\" aria-hidden=\"true\"></i>" +
            "</div>" +
            "<div>" +
            // "<div style=\"min-height:40px;\" class=\"student-names each-team\" id=\"studentNames" + i + "\">" +
              "<ul style=\"min-height:40px; margin-bottom:0;\" class=\"student-names each-team\" id=\"studentNames" + i + "\">" +

              "</ul>" +
            "</div>" +
            "<div id=\"calendar_" + i + "\" class=\"calendar\" hidden>" +
            "</div>"  +

          "</div>";

          // alternate between columns
          if (i%2 == 0) {
            $('#teamColumn1').append(team);
          } else {
            $('#teamColumn2').append(team);
          }

          $( '#calendar_'+i ).fullCalendar({
                defaultView: 'agendaWeek',
                aspectRatio: 2,
                header : false,
                allDaySlot: false,
                columnFormat: 'ddd',
                slotDuration: "00:60:00",
                displayEventTime: false,
                minTime: "08:00:00", //8am
                maxTime: "21:00:00" //9pm
          });


      }

     // On drop change from div to list item
     var dropped = $(".student-names").droppable({
        accept: '.draggable-student',
        hoverClass: 'ui-state-hover',
        greedy: true,
        tolerance: 'pointer',
        drop : function(event,ui) {
          if(ui.draggable[0].nodeName != "LI") {
            if($('.' + ui.draggable[0].id).length > 0) {
              console.log("This element already exists in a team");
              ui.draggable.remove();
            } else {
              var leadership;
              var gender;
              if (ui.helper.children(".student-gender").text().trim() == "Female") {
                gender = 1;
              } else {
                gender = 0;
              }
              if (ui.helper.children(".student-leadership").text().trim() == "Leader") {
                leadership = 1
              } else if (ui.helper.children(".student-leadership").text().trim() == "Can play either role") {
                leadership = -1;
              } else {
                leadership = 0;
              }
              var leaderText;
              if (ui.helper.children(".student-leadership").text().trim() == "Can play either role") {
                leaderText = "Either";
              } else {
                leaderText = ui.helper.children(".student-leadership").text().trim();
              }
              var listStudent = "<li class=\"each-student student dragged-student "+ ui.helper.context.id +"\"" +
              "name=\""+ ui.helper.children(".student-name").text().trim() +"\"" +
              "gender=\""+ gender +"\"" +
              "leadership=\""+ leadership +"\"" +
              "role=\"" + ui.helper.children(".student-roleDistribution").text().trim() +"\"" +
              "schedule=\""+ ui.helper.children(".student-schedule").text().trim() +"\">" +
                ui.helper.children(".student-name").text().trim() +
                "<div style=\"float: right; font-size:10px;\" class=\"li-attribute\">"+ ui.helper.children(".student-gender").text().trim() + " -- " + leaderText + " -- " + ui.helper.children(".student-roleDistribution").text().trim() +"</div>" +
              "</li>";
              $(ui.helper).replaceWith(listStudent);
            }
          }
        },
        accept: function (event, ui) {
          return true;
        }
     });

     // each student in the team
     var sortlists = $(".student-names").sortable({
      connectWith : ".each-team",
      items       : ".student",
      tolerance   : 'pointer',
      revert      : 'invalid',
      // forceHelperSize: true,
      stack: ".student-names",
      // placeholder: "placeholder"
      update: function () {
        var ul = this;
        console.log(this); // prints out each ul
        var students = [];
        $('#' + this.id + ' li').each(function(i) {
          var eachStudent = {};
          eachStudent.name = this.getAttribute("name");
          eachStudent.schedule = this.getAttribute("schedule");
          eachStudent.gender = this.getAttribute("gender");
          eachStudent.leadership = this.getAttribute("leadership");
          students.push(eachStudent);

        });
        var scoreAndSched = [];
        var ul_id = this.id;
        Meteor.call('updateTeams', JSON.stringify(students), 0, 0, "",
          function(error, result) {
            if (error) {
              console.log(error);
            }

            scoreAndSched = result.split(" & ");

            // Update calendar
            var schedule = JSON.parse(scoreAndSched[1]);
            var eventList = []
            for (k=0; k < schedule.length; k++) {
              var startTime = 8;
              for (m=0; m < schedule[k].length; m++) {
                var eachDayArray = schedule[k];
                if (eachDayArray[m]) {
                  var newEvent = {
                    title: " ",
                    start: startTime.toString() + ":00",
                    end: (startTime+1).toString() + ":00",
                    dow: [k]
                  };
                  eventList.push(newEvent);
                }
                startTime++;
              }
            }
            var calId = $('#' + ul_id).parents().children('.calendar')[0].id;
            $( '#' + calId ).fullCalendar('removeEvents');
            $( '#' + calId ).fullCalendar('addEventSource', eventList);
          });
      }


    });

    $('#teamsFilter').removeClass("hidden");

    }
    else {
      template.creatingTeams.set(true); // Dont show creating team spinner
      Session.set("missingFields", true);
      console.log("Please enter number of students");
    }

    var sortlists = $(".teamColumn").sortable({
     connectWith : ".teamColumn",
     items       : ".team:not(.excludeThisCss)",
     tolerance   : 'pointer',
     revert      : 'invalid',
     forceHelperSize: true

    });

    // Update text on button
    if (Session.get("manualMode")) {
      $('#optimizeTeamsButton').html('Reset Teams');
      $(".draggable-student").draggable('enable');
      $(".already-dropped-student").removeClass("already-dropped-student");
    } else {
      $('#optimizeTeamsButton').html('Update Teams');
    }
  },

  'click .remove' : function(e) {
    var row_id = e.target.id;
  	Session.set(row_id, '');
  	$(e.target).parents("span:first").remove();
},

// 'click .glyphicon-remove-sign' : function(e) {
// 	var row_id = e.target.id;
// 	Session.set(row_id, '');
// 	$(e.target).parents("span:first").remove();
//
// }
});

Template.constraintModalTemplate.events({
	'click #modelclose' : function() {
		Modal.hide('constraintModalTemplate');
	},

	'click #cancelButton' : function() {
		Modal.hide('constraintModalTemplate');
	},

	'click #add_button' : function() {
		var constrainttitle = document.getElementById("constrainttitle");

    // availability for adding to current constraints
		if(constrainttitle.innerHTML == "availability"){
			var constraintvalue = document.getElementById("constraintchange").value;
			if(constraintvalue.length != 0){
				var table = document.getElementById("currentconstraints");
				var currConstraint = constrainttitle.innerHTML;
				var new_row = document.createElement('tr');
				new_row.setAttribute("class", "clickable-cons");

			// console.log(childSnapshot.key);
			var name_cell = document.createElement('td');
			name_cell.setAttribute("id", currConstraint);
      name_cell.setAttribute("value", constraintvalue);
			name_cell.appendChild(document.createTextNode(currConstraint + ": " + constraintvalue));
			new_row.appendChild(name_cell);
			table.appendChild(new_row);

      var weightsTable = document.getElementById("weightsOfCurrentConstraints");
      var weightInput = document.createElement("input");
      var new_row_weights = document.createElement('tr');
      new_row_weights.setAttribute("class", "weights");

      weightInput.type = "text";
      weightInput.name = currConstraint;
      weightInput.style.cssText = "height: 20px; width: 39px;"
      new_row_weights.appendChild(weightInput);
      weightsTable.appendChild(new_row_weights);

			Session.set('availability', constraintvalue);

			var changedConstraint = document.getElementById(constrainttitle.innerHTML);
			changedConstraint.remove();

		}
		else{
			alert("You need to input a value first!")
		}

	}
  // leadership
	else if(constrainttitle.innerHTML == "leadership"){
		console.log("balanceCheck");
		var constraintvalue = document.getElementById('balancevalue').checked;
		var table = document.getElementById("currentconstraints");
		var currConstraint = constrainttitle.innerHTML;
		var new_row = document.createElement('tr');
		new_row.setAttribute("class", "clickable-cons");

			// console.log(childSnapshot.key);
			var name_cell = document.createElement('td');
			name_cell.setAttribute("id", currConstraint);
      name_cell.setAttribute("value", constraintvalue);
			name_cell.appendChild(document.createTextNode(currConstraint + ": " + constraintvalue));
			Session.set('leadership', document.getElementById('balancevalue').checked);
			new_row.appendChild(name_cell);
			table.appendChild(new_row);

      var weightsTable = document.getElementById("weightsOfCurrentConstraints");
      var weightInput = document.createElement("input");
      var new_row_weights = document.createElement('tr');
      new_row_weights.setAttribute("class", "weights");

      weightInput.type = "text";
      weightInput.name = currConstraint;
      weightInput.style.cssText = "height: 20px; width: 39px;"
      new_row_weights.appendChild(weightInput);
      weightsTable.appendChild(new_row_weights);

			var changedConstraint = document.getElementById(constrainttitle.innerHTML);
			changedConstraint.remove();

		}
    // gender
		else if(constrainttitle.innerHTML == "genderbalance"){
			console.log("balanceCheck");
			var constraintvalue = document.getElementById('balancevalue').checked;
			var table = document.getElementById("currentconstraints");
			var currConstraint = constrainttitle.innerHTML;
			var new_row = document.createElement('tr');
			new_row.setAttribute("class", "clickable-cons");

			// console.log(childSnapshot.key);
			var name_cell = document.createElement('td');
			name_cell.setAttribute("id", currConstraint);
      name_cell.setAttribute("value", constraintvalue);
			name_cell.appendChild(document.createTextNode(currConstraint + ": " + constraintvalue));
			Session.set('genderbalance', document.getElementById('balancevalue').checked);
			new_row.appendChild(name_cell);
			table.appendChild(new_row);

      var weightsTable = document.getElementById("weightsOfCurrentConstraints");
      var weightInput = document.createElement("input");
      var new_row_weights = document.createElement('tr');
      new_row_weights.setAttribute("class", "weights");

      weightInput.type = "text";
      weightInput.name = currConstraint;
      weightInput.style.cssText = "height: 20px; width: 39px;"
      new_row_weights.appendChild(weightInput);
      weightsTable.appendChild(new_row_weights);

			var changedConstraint = document.getElementById(constrainttitle.innerHTML);
			changedConstraint.remove();

		}
    // student likes
    else if(constrainttitle.innerHTML == "studentLikes"){
			console.log("balanceCheck");
			var constraintvalue = document.getElementById('balancevalue').checked;
			var table = document.getElementById("currentconstraints");
			var currConstraint = constrainttitle.innerHTML;
			var new_row = document.createElement('tr');
			new_row.setAttribute("class", "clickable-cons");

			// console.log(childSnapshot.key);
			var name_cell = document.createElement('td');
			name_cell.setAttribute("id", currConstraint);
      name_cell.setAttribute("value", constraintvalue);
			name_cell.appendChild(document.createTextNode(currConstraint + ": " + constraintvalue));
			Session.set('studentLikes', document.getElementById('balancevalue').checked);
			new_row.appendChild(name_cell);
			table.appendChild(new_row);

      var weightsTable = document.getElementById("weightsOfCurrentConstraints");
      var weightInput = document.createElement("input");
      var new_row_weights = document.createElement('tr');
      new_row_weights.setAttribute("class", "weights");

      weightInput.type = "text";
      weightInput.name = currConstraint;
      weightInput.readOnly = true;
      weightInput.value = 0;
      weightInput.style.cssText = "height: 20px; width: 39px;background-color: #E6E6E6;"
      new_row_weights.appendChild(weightInput);
      weightsTable.appendChild(new_row_weights);

			var changedConstraint = document.getElementById(constrainttitle.innerHTML);
			changedConstraint.remove();

		}

    // student dislikes
    else if(constrainttitle.innerHTML == "studentDislikes"){
			console.log("balanceCheck");
			var constraintvalue = document.getElementById('balancevalue').checked;
			var table = document.getElementById("currentconstraints");
			var currConstraint = constrainttitle.innerHTML;
			var new_row = document.createElement('tr');
			new_row.setAttribute("class", "clickable-cons");

			// console.log(childSnapshot.key);
			var name_cell = document.createElement('td');
			name_cell.setAttribute("id", currConstraint);
      name_cell.setAttribute("value", constraintvalue);
			name_cell.appendChild(document.createTextNode(currConstraint + ": " + constraintvalue));
			Session.set('studentDislikes', document.getElementById('balancevalue').checked);
			new_row.appendChild(name_cell);
			table.appendChild(new_row);

      var weightsTable = document.getElementById("weightsOfCurrentConstraints");
      var weightInput = document.createElement("input");
      var new_row_weights = document.createElement('tr');
      new_row_weights.setAttribute("class", "weights");

      weightInput.type = "text";
      weightInput.name = currConstraint;
      weightInput.readOnly = true;
      weightInput.value = 0;
      weightInput.style.cssText = "height: 20px; width: 39px;background-color: #E6E6E6;"
      new_row_weights.appendChild(weightInput);
      weightsTable.appendChild(new_row_weights);

			var changedConstraint = document.getElementById(constrainttitle.innerHTML);
			changedConstraint.remove();

		}

    // role distribution
    else if(constrainttitle.innerHTML == "roleDistribution"){
			console.log("balanceCheck");
			var constraintvalue = document.getElementById('balancevalue').checked;
			var table = document.getElementById("currentconstraints");
			var currConstraint = constrainttitle.innerHTML;
			var new_row = document.createElement('tr');
			new_row.setAttribute("class", "clickable-cons");

			// console.log(childSnapshot.key);
			var name_cell = document.createElement('td');
			name_cell.setAttribute("id", currConstraint);
      name_cell.setAttribute("value", constraintvalue);
			name_cell.appendChild(document.createTextNode(currConstraint + ": " + constraintvalue));
			Session.set('roleDistribution', document.getElementById('balancevalue').checked);
			new_row.appendChild(name_cell);
			table.appendChild(new_row);

      var weightsTable = document.getElementById("weightsOfCurrentConstraints");
      var weightInput = document.createElement("input");
      var new_row_weights = document.createElement('tr');
      new_row_weights.setAttribute("class", "weights");

      weightInput.type = "text";
      weightInput.name = currConstraint;
      weightInput.style.cssText = "height: 20px; width: 39px;"
      new_row_weights.appendChild(weightInput);
      weightsTable.appendChild(new_row_weights);

			var changedConstraint = document.getElementById(constrainttitle.innerHTML);
			changedConstraint.remove();

		}


		constrainttitle.innerHTML = "";
		var constraintModifier = document.getElementById("constrainttochange");
		while (constraintModifier.hasChildNodes()) {
			constraintModifier.removeChild(constraintModifier.lastChild);
		}

		var add_button = document.getElementById("add_button");
		add_button.style.visibility = "hidden" ;
		var remove_button = document.getElementById("removeButton");
		remove_button.style.visibility = "hidden";


	},

	'click #removeButton' : function (e) {
		console.log();
		var constrainttitle = document.getElementById("constrainttitle");
		var new_row = document.createElement('tr');
		new_row.setAttribute("class", "clickable-row");

			// console.log(childSnapshot.key);
			var table = document.getElementById("remainingConstraints");
			var name_cell = document.createElement('td');
			var removeid = $('#currentconstraints .highlight').attr('id');
			name_cell.setAttribute("id", $('#currentconstraints .highlight').attr('id'));
			name_cell.appendChild(document.createTextNode($('#currentconstraints .highlight').attr('id') + ": "));
			new_row.appendChild(name_cell);
			if($('#currentconstraints .highlight').attr('id') != null){
				table.appendChild(new_row);
				$('#currentconstraints .highlight').remove();
				constrainttitle.innerHTML = "Constraint to be modified";
				var constraintModifier = document.getElementById("constrainttochange");
				while (constraintModifier.hasChildNodes()) {
					constraintModifier.removeChild(constraintModifier.lastChild);
				}

			}
      // Removes weight input of corresponding constraint
      var weightsTable = document.getElementById("weightsOfCurrentConstraints");
      $('.weights').find('[name="' + removeid +'"]').remove();

      // Removes constraint from list outside modal
      $('#constraints-td').find('[constraint="'+ removeid +'"]').remove();
			Session.set(removeid, '');
			console.log(removeid + ": " + Session.get(removeid));
			constrainttitle.innerHTML = "";
			var add_button = document.getElementById("add_button");
			add_button.style.visibility = "hidden" ;
			var remove_button = document.getElementById("removeButton");
			remove_button.style.visibility = "hidden";

		},
		'click .clickable-cons': function(e) {
			var row_id = e.target.id;
			var add_button = document.getElementById("add_button");
			add_button.innerHTML = "Save change";
			add_button.style.visibility = "visible" ;
			var remove_button = document.getElementById("removeButton");
			remove_button.style.visibility = "visible";
			var constrainttitle = document.getElementById("constrainttitle");
			var constraintModifier = document.getElementById("constrainttochange");
			// var constraintHint = document.getElementById("constrainttip");
			while (constraintModifier.hasChildNodes()) {
				constraintModifier.removeChild(constraintModifier.lastChild);
			}

			constrainttitle.innerHTML = row_id;
      // Availability
			if(constrainttitle.innerHTML == "availability"){
    		// <input type="number" value="" min="0" placeholder="0" id="constraintchange"
        var availabilityText = document.createElement('center');
        availabilityText.setAttribute("class", "constraintInformation");
        availabilityText.innerHTML = "Number of overlapping time slots a student is able to meet on a weekly basis.";
        constraintModifier.appendChild(availabilityText);

        constraintModifier.style.padding = "0";
        var specificsBox = document.getElementById("specifics");
        specificsBox.style.height = "120px";

    		var inputBox = document.createElement('input');
        var inputDiv = document.createElement('div');
        inputDiv.setAttribute("id", "availabilityDiv");

    		inputBox.setAttribute("type", "number");
    		inputBox.setAttribute("value", Session.get('availability'));
    		inputBox.setAttribute("min", "0");
    		inputBox.setAttribute("placeholder", "0");
    		inputBox.setAttribute("id", "constraintchange");
    		// constraintHint.innerHTML = "information about Availability!"
        inputDiv.appendChild(inputBox);
        constraintModifier.appendChild(inputDiv);

    	}
      // gender
    	if(constrainttitle.innerHTML == "genderbalance"){
        var genderText = document.createElement('center');
        genderText.setAttribute("class", "constraintInformation");
        genderText.innerHTML = "Ensuring that at least two females exist on a team or none at all.";
        constraintModifier.appendChild(genderText);

        constraintModifier.style.padding = "0";
        var specificsBox = document.getElementById("specifics");
        specificsBox.style.height = "120px";

    		var balanceSwitch = document.createElement('label');
    		balanceSwitch.setAttribute('class', 'switch');
    		var balanceInput = document.createElement('input');
    		balanceInput.setAttribute('type', 'checkbox');
    		balanceInput.setAttribute('id', 'balancevalue');
    		balanceInput.checked = Session.get('genderbalance');
    		var balanceDiv = document.createElement('div');
    		balanceDiv.setAttribute('class', 'slider round');
    		balanceSwitch.appendChild(balanceInput);
    		balanceSwitch.appendChild(balanceDiv);
        var switchDiv = document.createElement('div');
        switchDiv.setAttribute('class', 'switchDiv');
        switchDiv.appendChild(balanceSwitch);
        constraintModifier.appendChild(switchDiv);
    		// constraintHint.innerHTML = "Information about gender balance!"
    	}
      // leadership
    	if(constrainttitle.innerHTML == "leadership"){
        var leadershipText = document.createElement('center');
        leadershipText.setAttribute("class", "constraintInformation");
        leadershipText.innerHTML = "Ensuring that one leader exists on a team.";
        constraintModifier.appendChild(leadershipText);

        constraintModifier.style.padding = "0";
        var specificsBox = document.getElementById("specifics");
        specificsBox.style.height = "120px";

    		var balanceSwitch = document.createElement('label');
    		balanceSwitch.setAttribute('class', 'switch');
    		var balanceInput = document.createElement('input');
    		balanceInput.setAttribute('type', 'checkbox');
    		balanceInput.setAttribute('id', 'balancevalue');
    		var balanceDiv = document.createElement('div');
    		balanceDiv.setAttribute('class', 'slider round');
    		balanceInput.checked = Session.get('leadership');
    		balanceSwitch.appendChild(balanceInput);
    		balanceSwitch.appendChild(balanceDiv);
        var switchDiv = document.createElement('div');
        switchDiv.setAttribute('class', 'switchDiv');
        switchDiv.appendChild(balanceSwitch);
        constraintModifier.appendChild(switchDiv);
        // constraintHint.innerHTML = "Information about leadership!"
    	}
      // student likes
      if(constrainttitle.innerHTML == "studentLikes"){
        var studentLikesText = document.createElement('center');
        studentLikesText.setAttribute("class", "constraintInformation");
        studentLikesText.innerHTML = "Taking into consideration who students want to be placed on a team with.";
        constraintModifier.appendChild(studentLikesText);

        constraintModifier.style.padding = "0";
        var specificsBox = document.getElementById("specifics");
        specificsBox.style.height = "120px";

    		var balanceSwitch = document.createElement('label');
    		balanceSwitch.setAttribute('class', 'switch');
    		var balanceInput = document.createElement('input');
    		balanceInput.setAttribute('type', 'checkbox');
    		balanceInput.setAttribute('id', 'balancevalue');
    		var balanceDiv = document.createElement('div');
    		balanceDiv.setAttribute('class', 'slider round');
    		balanceInput.checked = Session.get('studentLikes');
    		balanceSwitch.appendChild(balanceInput);
    		balanceSwitch.appendChild(balanceDiv);
        var switchDiv = document.createElement('div');
        switchDiv.setAttribute('class', 'switchDiv');
        switchDiv.appendChild(balanceSwitch);
    		constraintModifier.appendChild(switchDiv);
    		// constraintHint.innerHTML = "Information about student likes!"
    	}

      // student dislikes
      if(constrainttitle.innerHTML == "studentDislikes"){
        var studentDisikesText = document.createElement('center');
        studentDisikesText.setAttribute("class", "constraintInformation");
        studentDisikesText.innerHTML = "Taking into consideration who students do not want to be placed on a team with.";
        constraintModifier.appendChild(studentDisikesText);

        constraintModifier.style.padding = "0";
        var specificsBox = document.getElementById("specifics");
        specificsBox.style.height = "120px";

    		var balanceSwitch = document.createElement('label');
    		balanceSwitch.setAttribute('class', 'switch');
    		var balanceInput = document.createElement('input');
    		balanceInput.setAttribute('type', 'checkbox');
    		balanceInput.setAttribute('id', 'balancevalue');
    		var balanceDiv = document.createElement('div');
    		balanceDiv.setAttribute('class', 'slider round');
    		balanceInput.checked = Session.get('studentDislikes');
    		balanceSwitch.appendChild(balanceInput);
    		balanceSwitch.appendChild(balanceDiv);
        var switchDiv = document.createElement('div');
        switchDiv.setAttribute('class', 'switchDiv');
        switchDiv.appendChild(balanceSwitch);
    		constraintModifier.appendChild(switchDiv);
    		// constraintHint.innerHTML = "Information about student studentDislikes!"
    	}

      // role distribution
      if(constrainttitle.innerHTML == "roleDistribution"){
        var roleDistributionText = document.createElement('center');
        roleDistributionText.setAttribute("class", "constraintInformation");
        roleDistributionText.innerHTML = "Creating teams with distributed roles.";
        constraintModifier.appendChild(roleDistributionText);

        constraintModifier.style.padding = "0";
        var specificsBox = document.getElementById("specifics");
        specificsBox.style.height = "120px";

    		var balanceSwitch = document.createElement('label');
    		balanceSwitch.setAttribute('class', 'switch');
    		var balanceInput = document.createElement('input');
    		balanceInput.setAttribute('type', 'checkbox');
    		balanceInput.setAttribute('id', 'balancevalue');
    		var balanceDiv = document.createElement('div');
    		balanceDiv.setAttribute('class', 'slider round');
    		balanceInput.checked = Session.get('roleDistribution');
    		balanceSwitch.appendChild(balanceInput);
    		balanceSwitch.appendChild(balanceDiv);
        var switchDiv = document.createElement('div');
        switchDiv.setAttribute('class', 'switchDiv');
        switchDiv.appendChild(balanceSwitch);
    		constraintModifier.appendChild(switchDiv);
    	}
    	$('.highlight').removeClass('highlight');
    	$(e.target).addClass('highlight');

    },

    'click .clickable-row': function(e) {
    	var row_id = e.target.id;

    	var add_button = document.getElementById("add_button");
    	add_button.innerHTML = "Add constraint";
    	add_button.style.visibility = "visible" ;
    	var remove_button = document.getElementById("removeButton");
    	remove_button.style.visibility = "hidden";
    	var constrainttitle = document.getElementById("constrainttitle");
    	var constraintModifier = document.getElementById("constrainttochange");
    	// var constraintHint = document.getElementById("constrainttip");
    	while (constraintModifier.hasChildNodes()) {
    		constraintModifier.removeChild(constraintModifier.lastChild);
    	}

    	constrainttitle.innerHTML = row_id;
    	if(constrainttitle.innerHTML == "availability"){
    		// <input type="number" value="" min="0" placeholder="0" id="constraintchange"
        var availabilityText = document.createElement('center');
        availabilityText.setAttribute("class", "constraintInformation");
        availabilityText.innerHTML = "Number of overlapping time slots a student is able to meet on a weekly basis.";
        constraintModifier.appendChild(availabilityText);

        constraintModifier.style.padding = "0";
        var specificsBox = document.getElementById("specifics");
        specificsBox.style.height = "120px";

    		var inputBox = document.createElement('input');
        var inputDiv = document.createElement('div');
        inputDiv.setAttribute("id", "availabilityDiv");
    		inputBox.setAttribute("type", "number");
    		inputBox.setAttribute("value", "");
    		inputBox.setAttribute("min", "0");
    		inputBox.setAttribute("placeholder", "0");
    		inputBox.setAttribute("id", "constraintchange");
    		// constraintHint.innerHTML = "information about Availability!"
        inputDiv.appendChild(inputBox);
    		constraintModifier.appendChild(inputDiv);

    	}
    	if(constrainttitle.innerHTML == "genderbalance"){
        var genderText = document.createElement('center');
        genderText.setAttribute("class", "constraintInformation");
        genderText.innerHTML = "Ensuring that at least two females exist on a team or none at all.";
        constraintModifier.appendChild(genderText);

        constraintModifier.style.padding = "0";
        var specificsBox = document.getElementById("specifics");
        specificsBox.style.height = "120px";

    		var balanceSwitch = document.createElement('label');
    		balanceSwitch.setAttribute('class', 'switch');
    		var balanceInput = document.createElement('input');
    		balanceInput.setAttribute('type', 'checkbox');
    		balanceInput.setAttribute('id', 'balancevalue');
    		var balanceDiv = document.createElement('div');
    		balanceDiv.setAttribute('class', 'slider round');
    		balanceSwitch.appendChild(balanceInput);
    		balanceSwitch.appendChild(balanceDiv);
        var switchDiv = document.createElement('div');
        switchDiv.setAttribute('class', 'switchDiv');
        switchDiv.appendChild(balanceSwitch);
        constraintModifier.appendChild(switchDiv);
        // constraintHint.innerHTML = "Information about gender balance!"
    	}
    	if(constrainttitle.innerHTML == "leadership"){
        var leadershipText = document.createElement('center');
        leadershipText.setAttribute("class", "constraintInformation");
        leadershipText.innerHTML = "Ensuring that one leader exists on a team.";
        constraintModifier.appendChild(leadershipText);

        constraintModifier.style.padding = "0";
        var specificsBox = document.getElementById("specifics");
        specificsBox.style.height = "120px";

    		var balanceSwitch = document.createElement('label');
    		balanceSwitch.setAttribute('class', 'switch');
    		var balanceInput = document.createElement('input');
    		balanceInput.setAttribute('type', 'checkbox');
    		balanceInput.setAttribute('id', 'balancevalue');
    		var balanceDiv = document.createElement('div');
    		balanceDiv.setAttribute('class', 'slider round');
    		balanceSwitch.appendChild(balanceInput);
    		balanceSwitch.appendChild(balanceDiv);

        var switchDiv = document.createElement('div');
        switchDiv.setAttribute('class', 'switchDiv');
        switchDiv.appendChild(balanceSwitch);
    		constraintModifier.appendChild(switchDiv);
    		// constraintHint.innerHTML = "Information about leadership!"
    	}
      if(constrainttitle.innerHTML == "studentLikes"){
        var studentLikesText = document.createElement('center');
        studentLikesText.setAttribute("class", "constraintInformation");
        studentLikesText.innerHTML = "Taking into consideration who students want to be placed on a team with.";
        constraintModifier.appendChild(studentLikesText);

        constraintModifier.style.padding = "0";
        var specificsBox = document.getElementById("specifics");
        specificsBox.style.height = "120px";

    		var balanceSwitch = document.createElement('label');
    		balanceSwitch.setAttribute('class', 'switch');
    		var balanceInput = document.createElement('input');
    		balanceInput.setAttribute('type', 'checkbox');
    		balanceInput.setAttribute('id', 'balancevalue');
    		var balanceDiv = document.createElement('div');
    		balanceDiv.setAttribute('class', 'slider round');
    		balanceSwitch.appendChild(balanceInput);
    		balanceSwitch.appendChild(balanceDiv);
        var switchDiv = document.createElement('div');
        switchDiv.setAttribute('class', 'switchDiv');
        switchDiv.appendChild(balanceSwitch);
    		constraintModifier.appendChild(switchDiv);
    		// constraintHint.innerHTML = "Information about studentLikes!"
    	}
      if(constrainttitle.innerHTML == "studentDislikes"){
        var studentDisikesText = document.createElement('center');
        studentDisikesText.setAttribute("class", "constraintInformation");
        studentDisikesText.innerHTML = "Taking into consideration who students do not want to be placed on a team with.";
        constraintModifier.appendChild(studentDisikesText);

        constraintModifier.style.padding = "0";
        var specificsBox = document.getElementById("specifics");
        specificsBox.style.height = "120px";

    		var balanceSwitch = document.createElement('label');
    		balanceSwitch.setAttribute('class', 'switch');
    		var balanceInput = document.createElement('input');
    		balanceInput.setAttribute('type', 'checkbox');
    		balanceInput.setAttribute('id', 'balancevalue');
    		var balanceDiv = document.createElement('div');
    		balanceDiv.setAttribute('class', 'slider round');
    		balanceSwitch.appendChild(balanceInput);
    		balanceSwitch.appendChild(balanceDiv);
        var switchDiv = document.createElement('div');
        switchDiv.setAttribute('class', 'switchDiv');
        switchDiv.appendChild(balanceSwitch);
        constraintModifier.appendChild(switchDiv);
        // constraintHint.innerHTML = "Information about studentDislikes!"
    	}

      if(constrainttitle.innerHTML == "roleDistribution"){
        var roleDistributionText = document.createElement('center');
        roleDistributionText.setAttribute("class", "constraintInformation");
        roleDistributionText.innerHTML = "Creating teams with distributed roles.";
        constraintModifier.appendChild(roleDistributionText);

        constraintModifier.style.padding = "0";
        var specificsBox = document.getElementById("specifics");
        specificsBox.style.height = "120px";

    		var balanceSwitch = document.createElement('label');
    		balanceSwitch.setAttribute('class', 'switch');
    		var balanceInput = document.createElement('input');
    		balanceInput.setAttribute('type', 'checkbox');
    		balanceInput.setAttribute('id', 'balancevalue');
    		var balanceDiv = document.createElement('div');
    		balanceDiv.setAttribute('class', 'slider round');
    		balanceSwitch.appendChild(balanceInput);
    		balanceSwitch.appendChild(balanceDiv);
        var switchDiv = document.createElement('div');
        switchDiv.setAttribute('class', 'switchDiv');
        switchDiv.appendChild(balanceSwitch);
        constraintModifier.appendChild(switchDiv);
    	}

    	$('.highlight').removeClass('highlight');
    	$(e.target).addClass('highlight');
    	console.log(constrainttitle.innerHTML);
    },


    'click #saveButton' : function() {
    	var table = $("#currentconstraints");
      var weightsTable = $("#weightsOfCurrentConstraints");
    	$('#constraints-td').empty();

    // table is not empty
    if (table.children().length != 0 && $('.clickable-cons').children().length != 0) {
    	for (i = 0; i < table.children().length; i++) {
          if (table.children()[i].cells.length != 0) {
            var rowId = table.children()[i].cells[0].id; // id of constraint
          }
          var outerSpan = document.createElement('span');
          outerSpan.setAttribute("class", "constraint-tag");
          if (table.children()[i].cells.length != 0) {
            outerSpan.setAttribute("constraint", table.children()[i].cells[0].id);
          }

          // Saving the weight value for each constraint
          var weightValue = weightsTable.children().children()[i].value;
          if(weightValue != "") {
            outerSpan.setAttribute("weight", weightValue);
          }
          //if(weightsTable.children()[i])
          // outerSpan.setAttribute("value", table.children()[i].cells[0].value);
          outerSpan.setAttribute("value", Session.get(rowId));


          var innerSpan = document.createElement('span');
          innerSpan.appendChild(document.createTextNode(rowId + ": " + Session.get(rowId))); // add the row id to span

          // Creating the x for the box
          var aTag = document.createElement('a');
          var iTag = document.createElement('i');
          iTag.setAttribute("class", "remove glyphicon glyphicon-remove-sign glyphicon-white");
          iTag.setAttribute("id", rowId);
          aTag.appendChild(iTag);

          // Adding the elements to the outer span
          outerSpan.appendChild(innerSpan);
          outerSpan.appendChild(aTag);
          $('#constraints-td').append(outerSpan); // add after constraint button
      }
  }
  if ($('#totalWeight')[0].value != '100') {
    $('#totalWeightError').removeClass("hidden");
  } else {
    $('#totalWeightError').addClass("hidden");
    Modal.hide('constraintModalTemplate');
  }
},
// total weight
'change .weights' : function() {
  var weightsTable = document.getElementById("weightsOfCurrentConstraints");
  document.getElementById("totalWeight").value = 0;
  for (var i = 0, row; row = weightsTable.rows[i]; i++) {
    if (row.children[0].value.length != 0) {
      document.getElementById("totalWeight").value = parseFloat(document.getElementById("totalWeight").value)
                                                          + parseFloat(row.children[0].value);
    }
  }
}

});

// Template.filter.events({
//   'click .selectBox' : function() {
//     var checkboxes = document.getElementById("filter-checkboxes");
//     if (checkboxes.style.display == "none") {
//         checkboxes.style.display = "block";
//     } else {
//         checkboxes.style.display = "none";
//     }
//
//     if ($('#genderCheck:checkbox:checked').length != 0) {
//       $(".student-gender, .student-attributes").removeClass("hidden");
//     } else {
//       $(".student-gender").addClass("hidden");
//     }
//
//     if ($('#leadershipCheck:checkbox:checked').length != 0) {
//       $(".student-leadership, .student-attributes").removeClass("hidden");
//     } else {
//       $(".student-leadership").addClass("hidden");
//     }
//   }
// });

// Template.calendar.helpers({
//   options: function() {
//         return {
//             defaultView: 'agendaWeek',
//             aspectRatio: 2,
//             header : false,
//             allDaySlot: false,
//             columnFormat: 'ddd',
//             minTime: "08:00:00", //8am
//             maxTime: "21:00:00" //9pm
//         };
//     }
// });
