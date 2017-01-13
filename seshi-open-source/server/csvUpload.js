Meteor.methods({
  parseUpload( data ) {
    // console.log(data);
    // check( data, Array );

    // Students.remove({}); // remove all objects
    for ( let i = 0; i < data.length; i++ ) {
      let item   = data[ i ],
          exists = Students.findOne( { Name: item.name } );
      // console.log("HERE: " + JSON.stringify(item));

      if ( !exists ) {
        // console.log("it doesnt exists: " + JSON.stringify(item));
        Students.insert( item );
      } else {
        console.warn( 'Rejected. This item already exists.' );
      }
    }
    // console.log("item: " + Students.find().fetch()[0] + " id: " + Students.find().fetch()[0]._id);
    return Students.find().fetch(); // Displays what is in Students
    // console.log(data[0].Name);
  },

  'saveFile': function(buffer){
        Files.insert({data:buffer})
    }
});
