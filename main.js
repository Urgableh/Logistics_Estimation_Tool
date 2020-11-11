
    // Initialise some variables
    var directionsService = new google.maps.DirectionsService();
    var num, map, data, j=0;
    var requestArray = [], renderArray = [];

    // A JSON Array containing some people/routes and the destinations/stops
    var jsonArray = {
        "Person 1": ["Perth", "Joondalup", "Gingin"],
        //"Person 2": ["Exmouth", "Sidmouth", "Taunton", "Crediton", "Okehampton"],
        //"Person 3": ["Penzance", "Truro", "Bodmin", "Falmouth"]
    }

    // 16 Standard Colours for navigation polylines
    var colourArray = ['navy', 'grey', 'fuchsia', 'black', 'white', 'lime', 'maroon', 'purple', 'aqua', 'red', 'green', 'silver', 'olive', 'blue', 'yellow', 'teal'];

    // Let's make an array of requests which will become individual polylines on the map.
    function generateRequests(){

        requestArray = [];

        for (var route in jsonArray){
            // This now deals with one of the people / routes

            // Somewhere to store the wayoints
            var waypts = [];

            // 'start' and 'finish' will be the routes origin and destination
            var start, finish

            // lastpoint is used to ensure that duplicate waypoints are stripped
            var lastpoint

            data = jsonArray[route]

            limit = data.length
            for (var waypoint = 0; waypoint < limit; waypoint++) {
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

    function readRequests(){
        
        var uiArray = {"Track 1 ": [
                document.getElementById("pac-input1").value, 
                document.getElementById("pac-input2").value,
                document.getElementById("pac-input3").value,
                document.getElementById("pac-input4").value]
                    };
        
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

        // Counter to track request submission and process one at a time;
        var i = 0;

        // Used to submit the request 'i'
        function submitRequest(){
            directionsService.route(requestArray[i].request, directionResults);
        }

        // Used as callback for the above request for current 'i'
        function directionResults(result, status) {
            if (status == google.maps.DirectionsStatus.OK) {

                console.log(result)

                var addresses = 0;
                var timeTaken = 0;
                for(i=1; i<=4; i++) {
                    if (document.getElementById(`pac-input${i}`).value != ""){
                        addresses ++;
                    }
                }
                for(i=0; i<addresses-1; i++) {
                    timeTaken += result.routes[0].legs[i].duration.value;
                }
                
                var departTime = document.getElementById("departTime").value.split(":");
                var departHour = parseInt(departTime[0], 10);
                var departMin = parseInt(departTime[1], 10);
                var arrivalTime = departHour*60*60 + departMin*60 + timeTaken;
                var extra0 = "0", extra00 = "0";
                if (Math.floor(arrivalTime/60/60)%24 > 10) extra0 = "";
                if (Math.floor(arrivalTime%3600/60) > 10) extra00 = "";
                var arrivalClock = extra0 + Math.floor(arrivalTime/60/60)%24 + ":" + extra00 + Math.floor(arrivalTime%3600/60)

                document.getElementById("routes").innerHTML += "<br>" + document.getElementById("pac-input1").value
                for(i=2; i<=addresses; i++)
                    document.getElementById("routes").innerHTML += " &#8594 " + document.getElementById(`pac-input${i}`).value 
                document.getElementById("routes").innerHTML += " (" + Math.floor(timeTaken/60/60) + "Hrs " + Math.floor((timeTaken%3600)/60) + "Mins) "; //+ Math.floor(timeTaken%60) + "Secs) ";
                document.getElementById("routes").innerHTML += " <b><u>[" + document.getElementById("departTime").value + " &#8594 " + arrivalClock + "]</b></u>";
                document.getElementById("routes").innerHTML += "<button id='routeNumber" + j + "' onclick='removeRoute(this.id)' style='float: right;'>X</button><br>";

                var count = ((document.getElementById("routes").innerHTML.match(/<br>/g)||[]).length)/2-1;
                
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
                        strokeColor: colourArray[count%16]
                    },
                    markerOptions:{
                        icon:{
                            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                            scale: 3,
                            strokeColor: colourArray[count%16]
                        },
                        //label:{ 
                            //text: result.routes[0].legs[j].duration.text

                        //}
                    }
                });

                // Use this new renderer with the result
                renderArray[j].setDirections(result);
                // and start the next request
                nextRequest();
            }

        }

        function nextRequest(){
            // Increase the counter
            i++;
            j++;
            // Make sure we are still waiting for a request
            if(j >= requestArray.length){
                // No more to do
                return;
            }
            // Submit another request
            submitRequest();
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
        document.getElementById("routes").innerHTML = null;
    }
    function removeRoute(x) {
        var x1 = parseInt(x.match(/\d+/));
        renderArray[x1].setMap(null);
        x = x + '';
        var regex = new RegExp(`<br>((?!<br>).)*${x}.*?<br>`);
        //console.log(x)
        //console.log(regex.exec(document.getElementById("routes").outerHTML))
        //console.log(document.getElementById("routes").outerHTML.replace(regex, ''))
        document.getElementById("routes").outerHTML = document.getElementById("routes").outerHTML.replace(regex, '');
        // delete all between <br> routeNumberj <br>
        //document.getElementById("routes").innerHTML = null;
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

        // Start the request making
        //generateRequests()

        var defaultBounds = new google.maps.LatLngBounds(
        new google.maps.LatLng(-32,110),
        new google.maps.LatLng(-34,130));
        var options = {bounds: defaultBounds};

        var input1 = document.getElementById('pac-input1');
        var input2 = document.getElementById('pac-input2');
        var input3 = document.getElementById('pac-input3');
        var input4 = document.getElementById('pac-input4');
        //map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);

        var autocomplete = new google.maps.places.Autocomplete(input1, options)
        var autocomplete = new google.maps.places.Autocomplete(input2, options)
        var autocomplete = new google.maps.places.Autocomplete(input3, options)
        var autocomplete = new google.maps.places.Autocomplete(input4, options)

        document.getElementById("departTime").defaultValue = "08:00";

    }

    // Get the ball rolling and trigger our init() on 'load'
    google.maps.event.addDomListener(window, 'load', init);