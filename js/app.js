function AppViewModel() {
    var t = this;

    // TODO: load location from localStorage
    t.location = ko.observable();
    t.geoLocation = ko.observable();
    t.locationRadius = ko.observable(0);

    t.welcomeError = ko.observable("&nbsp");

    // if (t.location() === "") $('.welcome').css('visibility', 'visible');
    // else $('.welcome').css('visibility', 'hidden');

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

        $('.welcome').css('visibility', 'hidden');
    };
}

function LoadLocation(tf){
    if (tf) return "Seattle, WA";
    return "";
}

ko.applyBindings(new AppViewModel());
