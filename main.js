    // Initialise some variables
    var directionsService = new google.maps.DirectionsService();
    var num, map, data, j=0;
    var requestArray = [], renderArray = [];
    var waitAtWaypoint = 15*60; // 15 minutes
    var breakEvery = 5*60*60; // break every 5 hours for...
    var breakDuration = 30*60; // 30 minutes

    // 16 Standard Colours for navigation polylines
    var colourArray = ['navy', 'red', 'fuchsia', 'black', 'orange', 'maroon', 'purple', 'aqua', 'coral', 'green', 'indigo', 'olive', 'blue', 'plum', 'teal', 'brown'];

    // Get the ball rolling and trigger our init() on 'load'
    google.maps.event.addDomListener(window, 'load', init);

    // Path simulation global variables
    var autoDriveSteps = [];
    var speedFactor = 1; // Ax faster animated drive (altering this will mess with timer functionality)
    var animationRenderer = [];
    var autoDriveTimer = [];
    var agentMarker = [];
    var paused = [];
    var queued = [];
    var infoWindows = [];
    var stopAtWayPointTimeout = [];
    var stopForBreakTimeout = [];


    function resetInputs(){
        document.getElementById("sortablelist").innerHTML =
        `<div class="list-group-item d-flex align-items-center justify-content-between" data-id="1">
        <div>
        <p class="mb-0 d-inline-flex align-items-center">
            Address<br>
            <input id="pac-input1" size="30" class="controls" type="text" onchange="addInputs()" placeholder="Start typing here to add destination..."><br></p>
        </div>
        </div>
        <div class="list-group-item d-flex align-items-center justify-content-between" data-id="2">
        <div>
        <p class="mb-0 d-inline-flex align-items-center">
            Address<br>
            <input id="pac-input2" size="30" class="controls" type="text" onchange="addInputs()" placeholder="Start typing here to add destination..."><br></p>
        </div>
        </div>`
        document.getElementById("label").value = "";
        order = sortable.toArray();
        var defaultBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(-32,110),
            new google.maps.LatLng(-34,130));
        var options = {bounds: defaultBounds};
        var inputX = {};

        for (i=0; i<=1; i++) {
            inputX[i] = document.getElementById(`pac-input${order[i]}`);
            var autocomplete = new google.maps.places.Autocomplete(inputX[i], options)
        }
    }
    
    function addInputs(){
        var order = sortable.toArray();
        var inputCount = document.getElementById("sortablelist").innerHTML.split("pac-input").length - 1;
        var filled = true; 
        var currentText = {};
        for (i=0; i<inputCount; i++)
            if (document.getElementById(`pac-input${order[i]}`).value == "")
                filled = false;
            else
                currentText[i] = document.getElementById(`pac-input${order[i]}`).value;

        if (filled) {
            document.getElementById("sortablelist").innerHTML +=
            `<div class="list-group-item d-flex align-items-center justify-content-between" data-id="${inputCount+1}">
                <div>
                <p class="mb-0 d-inline-flex align-items-center">
                    Address<br>
                    <input id="pac-input${inputCount+1}" size="30" class="controls" type="text" onchange="addInputs()" placeholder="Start typing here to add destination"><br></p>
                </div>
            </div>`
            order = sortable.toArray();
            var defaultBounds = new google.maps.LatLngBounds(
                new google.maps.LatLng(-32,110),
                new google.maps.LatLng(-34,130));
            var options = {bounds: defaultBounds};
            var inputX = {};

            for (i=0; i<=inputCount; i++) {
                document.getElementById(`pac-input${order[i]}`).value = currentText[i];
                if (document.getElementById(`pac-input${order[i]}`).value == "undefined")
                    document.getElementById(`pac-input${order[i]}`).value = "";
                inputX[i] = document.getElementById(`pac-input${order[i]}`);
                var autocomplete = new google.maps.places.Autocomplete(inputX[i], options)
            }
        }
    }

    function readRequests(){
        
        var order = sortable.toArray();
        
        var inputCount = document.getElementById("sortablelist").innerHTML.split("pac-input").length - 1;
        var uiArray = {"Track 1 " : []};
        for (i=0; i<inputCount; i++)
            uiArray["Track 1 "][i] = document.getElementById(`pac-input${order[i]}`).value, 
        
        requestArray = [];

        for (var route in uiArray){
            // This now deals with one of the people / routes

            // Somewhere to store the wayoints
            var waypts = [];

            // 'start' and 'finish' will be the routes origin and destination
            var start, finish

            // lastpoint is used to ensure that duplicate waypoints are stripped
            var lastpoint

            data = uiArray[route]

            limit = data.length
            for (var waypoint = 0; waypoint < limit; waypoint++) {
                if (data[waypoint] != "") {
                    if (data[waypoint] === lastpoint){
                        // Duplicate of of the last waypoint - don't bother
                        continue;
                    }

                    // Prepare the lastpoint for the next loop
                    lastpoint = data[waypoint]

                    // Add this to waypoint to the array for making the request
                    waypts.push({
                        location: data[waypoint],
                        stopover: true
                    });
                }
            }

            // Grab the first waypoint for the 'start' location
            start = (waypts.shift()).location;
            // Grab the last waypoint for use as a 'finish' location
            finish = waypts.pop();
            if(finish === undefined){
                // Unless there was no finish location for some reason?
                finish = start;
            } else {
                finish = finish.location;
            }

            // Let's create the Google Maps request object
            var request = {
                origin: start,
                destination: finish,
                waypoints: waypts,
                travelMode: google.maps.TravelMode.DRIVING
            };

            // and save it in our requestArray
            requestArray.push({"route": route, "request": request});
        }
        
        processRequests();
        
    }

    function processRequests(){

        // Used to submit the request 'i'
        function submitRequest(){
            directionsService.route(requestArray[0].request, directionResults);
        }

        // Used as callback for the above request for current 'i'
        function directionResults(result, status) {
            if (status == google.maps.DirectionsStatus.OK) {

                var order = sortable.toArray();
                var inputCount = document.getElementById("sortablelist").innerHTML.split("pac-input").length - 1;

                //console.log(result)

                var addresses = 0;
                var timeTaken = 0; //in seconds
                var distance = 0; //in metres
                var timeTakenAtWaypoint = [];

                for(i=1; i<=inputCount; i++) {
                    if (document.getElementById(`pac-input${i}`).value != ""){
                        addresses ++;
                    }
                }
                timeTakenAtWaypoint[0] = 0;

                for(i=0; i<addresses-1; i++) {
                    timeTaken += result.routes[0].legs[i].duration.value;
                    distance += result.routes[0].legs[i].distance.value;
                    timeTakenAtWaypoint[i+1] = result.routes[0].legs[i].duration.value;
                }
                for(i=0; i<addresses-2; i++) {
                    timeTaken += waitAtWaypoint;
                }
                for(i=2; i<addresses; i++) {
                    timeTakenAtWaypoint[i] = timeTakenAtWaypoint[i] + waitAtWaypoint;
                    timeTakenAtWaypoint[i] += timeTakenAtWaypoint[i-1];
                }
                
                var departTime = document.getElementById("departTime").value.split(":");
                var departHour = parseInt(departTime[0], 10);
                var departMin = parseInt(departTime[1], 10);

                var arrivalClock = []
                var arrivalTime;
                var pastMidnight = [];
                for (i=0; i<addresses; i++) {
                    arrivalTime = departHour*60*60 + departMin*60 + timeTakenAtWaypoint[i];
                    arrivalTime = arrivalTime + Math.floor(timeTakenAtWaypoint[i] / breakEvery)*breakDuration;
                    var extra0 = "0", extra00 = "0";
                    if ((arrivalTime/60/60)/24 > 1) pastMidnight[i] = ["<mark>","</mark>"]; else pastMidnight[i] = ["",""];
                    if (Math.floor(arrivalTime/60/60)%24 >= 10) extra0 = "";
                    if (Math.floor(arrivalTime%3600/60) >= 10) extra00 = "";
                    arrivalClock[i] = extra0 + Math.floor(arrivalTime/60/60)%24 + ":" + extra00 + Math.floor(arrivalTime%3600/60)
                }
                var routeLabel = document.getElementById("label").value;
                if (routeLabel == "") {
                    routeLabel = j + "";
                }

                document.getElementById("routes").innerHTML += "<br>" + document.getElementById(`pac-input${order[0]}`).value + ` <sup>${document.getElementById("departTime").value}</sup>`;
                for(i=2; i<=addresses; i++)
                    document.getElementById("routes").innerHTML += " =&gt; " + document.getElementById(`pac-input${order[i-1]}`).value  + ` <sup>${pastMidnight[i-1][0]}${arrivalClock[i-1]}${pastMidnight[i-1][1]}</sup>`
                document.getElementById("routes").innerHTML += " (" + Math.floor((arrivalTime-(departHour*60*60 + departMin*60))/60/60) + "Hrs " + Math.floor(((arrivalTime-(departHour*60*60 + departMin*60))%3600)/60) + "Mins ";
                document.getElementById("routes").innerHTML += `- ${Math.round(distance/1000*10)/10}km)`
                document.getElementById("routes").innerHTML += " <b><u>[" + document.getElementById("departTime").value + " &#8594 " + arrivalClock[addresses-1] + "]</b></u>";
                document.getElementById("routes").innerHTML += "<b> " + `{${routeLabel}}</b><pre>\n</pre>`;
                document.getElementById("routes").innerHTML += "<button id='routeRemove" + j + "' onclick='removeRoute(this.id)' style='float: right;'><img src='Bin.png' width='20' height='20'/></button>";
                document.getElementById("routes").innerHTML += "<button id='routeEdit" + j + "' onclick='editRoute(this.id)' style='float: right;'><img src='Pencil.png' width='20' height='20'/></button>";
                document.getElementById("routes").innerHTML += "<button id='routeStop" + j + "' onclick='stopRoute(this.id)' style='float: right;'><img src='Stop.png' width='20' height='20'/></button>";
                document.getElementById("routes").innerHTML += "<button id='routeStart" + j + `' onclick='queueRoute(this.id,${j})' style='float: right;'><img src='Start.png' width='20' height='20'/></button><br>`;
                
                document.getElementById(`routeStop${j}`).disabled = true;

                // Create a unique DirectionsRenderer 'i'
                renderArray[j] = new google.maps.DirectionsRenderer();
                renderArray[j].setMap(map);

                // Some unique options from the colorArray so we can see the routes
                renderArray[j].setOptions({
                    preserveViewport: true,
                    suppressInfoWindows: true,
                    polylineOptions: {
                        strokeWeight: 4,
                        strokeOpacity: 0.8,
                        strokeColor: colourArray[j%16]
                    },
                    markerOptions:{
                        icon:{
                            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                            scale: 3,
                            strokeColor: colourArray[j%16]
                        },
                        //label:{ 
                            //text: result.routes[0].legs[j].duration.text

                        //}
                    }
                });

                // Use this new renderer with the result
                renderArray[j].setDirections(result);
                map.panTo(result.routes[0].legs[0].steps[0].start_location);
                resetInputs();
                // and start the next request
                j++;
            }

        }

        // This request is just to kick start the whole process
        submitRequest();
        
    }

    function removeAll() {
        var i = 0;
        while (renderArray[i] != null) {
            renderArray[i].setMap(null);
            i++;
        }
        document.getElementById("routes").innerHTML = "Routes<br>";
        resetInputs();
    }

    function removeRoute(x) {
        var x1 = parseInt(x.match(/\d+/));
        renderArray[x1].setMap(null);
        x = x + '';
        var regex = new RegExp(`<br>((?!<br>).)*${x}.*?<br>`);
        //console.log(x)
        //console.log(regex.exec(document.getElementById("routes").outerHTML))
        //console.log(document.getElementById("routes").outerHTML.replace(regex, ''))
        document.getElementById("routes").innerHTML = document.getElementById("routes").innerHTML.replace(regex, '');
        // delete all between <br> routeRemovej <br>
        //document.getElementById("routes").innerHTML = null;
        //console.log(autoDriveSteps)
    }

    function editRoute(x) {
        var x1 = parseInt(x.match(/\d+/));
        renderArray[x1].setMap(null);
        x = x + '';
        var regex1 = new RegExp(`<br>((?!<br>).)*${x}.*?<br>`);
        var regex2 = new RegExp(/(?<=<br>).*(?= \(\d)/);
        var regex3 = new RegExp(/(?<=<u>\[).*]/);
        var regex4 = new RegExp(/(?<=\{)(.*?)(?=\})/);
        var routeStrings = regex2.exec(regex1.exec(document.getElementById("routes").innerHTML)) + "";
        routeStrings = routeStrings.replace(/ <sup>(<mark>)*\d\d:\d\d(<\/mark>)*<\/sup>/g,"")
        var destinations = routeStrings.split(" =&gt; ");
        var departStrings = regex3.exec(regex1.exec(document.getElementById("routes").innerHTML)) + "";
        var label = regex4.exec(regex1.exec(document.getElementById("routes").innerHTML)) + "";
        //console.log(destinations)
        document.getElementById("routes").innerHTML = document.getElementById("routes").innerHTML.replace(regex1, '');
        resetInputs();
        var temp = departStrings.split(" ");
        document.getElementById("departTime").value = temp[0];
        label = label.split(",")[0];
        document.getElementById("label").value = label;
        var inputCount = destinations.length;
        for (i=2; i<=inputCount; i++) {
            document.getElementById("sortablelist").innerHTML +=
            `<div class="list-group-item d-flex align-items-center justify-content-between" data-id="${i+1}">
                <div>
                <p class="mb-0 d-inline-flex align-items-center">
                    Address<br>
                    <input id="pac-input${i+1}" size="30" class="controls" type="text" onchange="addInputs()" placeholder="Start typing here to add destination"><br></p>
                </div>
            </div>`
        }
        order = sortable.toArray();
        var defaultBounds = new google.maps.LatLngBounds(
            new google.maps.LatLng(-32,110),
            new google.maps.LatLng(-34,130));
        var options = {bounds: defaultBounds};
        var inputX = {};

        for (i=0; i<=inputCount; i++) {
            inputX[i] = document.getElementById(`pac-input${order[i]}`);
            var autocomplete = new google.maps.places.Autocomplete(inputX[i], options)
        }
        for (i=0; i<inputCount; i++) {
            document.getElementById(`pac-input${order[i]}`).value = destinations[i];
        }

    }

    // Called Onload
    function init() {

        // Some basic map setup (from the API docs)
        var mapOptions = {
            center: new google.maps.LatLng(-32, 115.9),
            zoom: 11,
            mapTypeControl: false,
            streetViewControl: false,
            mapTypeId: google.maps.MapTypeId.ROADMAP
        };

        map = new google.maps.Map(document.getElementById('map-canvas'), mapOptions);

        var defaultBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(-32,110),
        new google.maps.LatLng(-34,130));
        var options = {bounds: defaultBounds};

        var input1 = document.getElementById('pac-input1');
        var input2 = document.getElementById('pac-input2');
        //map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

        var autocomplete = new google.maps.places.Autocomplete(input1, options)
        var autocomplete = new google.maps.places.Autocomplete(input2, options)

        document.getElementById("departTime").defaultValue = "08:00";

        sortable = new Sortable(sortablelist, {
            animation: 150,
            ghostClass: 'sortable-ghost'
        });
    }

    ////////////////SIMULATING PATH//////////////////

    function setAnimatedRoute(origin, destination, waypts, map, j) {
        // init routing services
        animationRenderer[j] = new google.maps.DirectionsRenderer({
            map: map
        });

        //calculate route
        directionsService.route({
                origin: origin,
                destination: destination,
                waypoints: waypts,
                travelMode: google.maps.TravelMode.DRIVING
            },
            function(response, status) {
                if (status == google.maps.DirectionsStatus.OK) {
                    // display the route - this will zoom into the map too
                    //animationRenderer[j].setDirections(response);
                    map.panTo(response.routes[0].legs[0].steps[0].start_location);
                    // calculate positions for the animation steps
                    // the result is an array of LatLng, stored in autoDriveSteps
                    autoDriveSteps[j] = new Array()
                    for (i=0 ; i<response.routes[0].legs.length ; i++) {
                        var totalTime = 0; // in seconds considering each point is 1s long
                        var remainingSeconds = 0;
                        var leg = response.routes[0].legs[i]; // supporting single route, single legs currently
                        leg.steps.forEach(function(step) {
                            var stepSeconds = step.duration.value;
                            var nextStopSeconds = speedFactor - remainingSeconds;
                            while (nextStopSeconds <= stepSeconds) {
                                var nextStopLatLng = getPointBetween(step.start_location, step.end_location, nextStopSeconds / stepSeconds);
                                if (totalTime % breakEvery === 0 && totalTime != 0) {
                                    autoDriveSteps[j].push("Break!");
                                }
                                autoDriveSteps[j].push(nextStopLatLng);
                                nextStopSeconds += speedFactor;
                                totalTime++;
                            }
                            remainingSeconds = stepSeconds + speedFactor - nextStopSeconds;
                        });
                        if (remainingSeconds > 0) {
                            autoDriveSteps[j].push(leg.end_location);
                        }
                        autoDriveSteps[j].push("Waypoint!");
                        totalTime = totalTime + waitAtWaypoint;
                    }
                    //console.log(autoDriveSteps)
                    
                } else {
                    window.alert('Directions request failed due to ' + status);
                }
            });
    }

    // helper method to calculate a point between A and B at some ratio
    function getPointBetween(a, b, ratio) {
        return new google.maps.LatLng(a.lat() + (b.lat() - a.lat()) * ratio, a.lng() + (b.lng() - a.lng()) * ratio);
    }

    // start the route simulation   
    function startRouteAnimation(marker,j) {
        autoDriveTimer[j] = setInterval(function () {
                // stop the timer if the route is finished
                if (autoDriveSteps[j].length === 0 || paused[j]) {
                    clearInterval(autoDriveTimer[j]);
                    // remove path and marker
                    //animationRenderer[j].setMap(null);
                    //agentMarker[j].setMap(null);
                } else if (marker.getDraggable()){
                    var draggedPos = new google.maps.LatLng;
                    draggedPos = marker.getPosition();
                    var indexOfClosest = 0;
                    var distanceOfClosest = 999999;
                    for (k=0; k< autoDriveSteps[j].length; k++) {
                        if (autoDriveSteps[j][k] == ("Waypoint!")){
                            //console.log(autoDriveSteps);
                        }
                        else if (autoDriveSteps[j][k] == ("Break!")){
                            //console.log(autoDriveSteps);
                        }
                        else {
                            var localLat = autoDriveSteps[j][k].lat();
                            var localLng = autoDriveSteps[j][k].lng();
                            var distance = Math.pow(Math.pow(draggedPos.lat()-localLat,2)
                                + Math.pow(draggedPos.lng() - localLng,2),0.5);
                            if (distance < distanceOfClosest) {
                                distanceOfClosest = distance;
                                indexOfClosest = k;
                            }
                        }
                    }
                    for (k=0; k<indexOfClosest; k++) {
                        autoDriveSteps[j].shift();
                    }
                    marker.setDraggable(false);
                
                } else if (autoDriveSteps[j][0] == ("Waypoint!")){
                    autoDriveSteps[j].shift();
                    clearInterval(autoDriveTimer[j]);
                    stopAtWayPoint(marker,j);
                } else if (autoDriveSteps[j][0] == ("Break!")){
                    autoDriveSteps[j].shift();
                    clearInterval(autoDriveTimer[j]);
                    stopForBreak(marker,j);
                }
                else  {
                    // move marker to the next position (always the first in the array)
                    marker.setPosition(autoDriveSteps[j][0]);
                    // remove the processed position
                    autoDriveSteps[j].shift();
                }
            },
            1000);
        return autoDriveTimer[j];
    }

    function stopAtWayPoint(marker,j){
        stopAtWayPointTimeout[j] = setTimeout(function() {startRouteAnimation(marker,j)}, waitAtWaypoint*1000);
    }

    function stopForBreak(marker,j){
        stopForBreakTimeout[j] = setTimeout(function() {startRouteAnimation(marker,j)}, breakDuration*1000);
    }

// start simulation on button click...
    function startRoute(x,j){
        var x1 = parseInt(x.match(/\d+/));
        //renderArray[x1].setMap(null);
        x = x + '';
        var regex1 = new RegExp(`<br>((?!<br>).)*${x}.*?<br>`);
        var regex2 = new RegExp(/(?<=<br>).*(?= \(\d)/);
        var routeStrings = regex2.exec(regex1.exec(document.getElementById("routes").innerHTML)) + "";
        routeStrings = routeStrings.replace(/ <sup>(<mark>)*\d\d:\d\d(<\/mark>)*<\/sup>/g,"")
        var destinations = routeStrings.split(" =&gt; ");
        var waypts = [];
        var start = destinations.shift();
        var finish = destinations.pop();
        var wayptCount = destinations.length;
        for (i=0; i<wayptCount; i++) {
            waypts.push({
                location: destinations.shift(),
                stopover: true,
            });
        }
        var regex4 = new RegExp(/(?<=\{)(.*?)(?=\})/);
        var label = regex4.exec(regex1.exec(document.getElementById("routes").innerHTML)) + "";
        label = label.split(",")[0];
        agentMarker[x1] = new google.maps.Marker({map, label});
        agentMarker[x1].setDraggable(false);
        setAnimatedRoute(start, finish, waypts, map, x1);
        paused[x1] = false;
        startRouteAnimation(agentMarker[x1],x1);

        routeStrings = regex2.exec(regex1.exec(document.getElementById("routes").innerHTML)) + "";
        var contentString = routeStrings.replaceAll(" =&gt; ","<br> =&gt; ");
        infoWindows[x1] = new google.maps.InfoWindow({content: contentString});
        agentMarker[x1].addListener("click", () => {
            infoWindows[x1].open(map, agentMarker[x1])
        })

        document.getElementById(x).outerHTML = `<button id="routeStart${x1}" onclick="pauseRoute(this.id,j)" 
            style="float: right;"><img src="Pause.png" width="20" height="20"></button>`;
        document.getElementById(x).disabled = true;
        setTimeout(function (){document.getElementById(x).disabled = false;}, 1500);
        document.getElementById(`routeStop${x1}`).disabled = false;
        document.getElementById(`routeEdit${x1}`).disabled = true;
        document.getElementById(`routeRemove${x1}`).disabled = true;
    }

    function stopRoute(x,j){
        var x1 = parseInt(x.match(/\d+/));
        if (queued[x1]) {
            clearTimeout(queued[x1]);
            if (agentMarker[x1]) {
                clearInterval(autoDriveTimer[x1]);
                agentMarker[x1].setMap(null);
            }
        }
        else {
            clearInterval(autoDriveTimer[x1]);
            agentMarker[x1].setMap(null);
        }
        document.getElementById(`routeStart${x1}`).outerHTML = `<button id="routeStart${x1}" onclick="queueRoute(this.id,j)" 
        style="float: right;"><img src="Start.png" width="20" height="20"></button>`;
        document.getElementById(x).disabled = true;
        document.getElementById(`routeEdit${x1}`).disabled = false;
        document.getElementById(`routeRemove${x1}`).disabled = false;
    }

    function pauseRoute(x,j){
        var x1 = parseInt(x.match(/\d+/));
        document.getElementById(x).outerHTML = `<button id="routeStart${x1}" onclick="resumeRoute(this.id,j)" 
        style="float: right;"><img src="Start.png" width="20" height="20"></button>`;
        paused[x1] = true;
        agentMarker[x1].setDraggable(true);
        clearInterval(autoDriveTimer[x1]);
        clearTimeout(stopForBreakTimeout[x1]);
        clearTimeout(stopAtWayPointTimeout[x1]);
    }

    function resumeRoute(x,j){
        var x1 = parseInt(x.match(/\d+/));
        paused[x1] = false;
        document.getElementById(x).outerHTML = `<button id="routeStart${x1}" onclick="pauseRoute(this.id,j)" 
        style="float: right;"><img src="Pause.png" width="20" height="20"></button>`;
        startRouteAnimation(agentMarker[x1],x1);
    }

    function clock() {
        var today = new Date();
        var h = today.getHours();
        var m = today.getMinutes();
        var s = today.getSeconds();
        m = checkClock(m);
        s = checkClock(s);
        document.getElementById('clock').innerHTML =
        h + ":" + m + ":" + s;
        var t = setTimeout(clock, 500);
      }

    function checkClock(i) {
        if (i < 10) {i = "0" + i};  // add zero in front of numbers < 10
        return i;
    }

    function queueRoute(x,j) {
        var x1 = parseInt(x.match(/\d+/));
        var now = new Date();
        var regex1 = new RegExp(`<br>((?!<br>).)*${x}.*?<br>`);
        var regex3 = new RegExp(/(?<=<u>\[).*]/);
        var departStrings = regex3.exec(regex1.exec(document.getElementById("routes").innerHTML)) + "";
        var temp = departStrings.split(" ");
        var departTime = temp[0].split(":")
        var hour = parseInt(departTime[0]);
        var min = parseInt(departTime[1]);
        var millisTillDepart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hour, min, 0, 0) - now;
        if (millisTillDepart <= 0) {
            startRoute(x,j);
        }
        else {
            queued[x1] = setTimeout(function(){startRoute(x,j)}, millisTillDepart);
            document.getElementById(x).outerHTML = `<button id="routeStart${x1}" onclick="pauseRoute(this.id,j)" 
                style="float: right;"><img src="Pause.png" width="20" height="20"></button>`;
            document.getElementById(x).disabled = true;
            document.getElementById(`routeStop${x1}`).disabled = false;
            document.getElementById(`routeEdit${x1}`).disabled = true;
            document.getElementById(`routeRemove${x1}`).disabled = true;
        }
    }