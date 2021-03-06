'use strict';

$(document).ready(function() {
  initializePage();
})
var map;
var marker;
function initializePage() {
  // highlight();
  // buttonclick();

}

// use Google Maps API to create a mapbox
function initMap() {
  var geisel = {lat: 32.88, lng: -117.2362022};
  map = new google.maps.Map(document.getElementById('map'), {
    zoom: 14,
    center: geisel
  });

  var card = document.getElementById('pac-card');
  var input = document.getElementById('pac-input');

  var autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.addListener('place_changed', function(){
    // infowindow.close();
    // console.log("h3");
    var place = autocomplete.getPlace();
    console.log(place);
    if (!place.geometry) {
      window.alert("No details for input");
      return;
    }
    console.log("right now: " + map.getBounds());
    console.log("target bounds: " + place.geometry.location);

    var extended_bound = map.getBounds().extend(place.geometry.location);
    var $mapDiv = $('#map');
    var mapDim = {height: $mapDiv.height(), width: $mapDiv.width()};
    // addMarker(place.geometry.location,map);
    addPlaceInfo(place);
    map.setCenter(extended_bound.getCenter());
    map.setZoom(getBoundsZoomLevel(extended_bound, mapDim))
    $(input).val('');
  })

  // addMarker(geisel, map);
}
function getBoundsZoomLevel(bounds, mapDim) {
    var WORLD_DIM = { height: 256, width: 256 };
    var ZOOM_MAX = 21;

    function latRad(lat) {
        var sin = Math.sin(lat * Math.PI / 180);
        var radX2 = Math.log((1 + sin) / (1 - sin)) / 2;
        return Math.max(Math.min(radX2, Math.PI), -Math.PI) / 2;
    }

    function zoom(mapPx, worldPx, fraction) {
        return Math.floor(Math.log(mapPx / worldPx / fraction) / Math.LN2);
    }

    var ne = bounds.getNorthEast();
    var sw = bounds.getSouthWest();

    var latFraction = (latRad(ne.lat()) - latRad(sw.lat())) / Math.PI;

    var lngDiff = ne.lng() - sw.lng();
    var lngFraction = ((lngDiff < 0) ? (lngDiff + 360) : lngDiff) / 360;

    var latZoom = zoom(mapDim.height, WORLD_DIM.height, latFraction);
    var lngZoom = zoom(mapDim.width, WORLD_DIM.width, lngFraction);

    return Math.min(latZoom, lngZoom, ZOOM_MAX);
}
//Adds a marker to the map
function addMarker(location) {
  marker = new google.maps.Marker({
    position: location,
    map: map,
    animation: google.maps.Animation.DROP
  });
}
function addPlaceInfo(place) {
  var place_info = document.createElement('div');
  place_info.className = "place-info";
  var address = '';
  if (place.address_components) {
    address = [
      (place.address_components[0] && place.address_components[0].short_name || ''),
      (place.address_components[1] && place.address_components[1].short_name || ''),
      (place.address_components[2] && place.address_components[2].short_name || '')
    ].join(' ');
  }
  // add icon
  var place_icon = document.createElement('img');
  place_icon.src = place.icon;
  place_icon.className = "place-icon"
  place_info.append(place_icon);

  // add place name
  var place_name = document.createElement('span');
  place_name.textContent = place.name;
  place_name.className = "place-name"
  place_info.append(place_name);
  place_info.append(document.createElement('br'));

  // add place address
  var place_addr = document.createElement('span');
  place_addr.textContent = address;
  place_addr.className = "place-address"
  place_info.append(place_addr);

  var newli = document.createElement('li');
  newli.append(place_info);
  $("#place-cards").append(newli);
  var place_cards = document.getElementById('place-cards');
  var editablePlace = Sortable.create(place_cards, {
    onUpdate: function(evt) {
      var item = evt.item;
      console.log("item: " + item);
    },
    onEnd: function(evt){
      console.log(evt.oldIndex);

    },
    dataIdAttr: 'data-id'
  });
  // var $editablePlace = $('#place-cards');
  // var elements = $editablePlace.children();
  var elements = document.getElementById('place-cards').children;
  console.log("elements: " +elements );
  var place_list = [];
  // console.log("****** "+elements.children.getElementsByTagName("img").innerHTML);
  // elements.each(function(index,element){
  //   place_list.push($(this).attr('id'));
  // });
  // console.log(elements.length);
  // console.log(elements[0]);
  // var childs = $element.children();
  for (var i = 0; i < elements.length; i++) {
    var temp1 = elements[i];
    var temp2 = temp1.getElementsByTagName('span')[0].innerHTML;
    place_list.push(temp2);
    console.log(temp2);

  }
  var length = place_list.length;
  if (length == 1)
    addMarker(place.geometry.location,map);
  else if (length == 2) {
    marker.setMap(null);
    addRoute(place_list, length);
  }
  else if (length > 1)
    addRoute(place_list, length);
  console.log("place-list: "+ place_list);
}
function addRoute(place_list, length) {
  var directionsService = new google.maps.DirectionsService;
  var directionsDisplay = new google.maps.DirectionsRenderer;
  directionsDisplay.setMap(map);

  var origin = place_list[0];
  // console.log("origin: "+origin);
  var destination = place_list[place_list.length - 1];

  var waypoints = [];
  var format;
  // console.log("destination: " + destination);
  // if more than 2 destinations, then add waypoints from place_list
  if (length > 2) {
    for (var i = 1; i < length - 1; i++) {
      waypoints.push({
        location: place_list[i]
      });
    }
    console.log("waypoints: " + waypoints);
    // waypoints.shift();
    // console.log("waypoints1: " + waypoints);
    // waypoints.splice(waypoints.length-1, 1);
    // console.log("waypoints2: " + waypoints);
    displayRoute(origin, destination, waypoints, directionsService, directionsDisplay);
  }
  else {
    // waypoints = [];
    displayRoute(origin, destination, waypoints, directionsService, directionsDisplay);
  }

  // displayRoute(place_list[0], place_list[place_list.length-1], directionsService, directionsDisplay);
}
function displayRoute(origin, destination, waypoints, service, display) {
  service.route({
    origin: origin,
    destination: destination,
    waypoints: waypoints,
    travelMode: 'DRIVING',
    avoidTolls: true
  }, function(response, status) {
    if (status === 'OK') {
      display.setDirections(response);
    } else {
      alert('Could not display directions due to: ' + status);
    }
  });
}
// function highlight() {
//   $(window).scroll(function(){
//     var height = $(".highlight").offset().top - $(window).scrollTop();
//     // console.log(height);
//     $("#log").html("position: " + height + "\n marker Color: " + $("#newmarker").css("background-color") + "HighColor: " + $("highlight").css("color"));
//     if (height < 100) {
//       // console.log(height);
//
//       $("#newmarker").css("background-color", $("#highlight").css("color"));
//     }
//   })
// }

// function newDest() {
//   var dest = document.getElementById("pac-input").value;
//   console.log(dest);
//   document.getElementById("pac-input").value = "";
//   getAjax(dest);
// // }
// // function getAjax(query) {
//   $.ajax({
//          url: "http://api.mapbox.com/geocoding/v5/mapbox.places/"+query+".json?access_token=pk.eyJ1Ijoiemh1eW1hbyIsImEiOiJjajFvbjB2NTAwMTVtMzJtaGkwc2N1dW0zIn0.tNPQ9yER6BTqqrBaUi3T2A",
//          type: "GET",
//          crossDomain: true,
//         // crossOrigin: true,
//         //  data: JSON.stringify(somejson),
//          dataType: "json",
//          success: function (response) {
//            console.log(response);
//            var coordinates = response.features[0].geometry.coordinates;
//            console.log(coordinates);
//
//            addMarker(query, coordinates);
//           //    var resp = JSON.parse(response);
//           //    alert(resp.status);
//          },
//          error: function (xhr, status) {
//              alert("error");
//          }
//      });
// }
