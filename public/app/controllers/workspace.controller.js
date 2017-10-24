angular
	.module('workspace')
	.controller('workspace-controller', [
		'$rootScope', '$scope', '$routeParams', '$mdSidenav', '$mdToast', '$mdDialog', '$mdMedia', '$http', '$sce', 'reader-factory', 'Wildbook', 'leafletData', '$timeout',
		function($rootScope, $scope, $routeParams, $mdSidenav, $mdToast, $mdDialog, $mdMedia, $http, $sce, readerFactory, Wildbook, leafletData, $timeout) {

	//DECLARE VARIABLES
	$scope.reviewOffset = 0;
	$scope.workspace = null;
	$scope.workspace_occ = [];
	$scope.workspace_input = {};
	$scope.reviewData = {};
	$scope.datetime_model = new Date();
	$scope.pastDetectionReviews = [];
	$scope.pastDetectionUrls = [];
  	$scope.loading = 'off';
	$scope.individual_model="";
	$scope.myDate = new Date();
	$scope.min_date = new Date(
		$scope.myDate.getFullYear()-40,
    $scope.myDate.getMonth(),
    $scope.myDate.getDate()
	)
	$scope.max_date = new Date(
		$scope.myDate.getFullYear(),
		$scope.myDate.getMonth(),
		$scope.myDate.getDate()
	)

	//used for saving info using the datepicker
	$scope.set_datetime_model = function() {
		$scope.datetime_model = new Date($scope.mediaAsset.dateTime);
	};

	//Might be outdated, used sometimes to query with specific parameters
	$scope.queryWorkspace = function(params) {
	  $scope.loading = 'on';
	  $scope.workspace_args = params;
	  $.ajax({
	      type: "POST",
	      url: 'http://uidev.scribble.com/TranslateQuery',
	      data: params,
	      dataType: "json"

	  }).then(function(data) {
	      $scope.loading = 'off';
	      // this callback will be called asynchronously
	      // when the response is available
	      $scope.$apply(function() {
	          $scope.currentSlides = data.assets;
						console.log(data);
	      })
	  }).fail(function(data) {
	      $scope.loading = 'off';
	      console.log("failed workspaces query");
    });
  };

	//query all workspaces to populate workspace dropdown
	$scope.queryWorkspaceList = function() {
		Wildbook.retrieveWorkspaces(undefined).then(function(data) {
	    if (!data || (data.length < 1)) {
	        console.warn('queryWorkspaceList() got empty data');
	        return;
	    }
			//We need to decide a proper variable for saving workspace data. do we need 1 or 2
			$timeout(function(){
				//data = data.slice(1, (data.length - 2));
				$scope.workspacesObj = JSON.parse(data);
				$scope.workspaces=[];
				$scope.workspaceid=[];
				for(var i=0; i<$scope.workspacesObj.length;i++){
					$scope.workspaces.push($scope.workspacesObj[i].name);
				}
				console.log("Workspace Objects ", $scope.workspacesObj);
				console.log("Workspaces ", $scope.workspaces);
				$scope.setWorkspace($scope.workspaces[0], false);
			});
		}).fail(function(data) {
			console.log("failed workspaces get");
		});
	}

	$scope.queryWorkspaceList();

	//don't know, unused
	function sanitizePosition() {
		var current = $scope.toastPosition;
		if (current.bottom && last.top) current.top = false;
		if (current.top && last.bottom) current.bottom = false;
		if (current.right && last.left) current.left = false;
		if (current.left && last.right) current.right = false;
		last = angular.extend({}, current);
	};

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

	// Used to add IAStatus details to slide assets.
	// $scope.addIAStatus = function(i, data) {
	// 	if (i = $scope.currentSlides.length) return 0;
	// 	var id = data.assets[i].id;
	// 	$http.get('http://uidev.scribble.com/mediaAssetContext?id=' + id).then(function(response) {
	// 		console.log(i);
	// 		$scope.currentSlides[i].detectionStatus = response.data.IAStatus.detection;
	// 		console.log($scope.currentSlides[i]);
	// 		$scope.addIAStatus(i + 1, data);
	// 	});
	// };

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
			console.log("Get Workspace Data ", data.assets);
			$timeout(function(){
				$scope.workspace = id_;
				$scope.currentSlides = data.assets;
				$scope.workspace_args = data.metadata.TranslateQueryArgs;
				$scope.workspace_occ = $rootScope.Utils.keys(data.metadata.occurrences);
				$scope.map.refreshMap();
			});
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
		.title('SAVE WORKSPACE')
		.textContent('What would you like to name this workspace?')
		.placeholder('Enter a name')
	  .ariaLabel('workspace name')
	  .targetEvent(ev)
	  .ok('SAVE')
	  .cancel('CANCEL');
		$mdDialog.show(confirm).then(function(result) {

			// Error checking for duplicate names.
			Wildbook.retrieveWorkspaces()
			.then(function(data) {
				data = data.slice(1,data.length - 2).split(", ");
				console.log(data);
				for (var i = 0; i < data.length; i++) {
					console.log(data[i] + " : " + result);
					if (data[i] == result) {
						console.log(data[i] + " : " + result);
						alert("Cannot have duplicate names in retrieve workspaces");
						return 0;
					}
				}

				var id = result;
				var args = $scope.workspace_args;
				var original = $scope.workspace_args.query.id;
				var assets = [];

				$scope.loading = 'on';		// Provides user confirmation that data is loading.
				$scope.currentSlides = [];	// Hides current pictures to confirm loading + more aesthetically pleasing
				Wildbook.requestMediaAssetSet().then(function(response) {
					args.query.id = response.data.mediaAssetSetId;
					Wildbook.getWorkspace($scope.workspace)
					.then(function(data) {
						assets = data.assets;
						Wildbook.createMediaAssets(assets, args.query.id)
						.then(function() {
							var setArgs = {
								query: {
									id: args.query.id
								},
								class: "org.ecocean.media.MediaAssetSet"
							};
							Wildbook.saveWorkspace(result, setArgs)
							.then(function(response) {
								$scope.loading = 'off';				// For some reason saveworkspace fails but succeeds..
							}, function(response) {
								$scope.loading = 'off';
								$scope.queryWorkspaceList();
								$scope.setWorkspace(result, false);
							});
						});
					});
				});
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
		Wildbook.saveDateTime(params)
		.then(function(data) {
			$http.get('http://uidev.scribble.com/MediaAssetContext?id=' + $scope.mediaAssetId)
			.then(function(response) {
				$scope.mediaAsset.dateTime = $scope.workspace_input.datetime_input;
			});
		}).fail(function(data) {
			console.log("success or failure - needs fixing");
			$scope.queryWorkspaceList();
		});
	};

	//save change of marked individuals
	$scope.save_marked_individual=function(){
		console.log($scope.mediaAsset.features);
		var params= $.param({
			features:[
				{
					annotationId: $scope.mediaAsset.features[0].annotationId,
					encounterId: $scope.mediaAsset.features[0].encounterId,
					id: $scope.mediaAsset.features[0].id,
					individualId: $scope.workspace_input.individual_input
				}
			],
			id: $scope.mediaAssetId
		});
		console.log(params);
		Wildbook.saveMarkedIndividual(params).then(function(data){
			$http.get('http://wb.scribble.com/MediaAssetContext?id=' + $scope.mediaAssetId)
		.then(function(response) {
			$scope.mediaAsset.features[0].individualId=$scope.workspace_input.individual_input;
			console.log(response.data);
		});
	}).fail(function(data) {
		console.log(data);
		console.log("fail");
		$scope.queryWorkspaceList();
	})
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

	//used for dynamic sort in table view
	$scope.defaultTableSortProperty="id";
	$scope.reverse=true;

	$scope.tableSortBy = function(newProperty) {
		if(newProperty==$scope.defaultTableSortProperty){$scope.reverse=!$scope.reverse;}

		else{
			$scope.reverse=false;
		}

		$scope.defaultTableSortProperty=newProperty;
	};

	$scope.delteImage=function(ev,index){

	};


	$scope.refreshReviews = function(callback = function() {return;}) {
		console.log($scope.workspace);
		Wildbook.getReviewCounts().then(function(response) {
			$scope.reviewCounts = response;
			// console.log($scope.reviewCounts);

			callback();
			// Some cases require reviewCounts to be updated before proceeding
			// Pass function as callback to stall until reviews refreshed
		});
	};

	$scope.showReviewAnnotation=function(ev){
		$mdDialog.show({
			scope: $scope,
			preserveScope: true,
			templateUrl: 'app/views/includes/workspace/annotation.review.html',
			targetEvent: ev,
			clickOutsideToClose: false,
			escapeToClose: false,
			fullscreen: false
		});
	}


	//object where all identification methods are stored
	$scope.identification ={
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
		currentReviewID : 0,
		startDetection: function(ev) {
			console.log("Detection starting");
			$scope.detection.firstRun = true;
			Wildbook.findMediaAssetSetIdFromUploadSet($scope.workspace)
			.then(function(response) {
				console.log(response);
				if (response.data.metadata.TranslateQueryArgs.query) {
					console.log(response.data.metadata.TranslateQueryArgs.query.id);
					Wildbook.runDetection(response.data.metadata.TranslateQueryArgs.query.id)
					.then(function(data) {
						// this callback will be called asynchronously
						// when the response is available
						console.log(data);
						$scope.$apply(function() {
							//detection has started.  Save the job id, then launch review
							if (data.success) {
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
					});
				}
				else {
					console.log('error: no valid mediaAssetSetId');
					$scope.detection.startDetectionByImage(ev);
				}
			});
		},

		// Function to handle loading and hiding all assets when loading detection
		detectionLoading: function() {
			$scope.reviewData.reviewReady = false;
			$scope.waiting_for_response = true;
			document.getElementById("detection-loading").style.visibility="visible";
			document.getElementById("detection-loading").style.height="auto";
			document.getElementById("detection-review").style.visibility="hidden";
			document.getElementById("detection-review").style.height="0px";
		},

		// Function to handle loading assest when detection is loaded
		detectionLoaded: function() {
			document.getElementById("detection-loading").style.visibility="hidden";
			document.getElementById("detection-loading").style.height="0px";
			document.getElementById("detection-review").style.visibility="visible";
			document.getElementById("detection-review").style.height="auto";
			console.log("detection review loaded");
			$scope.waiting_for_response = false;
			$scope.reviewData.reviewReady = true;
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
					//detection has started. Launch review
					if (data.success) {
						$scope.detection.showDetectionReview(ev);
					}
					console.log(data);
				});
			}).fail(function(data) {
				// Shows failure dialog...
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

		//creates a dialog
		showDetectionReview: function(ev) {
			console.log("Starting detection review");
			$mdDialog.show({
				scope: $scope,
				preserveScope: true,
				templateUrl: 'app/views/includes/workspace/detection.review.html',
				targetEvent: ev,
				clickOutsideToClose: false,
				fullscreen: false,
				escapeToClose: false
			});
			$scope.refreshReviews($scope.detection.startCheckDetection);
		},

		detectDialogCancel: function() {
			$mdDialog.cancel();
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

		submitPrevDetectionReview: function(next_id){
			var prev_idx=$scope.pastDetectionReviews.indexOf(next_id)-1;
			var prev_id=0;
			if(prev_idx<-1){
				 prev_id=$scope.pastDetectionReviews[$scope.pastDetectionReviews.length-1];
			}else{
				 prev_id=$scope.pastDetectionReviews[prev_idx];
			}

			$('#ia-detection-form').unbind('submit').bind('submit', function(ev) {
				ev.preventDefault();
				$.ajax({
					url: $(this).attr('action'),
					type: $(this).attr('method'),
					dataType: 'json',
					data: $(this).serialize()

				}).then(function(data) {
					console.log("submit successful");
					$scope.refreshReviews($scope.detection.getNextDetectionHTMLById(prev_id));
					$scope.detection.currentReviewID=prev_id;
				}).fail(function(data) {
					console.log("submit failed");
				});
				return false;
			});
			$('#ia-detection-form').submit();
		},

		submitPrevNextDetectionReview:function(next_id){
			var prev_idx=$scope.pastDetectionReviews.indexOf(next_id)-1;
			var prev_id=0;
			if(prev_idx<-1){
				 prev_id=$scope.pastDetectionReviews[$scope.pastDetectionReviews.length-1];
			}else{
				 prev_id=$scope.pastDetectionReviews[prev_idx];
			}


			$('#ia-detection-form').unbind('submit').bind('submit', function(ev) {
				ev.preventDefault();
				$.ajax({
					url: $(this).attr('action'),
					type: $(this).attr('method'),
					dataType: 'json',
					data: $(this).serialize()

				}).then(function(data) {
					console.log("submit successful");
					$scope.refreshReviews($scope.detection.getNextDetectionHTMLById(next_id));
					$scope.detection.currentReviewID=next_id;
				}).fail(function(data) {
					console.log("submit failed");
				});
				return false;
			});
			$('#ia-detection-form').submit();

		},

		// When user clicks for next image
		getNext: function() {
			if($scope.pastDetectionReviews.indexOf($scope.detection.currentReviewID)<0||$scope.pastDetectionReviews.indexOf($scope.detection.currentReviewID)===$scope.pastDetectionReviews.length-1){
				if(document.getElementsByName("mediaasset-id")[0] != null) {
					$scope.pastDetectionReviews.push(document.getElementsByName("mediaasset-id")[0].value);
					$http.get('http://uidev.scribble.com/MediaAssetContext?id=' + document.getElementsByName("mediaasset-id")[0].value)
					.then(function(response) {
						console.log(response);
						$scope.pastDetectionUrls.push(response.url);
						$scope.detection.detectionLoading();
						console.log($scope.pastDetectionReviews);
						console.log($scope.pastDetectionUrls);
						$scope.detection.submitDetectionReview();
						$scope.detection.currentReviewID=document.getElementsByName("mediaasset-id")[0].value;
					});
				}
				else {
					$scope.detection.detectionLoading();
					console.log($scope.pastDetectionReviews);
					$scope.detection.submitDetectionReview();
					$scope.detection.currentReviewID=document.getElementsByName("mediaasset-id")[0].value;
				}
			} else {
				var next_idx=$scope.pastDetectionReviews.indexOf($scope.detection.currentReviewID)+1;
				var next_id=$scope.pastDetectionReviews[next_idx];
				$scope.detection.detectionLoading();
				console.log($scope.pastDetectionReviews);
				$scope.detection.submitPrevNextDetectionReview(next_id);
				$scope.detection.currentReviewID=next_id;
			}
		},

		// Go back to previous image
		getPrev: function() {
			//go back to last detection
			//console.log(document.getElementsByName("mediaasset-id")[0].value);
			$scope.detection.detectionLoading();
			var id=document.getElementsByName("mediaasset-id")[0].value;
		 	if($scope.pastDetectionReviews.indexOf(id)<0){
				$scope.pastDetectionReviews.push(id);
		 	}
		 	console.log($scope.pastDetectionReviews);
			$scope.detection.submitPrevDetectionReview(id);
		},

		// Load an image based off its media asset it
		loadDetectionHTMLwithById: function(id){
			$scope.detection.detectionLoading();
			console.log("http://uidev.scribble.com/ia?getDetectionReviewHtmlId="+ id);
			$("#detection-review").load("http://uidev.scribble.com/ia?getDetectionReviewHtmlId="+ id);
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
				var currId=$scope.workspacesObj.filter(function(itm){return itm.name===$scope.workspace;})[0].id;
				console.log("http://uidev.scribble.com/ia?getDetectionReviewHtmlNext&test=123&time=" + time);
				$("#detection-review").load("http://uidev.scribble.com/ia?getDetectionReviewHtmlNext&workspaceId="+currId+"&test=123&time=" + time, function(response, status, xhr) {
					if ($scope.pastDetectionReviews.length <= 0 || document.getElementsByName("mediaasset-id")[0] == $scope.pastDetectionReviews[1]) {
						$scope.detection.allowBackButton = false;
					} else {
						$scope.detection.allowBackButton = true;
					}
					if (status == 'success') {
						$scope.detection.detectionLoaded();
					}
					else {
						console.log('error retrieving next detection');
					}
				});
			}
		},

		// Used to get the next detection when going back (uses mediaasset id)
		getNextDetectionHTMLById: function(id) {
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
				console.log("http://uidev.scribble.com/ia?getDetectionReviewHtmlId=" + id);
				console.log(id);
				$("#detection-review").load("http://uidev.scribble.com/ia?getDetectionReviewHtmlId=" + id, function(response, status, xhr) {
					if ($scope.pastDetectionReviews.length <= 0  || id == $scope.pastDetectionReviews[1]) {
						$scope.detection.allowBackButton = false;
					} else {
						$scope.detection.allowBackButton = true;
					}
					if (status == 'success') {
						$scope.detection.detectionLoaded();
					}
					else {
						console.log('error retrieving next detection');
					}
				});
			}
		},
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
				$http.get('http://uidev.scribble.com/MediaAssetContext?id=' + mediaAssetId)
					.then(function(response) {
						$scope.mediaAssetContext = response.data;
						console.log(response);
					});
				$scope.mediaAsset = mediaAsset;
				//$scope.indID=mediaAsset.feature

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
				console.log(asset);
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
			$scope.tableImageInfo=function(ev,id){
				console.log(id);
				var assets=$scope.currentSlides.filter(function( obj ) {
  				return obj.id === id;
					});
					var asset=assets[0];
					console.log(asset);
					$scope.image_index=$scope.currentSlides.indexOf(asset);
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

			$scope.delete_id=""

			$scope.delete_image=function(){
				var confirm = $mdDialog.confirm()
				.title('Confirm')
				.textContent('Are you sure you want to delete this image from the workspace?')
				.ok('Yes')
				.cancel('No');
				$mdDialog.show(confirm).then(function(result) {
					console.log(result);
					var assets=$scope.currentSlides.filter(function(obj) {
						return obj.id === $scope.delete_id;
						});
					var toDelete=assets[0];
					$scope.delete_index=$scope.currentSlides.indexOf(toDelete);
					$scope.currentSlides.splice($scope.delete_index,1);
					Wildbook.removeMediaAssetFromWorkspace($scope.delete_id, workspace).then(function(data) { console.log(data); });
					$mdDialog.hide();
				});
			};

			/* VIEW MENU */
			$scope.views = ['thumbnails', 'table', 'map'];
			// $scope.views = ['thumbnails', 'table'];
			$scope.view = $scope.views[0];
			$scope.setView = function(v) {
				$scope.view = v;
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
					templateUrl: 'app/views/includes/workspace/upload/upload.dialog.html',
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

				addImages: function(element) {
					
					console.log("Adding images through select images.");
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

				addDropImages: function(element) {

					var justFiles = [];
					var dt = element.dataTransfer;
	        if (dt.items) {
	          // Use DataTransferItemList interface to access the file(s)
	          for (var i=0; i < dt.items.length; i++) {
	            if (dt.items[i].kind == "file") {
	              var f = dt.items[i].getAsFile();
	              console.log("... file[" + i + "].name = " + f.name);
	              justFiles.push(f);
	            }
	          }
	        } else {
	          // Use DataTransfer interface to access the file(s)
	          for (var i=0; i < dt.files.length; i++) {
	            console.log("... file[" + i + "].name = " + dt.files[i].name);
	            justFiles.push(dt.files[i]);
	          }
	        }

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
					console.log ("$scope.upload.images ", $scope.upload.images);
					$scope.upload.stage = 0;
					$scope.upload.reset();
					$scope.upload.uploadSetDialog.assets = assets;
					$scope.upload.uploadSetDialog.updateUploadSets();
					$scope.upload.close();
					alert("Successfully uploaded");
					$mdDialog.show($scope.upload.uploadSetDialog.dialog); // Opens completed_upload.dialog.html
				},
				uploadSetDialog: {
					assets: null,
					dialog: {
						templateUrl: 'app/views/includes/workspace/upload/completed_upload.dialog.html',
						clickOutsideToClose: false,
						escapeToClose: false,
						preserveScope: true,
						scope: $scope
					},
					addToOption: null,
					uploadSets: null,
					updateUploadSets: function() {
						var data = $scope.workspaces;
						console.log(data);
            			if (!data || (data.length < 1)) {
              				console.warn('updateUploadSets() got empty data');
              				return;
            			}
						$scope.upload.uploadSetDialog.uploadSets = data;
					},
					uploadSetName: "",
					completeUpload: function() {
						console.log("COMPLETING UPLOAD: creating a workspace");
						var isDup=false;
						while(true){
							var set = $scope.upload.uploadSetDialog.uploadSetName;
							var assets = $scope.upload.uploadSetDialog.assets;
							switch ($scope.upload.uploadSetDialog.addToOption) {
								case "new":
									var data = $scope.workspaces;
									console.log(data.length);
									isDup = data.includes(set);
									if (isDup) console.log("Duplicate");
									if (isDup == true) {
										var confirm = $mdDialog.confirm()
										.title('Error')
										.textContent('An image set with the name ' + set + ' already exists.')
										.ok('Yes');
										$mdDialog.show(confirm);
									}
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
										var id = false;
										Wildbook.createMediaAssets(assets, id);
										$scope.viewAllImages();
										$mdDialog.hide($scope.upload.uploadSetDialog.dialog);
										break;
								}
								if(isDup){
									continue;
								}else{
									break;
								}
						}

					},
					generateName: function() {
						var date = new Date();
						var dateString = date.toDateString();
						var timeString = date.toTimeString();
						var generated = "Workspace: " + dateString + " " + timeString;
						$scope.upload.uploadSetDialog.uploadSetName = generated;
					},
					reset: function() {
						$scope.upload.uploadSetDialog.uploadSetName = "";
					}
				},
				upload: function() {
					$scope.upload.stage = 1;
					Wildbook.upload($scope.upload.images, $scope.upload.type, $scope.upload.progressCallback, $scope.upload.completionCallback, $scope.upload.failureCallback, $scope.workspace);
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
