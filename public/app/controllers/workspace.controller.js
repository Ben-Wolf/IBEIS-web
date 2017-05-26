/* var workspace = */

angular
	.module('workspace')
	.controller('workspace-controller', [
		'$rootScope', '$scope', '$routeParams', '$mdSidenav', '$mdToast', '$mdDialog', '$mdMedia', '$http', '$sce', 'reader-factory', 'Wildbook', 'leafletData',
		function($rootScope, $scope, $routeParams, $mdSidenav, $mdToast, $mdDialog, $mdMedia, $http, $sce, readerFactory, Wildbook, leafletData) {

	//DECLARE VARIABLES
	$scope.last_jobid = "jobid-0004";
	$scope.reviewOffset = 0;
	$scope.workspace = null;
	$scope.workspace_occ = [];
	$scope.workspace_input = {};
	$scope.reviewData = {};
	$scope.datetime_model = new Date(); //default/test date, should never be seen
	$scope.pastDetectionReviews = [];
  $scope.loading = 'off';

	//used for saving info using the datepicker
	$scope.set_datetime_model = function() {
		$scope.datetime_model = new Date($scope.mediaAsset.dateTime);
	};

	//Might be outdated, used sometimes to query with specific parameters
	$scope.queryWorkspace = function(params) {
	  // $scope.workspace = "Loading...";
	  // params.class = "org.ecocean.media.MediaAssetSet";
	  $scope.loading = 'on';
	  console.log(params);
	  $scope.workspace_args = params;
	  $.ajax({
	      type: "POST",
	      url: 'http://wb.scribble.com/TranslateQuery',
	      data: params,
	      dataType: "json"

	  }).then(function(data) {
      $scope.loading = 'off';
      // this callback will be called asynchronously
      // when the response is available
      $scope.$apply(function() {
          $scope.currentSlides = data.assets;
      })
	  }).fail(function(data) {
      $scope.loading = 'off';
      console.log("failed workspaces query");
    });
  };

	//query all workspaces to populate workspace dropdown
	$scope.queryWorkspaceList = function() {
		Wildbook.retrieveWorkspaces(undefined).then(function(data) {
			console.info('data -> %o', data);
	    if (!data || (data.length < 1)) {
	        console.warn('queryWorkspaceList() got empty data');
	        return;
	    }
			//We need to decide a proper variable for saving workspace data. do we need 1 or 2
			$scope.$apply(function() {

				data = data.slice(1, (data.length - 2));
				$scope.workspaces = data.split(", ");
				$scope.setWorkspace($scope.workspaces[0], false);
			})
		}).fail(function(data) {
			console.log("failed workspaces get");
		});
	}

	$scope.queryWorkspaceList();

	//used for index in workspace
	$scope.image_index = -1;

	//used for filtering/other sidenavs
	$scope.toggleSidenav = function(menuId) {
		$mdSidenav(menuId).toggle();
	};

	var last = {
		bottom: false,
		top: true,
		left: false,
		right: true
	};

	//TODO comment what this does
	$scope.toastPosition = angular.extend({}, last);
	$scope.getToastPosition = function() {
		sanitizePosition();
		return Object.keys($scope.toastPosition)
			.filter(function(pos) {
				return $scope.toastPosition[pos];
			})
			.join(' ');
	};


	/* SIDENAVS */
	$scope.close = function(id) {
		$mdSidenav(id).close();
		//sets image-focus to null.  If multiple sidenavs are toggled this could cause an issue (maybe).
		$scope.image_index = -1;
	};

	/* TYPE MENU */
	//Used for top-right selector to change the data between the below 3 items
	// $scope.types = ['images', 'annotations', 'animals'];
	$scope.types = ['images'];
	$scope.type = $scope.types[0];

	$scope.setType = function(t) {
		if ($scope.type != t) {
			$scope.type = t;
		}
	};

	/* WORKSPACES */
	$scope.setWorkspace = function(id_, checkSame) {
		// break if we are checking for the same workspace, otherwise
		//  this should be used as a sort of refresh
		if (checkSame && $scope.workspace === id_) return;
		$scope.workspace = "Loading...";

		if (!id_) {
        console.warn('setWorkspace() not passed an id; failing!');
        alert('setWorkspace() was not passed an id.  :(');
        return;
    }

		$scope.refreshReviews();
		Wildbook.getWorkspace(id_)
		.then(function(data) {
			console.log("Getting Workspace: " + id_);
			console.log("There are " + String(data.assets.length) + " pictures in this workspace.");
			$scope.workspace = id_;
			$scope.currentSlides = data.assets;
			$scope.workspace_args = data.metadata.TranslateQueryArgs;
			$scope.workspace_occ = $rootScope.Utils.keys(data.metadata.occurrences);
			$scope.$apply();
			$scope.map.refreshMap();
		}).fail(function(data) {
			console.log("failed workspace get");
		});
	};

	$scope.viewAllImages = function(checkSame) {
		if (checkSame && $scope.workspace === "All Images") return;
		$scope.workspace = "Loading...";
		$scope.refreshReviews();
		Wildbook.getAllMediaAssets().then(function(response) {
			console.log(response);
			$scope.workspace = "All Images";
			$scope.currentSlides = response.data;
			$scope.workspace_args = "all";
			$scope.map.refreshMap();
		});
	};

	//used when save button is pressed
	$scope.saveWorkspace = function() {
		var id = $scope.workspace_input.form_data;
		var args = $scope.workspace_args;
		Wildbook.saveWorkspace(id, args)
		.then(function(data) {
			$scope.queryWorkspaceList();
		}).fail(function(data) {
			console.log("success or failure - needs fixing");
			console.log(data);
			$scope.queryWorkspaceList();
		});
	};

	$scope.saveNewWorkspace = function(ev) {
		var confirm = $mdDialog.prompt()
		.title('Save Workspace')
		.textContent('What would you like to name this workspace?')
		.placeholder('Enter a name')
	  .ariaLabel('Workspace name')
	  .targetEvent(ev)
	  .ok('SAVE')
	  .cancel('CANCEL');
		$mdDialog.show(confirm).then(function(result) {
			var id = result;
			var args = $scope.workspace_args;
			Wildbook.saveWorkspace(id, args)
			.then(function(data) {
				console.log("Saved workspace");
				$scope.queryWorkspaceList();
			}).fail(function(data) {
				console.log("success or failure - needs fixing");
				console.log(data);
				$scope.queryWorkspaceList();
			});
		});
	};

	$scope.deleteWorkspace = function() {
		var confirm = $mdDialog.confirm()
		.title('Are you sure you want to delete this workspace?')
		.textContent('All of your images will remain in the database.')
		.ok('Yes')
		.cancel("No");
		$mdDialog.show(confirm).then(function() {
			Wildbook.deleteWorkspace($scope.workspace)
			.then(function(data) {
				$scope.queryWorkspaceList();
			}).fail(function(data) {
				console.log("success or failure - needs fixing");
				console.log(data);
				$scope.queryWorkspaceList();
			});
		}, function() {
			console.log("said no to changing!");
		});
	};

	$scope.save_datetime = function() {
		console.log("saving");
		//this has to have user input
		//need to find out params for image edit
		var params = $.param({
			datetime: $scope.workspace_input.datetime_input,
			id: $scope.mediaAssetId
		});
		console.log($scope.workspace_input.datetime_input);
		console.log(params);
		Wildbook.saveDateTime(params)
		.then(function(data) {
			console.log("save complete " + data);
			console.log($scope.mediaAssetId);
			$http.get('http://wb.scribble.com/MediaAssetContext?id=' + $scope.mediaAssetId)
			.then(function(response) {
				$scope.mediaAsset.dateTime = $scope.workspace_input.datetime_input;
				console.log($scope.workspace_input.datetime_input);
			});
		}).fail(function(data) {
			console.log("success or failure - needs fixing");
			console.log(data);
			$scope.queryWorkspaceList();
		});
	};

	/* FILTERING */
	$scope.filterIDs = ['Encounter', 'Marked Individual', 'Annotation', 'Media Asset'];
	$scope.filterID = $scope.filterIDs[0];
	$scope.setFilter = function(f) {
		$scope.filterID = f;
	};

	//used to catch all form data for filtering and send in for query
	$scope.filter = {
		filtering_tests: null,
		filterData: {},
		submitFilters: function() {
			var params = $scope.filter.filterData;

      if ($scope.filterID == 'Encounter'){ params.class = "org.ecocean.Encounter"}
      if ($scope.filterID == 'Marked Individual'){ params.class = "org.ecocean.MarkedIndividual"}
      if ($scope.filterID == 'Annotation'){ params.class = "org.ecocean.Annotation"}
      if ($scope.filterID == 'Media Asset'){ params.class = "org.ecocean.MediaAsset"}
      // params = JSON.stringify(params);
			$scope.queryWorkspace(params);
			$scope.close('filter');
		},

		undoFilter: function() {
			var toast = $mdToast.simple()
			.content('You undid your last filter!')
			.action('REDO')
			.highlightAction(false)
			.position($scope.getToastPosition());

			$mdToast.show(toast).then(function(response) {
				if (response == 'redo') {
					alert('You redid the filter.');
				}
			});
		}
	};

	//fake filtering data
	$http.get('assets/json/fakeClassDefinitions.json').then(function(data) {
		$scope.filter.filtering_tests = data;
	});

	//used in table view
	$scope.convertDateTime = function(dateTime) {
		try {
			return new Date(dateTime).toISOString().substring(0, 10);
		} catch (e) {
			return "No Date Provided";
		}
	};

	$scope.refreshReviews = function(callback = function() {return;}) {
		Wildbook.getReviewCounts().then(function(response) {
			$scope.reviewCounts = response;
			console.log($scope.reviewCounts);

			callback();
			// Some cases require reviewCounts to be updated before proceeding
			// Pass function as callback to stall until reviews refreshed
		});
	};

	//object where all identification methods are stored
	$scope.identification = {
		startIdentification: function(ev) {
			$scope.refreshReviews();
			var confirm = $mdDialog.confirm()
			.title('Would you like to run identification?')
			.textContent('You will be running identification on ' + $scope.workspace_occ.length + ' occurrences.')
			.targetEvent(ev)
			.ok('Yes')
			.cancel('Not Right Now');

			$mdDialog.show(confirm).then(function() {
				console.log("starting identification");
				Wildbook.runIdentification($scope.workspace_occ).then(function(data) {
					console.log(data);
				});
			});
		},

		showIdentificationReview: function(ev) {
			$scope.refreshReviews();
			$scope.identification.getReview();
		},

		getReview: function() {
			Wildbook.getIdentificationReview().then(function(response) {
				console.log(response);
			});
		}
	};

	//object where all detection functions are stored
	$scope.detection = {
		startDetection: function(ev) {
			$scope.detection.firstRun = true;
			Wildbook.findMediaAssetSetIdFromUploadSet($scope.workspace)
			.then(function(response) {
				// console.log(String(response.data.metadata.TranslateQueryArgs.query.id))
				if (response.data.metadata.TranslateQueryArgs.query) {
					console.log(response.data.metadata.TranslateQueryArgs.query.id);
					Wildbook.runDetection(response.data.metadata.TranslateQueryArgs.query.id)
					.then(function(data) {
						// this callback will be called asynchronously
						// when the response is available
						$scope.$apply(function() {
							//detection has started.  Save the job id, then launch review
							if (data.success) {
								$scope.last_jobid = data.sendDetect.response;
								console.log("New jobID " + data.sendDetect.response);
								$scope.detection.showDetectionReview(ev);
							}
							else {
								console.log('error: ' + data.error);
								$scope.detection.startDetectionByImage(ev);
							}
						});
					}).fail(function(data) {
						console.log('IA server error');
						$scope.detection.startDetectionByImage(ev);

							// $mdDialog.show(
								// $mdDialog.alert()
								// .clickOutsideToClose(true)
								// .title('Error')
								// .textContent('No Response from IA server.')
								// .ariaLabel('IA Error')
								// .ok('OK')
								// .targetEvent(ev)
							// )
					});
				}
				else {
					console.log('error: no valid mediaAssetSetId');
					$scope.detection.startDetectionByImage(ev);
				}
			});
		},

		startDetectionByImage: function(ev) {
			var ids = [];
			for (i=0; i<$scope.currentSlides.length; i++) {
				ids.push($scope.currentSlides[i].id);
			}
			Wildbook.runDetectionByImage(ids)
			.then(function(data) {
				// this callback will be called asynchronously
				// when the response is available
				$scope.$apply(function() {
					//detection has started.  Save the job id, then launch review
					if (data.success) {
						$scope.last_jobid = data.sendDetect.response;
						console.log("New jobID " + data.sendDetect.response);
						$scope.detection.showDetectionReview(ev);
					}
				});
			}).fail(function(data) {

				$mdDialog.show(
					$mdDialog.alert()
					.clickOutsideToClose(true)
					.title('Error')
					.textContent('No Response from IA server.')
					.ariaLabel('IA Error')
					.ok('OK')
					.targetEvent(ev)
				)
			});
		},

		//used to query for results every 3 seconds until it gets a response
		startCheckDetection: function() {
			$scope.reviewData.reviewReady = false;
			$scope.waiting_for_response = true;
			$scope.detection.reviewCompleteText = '';
			$scope.detection.getNextDetectionHTML();
			// $scope.detection.detectionChecker = setInterval($scope.detection.checkLoadedDetection, 500);
		},

		//check function every x seconds
		checkLoadedDetection: function() {
			if ($scope.reviewCounts.detection > 0) {
				clearInterval($scope.detection.detectionChecker);
				$scope.detection.getNextDetectionHTML();
			}
			else {
				$scope.refreshReviews();
			}
			// var myElem = document.getElementById('ia-detection-form');
			// if (myElem != null) {
			//	 clearInterval($scope.detection.detectionChecker);
			//	 $scope.$apply(function() {
			//		 $scope.reviewData.reviewReady = true;
			//	 });
			// }
		},

		//creates a dialog
		showDetectionReview: function(ev) {
			$mdDialog.show({
				scope: $scope,
				preserveScope: true,
				templateUrl: 'app/views/includes/workspace/detection.review.html',
				targetEvent: ev,
				clickOutsideToClose: false,
				fullscreen: true

			});
			$scope.refreshReviews($scope.detection.startCheckDetection);
		},

		detectDialogCancel: function() {
			$mdDialog.cancel();
		},
		//unused?
		detectDialogHide: function() {
			$mdDialog.hide();
		},
		//on button click prev/next/saveandexit
		submitDetectionReview: function() {
			$('#ia-detection-form').unbind('submit').bind('submit', function(ev) {
				ev.preventDefault();
				$.ajax({
					url: $(this).attr('action'),
					type: $(this).attr('method'),
					dataType: 'json',
					data: $(this).serialize()

				}).then(function(data) {
					console.log("submit successful");
					$scope.refreshReviews($scope.detection.getNextDetectionHTML);
				}).fail(function(data) {
					console.log("submit failed");
				});
				return false;
			});
			$('#ia-detection-form').submit();
		},

				//temp function
				nextClicked: function() {
					if(document.getElementsByName("mediaasset-id")[0] != null){
						$scope.pastDetectionReviews.push(document.getElementsByName("mediaasset-id")[0].value);
					}
					$scope.reviewData.reviewReady = false;
					$scope.waiting_for_response = true;
					document.getElementById("detection-loading").style.visibility="visible";
					document.getElementById("detection-loading").style.height="auto";
					document.getElementById("detection-review").style.visibility="hidden";
					document.getElementById("detection-review").style.height="0px";
					console.log($scope.pastDetectionReviews);
					$scope.detection.submitDetectionReview();
					//add logic for only allowing numbers in range of images
					// $scope.reviewOffset = $scope.reviewOffset + 1;
					// $scope.detection.getNextDetectionHTML();
					// $scope.detection.loadDetectionHTMLwithOffset();
				},
				//temp function
				decrementOffset: function() {
					//go back to last detection

					// $scope.detection.submitDetectionReview();
					//add logic for only allowing numbers in range of images
					// $scope.reviewOffset = $scope.reviewOffset - 1;
					// $scope.detection.loadDetectionHTMLwithOffset();
				},
				//temp function
				endReview: function() {
					//do Submit of current review
					$scope.detection.submitDetectionReview();
					//exit
					$scope.detection.detectDialogCancel();
				},
				getNextDetectionHTML: function() {
					if (!$scope.detection.firstRun && $scope.reviewCounts.detection == 0) {
						console.log('No detections remaining');
						if (document.getElementById("detection-complete")) {
							$scope.detection.reviewCompleteText = 'Detection Review Complete!';
							document.getElementById("detection-loading").style.visibility="hidden";
							document.getElementById("detection-loading").style.height="0px";
						}
					}
					else {
						$scope.detection.firstRun = false;
						var time = new Date().getTime();
						console.log("http://wb.scribble.com/ia?getDetectionReviewHtmlNext&time=" + time);
						$("#detection-review").load("http://wb.scribble.com/ia?getDetectionReviewHtmlNext&time=" + time, function(response, status, xhr) {
							if ($scope.pastDetectionReviews.length <= 0) {
								$scope.detection.allowBackButton = false;
							} else {
								$scope.detection.allowBackButton = true;
							}
							if (status == 'success') {
								document.getElementById("detection-loading").style.visibility="hidden";
								document.getElementById("detection-loading").style.height="0px";
								document.getElementById("detection-review").style.visibility="visible";
								document.getElementById("detection-review").style.height="auto";
								console.log("detection review loaded");
								$scope.waiting_for_response = false;
								$scope.reviewData.reviewReady = true;
							}
							else {
								console.log('error retrieving next detection');
							}
						});
					}
				},
				loadDetectionHTMLwithOffset: function() {
					 console.log("http://wb.scribble.com/ia?getDetectReviewHtml=" + $scope.last_jobid + "&offset=" + $scope.reviewOffset);
					 $("#detection-review").load("http://wb.scribble.com/ia?getDetectReviewHtml=" + $scope.last_jobid + "&offset=" + $scope.reviewOffset);
				},
				// //queries for the actual detection html and sets it in the page
				// loadDetectionHTML: function() {
				//	 $scope.reviewOffset = 0;
				//	 console.log("http://wb.scribble.com/ia?getDetectReviewHtml=" + $scope.last_jobid);
				//	 $("#ibeis-process").load("http://wb.scribble.com/ia?getDetectReviewHtml=" + $scope.last_jobid);
				// }


			};


			/* SIDENAVS */
			$scope.close = function(id) {
				$mdSidenav(id).close();
				//sets image-focus to null.  If multiple sidenavs are toggled this could cause an issue (maybe).
				$scope.image_index = -1;
			};


			/* SHARE DIALOG */
			$scope.showShareDialog = function(ev) {
				$mdDialog.show(
					$mdDialog.alert({
						title: 'Share',
						content: 'This is where the share dialog will be.',
						ok: 'Close'
					})
				);
			};


			$scope.confirmDialog = function(string) {
				$mdDialog.show(
					$mdDialog.alert()
					.clickOutsideToClose(true)
					.title('Cancelled')
					.textContent(string)
					.ariaLabel('Alert')
					.ok('OK')
				);
			};


			/* IMAGE INFO DIALOG */
			function ImageDialogController($scope, $mdDialog, mediaAsset) {
				var mediaAssetId = mediaAsset.id;
				$scope.mediaAssetId = mediaAsset.id;
				$http.get('http://wb.scribble.com/MediaAssetContext?id=' + mediaAssetId)
					.then(function(response) {
						$scope.mediaAssetContext = response.data;
					});
				$scope.mediaAsset = mediaAsset;
				$scope.hide = function() {
					$mdDialog.hide();
				};
				$scope.cancel = function() {
					$mdDialog.cancel();
				};
			};
			//launched on image click, uses the above controller
			$scope.showImageInfo = function(ev, index) {
				var asset = $scope.currentSlides[index];
				$scope.image_index = index;
				$mdDialog.show({
					controller: ImageDialogController,
					templateUrl: 'app/views/includes/workspace/image.info.html',
					targetEvent: ev,
					clickOutsideToClose: true,
					fullscreen: true,
					scope: $scope,
					preserveScope: true,
					locals: {
						mediaAsset: asset
					}
				});
			};


			$scope.toggleLogo = function() {
				var logo = $('#logo');
				if (logo.css('display') === 'none') {
					logo.show();
				} else {
					logo.hide();
				}
			};

			/* VIEW MENU */
			$scope.views = ['thumbnails', 'table', 'map'];
			// $scope.views = ['thumbnails', 'table'];
			$scope.view = $scope.views[0];
			$scope.setView = function(v) {
				$scope.view = v;
			};
			$scope.logoVisible = function() {
				var logo = $('#logo');
				if (logo.css('display') === 'none') {
					return false;
				} else {
					return true;
				}
			};

			var exifToDecimal = function(coords) {
				return (coords[0].numerator
						+ coords[1].numerator/60
						+ (coords[2].numerator/coords[2].denominator)
						/ 3600).toFixed(4);
			}

			//Leaflet map
			$scope.map = {
				center: {
					lat: 0,
					lng: 0,
					zoom: 4
				},
				options: {
					draggable: true,
					zoomControl: true
				},
				markers: [],
				centerMarkers: function() {
					// Centers map on average location of markers
					var centerLat = 0;
					var centerLng = 0;
					for (i=0; i<$scope.map.markers.length; i++) {
						var latLng = $scope.map.markers[i].getLatLng();
						centerLat += latLng.lat;
						centerLng += latLng.lng;
					}
					if ($scope.map.markers.length > 0) {
						centerLat /= $scope.map.markers.length;
						centerLng /= $scope.map.markers.length;
					}
					$scope.map.center.lat = centerLat;
					$scope.map.center.lng = centerLng;
					leafletData.getMap().then(function(map) {
						map.setView($scope.map.center, $scope.map.center.zoom);
					});
				},
				setBounds: function() {
					// Centers map on markers via fitBounds
					var nLat = 0;
					var sLat = 0;
					var eLng = 0;
					var wLng = 0;
					for (i=0; i<$scope.map.markers.length; i++) {
						var m = $scope.map.markers[i].getLatLng;
						nLat = Math.max(nLat, m.lat);
						sLat = Math.min(sLat, m.lat);
						eLng = Math.max(eLng, m.lng);
						wLng = Math.min(wLng, m.lng);
					}
					leafletData.getMap().then(function(map) {
						map.fitBounds([[sLat,wLng],[nLat,eLng]]);
					});
				},
				invalidateSize: function() {
					leafletData.getMap().then(function(map) {
						map.invalidateSize();
					});
				},
				refreshMap: function() {
					leafletData.getMap().then(function(map) {
						// Clear previous markers
						for (i=0; i<$scope.map.markers.length; i++) {
							map.removeLayer($scope.map.markers[i]);
						}
						$scope.map.markers = [];
						for (i=0; i<$scope.currentSlides.length; i++) {
							// Get image location
							Wildbook.getMediaAssetDetails($scope.currentSlides[i].id).then(function(response) {
								var lat;
								var lng;
								var id;
								// Currently uses 'userLatitude'/'userLongitude'
								// Will switch to 'latitude'/'longitude' eventually
								if (response.userLatitude) {
									lat = response.userLatitude;
								}
								else if (response.latitude) {
									lat = response.latitude;
								}
								if (response.userLongitude) {
									lng = response.userLongitude;
								}
								else if (response.longitude) {
									lng = response.longitude;
								}
								if (lat && lng) {
									// Place marker for applicable images
									var marker = new L.marker([lat,lng]);
									var ptxt = "imageID: " + response.id
												+ "<br><img src='"
												+ response.url
												+ "' style='max-width:150px !important; max-height:200px;"
												+ " width:auto; height:auto'>"
												+ "<br>" + lat + " N"
												+ "<br>" + lng + " E";
									marker.bindPopup(ptxt);
									map.addLayer(marker);
									$scope.map.markers.push(marker);
									$scope.map.centerMarkers();
								}
							});
						}
						// Due to asynchronous API calls, this may be called before markers in place
						// $scope.map.invalidateSize();
						$scope.map.centerMarkers();
						// $scope.map.setBounds();
					});
				}
			};

			//everything below is upload

			// stages:
			//  - 0 = select
			//  - 1 = upload
			//  - 2 = occurence
			//  - 3 = complete

            // $scope.$watch('files.length',function(newVal,oldVal){
            // console.log($scope.files);
            // });
            // $scope.onSubmit = function(){
            // var formData = new FormData();
            // angular.forEach($scope.files,function(obj){
            //     formData.append('files[]', obj.lfFile);
            // });
            // $http.post('./upload', formData, {
            //     transformRequest: angular.identity,
            //     headers: {'Content-Type': undefined}
            // }).then(function(result){
            //     $scope.upload.completionCallback(formData);
            // },function(err){
            //     // do sometingh
            // });
            // };
			$scope.upload = {
				types: Wildbook.types,
				type: "local",
				updateType: function() {
					var t = $routeParams.upload;
					if (t && _.indexOf($scope.upload.types, t) !== -1) {
						$scope.upload.type = t;
					}
					console.log($scope.upload.type);
				},
				dialog: {
					templateUrl: 'app/views/includes/workspace/upload.dialog.html',
					clickOutsideToClose: true,
					fullscreen: true,
					preserveScope: true,
					scope: $scope
				},
				stage: 0,
				mediaAssetSetId: null,
				images: [],
				totalProgress: 0,
				reset: function() {
					$scope.upload.stage = 0;
					$scope.upload.images = [];
					$scope.upload.totalProgress = 0;
				},
				select: function(element) {
					var justFiles = $.map(element.files, function(val, key) {
						return val;
					}, true);

					console.log(justFiles);

					var fileEquality = function(f1, f2) {
						if (f1.name != f2.name) return false;
						if (f1.size != f2.size) return false;
						if (f1.type != f2.type) return false;
						if (f1.lastModified != f2.lastModified) return false;
						return true;
					}
					for (i in justFiles) {
						var contains = false;
						var file = justFiles[i];
						for (i in $scope.upload.images) {
							if (fileEquality(file, $scope.upload.images[i])) {
								contains = true;
								break;
							}
						}
						if (!contains) {
							var index = $scope.upload.images.push(file) - 1;
							readerFactory.readAsDataUrl(file, $scope, index);
						}
					}
				},
				remove: function(i) {
					$scope.upload.images.splice(i, 1);
				},
				show: function(ev) {
					$mdDialog.show($scope.upload.dialog);
				},
				close: function() {
					$mdDialog.cancel();
				},
				progressCallback: function(index, progress) {
					$scope.upload.images[index].progress = progress;
					$scope.upload.updateProgress();
				},
				failureCallback: function() {
					alert("Failed to upload files");
					$scope.upload.stage = 0;
					console.log($scope.upload.stage);
					$scope.upload.close();
				},
				completionCallback: function(assets) {
					console.log ("upload completed");
					$scope.upload.stage = 0;
					$scope.upload.uploadSetDialog.assets = assets;
					$scope.upload.uploadSetDialog.updateUploadSets();
					$scope.upload.close();
					alert("Successfully uploaded");
					// $mdDialog.show($scope.upload.uploadSetDialog.dialog); // Not sure what the goal is
				},
				uploadSetDialog: {
					assets: null,
					dialog: {
						templateUrl: 'app/views/includes/workspace/completed_upload.dialog.html',
						clickOutsideToClose: false,
						preserveScope: true,
						scope: $scope
					},
					addToOption: null,
					uploadSets: null,
					updateUploadSets: function() {
						Wildbook.retrieveWorkspaces(true).then(function(data) {
console.info('data -> %o', data);
                                                        if (!data || (data.length < 1)) {
                                                            console.warn('updateUploadSets() got empty data');
                                                            return;
                                                        }
							data = data.slice(1, (data.length - 2));
							$scope.upload.uploadSetDialog.uploadSets = _.without(data.split(", "), "*undefined*");
						});
					},
					uploadSetName: "",
					completeUpload: function() {
						console.log("COMPLETING UPLOAD: creating a workspace");
						var set = $scope.upload.uploadSetDialog.uploadSetName;
						var assets = $scope.upload.uploadSetDialog.assets;
						switch ($scope.upload.uploadSetDialog.addToOption) {
							case "new":
								Wildbook.requestMediaAssetSet().then(function(response) {
									var id = response.data.mediaAssetSetId;
									Wildbook.createMediaAssets(assets, id).then(function(response) {
										console.log(response);
										var setArgs = {
											query: {
												id: id
											},
											class: "org.ecocean.media.MediaAssetSet"
										};
										// why does this succeed but return a failure
										Wildbook.saveWorkspace(set, setArgs).then(function(response) {
											console.log(response);
										}, function(response) {
											console.log(response);
											$scope.queryWorkspaceList();
											$scope.setWorkspace(set, false);
											$mdDialog.hide($scope.upload.uploadSetDialog.dialog);
										});
									});
								});
								break;
							case "existing":
								Wildbook.findMediaAssetSetIdFromUploadSet(set).then(function(response) {
									var id = response.data.metadata.TranslateQueryArgs.query.id;
									if (id == undefined) id = JSON.parse(response.data.metadata.TranslateQueryArgs.query).id;
									console.log("id: " + id);
									Wildbook.createMediaAssets(assets, id).then(function(response) {
										console.log(response);
										$scope.queryWorkspaceList();
										$scope.setWorkspace(set, false);
										$mdDialog.hide($scope.upload.uploadSetDialog.dialog);
									});
								});
								break;
							default:
								Wildbook.createMediaAssets(assets).then(function(response) {
									$scope.viewAllImages();
									$mdDialog.hide($scope.upload.uploadSetDialog.dialog);
								});
						}
					},
					generateName: function() {
						var date = new Date();
						var dateString = date.toDateString();
						var timeString = date.toTimeString();
						var generated = dateString + " " + timeString;
						$scope.upload.uploadSetDialog.uploadSetName = generated;
					},
					reset: function() {
						$scope.upload.uploadSetDialog.uploadSetName = "";
					}
				},
				upload: function() {
					$scope.upload.stage = 1;
					Wildbook.upload($scope.upload.images, $scope.upload.type, $scope.upload.progressCallback, $scope.upload.completionCallback, $scope.upload.failureCallback);
				},
				updateProgress: function() {
					var max = 100 * $scope.upload.images.length;
					var sum = 0;
					for (i in $scope.upload.images) {
						sum = sum + $scope.upload.images[i].progress;
					}
					$scope.upload.totalProgress = Math.round(sum / max * 100);
				}
			};

			$scope.lewaUpload = {
				dialog: {
					templateUrl: 'app/views/includes/workspace/upload/lewa.dialog.html',
					clickOutsideToClose: true,
					fullscreen: true,
					preserveScope: true,
					scope: $scope
				},
				show: function(ev) {
					$mdDialog.show($scope.lewaUpload.dialog);
				},
				close: function(ev) {
					$mdDialog.hide($scope.lewaUpload.dialog);
				},
				selectXML: function(element) {
					var justFile = $.map(element.files, function(val, key) {
						return val;
					}, true);
					$scope.lewaUpload.xml = justFile;
					$scope.$apply();
					console.log($scope.lewaUpload.xml);
				},
				selectFolder: function(element) {
					var justFiles = $.map(element.files, function(val, key) {
						return val;
					}, true);
					$scope.lewaUpload.images = justFiles;
					$scope.$apply();
					console.log($scope.lewaUpload.images);
				},
				images: null,
				xml: null
			};

			/* An intermediate function to link an md-button to a
			hidden file input */
			$scope.proxy = function(id) {
				angular.element($('#' + id)).click();
			};
			$scope.upload.updateType();

		}
	])
	.service('reader-factory', ['$q', function($q) {

		var onLoad = function(reader, deferred, scope) {
			return function() {
				scope.$apply(function() {
					deferred.resolve(reader.result);
				});
			};
		};

		var onError = function(reader, deferred, scope) {
			return function() {
				scope.$apply(function() {
					deferred.reject(reader.result);
				});
			};
		};

		var getReader = function(deferred, scope) {
			var reader = new FileReader();
			reader.onload = onLoad(reader, deferred, scope);
			reader.onerror = onError(reader, deferred, scope);
			return reader;
		};

		var readAsDataURL = function(file, scope, index) {
			var deferred = $q.defer();

			var reader = getReader(deferred, scope);
			reader.readAsDataURL(file);

			deferred.promise.then(function(result) {
				scope.upload.images[index].imageSrc = result;
			});
		};

		return {
			readAsDataUrl: readAsDataURL
		};

	}]);

	//don't know, unused
	// function sanitizePosition() {
	// 	var current = $scope.toastPosition;
	// 	if (current.bottom && last.top) current.top = false;
	// 	if (current.top && last.bottom) current.bottom = false;
	// 	if (current.right && last.left) current.left = false;
	// 	if (current.left && last.right) current.right = false;
	// 	last = angular.extend({}, current);
	// };
