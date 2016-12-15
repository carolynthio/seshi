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


// To start stress testing, browse to /stress/NAME/INTERVAL,
//     where NAME is the name that will be used for logging the stress tester's actions.
//     and INTERVAL is the time between actions in milliseconds.
// e.g.  /stress/worker-5/1000

// measuring throughput in actions/sec
var actionCount;
var startTimeMsecs;

startStressTest = function() {
    actionCount = 0;
    startTimeMsecs = new Date().getTime();
    setTimeout(stressTest, Session.get('stressInterval'));
}


stressTest = function() {
    function randomInt(n) {
        return Math.floor(Math.random() * n);
    }
    function randomItem(collection, query) {
        var n = collection.find(query).count();
        var i = randomInt(n);
        var item = collection.findOne(query, {skip:i});
        return item;
    }
    function randomListItem(list) {
        var i = randomInt(list.length);
        var item = list[i];
        return item;
    }

    try {
        var x = Math.random();

        if ((x -= 0.25) < 0) {
            // 25% of the time, search for prefix of a random paper title word
            var paper = randomItem(Papers, {active:true});
            var words = paper.title.split(/\s+/);
            var word = randomListItem(words);
            var prefix = word.substring(0,2+randomInt(word.length));
            console.log("search for " + prefix);
            EasySearch.search('papers', prefix,
                  function (err, data){
                      console.log("found " + data.results.length + " papers");
                  });
        }
        else if ((x -= 0.25) < 0) { 
            // 25% of the time, create a new session
            var paper = randomItem(Papers, {active:true});
            var position = {top: randomInt(500), left: randomInt(500)};
            var sessionName = paper.title.split(/\s+/)[0];
            console.log("createSession(" + paper._id + ") and renameSession(" + sessionName + ")");
            var sessionID = createSession(paper._id, position);
            updateSessionName(sessionID, sessionName);
        } else if ((x -= 0.25) < 0) { 
            // 25% of the time, add a paper to a session
            var paper = randomItem(Papers, {active:true});
            var session = randomItem(Sessions, {name:{$ne: ''}});
            console.log("addPaperToSession(" + paper._id + "," + session._id + ")");
            addPaperToSession(paper._id, session._id);
        } else { 
            // 25% of the time, remove a paper from a session
            var session = randomItem(Sessions, {name:{$ne: ''}});
            var paperID = randomListItem(session.papers);
            console.log("removePaperFromSession(" + paperID + "," + session._id + ")");
            removePaperFromSession(paperID, session._id);
        }
    } finally {
        // compute and display throughput
        ++actionCount;
        if (actionCount >= 10) {
            var now = new Date().getTime();
            var timeElapsedSecs = (now - startTimeMsecs) / 1000.0;
            var actionsPerSec = actionCount / timeElapsedSecs;
            console.log("throughput: " + actionsPerSec + " automatic actions per second");
            startTimeMsecs = now;
            actionCount = 0;
        }

        // wait a bit, then call this function again
        setTimeout(stressTest, Session.get('stressInterval'));
    }
}
