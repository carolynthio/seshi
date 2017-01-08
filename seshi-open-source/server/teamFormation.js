var exec = Npm.require('child_process').exec;
// var Fiber = Npm.require('fibers');
// var Future = Npm.require('fibers/future');
// var spawn = Npm.require("child_process").spawn;

Meteor.methods({
  callPython: function(number, list) {
    // var process = spawn('python',["/Users/carolynthio/Desktop/randomTeams.py", number, list]);
    //
    // console.log("after spawn");
    // var output = "";
    var sync = Meteor.wrapAsync(exec);
    var cmd = "python assets/app/randomTeams.py " + " " + number + " " + list;
    var result = sync(cmd);

    // process.stdout.on('data', function (data){
    // // Do something with the data returned from python script
    //   console.log(data.toString('utf8'));
    //   data = data.toString('utf8');
    //   output += data;
    //   console.log("inside stdout: " + output);
    // });
    // console.log("outside stdout: " + output);
    return result;
  },
  createTeams: function(minStudents, maxStudents) {
    var sync = Meteor.wrapAsync(exec);
    var cmd = "python assets/app/teamFormationAlgorithm.py " + " " + minStudents + " " + maxStudents;
    var result = sync(cmd);

    return result;
  },


});
