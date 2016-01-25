function AppViewModel() {
    var t = this;

    // TODO: load location from localStorage
    t.location = ko.observable();
    t.geoLocation = ko.observable();
    t.locationRadius = ko.observable(0);

    t.welcomeError = ko.observable("&nbsp");

    t.verifyInitialLocation = VerifyInitialLocation(t);

}

function VerifyInitialLocation(t) {
    return function (){
        var msg = "";

        if (!t.location())
            msg = "* Please enter a location";

        if (msg){
            t.welcomeError(msg);
            return;
        }

        // TODO: geolocate the user-provided address

        $('.welcome').css('visibility', 'hidden');
    };
}

function LoadLocation(tf){
    if (tf) return "Seattle, WA";
    return "";
}

var map;
function initMap(){
    map = new google.maps.Map(document.getElementById('map'), {
      center: {lat: -34.397, lng: 150.644},
      zoom: 8
    });
}






ko.applyBindings(new AppViewModel());
