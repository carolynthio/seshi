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

/* 
   This is Opty.

   Opty uses a heuristic algorithm to simulate optimal session selection, that:
   1. Which candidate sessions to include as selected sessions, such that no paper ends up in more than 1 selected session
   2. Provide feedback in the form of 'Used Count' to show which papers won't be placed in an actual session (e.g., will be orphan'ed), given the current set of candidate sessions. You could think of these papers as ones that need "better groupings" if they are to not be orphaned.
*/

Session.set("optSessions", []);
Session.set("summaryStats", []);
Session.set("usedCount", []);
Session.set("approvedCount", []);

var PAPERS_PER_SESSION = 3;

Template.opty.helpers({
    sessionPapers : function () {
	var paperIDs = this.papers;
	return Papers.find({_id: {$in: paperIDs}})
    },
    sessions : function (){
	var nullNames = ["Not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
	return Sessions.find({name   : {$not: {$in: nullNames}}});
    },
    optSessions : function (){
	var ret = [];
	var optsessions = Session.get("optSessions");
	for(var i = 0; i < optsessions.length; i++){
	    ret.push({index: (i+1), 
		      sessions: optsessions[i],
		      score: optsessions[i].map(function(x) {return x.score}).reduce(function(previousValue, currentValue, index, array){
			  return previousValue + currentValue;
		      }) 
		     });
	}
	return ret;
    },
    optSession : function (){
	return this.sessions;
    },
    
    getUsedCount : function (){
	return Session.get("usedCount");
    },
    
    getApprovedCount : function(){
	return Session.get("approvedCount");
    },
    
    getOverallSummary: function(){
	var stats = Session.get("summaryStats");
	if(stats.length == 0) return;

	var numInSession = stats.map(function(x){return x.numSessioned}).reduce(function(pv, cv, i, arr){	    return pv + cv;}) / stats.length;
	
	var numNotInSession = stats.map(function(x){return x.numOrphaned}).reduce(function(pv, cv, i, arr){	    return pv + cv;}) / stats.length;

	var averageScore =  stats.map(function(x){return x.score}).reduce(function(pv, cv, i, arr){	    return pv + cv;}) / stats.length;

	var numInApprovedSessions =  stats.map(function(x){return x.numInApprovedSessions}).reduce(function(pv, cv){ return pv + cv;}) / stats.length;
	
	var numInFullSessions =  stats.map(function(x){return x.numInFullSessions}).reduce(function(pv, cv){ return pv + cv;}) / stats.length;
	
	
	
	return 	$('<div>').append($('<div>').append("Total number of papers: " + Papers.find({active:true}).count()))
	    .append($('<div>').append("Avg number of orphaned papers: " + numNotInSession))
	    .append($('<div>').append("Avg number of papers sessioned: " + numInSession))
	    .append($('<div>').append("Avg number of papers in approved sessions: " + numInApprovedSessions))
	    .append($('<div>').append("Avg number of papers in sessions with " + PAPERS_PER_SESSION + " papers: " + numInFullSessions))
	    .append($('<div>').append("Avg total score: " + averageScore)).html();
	
    },
    
    getSummary : function(){
	var sessions = this.sessions;
	var numInSessions = sessions.map(function(x){ return x.papers.length}).reduce(function(previousValue, currentValue, index, array){
	    return previousValue + currentValue;
	});
	var numNotInSessions = Papers.find({active: true}).count() - numInSessions;
	
	var averageScore = sessions.map(function(x) {return x.score}).reduce(function(previousValue, currentValue, index, array){
	    return previousValue + currentValue;
	}) / sessions.length;
	
	var numInApprovedSessions = sessions.map(function(x){ if(x.approved){return x.papers.length} else {return 0}}).reduce(function(p, c){return p+c;});
	var numInFullSessions = sessions.map(function(x){ if(x.papers.length == PAPERS_PER_SESSION){return x.papers.length} else {return 0}}).reduce(function(p, c){return p+c;});
	

	return $('<div>')
	    .append($('<div>').append("Number of orphaned papers: " + numNotInSessions))
	    .append($('<div>').append("Number of papers sessioned: " + numInSessions))
	    .append($('<div>').append("Number of papers in approved sessions: " + numInApprovedSessions))
	    .append($('<div>').append("Number of papers in sessions with " + PAPERS_PER_SESSION + " papers: " + numInFullSessions))
	    .append($('<div>').append("Average session score: " + averageScore)).html();
	
    }
});

Template.opty.events({
    'click #opt-button': function(){
	runOptimizer();
    },
    'click .trial-run': function(e){
	$(e.target).siblings().toggle();
    },
    'click #clearAllOpt': function(e){
	Session.set("optSessions", []);
	Session.set("summaryStats", []);
	Session.set("usedCount", []);
	Session.set("approvedCount", []);
    }
});

function runOptimizer(){
    // initialize used counts;
    var usedCount = {};
    var approvedCount = {};
    Papers.find({active: true}).fetch().map(function(x){ usedCount[x._id] = 0; approvedCount[x._id] = 0;});
    Session.get("usedCount").map(function(x){ usedCount[x.id] += x.useCount});
    Session.get("approvedCount").map(function(x){ approvedCount[x.id] += x.useCount});
    
    // prepare data to run optimizer on
    var useActual = true;
    var candidates = prepareData(useActual);
    
    var numTrials = 5;
    var stats = Session.get("summaryStats");
    for(var i = 0; i < numTrials; i++){
	var optsessions = greedySessionOptimizer(cloneCandidates(candidates));

	// update session outputs
        var ret = Session.get("optSessions")
	ret.push(optsessions);
	Session.set("optSessions", ret);
	
	// update counts
	updateUsedCount(usedCount, optsessions);
	updateApprovedUsedCount(approvedCount, optsessions);
	
	// update stats
	var numInSessions = optsessions.map(function(x){ return x.papers.length}).reduce(function(p, c){return p+c;});
	var numNotInSessions = Papers.find({active: true}).count() - numInSessions;
	var score = optsessions.map(function(x) {return x.score}).reduce(function(p,c){ return p+c;});
	var numInApprovedSessions = optsessions.map(function(x){ if(x.approved){return x.papers.length} else {return 0}}).reduce(function(p, c){return p+c;});
	var numInFullSessions = optsessions.map(function(x){ if(x.papers.length == PAPERS_PER_SESSION){return x.papers.length} else {return 0}}).reduce(function(p, c){return p+c;});
	stats.push({numSessioned: numInSessions,
		    numOrphaned: numNotInSessions,
		    score: score,
		    numInApprovedSessions: numInApprovedSessions,
		    numInFullSessions: numInFullSessions
		   });
    }
    
    Session.set("summaryStats", stats);
    
    // update used counts;
    var usedCountArray = []
    for (var id in usedCount)
	usedCountArray.push({id: id, useCount: usedCount[id]});
    usedCountArray.sort(function(a,b) {return a.useCount - b.useCount});
    Session.set("usedCount", usedCountArray);

    var approvedCountArray = [];
    for (var id in approvedCount)
	approvedCountArray.push({id: id, useCount: approvedCount[id]});
    approvedCountArray.sort(function(a,b) {return a.useCount - b.useCount});
    Session.set("approvedCount", approvedCountArray);
}

function updateUsedCount(usedCount, sessions){
    // get all papers in sessions
    sessions.map(function(x){
	var papers = x.papers;
	papers.map(function(y){
	    usedCount[y] +=1;
	});
    });
}

function updateApprovedUsedCount(approvedCount, sessions){
   sessions.map(function(x){
       if(x.approved){
	   var papers = x.papers;
	   papers.map(function(y){
	       approvedCount[y] +=1;
	   });
       }
   });
}


function greedySessionOptimizer(candidates){
    var sessions = [];
    while(1){ // when do we stop?
	// 1. prune invalid candidates
	candidates = candidates.filter(function(x) { return x.papers && x.papers.length > 2; })
	// 2. pick best candidate
	var bestOption = pickBest(candidates);
	if(bestOption == null) { // no one works for some reason
	    return sessions;
	}else{ // let's use this best option
	    sessions.push(bestOption);
	    for(var p in bestOption.papers){ // these papers can no longer be used
		removePaperFromCandidates(candidates, bestOption.papers[p]);
	    }
	}
    }
}

function pickBest(candidates){
    var best = [{score: 0, candidate: null}];
    
    for(var c in candidates){
	var option = scoreAndCreate(candidates[c], candidates);
	if(option.score > best[0].score){
	    best = [{score: option.score, candidate: option}]
	}else if(option.score == best[0].score){
	    best.push({score: option.score, candidate: option});
	}
    }
//    console.log(best);

    if(best[0].candidate == null) return null;
    
    best.map(function(x){
	// for each candidate
	var papers = x.candidate.papers;
	var chooseNowScore = papers.map(function(y){
	    var ret = candidates.map(function(z){
		// how many candidates is the paper in
		if(z.papers.length >=3 && z.approved && z.papers.indexOf(y) != -1){
		    return 1;
		}
		else{
		    return 0;
		}
	    });

	    ret = ret.reduce(function(p,c,i,a){return p+c;})
	    return ret;
	    
	});
	
	chooseNowScore = chooseNowScore.reduce(function(p,c,i,a){return p+c});
	x.chooseNowScore = chooseNowScore;
    });
    
    
    var minChooseNowScore = Math.min.apply(Math, best.map(function(x){ return x.chooseNowScore}));
    
  //  console.log("min choose score:", minChooseNowScore);
    best = best.filter(function(x){ return x.chooseNowScore == minChooseNowScore});

//    console.log("surviving choices:", best);
    return best[randIndex(best)].candidate;
}

function scoreAndCreate(candidate, liveCandidates){
    var score = 0;
    var option = null;
    var reasons = [];
    
    if(candidate.approved) {
	score += 100;
	reasons.push("approved+100");
    }
    if(candidate.origLength / candidate.papers.length >= 2) {
	score -= 20;
	reasons.push("broad-20");
    }
    
    if(candidate.papers.length == PAPERS_PER_SESSION) {
	score += 50;
	reasons.push("exactlyNPapers+50");
	option = new chosenSession(candidate.papers, 
				   candidate.name,
				   candidate.approved,
				   candidate.contributors,
				   candidate._id
				  );
    }else if(candidate.papers.length > PAPERS_PER_SESSION){
	reasons.push("moreThanNPapers+30");
	score += 30;
	option = new chosenSession(pickSubsetOfPapers(candidate.papers, liveCandidates),
				   candidate.name,
				   candidate.approved,
				   candidate.contributors,
				   candidate._id);
    }else if(candidate.papers.length == PAPERS_PER_SESSION-1){
	reasons.push("N-1Papers+10");
	score += 10; 
	option = new chosenSession(candidate.papers,
				   candidate.name,
				   candidate.approved,
				   candidate.contributors,
				   candidate._id);
    }
    option.score = score;
    option.reasons = reasons;
    return option;
}


pickSubsetOfPapers = function pickSubsetOfPapers(arr, candidates){
    // pick a subset of arr as a session containing PAPERS_PER_SESSION papers
    // pick the papers that are hardest to session otherwise

    var chooseNowScores = arr.map(function(y){
	var ret = candidates.map(function(z){
		// how many candidates is the paper in
	    if(z.papers.length >=3 && z.approved && z.papers.indexOf(y) != -1){
		return 1;
	    }else if(z.papers.length >=3 && !z.approved && z.papers.indexOf(y) != -1){
		return 0.2;
	    }
	    else{
		return 0;
	    }
	});
	
	ret = ret.reduce(function(p,c,i,a){return p+c;})
	return ret;
    });
    
    var options = [];
    for(var i = 0; i < arr.length;i++){
	options.push({score: chooseNowScores[i], paper: arr[i]});
    }
    options = shuffle(options);
    options.sort(function(a,b) { return a.score - b.score});

    return options.slice(0, PAPERS_PER_SESSION).map(function(option) { return option.paper });
}

function prepareData(useActual){
    if(useActual){
	var nullNames = ["Not yet named", "Not named yet", "", " ", "  ", "   ", undefined];
	var sessions =  Sessions.find({name   : {$not: {$in: nullNames}}}).fetch();
	// attach original length
	return sessions.map(function (s){
	    s.origLength = s.papers.length;
	    return s;
	});
    }else{
	return synthesizeData();
    }
}

synthesizeData = function synthesizeData(){
    var sessions = [];
    var papers = Papers.find({active: true});
    var set1 = shuffle(papers.fetch());
    var set2 = shuffle(papers.fetch());
    var set3 = shuffle(papers.fetch());
    var set4 = shuffle(papers.fetch());
    
    sessions = sessions.concat(syntheticSessionsFromPapers(set1, true));
    sessions = sessions.concat(syntheticSessionsFromPapers(set2, true));
    sessions = sessions.concat(syntheticSessionsFromPapers(set3, true));
    sessions = sessions.concat(syntheticSessionsFromPapers(set4, true));

//    console.log(sessions.length);
    return sessions;
}

function syntheticSessionsFromPapers(papers, approved){
    var sessions = [];
    var numPapersInSession = PAPERS_PER_SESSION;
    for(var z = 0; z < 45; z++){
    	// start from a random index
    	var i = randIndex(papers);
    	var papersInSession = [];
    	for(var k = i; k < papers.length && k < i+numPapersInSession; k++)
    	    papersInSession.push(papers[k]._id);
    	var session = new ConfSession(papersInSession);
    	session.approved = approved;
    	session.name = papersInSession.join(",");
    	sessions.push(session);
    }
    
    // // take groups of PAPERS_PER_SESSION papers
    // for(var i = 0; i < papers.length; i+=numPapersInSession){
    // 	var papersInSession = [];
    // 	for(var k = i; k < papers.length && k < i+numPapersInSession; k++)
    // 	    papersInSession.push(papers[k]._id);
    // 	var session = new ConfSession(papersInSession);
    // 	session.approved = approved;
    // 	session.name = papersInSession.join(",");
    // 	sessions.push(session);
    // }
    return sessions;
}

function cloneCandidates(candidates){
    var sessions = [];
    for(var i = 0; i < candidates.length; i++){
	var session = new ConfSession(candidates[i].papers);
	session.approved = candidates[i].approved;
	session.name = candidates[i].name;
	sessions.push(session);
    }
    return sessions;
}

function chosenSession(papers, name, approved, contributors, parentID){
    this.papers = papers;
    this.name = name;
    this.approved = approved;
    this.contributors = contributors;
    this.parentID = parentID;
}

function removePaper(papers, paperID){
    return papers.filter(function (x) { return x != paperID});
}

function removePaperFromCandidates(candidates, paperID){
    for(var c in candidates){
	candidates[c].papers = removePaper(candidates[c].papers, paperID)
    }
}
    

////////////// UTIL //////////
function shuffle(o){ //v1.0
    for(var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
};

function randIndex(items){
    return Math.floor(Math.random()*items.length)
}
