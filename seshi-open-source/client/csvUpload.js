Template.upload.onCreated( () => {
  Template.instance().uploading = new ReactiveVar( false );
});

Template.upload.helpers({
  uploading() {
    return Template.instance().uploading.get();
  }
});

Template.upload.events({
  'change [name="uploadCSV"]' () {
    $('#submitFile').removeAttr('disabled');
  },

  'click #submitFile' ( event, template ) {
    template.uploading.set( true );
    var csv_file = $('input[name="uploadCSV"]')[0].files[0];
    Papa.parse( csv_file, {
      header: true,
      complete( results, file ) {
        Meteor.call( 'parseUpload', results.data, ( error, response ) => {
          if ( error ) {
            console.log( error.reason );
          } else {
            template.uploading.set( false );
            Bert.alert( 'Upload complete!', 'success', 'growl-top-right' );
            console.log("IN CSVUPLOAD.JS CLIENT: " + JSON.stringify(results.data))
            Session.set("students", results.data);
          }
        });
      }
    });
  }
});
