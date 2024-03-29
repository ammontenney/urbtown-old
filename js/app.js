/**
    UrbTown is an exploration tool for those going to a new place

    This app utilizes Goople Maps API, Knockout.js, and jquery
    Everything starts from the class 'AppViewModel' when it is instantiated and
    bound to knockout

 */
function AppViewModel() {
    var t = this;

    var map = {}; // stores an instance of Google Maps
    var geocoder = {}; // used w/ GMaps to do a reverse lat-lng lookup on an address
    var places = {}; // used w/ GMaps to retrieve location info and reviews
    var mapReady = false; // track w/ the map has been initialized
    var resultsToggle = false;
    var localData = {radius: 5};
    var placeSearchData = {};
    var selectedItem = null;
    var SELECTED_MARKER_COLOR = 'green';
    var RADIUS_VALS = [5,10,15,20,25];
    CATEGORIES = {
        Dining:     {title:'Dining',
                    icon:'img/dining.svg',
                    color:'#440055',
                    api:'',
                    types:['cafe', 'food', 'meal_delivery', 'meal_takeaway', 'restaurant']},
        Shopping:   {title:'Shopping',
                    icon:'img/retail.svg',
                    color:'#aa4400',
                    api:'',
                    types:['book_store', 'bakery', 'clothing_store', 'convenience_store', 'department_store', 'electronics_store', 'furniture_store', 'grocery_or_supermarket', 'hardware_store', 'home_goods_store', 'pet_store', 'shoe_store', 'shopping_mall', 'store']},
        Automotive: {title:'Automotive',
                    icon:'img/auto.svg',
                    color:'#005522',
                    api:'',
                    types:['car_dealer', 'car_rental', 'car_repair', 'car_wash', 'gas_station', 'parking']},
        Leisure:    {title:'Leisure',
                    icon:'img/leisure.svg',
                    color:'#dbb400',
                    api:'',
                    types:['amusement_park', 'aquarium', 'art_gallery', 'bowling_alley', 'campground', 'movie_rental', 'movie_theater', 'museum', 'park', 'stadium', 'zoo']},
        Education:  {title:'Education',
                    icon:'img/education.svg',
                    color:'#2c5aa0',
                    api:'',
                    types:['library', 'school', 'university']},
        Medical:    {title:'Medical',
                    icon:'img/medical.svg',
                    color:'#b80000',
                    api:'',
                    types:['dentist', 'doctor', 'health', 'hospital', 'pharmacy', 'physiotherapist']}
    };
    var APILIST = {
        GPlaces: {name:'Google Places',
                 icon: 'img/g-icon.png',
                 logo: 'img/g-logo.png',
                 loader: gpLoader },
        YP: {name:'YellowPages',
            icon: 'img/yp-icon.svg',
            logo: 'img/yp-logo.svg',
            loader: ypLoader },
    };

    var $txt_loc_search = $('.txt-loc-search');
    var $loc_search_ctrls = $('.loc-search-ctrls');
    var $results = $('.results');
    var $arrow = $('.arrow');
    var $view_item = $('.view-item');
    var $list = $('.list');

    // the selected API in the GUI defaults to Google Places
    t.selectedAPI = ko.observable('GPlaces');
    t.radiusValues = ko.observableArray(RADIUS_VALS);
    // These are the categories that are displayed on the left bar of the screen
    t.categories = ko.observableArray( ObjectToArray(CATEGORIES) );
    t.apiList = ko.observableArray( ObjectToArray(APILIST) );
    t.welcomeError = ko.observable("&nbsp");
    t.location = ko.observable();
    t.locationRadius = ko.observable(0);
    t.currentCategoryLabel = ko.observable('No category has been selected');
    t.currentResults = ko.observableArray();
    t.newFilter = ko.observable("");
    t.currentFilter = ko.observable("");
    t.SelectedAPILogo = ko.computed(function(){
        return APILIST[t.selectedAPI()].logo;
    });

    t.SetInitialLocation = function() {
        var msg = "";

        // make sure user entered a location
        // TODO make user input is escaped
        if (!t.location()){
            msg = "* Please enter a location";
            t.welcomeError(msg);
            return;
        }

        // TODO verify the searchRadius value is valid

        // Somehow the user managed to enter a location in before the map is ready
        if (!mapReady){
            msg = "The map is not ready yet. Please wait 5 seconds and try again.";
            t.welcomeError(msg);
            return;
        }

        // The data has made it through the gauntlet and the map can be shown
        centerMap();

        // Remove the focus from the textbox on the welcome screen so we
        // can set the focus elsewhere
        $('welcome-info-controls-input').blur();

        // We're done with the welcome screen and we can now hide it
        $('.welcome').css('visibility', 'hidden');

    };

    t.UpdateLocation = function(){
        // TODO: verify the searchRadius value is valid
        // TODO: on UpdateLocation w/ empty query, update locationRadius
        // TODO: adjust map zoom according to locationRadius

        var tmpLoc = $txt_loc_search.val();
        if (tmpLoc){
            t.location(tmpLoc);
            centerMap();
            resetSearchData();
        }
        else {
            t.locationRadius(localData.radius);
        }

        $txt_loc_search.val("");
        $txt_loc_search.blur();
        $loc_search_ctrls.css('display', 'none');
    };

    t.ToggleSearch = function(){
        $loc_search_ctrls.toggle();

        if ($loc_search_ctrls.css('display') !== 'none')
            $txt_loc_search.focus();
    };

    t.CategoryClick = function(koData){
        var category = koData.title;
        t.currentCategoryLabel(category);

        if ( categoryIsLoaded(category) ){
            switchCategory(category);
        }
        else {
            loadCategory(koData);
        }
    };

    t.ArrowClick = function(){
            toggleResultsPane();
    };

    t.ResultItemClick = function (data){
        if (selectedItem !== null && selectedItem.place_id === data.place_id){
            showResultItem(data);
        }
        else {
            setSelectedItem(data);
        }
    };

    t.ResultItemMouseMove = function(data){
        setSelectedItem(data);
    };

    t.NotifyMapIsReady = function() {
        mapReady = true; // indicate that the map api has been loaded

        // these coordinates default to the center of the USA
        var myLat = 37.2739675;
        var myLng = -104.678212;

        //
        if (!$.isEmptyObject(localData)){
            myLat = localData.lat;
            myLng = localData.lng;
        }

        geocoder = new google.maps.Geocoder();
        map = new google.maps.Map(document.getElementById('map'), {
            center: {lat: myLat, lng: myLng},
            zoom: 13
        });
        places = new google.maps.places.PlacesService(map);

        // initialize the first category to display to the screen
        selectInitialCategory();
    };

    t.CloseViewItem = function() {
        $view_item.toggleClass('hide-me', true);
        $list.toggleClass('hide-me', false);
    };

    t.Filter = function(){
        // don't do anything if the user didn't enter anything to filter by
        if (t.newFilter() === "") return;

        // update the label showing the current filter
        if (t.currentFilter() === ""){
            t.currentFilter(t.newFilter());
        }
        else{
            t.currentFilter(t.currentFilter()+ ' + ' +t.newFilter());
        }

        // Save the new filter and then clear it on the display
        var tmpFilter = t.newFilter();
        t.newFilter("");

        // filter the category by the given filter
        var tmpResults = t.currentResults().filter(checkForKeyWord(tmpFilter));

        // update the markers on the map to reflect the filtered results
        toggleMarkers(false, t.currentResults());
        t.currentResults(tmpResults);
        toggleMarkers(true, t.currentResults());
    };

    t.ClearFilter = function(){
        t.newFilter("");
        t.currentFilter("");

        switchCategory(t.currentCategoryLabel());
    };

    function centerMap(){
        geocoder.geocode({'address':t.location()}, updateGeo);
        function updateGeo(results, status){
            if (status !== google.maps.GeocoderStatus.OK){
                console.log("Geocode didn't work: " + status);
                return;
            }

            // get the formatted address and lat/lng and save them to localStorage
            t.location(results[0].formatted_address);
            localData.location = results[0].formatted_address;
            localData.lat = results[0].geometry.location.lat();
            localData.lng = results[0].geometry.location.lng();
            localData.radius = t.locationRadius();
            saveLocalData();

            map.setCenter(results[0].geometry.location);
        }
    }

    function saveLocalData(){
        var json_data = JSON.stringify(localData);
        localStorage.setItem("urbtown", json_data);
    }

    function loadLocalData(){
        var json_data = localStorage.getItem("urbtown");

        if (!json_data)
            return false;

        // TODO escape input from localStorage to make sure it wasn't messed with
        localData = JSON.parse(json_data);
        t.locationRadius(localData.radius);

        return true;
    }

    function categoryIsLoaded(category){
        if (placeSearchData[category])
            return true;
        else
            return false;
    }

    function loadCategory(data){
        var category = data.title;
        var categoryTypes = data.types;

        var loc = new google.maps.LatLng(localData.lat, localData.lng);
        var request = {
            location: loc,
            radius: localData.radius*1600,
            types: categoryTypes
        };

        places.nearbySearch(request, function(results, status){
            if (status !== google.maps.places.PlacesServiceStatus.OK) {
                console.log("Places search did not work: " + status );
                return;
            }

            placeSearchData[category] = results;
            addMarkers(category);
            switchCategory(category);
            assignCategoryToResults(category, results);
        });
    }

    function assignCategoryToResults(category, results){
        var item = {};
        for (var i=0; i<results.length; i++)
        {
            item = results[i];
            item.category = category;
        }
    }

    function switchCategory(category){
        toggleMarkers(false, t.currentResults());
        toggleMarkers(true, placeSearchData[category]);
        t.currentResults(placeSearchData[category]);
    }

    function addMarkers(category){
        var list = placeSearchData[category];
        var len = list.length;
        var item = {};

        var tag = createTagIcon(category);

        for (var i=0; i<len; i++){
            item = list[i];
            item.marker = new google.maps.Marker({
                position: item.geometry.location,
                map: null,
                title: item.name,
                icon: tag
            });
            google.maps.event.addListener(item.marker, 'click', markerClick(item));
        }
    }

    function markerClick(data){
        return function(){
            setSelectedItem(data);
            showResultItem(data);
            toggleResultsPane(true);
        };
    }

    function toggleMarkers(display, categoryData){
        var tempMap = null;
        if (display){
            tempMap = map;
        }

        var list = categoryData;
        var len = list.length;
        var item = {};
        for (var i=0; i<len; i++){
            item = list[i];
            item.marker.setMap(tempMap);
        }
    }

    function resetSearchData(){
        toggleMarkers(false, t.currentResults());
        placeSearchData = {};
    }

    function ObjectToArray(obj){
        var keys = Object.keys(obj);
        var arr = [];

        for (var i=0; i<keys.length; i++){
            arr.push(obj[ keys[i] ]);
        }

        return arr;
    }

    /* @param display: pass t/f to specify to open/close results pane
     * if parameter is ommited the  results pane will toggle open/close
     */
    function toggleResultsPane(display){
        if (display !== undefined) {
            resultsToggle = display;
        }
        else {
            resultsToggle = !resultsToggle;
        }

        $results.toggleClass('open', resultsToggle);
        $arrow.toggleClass('flip', resultsToggle);
    }

    function showResultItem(data){
        $view_item.toggleClass('hide-me', false);
        $list.toggleClass('hide-me', true);

        // we need to set the selectedAPI to 'GPlaces' because we use it to get
        // the data from the other 3rd party services
        // t.selectedAPI('GPlaces');

        var api = t.selectedAPI();
        APILIST[api].loader();
    }

    // this function loads data from the Google Places API and outputs HTML
    // formatted to that data
    function gpLoader(){
        t.selectedAPI('GPlaces');

        var request = {placeId: selectedItem.place_id};
        places.getDetails(request, function(details, status){
            console.log('GPLoader results:');
            console.log(details);

            var gen = new HTMLGenerator();
            gen.addTitle ( details.name, 2 );
            gen.addEntry ( 'Rating: ', gen.generateStars(details.rating), false );
            gen.addEntry ( 'Phone: ', details.formatted_phone_number, false );
            gen.addEntry ( 'Link: ', gen.generateLink(details.name, details.website), true );
            gen.addEntry ( 'Link: ', gen.generateLink('View on Google Maps', details.url), true );
            gen.addEntry ( 'Address: ', details.formatted_address, true );
            gen.addTitle ( 'Reviews', 3 );

            if (details.reviews){
                gen.addList ( 'review', details.reviews, ['author_name', 'rating', 'text'] );
            }
            else {
                gen.addEntry( '', 'No reviews available', false );
            }

            $('.item-content').html( gen.getHTML() );
        });
    }

    // this function loads data from the YellowPages API and outputs HTML
    // formatted to that data
    function ypLoader(){
        t.selectedAPI('YP');
        var loc = selectedItem.geometry.location.lat() + ':' + selectedItem.geometry.location.lng();
        var listing;
        var searchData;
        var reviewData;
        var gen = new HTMLGenerator();

        gen.addEntry('', 'Contacting YP.com ...', false);
        gen.display('.item-content');
        gen.reset();

        var timeout = setTimeout(function(){
            gen.addEntry('', 'YP.com is unavailable. Please try again.', false);
            gen.display('.item-content');
            gen.reset();
        }, 6000);

        $.ajax({
            url: 'http://api2.yp.com/listings/v1/search',
            dataType: 'jsonp',
            data: { key: 'qw1921yj10',
                    term: selectedItem.name,
                    format: 'json',
                    listingcount: '5',
                    searchloc: loc},
            success: processSearchResults
        });

        function processSearchResults(data){
            console.log('YP Results:');
            console.log(data);
            clearTimeout(timeout);

            searchData = data.searchResult;

            if (searchData.metaProperties.listingCount === 0){
                gen.addEntry('', 'YP.com did not return any results for this location', false);
                gen.display('.item-content');
                return;
            }

            listing = searchData.searchListings.searchListing[0];
            displayYPInfo();

            // notify the user if the ajax request from yp.com does not work
            timeout = setTimeout(function(){
                console.log('YP.com is unavailable. Please try again.');
            }, 6000);

            // Request the Review data from YP.com
            $.ajax({
                url: 'http://api2.yp.com/listings/v1/reviews',
                dataType: 'jsonp',
                data: { key: 'qw1921yj10',
                        format: 'json',
                        listingid: listing.listingId},
                success: processReviews
            });
        }

        function processReviews(data){
            console.log('YP Reviews:');
            console.log(data);
            clearTimeout(timeout);

            reviewData = data.ratingsAndReviewsResult;

            if (reviewData.metaProperties.reviewCount === 0){
                return;
            }

            var reviews = reviewData.reviews.review;
            console.log(reviews);
            gen.addTitle('Reviews');
            gen.addList ( 'reviews', reviews, ['reviewer', 'rating', 'reviewSubject', 'reviewBody'] );
            gen.display('.item-content');
        }

        function displayYPInfo(){
            var name = listing.businessName;
            var phone = listing.phone;
            var rating = listing.averageRating;
            var ypLink = listing.moreInfoURL;
            var website = listing.websiteURL;
            var address = listing.street + ', ' +
                          listing.city + ', ' +
                          listing.state + ' ' + listing.zip;

            gen.addTitle(name);
            gen.addEntry('Rating: ', gen.generateStars(rating), false);
            gen.addEntry('Phone: ', phone, false);
            gen.addEntry('Link: ', gen.generateLink(name, website), true);
            gen.addEntry('Link: ', gen.generateLink('View listing on yp.com', ypLink), true);
            gen.addEntry('Address: ', address, true);
            gen.display('.item-content');
        }
    }

    // All of my 3rd party loader functions format the HTML similarly with only
    // the content differing. This class/function makes is easier and quicker to
    // genreate consistently formatted html
    var HTMLGenerator = function (){
        var me = this;
        var $html = $('<div class="place-info">');

        me.getHTML = function(){
            return $html;
        };

        me.addTitle = function(content, h_level){
            $html.append( $('<h'+h_level+' class="place-title">').text(content) );
        };

        me.addEntry = function(label, content, insert_break){
            var $entry = $('<p class="place-entry">');
            $entry.append( $('<span class="place-label">').text(label) );
            if (insert_break)
                $entry.append('<br>');
            $entry.append( content );
            $html.append($entry);
        };

        me.addList = function(base_class, list, keys){
            var list_item;
            var $item_html;
            var key;
            for (var i=0; i<list.length; i++){
                $item_html = $('<p class="'+base_class+'">');
                for (var j=0; j<keys.length; j++){
                    key = keys[j];
                    if (j!==0) $item_html.append('<br>');
                    $item_html.append( $('<span class="'+base_class+'-'+key+'">').append(list[i][key]) );
                }
                $html.append($item_html);
            }
        };

        me.generateLink = function(label, url){
            var $link = $('<a>', {href: url, target:'_blank'}).text(label);
            return $link;
        };

        me.generateStars = function(num){
            // TODO replace number w/ actual star icon
            return num;
        };

        me.display = function(selector){
            $(selector).html( me.getHTML() );
        };

        me.reset = function(){
            $html = $('<div class="place-info">');
        };

    };

    /* @param category_color: can equal any key in CATEGORIES or a valid HTML color
     */
    function createTagIcon(category_color){
        var color = category_color;
        var category_obj = CATEGORIES[category_color];

        if (category_obj){
            color = category_obj.color;
        }

        var tag = {
            path: 'M 0,0 24,0, 24,24 12,40, 0,24 z',
            fillColor: color,
            fillOpacity: 0.8,
            scale: 0.75,
            strokeColor: 'black',
            strokeWeight: 1,
        };
        return tag;
    }

    function setSelectedItem(data){
        // de-select the current item
        if (selectedItem !== null){
            var selectedElem = $('.'+selectedItem.place_id);
            var normalTag = createTagIcon(selectedItem.category);

            selectedItem.marker.setIcon(normalTag);
            selectedItem.marker.setZIndex(google.maps.Marker.MAX_ZINDEX-1);
            selectedElem.toggleClass('selected-item', false);
        }

        // select the new item
        var item = data;
        var itemElem = $('.'+item.place_id);
        var selectedTag = createTagIcon(SELECTED_MARKER_COLOR);
        item.marker.setIcon(selectedTag);
        item.marker.setZIndex(google.maps.Marker.MAX_ZINDEX+1);
        itemElem.toggleClass('selected-item', true);

        selectedItem = item;
    }

    function checkForKeyWord(keyWord){
        return function(element, index){
            var key = keyWord.toLowerCase();
            var name = element.name.toLowerCase();
            var address = element.vicinity.toLowerCase();

            if (name.includes(key) || address.includes(key))
                return true;
            else
                return false;
        };
    }

    function selectInitialCategory(){
        var category = Object.keys(CATEGORIES)[0];
        t.currentCategoryLabel(category);

        var data = {title: category,
                    types: CATEGORIES[category].types};

        loadCategory(data);
    }

    if (loadLocalData())
        t.location(localData.location);
    else
        $('.welcome').css('visibility', 'visible');
}


var myModel = new AppViewModel();
ko.applyBindings(myModel);
