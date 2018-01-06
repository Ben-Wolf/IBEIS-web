var workspace = angular
.module('wildbook.service', [])
.service('Wildbook', ['$http', function($http) {
  var service = {};

  service.baseUrl = "http://uidev.scribble.com/";

  // UPLOADING TO S3 AND THROUGH FLOW
  // ==================================
  service.types = ["s3", "local"];
  service.upload = function(images, type, progressCallback, completionCallback, failureCallback) {
    console.log("UPLOADING");
    // retrieve a mediaAssetSetId
    switch (_.indexOf(service.types, type)) {
      case 0:
        // s3
        s3Upload(images, progressCallback, completionCallback);
        break;
      case 1:
        // local
        flowUpload(images, progressCallback, completionCallback, failureCallback);
        break;
        default:
        // doesn't exist
        // TODO: design failure return
        return null;
    }
  };

  // upload to s3
  var s3Upload = function(images, progressCallback, completionCallback) {
  // AWS Uploader Config
  AWS.config.update({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY
  });

  AWS.config.region = 'us-west-2';
  console.log("DOING S3 UPLOAD");
  var s3Uploader = new AWS.S3({
    params: {
      Bucket: 'flukebook-dev-upload-tmp'
    }
  });

  var count = 0;
  var uploads = [];
  var prepend = (new Date()).getTime();
  for (i in images) {
    var key = prepend + '/' + images[i].name;
    var params = {
      Key: key,
      ContentType: images[i].type,
      Body: images[i]
    };

  // start an upload for each of the images
    s3Uploader.upload(params, function(err, data) {
      if (err) {
        console.error(err);
      } else {
        console.log(data);
        var uploadData = {
          bucket: data.Bucket,
          key: data.key
        };

        uploads.push(uploadData);
        count = count + 1;
        if (count >= images.length) completionCallback(uploads);
      }
      }).on('httpUploadProgress', function(data) {
        var progress = Math.round(data.loaded / data.total * 100);
        var index = -1;
        // find the image index, and return that
        for (var j = 0; j < images.length; j++) {
          var testKey = prepend + '/' + images[j].name;
          if (data.key === testKey) {
            index = j;
            break;
          }
        }

        if (index >= 0) {
          progressCallback(index, progress);
        } else {
          console.log("Error: httpUploadProgress failed; image not found");
        }
      });
    };
  };

  // upload to local server with flow
  var flowUpload = function(images, progressCallback, completionCallback, failureCallback, mediaAssetSetId) {
    var flow = new Flow({
      target: service.baseUrl + 'ResumableUpload',
      forceChunkSize: true,
      maxChunkRetries: 5,
      testChunks: false
    });

    var count = 0;
    var assets = [];
    var prog = true;

    flow.on('fileProgress', function(file, chunk) {
      var progress = Math.round(file._prevUploadedSize / file.size * 100);
      var index = -1;
      var fileKey = file.name;
      for (var i = 0; i < images.length; i++) {
        var testKey = images[i].name;
        if (testKey === fileKey) {
          index = i;
          break;
        }
      }

      if (index >= 0) {
        console.log(index + " : " + progress);
        progressCallback(index, progress);
      } else {
        console.log("Error: fileProgress failed; images not found");
      }
    });

    flow.on('fileError', function(file, message, chunk) {
      // TODO: handle error
      console.log("Failed to upload " + file.name);
      failureCallback();
    });

    flow.on('fileSuccess', function(file, message, chunk) {
      console.log("Successfully uploaded " + file);
      var name = file.name;
      assets.push({
          filename: name
      });
      count = count + 1;
      if (count >= images.length) {
        console.log("Assets: %o", assets);
        completionCallback(assets);
      }
    });

    // add files to flow and upload
    for (i in images) {
      flow.addFile(images[i]);
    };

    flow.upload();
  };

    // MEDIA assets
    // ==============

    service.addLabel = function(mediaAssetId, label) {
      console.log("Adding \"" + label + "\" label to " + mediaAssetId);
      return $http.get(service.baseUrl + "MediaAssetModify?id=" + mediaAssetId + "&labelAdd=" + label);
    };

    service.removeLabel = function(mediaAssetId, label) {
      console.log("Removing \"" + label + "\" label from " + mediaAssetId);
      return $http.get(service.baseUrl + "MediaAssetModify?id=" + mediaAssetId + "&labelRemove=" + label);
    };

    // request mediaAssetSet
    service.requestMediaAssetSet = function() {
      return $http.get(service.baseUrl + 'MediaAssetCreate?requestMediaAssetSet').catch(function(e){
        console.log("requestMediaAssetSet failed, error: ", e);
      });
    };

    service.findMediaAssetSetIdFromUploadSet = function(setName) {
      console.log("WORKSPACE = " + setName);
      if (!setName) { alert('findMediaAssetSetIdFromUploadSet() passed no arg'); console.error('no setName passed!'); return; }  //hacky but ya get what ya get
      var params = {
        method: "GET",
        url: service.baseUrl + 'WorkspaceServer',
        params: {
          id: setName
        }
      };

      return $http(params);
    };

    // if no setId is given, create them outside of a MediaAssetSet
    service.createMediaAssets = function(assets, setId) {
      var mediaAssets = null;
      if (setId) {
        mediaAssets = {
          MediaAssetCreate: [{
            setId: setId,
            assets: assets
          }]
        };
      } else {
        mediaAssets = {
          MediaAssetCreate: [{
            assets: assets
          }]
        };
      }

      return $http.post(service.baseUrl + 'MediaAssetCreate', mediaAssets);
    };

    // Waiting for wildbook to set this up.
    service.removeMediaAssetFromWorkspace = function(mediaAssetId_, workspaceId_) {
      var params = $.param({
        mediaAssetId: mediaAssetId_,
        action: "remove",
        id: workspaceId_
      });
      console.log("Deleting media asset " + mediaAssetId_ + " from workspace " + workspaceId_);
      return $.ajax({
        type: "POST",
        url: service.baseUrl + 'WorkspaceServer',
        data: params,
        dataType: "json"
      });
    };


    service.getAllMediaAssets = function() {
      console.log("retrieving all media assets for this user");
      return $http.get(service.baseUrl + 'MediaAssetsForUser');
    };

	  service.getMediaAssetDetails = function(imageID) {
		 // Gets data about MediaAsset
     // Primarily used to parse location data for map view
      return $.ajax({
        type: "GET",
			  url: service.baseUrl + 'MediaAssetContext?id=' + imageID.toString(),
        dataType: "json",
      });
    };

    service.getReviewCounts = function(workspaceID) {
      console.log(service.baseUrl + 'ia?getReviewCounts&workspaceId=' + workspaceID);
      return $.ajax({
        type: "GET",
        url: service.baseUrl + 'ia?getReviewCounts&workspaceId=' + workspaceID,
        dataType: "json",
      });
    };

    // WORKSPACES
    // ============
    service.retrieveWorkspaces = function(isImageSet) {
      if (typeof isImageSet !== 'undefined') {
        return $.ajax({
          type: "GET",
          url: service.baseUrl + 'WorkspacesForUser',
          params: {
            isImageSet: isImageSet
          }
        });
      } else {
        return $.ajax({
          type: "GET",
          url: service.baseUrl + 'WorkspacesForUser'
        });
      }
    };

    service.saveWorkspace = function(name, args) {
      var params = $.param({
        id: String(name),
        args: JSON.stringify(args)
      });

      return $.ajax({
        type: "POST",
        url: service.baseUrl + 'WorkspaceServer',
        data: params,
        dataType: "json"
      });
    };

    service.deleteWorkspace = function(workspaceID) {
      return $.ajax({
        type: "POST",
        url: service.baseUrl + 'WorkspaceDelete',
        data: {
          id: workspaceID
        },
        dataType: "json"
      });
    }

    service.getWorkspace = function(id) {
      if (!id) { alert('getWorkspace() passed no id'); console.error('no id passed!'); return; }  //hacky but ya get what ya get
      return $.ajax({
        type: "GET",
        url: service.baseUrl + 'WorkspaceServer',
        data: {
          id: id
        },
        dataType: "json"
      });
    };

    service.queryWorkspace = function(params) {
      return $.ajax({
        type: "POST",
        url: service.baseUrl + 'TranslateQuery',
        data: params,
        dataType: "json"
      });
    };

    service.saveDateTime = function(params) {
      return $.ajax({
        type: "POST",
        url: service.baseUrl + 'MediaAssetModify',
        data: params,
        dataType: "json"
      });
    };

    service.saveMarkedIndividual=function(params){
      console.log("test");
      console.log(params);
      return $.ajax({
        type: "POST",
        url: service.baseUrl + 'MediaAssetModify',
        data: params,
        dataType: "json"
      });
    };

    // IDENTIFICATION
    // ==================
    service.runIdentification = function(annotations) {
      var params = {
        identify: {
          annotationIds: annotations
        }
      };
      return $.ajax({
        type: "POST",
        url: service.baseUrl + 'ia',
        data: JSON.stringify(params),
        dataType: "json",
        contentType: 'application/javascript'
      });
    };

    service.getIdentificationReview = function() {
      return $.ajax({
        type: "GET",
        url: service.baseUrl + 'ia?getIdentificationReviewHtmlNext&test',
        dataType: "json",
        contentType: 'application/javascript'
      });
    };

    // DETECTION
    // ================
    service.runDetection = function(imageSetID) {
      var params = {
        detect: {
          mediaAssetSetIds: [imageSetID]
        }
      };

      return $.ajax({
        type: "POST",
        url: service.baseUrl + 'ia',
        data: JSON.stringify(params),
        dataType: "json",
        contentType: "application/javascript"
      });
    };

    service.runDetectionByImage = function(imageIDs) {
      var params = {
        detect: {
          mediaAssetIds: imageIDs
        }
      };
      return $.ajax({
        type: "POST",
        url: service.baseUrl + 'ia',
        data: JSON.stringify(params),
        dataType: "json",
        contentType: "application/javascript"
      });
    };


    service.getDetectionReview = function() {
      return $.ajax({
        type: "GET",
        url: service.baseUrl + 'ia?getDetectionReviewHtmlNext&test',
        dataType: "json",
        contentType: 'application/javascript'
      });
    };

    return service;
  }]);
