'use strict';

var rssApp = angular.module('starter', ['ionic', 'ngCordova', 'pouchdb']);
rssApp.run(function($ionicPlatform) {
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

$stateProvider           
	.state('blogs', {name: 'blogs', url: '/blogs', templateUrl: 'templates/blogs.html', controller: 'BlogsController'})
    .state('newsfeed', {name: 'newsfeed', url: '/newsfeed/:blogId', templateUrl: 'templates/newsfeed.html', controller: 'FeedController'})
    .state('about', {name: 'about', url: '/about', templateUrl: 'templates/about.html', controller: 'AboutController'});
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/blogs');
});

rssApp.controller("BlogsController", function($http, $state, $scope, FeedService, pouchDB) {

/*	
	var db = pouchDB('db');
	var doc = {name: 'Haris', surname: 'Bouchlis', age: '28'};

	db.post(doc).then(function (res) {
		if (!res.ok) {
			return error(res);
		}
		alert('post');
		return db.get(res.id);
	}).then(function (res) {
		$scope.doc = res;
		console.log(res);
		alert('bind');
	}).catch(function (err) {
		$log.error(err);
		alert('error');
	});

	$scope.allDocs = [];

	db.allDocs({include_docs:true}).then(function (res){
		//console.log(res);
		for(var i=0; i<res.total_rows; i++){
			var row = res.rows[i];
			var row_doc = row.doc;
			console.log(row_doc);
			$scope.allDocs.push(row_doc);
		}
	});
*/
	
	$scope.init = function(){
		$scope.blogs = FeedService.getBlogs();
	}
	
	$scope.toNewsfeed = function(blog){
		console.log(blog);
		var blogs = FeedService.getBlogs();
		var blogId = arrayObjectIndexOf(blogs, blog);
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

rssApp.controller("HeaderController", function($http, $state, $scope, TitleService) {
	$scope.toAbout = function(){
		$state.go('about');
	}
	
	$scope.toBlogs = function(){
		$state.go('blogs');
	}
	
	$scope.getTitle = function(){
		$scope.title = TitleService.getTitle();
		if($scope.title == null){
			$scope.title = "Nein News";
		}
	}
	
	//alert($cordovaNetwork.getNetwork());

});

rssApp.controller("AboutController", function($http, $state, $scope) {
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

rssApp.controller("FeedController", function($http, $scope, $timeout, $ionicLoading, $cordovaInAppBrowser, $stateParams, FeedService, TitleService) {
	$scope.feedSrc = [];
	var blogId = 0;
	
    $scope.init = function() {
		blogId = $stateParams.blogId;
		$scope.feedSrc = FeedService.getBlogs();
		$scope.blogTitle = $scope.feedSrc[blogId].title;
		TitleService.setTitle($scope.blogTitle);
		console.log($scope.blogTitle);
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
			feedSrc.push({feedUrl:"http://feeds.feedburner.com/tokoulouri/rss", siteUrl: "tokoulouri.com", title: "To Koulouri", image: "img/koulouri.png"});
			feedSrc.push({feedUrl:"http://olympia.gr/feed/", siteUrl: "olympia.gr", title: "Olympia", image: "img/olympia.jpeg"});
			feedSrc.push({feedUrl:"http://www.pinnokio.gr/rss", siteUrl: "pinnokio.gr", title: "Pinnokio", image: "img/pinnokio.png"});
			feedSrc.push({feedUrl:"http://kourdistoportocali.com/feeds/xml/latest.xml",  siteUrl: "kourdistoportocali.com", title: "Kourdisto Portokali", image: "img/kourdistoportokali.png"});
			feedSrc.push({feedUrl:"http://feeds.feedburner.com/trelokouneli/YZEp", siteUrl: "trelokouneli.gr", title: "Trello Kouneli", image: "img/trellokouneli.png"});
			feedSrc.push({feedUrl:"http://www.antinews.gr/feed/", siteUrl: "antinews.gr", title: "Antinews", image: "img/antinews.png"});
			feedSrc.push({feedUrl:"http://feeds.feedburner.com/Voliotaki", siteUrl: "voliotaki.blogspot.gr", title: "Voliotaki", image: "img/voliotaki.jpg"});
			// feedSrc.push({feedUrl:"http://www.alexiptoto.com/feed/", title: "Alexiptoto", image: "img/alexiptoto.png"});
			// feedSrc.push({feedUrl:"http://antikleidi.com/feed", title: "Antikleidi", image: "img/antikleidi.png"});
			// feedSrc.push({feedUrl:"http://feeds.feedburner.com/blogspot/Rnkws", title: "Dexi x-Trem(i)"});
			// feedSrc.push({feedUrl:"http://apocalypsejohn.com/feed", title: "Apocalypse"});
			// feedSrc.push({feedUrl:"http://feeds.feedburner.com/autoblog/feed", title: "Autoblog"});
			// feedSrc.push({feedUrl:"http://www.neolaia.gr/feed/", title: "Neolaia.gr"});
			// feedSrc.push({feedUrl:"http://feeds.feedburner.com/feedburner/rVOU", title: "The Secret Real Truth"});
			// feedSrc.push({feedUrl:"http://feeds.feedburner.com/blogspot/BBfGP", title: "24oro"});
			// feedSrc.push({feedUrl:"http://anemosantistasis.blogspot.com/feeds/posts/default", title: "Anemos Antistasis"});
			// feedSrc.push({feedUrl:"http://kranosgr.blogspot.com/feeds/posts/default", title: "KRANOSGR"});			
			// feedSrc.push({feedUrl:"http://fimotro.blogspot.com/feeds/posts/default", title: "Fimotro"});
			// feedSrc.push({feedUrl:"http://feeds.feedburner.com/blogspot/OTsvU", title: "Epirus Gate"});
			// feedSrc.push({feedUrl:"http://www.katohika.gr/feeds/posts/default", title: "Katoxika"});
			// feedSrc.push({feedUrl:"http://feeds.feedburner.com/nonews-news", title: "No News"});			
			return feedSrc;
		}
    }
}]);