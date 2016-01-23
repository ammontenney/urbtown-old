function AppViewModel() {
    var t = this;

    // TODO: load location from localStorage
    t.location = ko.observable(LoadLocation(false));
    t.geoLocation = ko.observable();
    t.locationRadius = ko.observable();

    if (t.location() === ""){
        $('.welcome').css('visibility', 'visible');
    }
    else {
        $('.welcome').css('visibility', 'hidden');
    }


}

function LoadLocation(tf){
    if (tf) return "Seattle, WA";
    return "";
}

ko.applyBindings(new AppViewModel());
