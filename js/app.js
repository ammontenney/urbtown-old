
function AppViewModel() {
    var map = {};
    var geocoder = {};
    var places = {};
    var mapReady = false;
    var localData = {};
    localData.radius = 5;
    var placeSearchData = {};

    var SELECTED_MARKER_COLOR = 'green';

    var RADIUS_VALS = [5,10,15,20,25];

    var CATEGORIES = {
        Education:  {title:'Education',
                    icon:'img/education.svg',
                    color:'#2c5aa0',
                    api:'',
                    types:['library', 'school', 'university']},
        Medical:    {title:'Medical',
                    icon:'img/medical.svg',
                    color:'#b80000',
                    api:'',
                    types:['dentist', 'doctor', 'health', 'hospital', 'pharmacy', 'physiotherapist']},
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
                    types:['amusement_park', 'aquarium', 'art_gallery', 'bowling_alley', 'campground', 'movie_rental', 'movie_theater', 'museum', 'park', 'stadium', 'zoo']}
    };


    var t = this;
    t.radiusValues = ko.observableArray(RADIUS_VALS);
    t.categories = ko.observableArray( categoriesToArray() );
    t.welcomeError = ko.observable("&nbsp");
    t.location = ko.observable();
    t.locationRadius = ko.observable(0);
    t.currentCategoryLabel = ko.observable('No category has been selected');
    t.currentResults = ko.observableArray();

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

    var txt_loc_search = $('.txt-loc-search');
    var loc_search_ctrls = $('.loc-search-ctrls');
    t.UpdateLocation = function(){
        // TODO: verify the searchRadius value is valid
        // TODO: on UpdateLocation w/ empty query, update locationRadius
        // TODO: adjust map zoom according to locationRadius

        var tmpLoc = txt_loc_search.val();
        if (tmpLoc){
            t.location(tmpLoc);
            centerMap();
            resetSearchData();
        }
        else {
            t.locationRadius(localData.radius);
        }

        txt_loc_search.val("");
        txt_loc_search.blur();
        loc_search_ctrls.css('display', 'none');
    };

    t.ToggleSearch = function(){
        loc_search_ctrls.toggle();

        if (loc_search_ctrls.css('display') !== 'none')
            txt_loc_search.focus();
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

    var results = $('.results');
    var arrow = $('.arrow');
    var resultsToggle = false;
    t.ArrowClick = function(){
            resultsToggle = !resultsToggle;
            results.toggleClass('open', resultsToggle);
            arrow.toggleClass('flip', resultsToggle);
    };

    t.ResultItemClick = function (d){
        console.log('item clicked!');
        console.log(d);
    };

    t.NotifyMapIsReady = function() {
        mapReady = true;
        // these coordinates default to the center of the USA
        var myLat = 37.2739675;
        var myLng = -104.678212;

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

        });
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
        }
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

    function categoriesToArray(){
        var keys = Object.keys(CATEGORIES);
        var arr = [];

        for (var i=0; i<keys.length; i++){
            arr.push(CATEGORIES[ keys[i] ]);
        }

        return arr;
    }

    /*
     * @param category_color: can equal any key in CATEGORIES or a valid HTML color
     */
    function createTagIcon(category_color){
        var color = SELECTED_MARKER_COLOR;
        var category_obj = CATEGORIES[category_color];

        if (category_obj){
            color = category_obj.color;
        }
        console.log(color);
        var tag = {
            path: 'M 0,0 24,0, 24,24 12,40, 0,24 z',
            fillColor: color,
            fillOpacity: 0.8,
            scale: 0.75,
            strokeColor: 'black',
            strokeWeight: 1
        };

        return tag;
    }

    if (loadLocalData())
        t.location(localData.location);
    else
        $('.welcome').css('visibility', 'visible');
}


var myModel = new AppViewModel();
ko.applyBindings(myModel);
