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
    Session.set("studentRosterFile", EJSON.toJSONValue(Files.findOne()));
    // console.log("CHANGING FILE INPUT");
    // console.log(Files.findOne().data);
    // console.log($('input[name="uploadCSV"]')[0].files[0]);
    // console.log(Session.get("studentRosterFile"));
    $('#submitFile').removeAttr('disabled');
  },

  'click #submitFile' ( event, template ) {
    template.uploading.set( true );
    var csv_file = $('input[name="uploadCSV"]')[0].files[0];
    var reader = new FileReader();

    reader.onload = function(event) {
      var buffer = new Uint8Array(reader.result) // convert to binary
            Meteor.call('saveFile', buffer);
    }

    reader.readAsArrayBuffer(csv_file); //read the file as arraybuffer

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
