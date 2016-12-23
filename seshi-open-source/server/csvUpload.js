Meteor.methods({
  parseUpload( data ) {
    // console.log(data);
    // check( data, Array );

    for ( let i = 0; i < data.length; i++ ) {
      let item   = data[ i ],
          exists = Students.findOne( { Name: item.Name } );

      if ( !exists ) {
        Students.insert( item );
      } else {
        console.warn( 'Rejected. This item already exists.' );
      }
    }
    return Students.find().fetch(); // Displays what is in Students
    // console.log(data[0].Name);
  }
});
