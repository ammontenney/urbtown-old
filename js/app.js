var app = {};
app.map = {};
app.geocoder = {};
app.mapReady = false;

var data = {};
data.geoLocation = {};

function AppViewModel() {
    var t = this;
    t.radiusValues = ko.observableArray([5,10,15,20,25]);
    t.welcomeError = ko.observable("&nbsp");
    // TODO: load location from localStorage
    t.location = ko.observable();
    t.locationRadius = ko.observable(0);

    t.SetInitialLocation = SetInitialLocation(t);
    t.UpdateLocation = UpdateLocation(t);
    t.toggleSearch = ToggleSearch(t);

}

function SetInitialLocation(t) {
    return function (){
        var msg = "";

        if (!t.location()){
            msg = "* Please enter a location";
            t.welcomeError(msg);
            return;
        }

        // TODO verify the searchRadius value is valid

        if (!app.mapReady){
            msg = "The map is not ready yet. Please wait 5 seconds and try again.";
            t.welcomeError(msg);
            return;
        }

        orientMap(t.location());

        $('.welcome').css('display', 'none');
    };
}

function UpdateLocation(t){
    return function(){
        var locSrch = $('.txt-loc-search');
        var radSrch = $('.radius-loc-search');
        var tmpLoc = locSrch.val();
        var tmpRad = radSrch.val();
        // TODO verify the searchRadius value is valid

        if (tmpLoc){
            t.location(tmpLoc);
            t.locationRadius(tmpRad);
            orientMap(t.location());
        }

        //TODO reset categories for new location
        locSrch.val("");
        $('.loc-search-ctrls').css('display', 'none');
    };
}

function ToggleSearch(t){
    return function (){
        $('.loc-search-ctrls').toggle();
    };
}

function LoadLocation(tf){
    if (tf) return "Seattle, WA";
    return "";
}

function orientMap(location){
    app.geocoder.geocode({'address':location}, function(results, status){
        if (status == google.maps.GeocoderStatus.OK)
            app.map.setCenter(results[0].geometry.location);
        else
            console.log("Geocode didn't work: " + status);
    });


}


function NotifyMapIsReady(){
    app.mapReady = true;

    app.geocoder = new google.maps.Geocoder();
    app.map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 37.2739675, lng: -104.678212},
        zoom: 12
    });
}





ko.applyBindings(new AppViewModel());
