'use strict';

var rssApp = angular.module('starter', ['ionic', 'ngCordova', 'pouchdb']);

rssApp.run(function($ionicPlatform, $rootScope) {
  $ionicPlatform.ready(function() {
    if(window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
    }
    if(window.StatusBar) {
      StatusBar.styleDefault();
    }

    if (window.Connection) {
      $rootScope.$on('$cordovaNetwork:online', function(event, networkState) {
        alert('online good sir');
      })
      $rootScope.$on('$cordovaNetwork:offline', function(event, networkState) {
        alert('offline good sir');
      })
    }

  });
})
.config(function($stateProvider, $urlRouterProvider) {

$stateProvider           
	.state('blogs', {name: 'blogs', url: '/blogs', templateUrl: 'templates/blogs.html', controller: 'BlogsController'})
    .state('newsfeed', {name: 'newsfeed', url: '/newsfeed/:blogId', templateUrl: 'templates/newsfeed.html', controller: 'FeedController'})
    .state('about', {name: 'about', url: '/about', templateUrl: 'templates/about.html', controller: 'AboutController'});
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/blogs');
});

rssApp.controller("BlogsController", function($http, $state, $scope, $ionicPlatform, $ionicLoading, $rootScope, $ionicPopup, NetworkService, FeedService, TitleService, pouchDB) {
	$ionicPlatform.ready(function() {

		$ionicLoading.hide();

		$scope.init = function(){
			$scope.blogs = FeedService.getBlogs();
		}
		
		$scope.toNewsfeed = function(blog){
			var blogs = FeedService.getBlogs();
			var blogId = arrayObjectIndexOf(blogs, blog);
			$rootScope.title = TitleService.setTitle("mpla mpla");
			$state.go('newsfeed', { blogId: blogId});
		}
		
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

rssApp.controller("HeaderController", function($http, $state, $scope, $ionicPlatform, $ionicLoading, $rootScope, TitleService) {
	$ionicPlatform.ready(function() {
		$scope.$rootScope = $rootScope;
		$ionicLoading.hide();

		$scope.toAbout = function(){
			$state.go('about');
		}
		
		$scope.toBlogs = function(){
			$state.go('blogs');
		}
		
		$scope.getTitle = function(){
			$rootScope.title = TitleService.getTitle();
			$scope.title = TitleService.getTitle();
			if($scope.title == null){
				$scope.title = "News Lite";
			}
		}
		
		$scope.getTitle();
	});

});

rssApp.controller("AboutController", function($http, $state, $scope, $ionicPlatform, $ionicLoading) {
	$ionicPlatform.ready(function() {
		$ionicLoading.hide();

		$scope.getQuote = function(){
			$http.get('http://www.iheartquotes.com/api/v1/random', { params: { "source":"news"}})
			.success(function(data, status, headers, config) {
				var quote = data.split("[fortune]"); 
				$scope.quote = quote[0];
			})
			.error(function(data, status, headers, config) {
				$scope.quote = 	"The only qualities for real success in journalism are ratlike cunning, a "+
								"plausible manner and a little literary ability.  The capacity to steal "+
								"other people's ideas and phrases ... is also invaluable. "+
								"-- Nicolas Tomalin, &quot;Stop the Press, I Want to Get On&quot;";
			});
		}
	});
});

rssApp.controller("FeedController", function($http, $scope, $timeout, $ionicLoading, $cordovaInAppBrowser, $stateParams, $ionicPlatform, FeedService, TitleService) {
	$ionicPlatform.ready(function() {
		$ionicLoading.hide();

		$scope.feedSrc = [];
		var blogId = 0;
		
	    $scope.init = function() {
			blogId = $stateParams.blogId;
			$scope.feedSrc = FeedService.getBlogs();
			$scope.blogTitle = $scope.feedSrc[blogId].title;
			TitleService.setTitle($scope.blogTitle);
			$scope.getFeed();
	    }
		
		$scope.itemAvatar = "item item-avatar item-avatar-left item-icon-right";
		$scope.itemNoImage = "item item-icon-right";

		$scope.itemClass = function(entry){
			if(entry.expanded){
				return $scope.itemNoImage;
			}
		
			if(entry.hasOwnProperty('mediaGroups')){
				return $scope.itemAvatar;
			} else {
				return $scope.itemNoImage;
			}
		}
			
		$scope.getFeed = function(){
			$ionicLoading.show({
				template: 'Loading feed...'
			});

			$scope.blogTitle = $scope.feedSrc[blogId].title;
	        $http.get("http://ajax.googleapis.com/ajax/services/feed/load", { params: { "v": "1.0", "q": $scope.feedSrc[blogId].feedUrl, "num": "50" } })
			.success(function(data, status, headers, config) {
				
				
	        	if(res.data.responseData.feed.entries == [] || res.data.responseData.feed.entries == null){
	        		alert("Please check your internet connection");
	        	}

				$scope.rssTitle = data.responseData.feed.title;
				$scope.rssUrl = data.responseData.feed.feedUrl;
				$scope.rssSiteUrl = data.responseData.feed.link;
				$scope.entries = data.responseData.feed.entries;
				
				for(var i=0; i<$scope.entries.length; i++){
					$scope.entries[i].text = "";
					$scope.entries[i].slideDown = true;
				}
				$ionicLoading.hide();
				$scope.$broadcast('scroll.refreshComplete');
			})
			.error(function(data, status, headers, config) {
				$scope.loadBrowserFeed();
				$scope.$broadcast('scroll.refreshComplete');
				$ionicLoading.hide();
			});	
		}
		
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
			// if(entry.expanded){
				// entry.expanded = false;
			// } else {
				// entry.expanded = true;
			// }
		}
		
		$scope.loadBrowserFeed = function(){  
			$scope.blogTitle = $scope.feedSrc[blogId].title;
	        FeedService.parseFeed($scope.feedSrc[blogId].feedUrl).then(function(res){	        	
				$scope.rssTitle = res.data.responseData.feed.title;
				$scope.rssUrl = res.data.responseData.feed.feedUrl;
				$scope.rssSiteUrl = res.data.responseData.feed.link;
				$scope.entries = res.data.responseData.feed.entries;
				
				for(var i=0; i<$scope.entries.length; i++){
					$scope.entries[i].text = "";
					$scope.entries[i].slideDown = true;
				}
				$scope.$broadcast('scroll.refreshComplete');
				$timeout(function(){
					$scope.$apply();
				}, 1);
	        });
	    }
	});
 
});

rssApp.factory('TitleService', function(){
	var title;
    return {
        getTitle : function(){
            return title;
        },
		setTitle : function(newTitle){
			title = newTitle;
		}
    }
});

rssApp.factory('FeedService',['$http',function($http){
    return {
        parseFeed : function(url){
            return $http.jsonp('//ajax.googleapis.com/ajax/services/feed/load?v=1.0&num=50&callback=JSON_CALLBACK&q=' + encodeURIComponent(url));
        },
		getBlogs : function(){
			var feedSrc = [];
			feedSrc.push({feedUrl:"http://news.yahoo.com/rss/", siteUrl: "new.yahoo.com", title: "Yahoo! News", image: "img/logos/yahoo.jpeg"});
			feedSrc.push({feedUrl:"http://rss.cnn.com/rss/edition_world.rss", siteUrl: "cnn.com", title: "CNN News", image: "img/logos/cnn.png"});
			feedSrc.push({feedUrl:"http://www.huffingtonpost.com/feeds/index.xml", siteUrl: "huffingtonpost.com", title: "The Huffington Post", image: "img/logos/huffington.png"});
			feedSrc.push({feedUrl:"http://rss.nytimes.com/services/xml/rss/nyt/World.xml", siteUrl: "nytimes.com", title: "The New York Times", image: "img/logos/nytimes.png"});
			feedSrc.push({feedUrl:"https://news.google.com/news?output=rss", siteUrl: "news.google.com", title: "Google News", image: "img/logos/google.png"});
			feedSrc.push({feedUrl:"http://feeds.bbci.co.uk/news/world/rss.xml", siteUrl: "bbc.com", title: "BBC News", image: "img/logos/bbc.jpg"});
			feedSrc.push({feedUrl:"http://feeds.foxnews.com/foxnews/world", siteUrl: "foxnews.com", title: "FOX News", image: "img/logos/foxnews.jpg"});
			feedSrc.push({feedUrl:"http://feeds.washingtonpost.com/rss/world", siteUrl: "washingtonpost.com", title: "The Washington Post", image: "img/logos/washington.png"});
			feedSrc.push({feedUrl:"http://www.theguardian.com/world/rss", siteUrl: "theguardian.com", title: "The Guardian", image: "img/logos/guardian.jpg"});
			feedSrc.push({feedUrl:"http://www.reddit.com/r/news/.rss", siteUrl: "reddit.com", title: "Reddit", image: "img/logos/reddit.png"});
			// feedSrc.push({feedUrl:"http://feeds.feedburner.com/tokoulouri/rss", siteUrl: "tokoulouri.com", title: "To Koulouri", image: "img/koulouri.png"});
			// feedSrc.push({feedUrl:"http://olympia.gr/feed/", siteUrl: "olympia.gr", title: "Olympia", image: "img/olympia.jpeg"});
			// feedSrc.push({feedUrl:"http://www.pinnokio.gr/rss", siteUrl: "pinnokio.gr", title: "Pinnokio", image: "img/pinnokio.png"});
			// feedSrc.push({feedUrl:"http://kourdistoportocali.com/feeds/xml/latest.xml",  siteUrl: "kourdistoportocali.com", title: "Kourdisto Portokali", image: "img/kourdistoportokali.png"});
			// feedSrc.push({feedUrl:"http://feeds.feedburner.com/trelokouneli/YZEp", siteUrl: "trelokouneli.gr", title: "Trello Kouneli", image: "img/trellokouneli.png"});
			// feedSrc.push({feedUrl:"http://www.antinews.gr/feed/", siteUrl: "antinews.gr", title: "Antinews", image: "img/antinews.png"});
			// feedSrc.push({feedUrl:"http://feeds.feedburner.com/Voliotaki", siteUrl: "voliotaki.blogspot.gr", title: "Voliotaki", image: "img/voliotaki.jpg"});
	
			return feedSrc;
		}
    }
}]);

rssApp.factory('NetworkService', ['$q', function($q) {
    var Connection = window.Connection || {
        'ETHERNET': 'ethernet',
        'WIFI': 'wifi',
        'CELL_2G': 'cell_2g',
        'CELL_3G': 'cell_3g',
        'CELL_4G': 'cell_4g',
        'CELL': 'cell',
        'EDGE': 'edge',
        'UNKNOWN': 'unknown',
        'NONE': 'none'
    };

    var loaded = false;
    var connType = null;

    return {
        isOnline: function() {
            var blnReturn = true;

            switch (this.getStatus()) {
                case Connection.NONE:
                case Connection.UNKNOWN:
                    blnReturn = false;
                    break;
            }

            return blnReturn;
        },
        getStatus: function() {
            if (connType) {
                return connType.type;
            }
            if (typeof device !== 'undefined') {
                if ((device.platform === "Android") && navigator && navigator.network && navigator.network.connection) {
                    connType = navigator.network.connection || {
                        type: 'UNKNOWN'
                    };
                } else {
                    if ((device.platform === "iOS") && navigator && navigator.connection) {
                        connType = navigator.connection || {
                            type: 'UNKNOWN'
                        };
                    }
                }
            }
            if (!connType) {
                connType = { type: 'none'};
            }
            return connType.type;
        }
    };
}]);