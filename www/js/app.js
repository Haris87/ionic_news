'use strict';

var rssApp = angular.module('starter', ['ionic', 'ngCordova']);

rssApp.run(function($ionicPlatform, $rootScope) {
	$ionicPlatform.ready(function() {
		if(window.cordova && window.cordova.plugins.Keyboard) {
			cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
		}

		if(window.StatusBar) {
			StatusBar.styleDefault();
		}
	});
})
.config(function($stateProvider, $urlRouterProvider) {

//match controllers to views
$stateProvider           
	.state('blogs', {name: 'blogs', url: '/blogs', templateUrl: 'templates/blogs.html', controller: 'BlogsController'})
    .state('newsfeed', {name: 'newsfeed', url: '/newsfeed/:blogId', templateUrl: 'templates/newsfeed.html', controller: 'FeedController'})
    .state('about', {name: 'about', url: '/about', templateUrl: 'templates/about.html', controller: 'AboutController'})
    .state('covers', {name: 'cover', url: '/covers', templateUrl: 'templates/covers.html', controller: 'CoversController', cache: 'false'});
  //default state
  $urlRouterProvider.otherwise('/blogs');
});

//controller for news site list
rssApp.controller("BlogsController", function($http, $state, $scope, $ionicPlatform, $ionicLoading, $rootScope, $ionicPopup, NetworkService, FeedService) {
	$ionicPlatform.ready(function() {
		//on initialization get all news sites
		$scope.init = function(){
			$scope.blogs = FeedService.getBlogs();
		}

		//send the user to the specific feed requested, 
		//pass id as parameter in the state url
		$scope.toNewsfeed = function(blog){
			var blogs = FeedService.getBlogs();
			var blogId = arrayObjectIndexOf(blogs, blog);
			$scope.title = "";
			$state.go('newsfeed', { blogId: blogId});
		}
		
		//array helper function
		function arrayObjectIndexOf(arr, obj){
			for(var i = 0; i < arr.length; i++){
				if(angular.equals(arr[i], obj)){
					return i;
				}
			};
			return -1;
		}
	});
});

//controller for header
rssApp.controller("HeaderController", function($http, $state, $scope, $ionicPlatform, $ionicLoading, $rootScope) {
	$ionicPlatform.ready(function() {

		//link to about page
		$scope.toAbout = function(){
			$state.go('about');
		}
		
		//link to news site page
		$scope.toBlogs = function(){
			$state.go('blogs');
		}

		//link to covers page
		$scope.toCovers = function(){
			$state.go('covers');
		}
	});
});

//controller for about page
rssApp.controller("AboutController", function($http, $state, $scope, $ionicPlatform, $ionicLoading) {
	$ionicPlatform.ready(function() {

		$scope.brand = {};
		$scope.brand.name = "Goblin Apps";
		$scope.brand.info = "info@goblin-apps.com";
		$scope.brand.link = "https://goblin-apps.com";
		$scope.brand.image = "img/goblin.gif";

		//service that reads a random quote about the press and loads it to teh view
		$scope.getQuote = function(){
			$http.get('http://www.iheartquotes.com/api/v1/random', { params: { "source":"news"}})
			.success(function(data, status, headers, config) {
				var quote = data.split("[fortune]"); 
				$scope.quote = quote[0];
			})
			.error(function(data, status, headers, config) {
				//if no connection, standard quote shown
				$scope.quote = 	"The only qualities for real success in journalism are ratlike cunning, a "+
								"plausible manner and a little literary ability.  The capacity to steal "+
								"other people's ideas and phrases ... is also invaluable. "+
								"-- Nicolas Tomalin, &quot;Stop the Press, I Want to Get On&quot;";
			});
		}
	});
});

//controller for rss feed page
rssApp.controller("FeedController", function($http, $scope, $timeout, $ionicLoading, $cordovaInAppBrowser, $cordovaNetwork, $rootScope, $stateParams, $ionicPlatform, $ionicPopup, NetworkService, FeedService) {
	$ionicPlatform.ready(function() {

		$scope.feedSrc = [];
		var blogId = 0;
		
		//code runs on initialization
	    $scope.init = function() {
			blogId = $stateParams.blogId;
			$scope.feedSrc = FeedService.getBlogs();
			$scope.blogTitle = $scope.feedSrc[blogId].title;
			$scope.title = $scope.blogTitle;
			$scope.getFeed();
	    }
		
		//classes for expanding and minimizing article objects
		$scope.itemAvatar = "item item-avatar item-avatar-left item-icon-right";
		$scope.itemNoImage = "item item-icon-right";

		//function for expanding and minimizing article objects
		$scope.itemClass = function(entry){
			if(entry.expanded){
				return $scope.itemNoImage;
			}
			
			//check if entry has image
			if(entry.hasOwnProperty('mediaGroups')){
				return $scope.itemAvatar;
			} else {
				return $scope.itemNoImage;
			}
		}
		
		//function called to return feed for a news site to the view
		$scope.getFeed = function(){
			//show loading until feed is returned
			$scope.loading = true;
			$scope.blogTitle = $scope.feedSrc[blogId].title;
	        $http.get("http://ajax.googleapis.com/ajax/services/feed/load", { params: { "v": "1.0", "q": $scope.feedSrc[blogId].feedUrl, "num": "50" } })
			.success(function(data, status, headers, config) {
				$scope.loading = false;
				//if parse feed is succesfull, display the information in the view
				$scope.rssTitle = data.responseData.feed.title;
				$scope.rssUrl = data.responseData.feed.feedUrl;
				$scope.rssSiteUrl = data.responseData.feed.link;
				$scope.entries = data.responseData.feed.entries;
				
				for(var i=0; i<$scope.entries.length; i++){
					$scope.entries[i].text = "";
					$scope.entries[i].slideDown = true;
				}
				$scope.$broadcast('scroll.refreshComplete');
			})
			.error(function(data, status, headers, config) {
				$scope.loading = false;
				$scope.$broadcast('scroll.refreshComplete');
				errorFunction;
			});	
		}
		
		//function called when user clicks the link icon in an article
		//opens the full article in the inapp browser
		$scope.browse = function(v) {
			var options = {
				location: 'no',
				clearcache: 'no',
				toolbar: 'yes'
			};
			
			$cordovaInAppBrowser.open(v, '_blank', options)
			.then(function(event){})
			.catch(function(event){});
		}
		
		$scope.itemClick = function(entry){
			entry.expanded = !entry.expanded;
		}

	    //function to call when an error occurs
	    //shows an alert message
        var errorFunction = function(){
        }

	});
});

//controller for covers page
rssApp.controller("CoversController", function($http, $scope, $state, $timeout, $ionicPlatform, $ionicLoading, $ionicSlideBoxDelegate, $ionicModal, $ionicPopup, NetworkService, FeedService) {
	$ionicPlatform.ready(function() {

		//get today's date
		//fix month and day format for calling the cover service
		var myDate = new Date();
		var year = myDate.getFullYear();
		var month = myDate.getMonth() + 1;
		if(month <= 9){
		    month = '0'+month;
		}

		var day= myDate.getDate();
		if(day <= 9){
		    day = '0'+day;
		}

		$scope.init = function(){
			$scope.covers = FeedService.getCovers(year, month, day);
			$timeout(function(){
				$scope.covers = FeedService.getCovers(year, month, day);
				$scope.$broadcast('scroll.refreshComplete');
				$state.transitionTo('covers');
				$ionicSlideBoxDelegate.update();
				$scope.$apply();
			},2000);
		}

		$scope.imageClick = function($index){
			$scope.openModal();
			$scope.selected = $scope.covers[$index];
		}

		$ionicModal.fromTemplateUrl('cover-modal.html', {
			scope: $scope,
			hardwareBackButtonClose: false,
			animation: 'slide-in-up'
		}).then(function(modal) {
			$scope.modal = modal;
		});
		
		$scope.openModal = function() {
			$scope.modal.show();
		};
		
		$scope.closeModal = function() {
			$scope.modal.hide();
		};

		//Cleanup the modal when we're done with it!
		$scope.$on('$destroy', function() {
			$scope.modal.remove();
		});

		// Execute action on hide modal
		$scope.$on('modal.hidden', function() {
		// Execute action
		});
		
		// Execute action on remove modal
		$scope.$on('modal.removed', function() {
		// Execute action
		});

		$scope.covers = FeedService.getCovers(year, month, day);
		$scope.$parent.title = $scope.covers[0].title;	
		//when slide is changed, change the title
		$scope.slideHasChanged = function($index){
			$scope.$parent.title = $scope.covers[$index].title;
		}
		
	});
});

//service for retrieving news information
rssApp.factory('FeedService',['$http',function($http){
    return {
    	//returns the given feed in json format
        parseFeed : function(url){
            return $http.jsonp('//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=50&callback=JSON_CALLBACK&q=' + encodeURIComponent(url));
        },
        //returns a list of news sites
		getBlogs : function(){
			var feedSrc = [];
			feedSrc.push({feedUrl:"http://feeds.washingtonpost.com/rss/world", siteUrl: "washingtonpost.com", title: "The Washington Post", image: "img/logos/washington.png"});
			feedSrc.push({feedUrl:"http://feeds.bbci.co.uk/news/world/rss.xml", siteUrl: "bbc.com", title: "BBC News", image: "img/logos/bbc.jpg"});
			feedSrc.push({feedUrl:"http://feeds.foxnews.com/foxnews/world", siteUrl: "foxnews.com", title: "FOX News", image: "img/logos/foxnews.jpg"});
			feedSrc.push({feedUrl:"http://www.theguardian.com/world/rss", siteUrl: "theguardian.com", title: "The Guardian", image: "img/logos/guardian.jpg"});
			feedSrc.push({feedUrl:"http://rss.cnn.com/rss/edition_world.rss", siteUrl: "cnn.com", title: "CNN News", image: "img/logos/cnn.png"});
			feedSrc.push({feedUrl:"http://www.huffingtonpost.com/feeds/index.xml", siteUrl: "huffingtonpost.com", title: "The Huffington Post", image: "img/logos/huffington.png"});
			feedSrc.push({feedUrl:"http://rss.nytimes.com/services/xml/rss/nyt/World.xml", siteUrl: "nytimes.com", title: "The New York Times", image: "img/logos/nytimes.png"});
			feedSrc.push({feedUrl:"https://news.google.com/news?output=rss", siteUrl: "news.google.com", title: "Google News", image: "img/logos/google.png"});
			feedSrc.push({feedUrl:"http://feeds.bbci.co.uk/news/world/rss.xml", siteUrl: "bbc.com", title: "BBC News", image: "img/logos/bbc.jpg"});
			feedSrc.push({feedUrl:"http://feeds.foxnews.com/foxnews/world", siteUrl: "foxnews.com", title: "FOX News", image: "img/logos/foxnews.jpg"});
			feedSrc.push({feedUrl:"http://www.reddit.com/r/news/.rss", siteUrl: "reddit.com", title: "Reddit", image: "img/logos/reddit.png"});
			feedSrc.push({feedUrl:"http://news.yahoo.com/rss/", siteUrl: "new.yahoo.com", title: "Yahoo! News", image: "img/logos/yahoo.jpeg"});
			return feedSrc;
		},
		//returns a list of newspaper fronpages
		getCovers : function(year, month, day){
			var coverSrc = [];
			var url = "http://img.kiosko.net/"+year+"/"+month+"/"+day;
			coverSrc.push({image: url+"/us/wsj.750.jpg", title: "The Wall Street Journal"});
			coverSrc.push({image: url+"/us/usa_today.750.jpg", title: "USA Today"});
			coverSrc.push({image: url+"/us/newyork_times.750.jpg", title: "The New York Times"});
			coverSrc.push({image: url+"/us/washington_post.750.jpg", title: "The Washington Post"});
			coverSrc.push({image: url+"/uk/the_times.750.jpg", title: "The Times"});
			coverSrc.push({image: url+"/au/sydney_morning_herald.750.jpg", title: "The Sydney Morning Herald"});
			coverSrc.push({image: url+"/de/faz.750.jpg", title: "Frankfurter Allgemeine Zeitung"});
			coverSrc.push({image: url+"/asi/gulf_news.750.jpg", title: "Gulf News"});
			coverSrc.push({image: url+"/fr/lemonde.750.jpg", title: "Le Monde"});
			return coverSrc;
		}
    }
}]);

//service for checking internet conectivity. not used.
rssApp.factory('NetworkService', ['$q', function($q) {
    return {
        isOnline: function() {
        	if(navigator){
        		if(navigator.onLine){
        			return true;
        		} else if(!navigator.onLine){
        			return false;
        		} else {
        			return null;
        		}
        	} else {
        		return null;
        	}
        }
    };
}]);

//directive for showing default image if img src 404s
rssApp.directive('errSrc', function() {
  return {
    link: function(scope, element, attrs) {
      element.bind('error', function() {
        if (attrs.src != attrs.errSrc) {
          attrs.$set('src', attrs.errSrc);
        }
      });
    }
  }
});