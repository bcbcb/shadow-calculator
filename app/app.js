
var calcSunPosition = function ( day, plat, plon, gmtdiff, azimuth, altitude ) {

  function to360range( num ) {
    if ( num > 360 ) return num - Math.floor( num / 360 ) * 360; else if ( num < 0 ) return num + ( Math.floor( - num / 360 ) + 1 ) * 360; else return num;
  }
  
  var inputDate = new Date();
  day = Date.UTC( day.getFullYear(), day.getMonth(), day.getDate(), day.getHours(), day.getMinutes() ) - gmtdiff * 60 * 60 * 1000;
  
  inputDate.setTime( day );

  var year = inputDate.getFullYear();
  var month = inputDate.getMonth() + 1;
  var D = inputDate.getDate();
  var d = 367 * year - Math.floor( ( 7 * ( year + ( Math.floor( ( month + 9 ) / 12 ) ) ) ) / 4 ) + Math.floor( ( 275 * month ) / 9 ) + D - 730530;
  //longitude of perihelion
  var w = 282.9404 + 4.70935 * Math.pow( 10, - 5 ) * d;
  //mean distance, a.u.
  var a = 1.000000;
  //eccentricity
  var e = 0.016709 - 1.151 * Math.pow( 10, - 9 ) * d;
  //mean anomaly
  var M = to360range( 356.0470 + 0.9856002585 * d );
  //obliquity of the ecliptic
  var oblecl = 23.4393 - 3.563 * Math.pow( 10, - 7 ) * d;
  //mean longitude
  var L = to360range( w + M );
  //eccentric anomaly
  var E = M + ( 180 / Math.PI ) * e * Math.sin( M * Math.PI / 180 ) * ( 1 + e * Math.cos( M * Math.PI / 180 ) );
  //rectangular coordinates in the plane of the ecliptic, where the X axis points towards the perihelion
  var x = Math.cos( E * Math.PI / 180 ) - e;
  var y = Math.sin( E * Math.PI / 180 ) * Math.sqrt( 1 - e * e );
  var r = Math.sqrt( x * x + y * y );
  var v = ( 180 / Math.PI ) * Math.atan2( y, x );
  var lon = to360range( v + w );
  //ecliptic rectangular coordinates
  x = r * Math.cos( lon * Math.PI / 180 );
  y = r * Math.sin( lon * Math.PI / 180 );  
  z = 0.0; //rotate to equatorial coordinates
  var xequat = x;
  var yequat = y * Math.cos( oblecl * Math.PI / 180 ) + z * Math.sin( oblecl * Math.PI / 180 );
  var zequat = y * Math.sin( oblecl * Math.PI / 180 ) + z * Math.cos( oblecl * Math.PI / 180 );
  //convert to RA and Declination
  var RA = ( 180 / Math.PI ) * Math.atan2( yequat, xequat );
  var Decl = ( 180 / Math.PI ) * Math.asin( zequat / r );
  //Sidereal Time at the Greenwich meridian at 00:00 right now
  var GMST0 = L / 15 + 12;
  var UT = inputDate.getUTCHours() + inputDate.getUTCMinutes() / 60;
  var SIDTIME = GMST0 + UT + plon / 15;
  SIDTIME = SIDTIME - 24 * Math.floor( SIDTIME / 24 );
  //hour angle
  var HA = to360range( 15 * ( SIDTIME - RA / 15 ) );
  x = Math.cos( HA * Math.PI / 180 ) * Math.cos( Decl * Math.PI / 180 );
  y = Math.sin( HA * Math.PI / 180 ) * Math.cos( Decl * Math.PI / 180 );
  z = Math.sin( Decl * Math.PI / 180 );
  var xhor = x * Math.sin( plat * Math.PI / 180 ) - z * Math.cos( plat * Math.PI / 180 );
  var yhor = y;
  var zhor = x * Math.cos( plat * Math.PI / 180 ) + z * Math.sin( plat * Math.PI / 180 );
  azimuth = ( to360range( Math.atan2( yhor, xhor ) * ( 180 / Math.PI ) + 180 ) );
  altitude = ( Math.asin( zhor ) * ( 180 / Math.PI ) );

  return {
    azimuth: azimuth,
    altitude: altitude
  };
};

var calculateShadow = function ( h, day, lat, lon, timeZone, i ) {
  var result = calcSunPosition( day, lat, lon, timeZone );
  var length;


  if ( result.altitude > 0 && result.altitude != 90 ) {
    length = h / Math.tan( result.altitude / 180 * Math.PI ) ;
  } else {
    length = 0;
  }
  // console.log(i, result.azimuth.toFixed(3), result.altitude.toFixed(3), length.toFixed(3));
  return {
    length: length,
    azimuth: result.azimuth,
    altitude: result.altitude
  };
};


// =================================================================================================
//           A N G U L A R
// =================================================================================================
//

var app = angular.module('shadow', ['mgcrea.ngStrap', 'ui.bootstrap-slider', 'geolocation']);

app.controller('ShadowController', ['$scope', '$http', 'Times', 'geolocation', function($scope, $http, Times, geolocation) {

  geolocation.getLocation().then(function(data){
    $scope.coords = {lat:data.coords.latitude, long:data.coords.longitude};
    console.log($scope.coords);
  });


  $scope.data = Times; // For testing calculations
  var now = new Date();

  $scope.selectedDate = now;

  $scope.timeRange = {
    min: +new Date(now.getFullYear(), now.getMonth(), now.getDate(), 6, 0, 0 ,0),
    max: +new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0 ,0),
    step: 1000 * 60,
  };

  $scope.shadowLength = $scope.shadowLength || 1;

  $scope.getShadowLength = function (value, event) {
    var result = calculateShadow(1, new Date(value), 37, -122, -8);
    $scope.shadowLength = result.length;
    $scope.altitude = result.altitude;
    $scope.azimuth = result.azimuth;
  };

  // date stuff

  $scope.getDate = function () {
    var day = $scope.selectedDate;
    $scope.timeRange = {
      min: +new Date(day.getFullYear(), day.getMonth(), day.getDate(), 6, 0, 0 ,0),
      max: +new Date(day.getFullYear(), day.getMonth(), day.getDate(), 18, 0, 0 ,0)
    };

  };



}]);


// Make array of times with 15 minute intervals
app.factory('Times', function TimesFactory() {
  var startHour = 6;
  var endHour   = 12 + 5; 
  var minutes = [0, 30];

  var getTimes = function (day) {
    var times = [];
    for (var hour = startHour; hour < endHour + 1; hour++) {
      for (var i = 0; i < 2; i++) {
        times.push( new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minutes[i]) );
      }
    }

    return times.map( function (t) {
      return {
        time: t,
        shadow: calculateShadow(1, t, 37, -122, -8).length
     };
    });

  };
  return getTimes;
});



// D3
// ====================



app.directive('shadowChart', ['Times', '$filter', function ChartDirective(Times, $filter) {
  return {
    restrict: 'E',
    scope: true,
    link: function (scope, element, attrs) {

      var data = Times(scope.selectedDate);
      var chart = d3.select(element[0]);

      scope.$watch('selectedDate', function (value) {
        data = Times(scope.selectedDate);
        chart.select("div").remove();
        chart.append("div").attr("class", "chart")
        .selectAll('div')
        .data(data).enter().append("div")
        .transition()
        .duration(1000)
        .ease("elastic")
        .attr("class", "test")
        .style("width", "3.85%")
        .style("height", function(d) { return d.shadow  * 5 + '%' ; })
        .style("background-color", "#999")
        .style("color", "#222")
        .style("float", "left")
        .style("margin", "1px")
        .style("z-index", "-10")
        .style("font-size", "0.9em")
        .style("font-weight", "400")
        .style("text-align", "center")
        .text(function(d) { return $filter('date')(d.time, 'h:mm a') + '(' + $filter('number')(d.shadow, 1) + 'x)'; });
      });

      
    }
  };
}]);

