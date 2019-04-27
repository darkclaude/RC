var app = angular.module('mdx', []);
const {ipcRenderer} = require('electron')
var size =200;


var thrust     = $.gauge('#thrust', { size: size,ul:100,q1:0.1,q2:0.3,q3:0.7, footer:"%", title:"Thrust Level",inv: true}); 
var airspeed     = $.airspeed('#airspeed', { size: size }); 
var altimeter    = $.altimeter('#altimeter', { size: size });
var attitude     = $.attitude('#attitude', { size: size });
var heading      = $.heading('#heading', { size: size, beacon1Visible: true, beacon2Visible: false });
var turn_coord   = $.turn_coordinator('#bankAngle', { size: size});

//var chart;
var data;
var try_to_connect = false;
app.controller('MainController', ['$scope' ,'$sce','$http', '$interval','$timeout', '$window', function ($scope, $sce,$http, $interval,$timeout, $window) {
var userid;
var userobj;

$scope.altitude = "0";
$scope.heading = "0";
$scope.gpstatus = "No Fix"
$scope.yaw = "0";
$scope.roll = "0"
$scope.navmode = "Null";
$scope.pitch= "0"
$scope.hdop= "0";
$scope.distwp = "0";

//STATE CHECK BEGIN
//heading= f;
var state = ipcRenderer.sendSync('getState', 'gs');
if(state=='null'){
    $scope.datalink = "Gateway"
    $scope.btnStatus= "Connect";
    $scope.btnC= "btn btn-success"
    $scope.conStat = false;
    $scope.linkdn = false;
    $scope.slisten = false;
}
else{
    var args = state.split(',');
    if(args[0]=='socket'){
    $scope.datalink = "Gateway";
    $scope.linkpath= args[1];
    $scope.btnStatus= "Disconnect";
    $scope.btnC= "btn btn-warning"
    $scope.conStat = true;
    $scope.linkdn = true;
    $scope.slisten = false;
    }
    else{
        $scope.datalink = "Serial";
    $scope.linkpath= args[0];
    $scope.dataport= args[1];
    $scope.btnStatus= "Disconnect";
    $scope.btnC= "btn btn-warning"
    $scope.conStat = true;
    $scope.linkdn = true;
    $scope.slisten = true; 
    }
}
//STATE CHECK DONE


var mapObj = new GMaps({
    el: '#map',
    lat: 25.118950,
    lng:  55.164418,
});
var planeSymbol = {
  //  path:"M 439.48098,95.969555 L 393.34268,142.46481 L 305.91233,133.41187 L 324.72376,114.58551 L 308.61525,98.464215 L 276.15845,130.94677 L 185.25346,123.08136 L 201.15145,107.27643 L 186.46085,92.574165 L 158.32,120.73735 L 45.386032,112.12042 L 15.000017,131.66667 L 221.20641,192.48691 L 298.26133,237.01135 L 191.91028,345.62828 L 152.82697,408.6082 L 41.549634,393.05411 L 21.037984,413.58203 L 109.25334,470.93369 L 166.38515,558.95725 L 186.8968,538.42933 L 171.35503,427.06371 L 234.28504,387.94939 L 342.81586,281.51396 L 387.305,358.63003 L 448.07703,565.00001 L 467.60778,534.58989 L 458.99769,421.56633 L 487.16033,393.38134 L 473.14247,379.35235 L 456.6139,395.97492 L 448.79636,303.63439 L 481.25315,271.15184 L 465.14464,255.03055 L 446.33321,273.8569 L 436.04766,185.1164 L 482.35108,138.7864 C 501.1942,119.92833 560.62425,61.834815 564.99998,14.999985 C 515.28999,23.707295 476.1521,61.495405 439.48098,95.969555 z",
   path: 'M362.985,430.724l-10.248,51.234l62.332,57.969l-3.293,26.145 l-71.345-23.599l-2.001,13.069l-2.057-13.529l-71.278,22.928l-5.762-23.984l64.097-59.271l-8.913-51.359l0.858-114.43 l-21.945-11.338l-189.358,88.76l-1.18-32.262l213.344-180.08l0.875-107.436l7.973-32.005l7.642-12.054l7.377-3.958l9.238,3.65 l6.367,14.925l7.369,30.363v106.375l211.592,182.082l-1.496,32.247l-188.479-90.61l-21.616,10.087l-0.094,115.684',
    scale: 0.0633, 
    strokeOpacity: 1,
    //fill:'black',
    fillColor: 'green',
    fillOpacity: 1,
    color: 'black',
    strokeWeight: 2,
    rotation: 0
 };	
 

mapObj.setZoom(14);
var plane = mapObj.addMarker({
    lat: 25.118950,
    lng:  55.164418,
    icon: planeSymbol,
    click: function(e) {
    //  alert('You clicked in this marker');
    }
  }); 
  //mapObj.panTo(newPosition);
  var lat = 25.118950;
  var inc =  0.00020;

  
//console.log(heading);
 setInterval(function(){
  
    var newPosition = new google.maps.LatLng(plane.getPosition().lat(), plane.getPosition().lng());
    plane.setPosition(newPosition);
        mapObj.panTo(newPosition);
  
 },5000)


   // console.log(response);
  
   //$scope.test = ipcRenderer.sendSync('http', 'http://google.com');
$scope.connect = function(linkpath,datalink){
    if(linkpath){
        if(datalink=="Gateway"){
        if($scope.btnC.indexOf("success")>0){
        ipcRenderer.sendSync('connect', linkpath);
        $scope.conStatus=true
        $scope.linkdn = true;
        $scope.btnStatus= "Connecting...";
$scope.btnC= "btn btn-warning"
        try_to_connect = true;
        }
        else{
            ipcRenderer.sendSync('disconnect', linkpath);
            $scope.conStatus=true
            $scope.btnStatus= "disconnecting...";
    $scope.btnC= "btn btn-warning"
        }
       
    }
    else if(datalink=="Serial"){
        if($scope.btnC.indexOf("success")>0){
            if(typeof $scope.dataport === "undefined"){
                // alert()
               // swal($scope.dataport)
                 swal("", "Please Select Baud Rate", "warning");
             }
             else{
            //     swal($scope.dataport)
             ipcRenderer.sendSync('serialconnect', linkpath+':'+$scope.dataport);
             $scope.conStatus=true;
             $scope.linkdn = true;
             $scope.btnStatus= "Connecting...";
     $scope.btnC= "btn btn-warning"
             }
            }
            else{
                ipcRenderer.sendSync('serialdisconnect', linkpath);
                $scope.conStatus=true
                $scope.btnStatus= "disconnecting...";
        $scope.btnC= "btn btn-warning"
            }
     
    }
    else{}
}
   
    else{
      // swal("No Entry!");
       swal("", "Please Enter a Linkpath", "warning");
    }
  
}

$("#linkpath").keyup(function(){
    //swal($scope.datalink)
   if($scope.datalink=="Serial"){
   // ipcRenderer.sendSync('fetchports', 'fp'); 
   fetchports();
   }
  });
  $("#linkpath").keydown(function(){
    if($scope.datalink=="Serial"){
       fetchports();
       } 
});
function fetchports(){
     
    $scope.$apply(function () {
    $scope.linkpath = ipcRenderer.sendSync('fetchports', 'fp');
    });
}
$scope.linkchange = function(curval){
if(curval=="Serial"){
$scope.slisten = true;


}
else{
$scope.slisten = false;
}
}

ipcRenderer.on('connected', (event, args) => {
    
    $scope.$apply(function () {
        $scope.conStatus=false;
        $scope.btnStatus= "Disconnect";
        $scope.linkdn = true;
$scope.btnC= "btn btn-danger";
    });
 //   swal(args)
    swal("", args.toUpperCase(), "success");
    try_to_connect=true;
 /// console.log(args)
})

ipcRenderer.on('data', (event, args) => {
    $scope.$apply(function () {
        $scope.conStatus=false;
        $scope.btnStatus= "Disconnect";
        $scope.linkdn = true;
$scope.btnC= "btn btn-danger";
    });
  
  //  $scope.conStatus=true;
     try_to_connect=true;
 
   try{
 data = JSON.parse(args);
   }catch(error){

   }
console.log(data.heading)

   

 altimeter.setAltitude(data.altitude)
 airspeed.setAirspeed(data.airspeed);
 attitude.setPitch((parseInt(data.pitch)*-1.0).toString());
 attitude.setRoll(data.roll);
 turn_coord.setTurn(data.roll);
 thrust.setValue(data.thrustlevel);
 $scope.altitude = data.altitude; 

$scope.gpstatus = data.gpsfix;
$scope.yaw = data.yaw;
$scope.roll = data.roll;
$scope.navmode = data.navmode;
$scope.pitch= data.pitch;
$scope.hdop= data.hdop;
var newPosition = new google.maps.LatLng(data.lat, data.lng);
  plane.setPosition(newPosition);
var currentheading2 = mapObj.getHeading({lat:plane.getPosition().lat(),lng: plane.getPosition().lng()},{lat: 25.038015, lng: 55.117550});//
//new google.maps.geomtry.spherical.computeHeading(new google.maps.LatLng(25.197525, 55.274288),new google.maps.LatLng(25.038015,55.117550));
planeSymbol.rotation = currentheading2;
$scope.heading = currentheading2.toFixed(1);
heading.setHeading(currentheading2);
plane.setIcon(planeSymbol); 

$scope.distwp =   mapObj.getDistance({lat:plane.getPosition().lat(),lng: plane.getPosition().lng()},{lat: 25.038015, lng: 55.117550}).toFixed(1)
        
        
})

ipcRenderer.on('disconnected', (event, args) => {
    $scope.$apply(function () {
        $scope.conStatus=false;
        $scope.btnStatus= "Connect";
        $scope.btnC= "btn btn-success";
        $scope.linkdn = false;
            try_to_connect=false;
    });
  
    try_to_connect=false;
    console.log(args)
  //  swal(args)
  swal("", args.toUpperCase(), "error");
})

  
}]);
