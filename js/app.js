var app = {};
app.map = {};
app.geocoder = {};
app.mapReady = false;

var data = {};
data.geoLocation = {};

function AppViewModel() {
    var t = this;

    // TODO: load location from localStorage
    t.location = ko.observable();
    t.locationRadius = ko.observable(0);

    t.welcomeError = ko.observable("&nbsp");

    t.verifyInitialLocation = VerifyInitialLocation(t);

}

function VerifyInitialLocation(t) {
    return function (){
        var msg = "";

        if (!t.location()){
            msg = "* Please enter a location";
            t.welcomeError(msg);
            return;
        }

        if (!app.mapReady){
            msg = "The map is not ready yet. Please wait 5 seconds and try again.";
            t.welcomeError(msg);
            return;
        }

        orientMap(t.location());

        $('.welcome').css('visibility', 'hidden');
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
