var app = {};
app.map = {};
app.geocoder = {};
app.mapReady = false;

var localData = {};

var searchData = {'abc': 123, 'xyz': 456};
var dummyResults = [2, 4, 6, 8, 10];

var RADIUSVALS = [5,10,15,20,25];
var CATEGORIES = [
    {title:'Education', icon:'img/blue.svg', api:''},
    {title:'Medical', icon:'img/red.svg', api:''},
    {title:'Dining', icon:'img/green.svg', api:''},
    {title:'Shopping', icon:'img/gray.svg', api:''},
    {title:'Automotive', icon:'img/yellow.svg', api:''},
    {title:'Entertainment', icon:'img/orange.svg', api:''}
];


function AppViewModel() {
    var t = this;
    t.radiusValues = ko.observableArray(RADIUSVALS);
    t.categories = ko.observableArray(CATEGORIES);
    t.welcomeError = ko.observable("&nbsp");
    // TODO: load location from localStorage
    t.location = ko.observable();
    t.locationRadius = ko.observable(0);
    t.currentCategory = ko.observable('No category has been selected');
    t.currentResults = ko.observableArray();

    t.SetInitialLocation = SetInitialLocation(t);
    t.UpdateLocation = UpdateLocation(t);
    t.toggleSearch = ToggleSearch(t);
    t.CategoryClick = CategoryClick(t);
    t.ArrowClick = ArrowClick(t);

    if (loadLocalData())
        t.location(localData.location);
    else
        $('.welcome').css('visibility', 'visible');
}

function SetInitialLocation(t) {
    return function (){
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
        if (!app.mapReady){
            msg = "The map is not ready yet. Please wait 5 seconds and try again.";
            t.welcomeError(msg);
            return;
        }

        // The data has made it through the gauntlet and the map can be shown
        centerMap(t);

        // Remove the focus from the textbox on the welcome screen so we
        // ca set the focus elsewhere
        $('welcome-info-controls-input').blur();

        // We're done with the welcome screen and we can now hide it
        $('.welcome').css('visibility', 'hidden');
    };
}

var txt_loc_search = $('.txt-loc-search');
var radius_loc_search = $('.radius-loc-search');
var loc_search_ctrls = $('.loc-search-ctrls');
function UpdateLocation(t){
    return function(){
        var tmpLoc = txt_loc_search.val();
        var tmpRad = radius_loc_search.val();
        // TODO verify the searchRadius value is valid

        if (tmpLoc){
            t.location(tmpLoc);
            t.locationRadius(tmpRad);
            centerMap(t);
        }

        //TODO reset categories for new location
        txt_loc_search.val("");
        txt_loc_search.blur();
        loc_search_ctrls.css('display', 'none');
    };
}

var loc_search_ctrls = $('.loc-search-ctrls');
var txt_loc_search = $('.txt-loc-search');
function ToggleSearch(t){
    return function (){
        loc_search_ctrls.toggle();

        if (loc_search_ctrls.css('display') !== 'none')
            txt_loc_search.focus();
    };
}

function CategoryClick(t){
    return function(d){
        var category = d.title;
        t.currentCategory(category);

        if (!searchData[category])
            searchData[category] = GetSearchResults(category);

        t.currentResults(searchData[category]);
    };
}

function GetSearchResults(category){
    // TODO populate results for 'category' from google places
    return $.extend(true, [], dummyResults);
}

function centerMap(t){
    app.geocoder.geocode({'address':t.location()}, updateGeo);
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
        saveLocalData();

        app.map.setCenter(results[0].geometry.location);
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

    return true;
}


function NotifyMapIsReady(){
    app.mapReady = true;
    // these coordinates default to the center of the USA
    var myLat = 37.2739675;
    var myLng = -104.678212;

    if (!$.isEmptyObject(localData)){
        myLat = localData.lat;
        myLng = localData.lng;
    }

    app.geocoder = new google.maps.Geocoder();
    app.map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: myLat, lng: myLng},
        zoom: 13
    });
}

var results = $('.results');
var arrow = $('.arrow');
var resultsToggle = false;
function ArrowClick(t){
    return function (){
        resultsToggle = !resultsToggle;
        results.toggleClass('open', resultsToggle);
        arrow.toggleClass('flip', resultsToggle);
    };
}


var myModel = new AppViewModel();
ko.applyBindings(myModel);
