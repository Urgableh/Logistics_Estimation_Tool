# How to use the Logistics Estimation Tool

An estimation tool used by dispatch callers to be able to glance at, monitor, input driver positions on a map that covers the general routes.

![demo](/guide-images/demo.gif)

## User Interface

![UI](/guide-images/UI.png)

There are 3 mandatory inputs to the tool: 2 addresses and a departure time. The route label is a optional input which will default to a numbering system starting at 0.

The departure time specifies the wall clock time that the simulation should initiate. If the departure time has passed the current time of the current local day, the simulation will start without delays. Otherwise, the simulation will hold the path until the specified departure time.

The Calculate button will submit the given addresses to Google and return a by-car route if one is available.

![Autocomplete](/guide-images/Autocomplete.png)

Each address input bar has autocomplete provided by Google. If every address is filled, a new address input bar will appear. It is necessary that only the final input bar is empty.

![Edit Example](/guide-images/Edit_Example_2.png)

Addresses can be dragged to rearrange the order of the destinations.

![Example Route 1](/guide-images/Example_route_1.png)

After clicking the Calculate button on a valid request, the result will be displayed under the Routes heading and on the map.

![Multiroute Example](/guide-images/Multiroute_example.png)

Multiple routes can be independently added to the estimation tool and will operate completely independently according to their specified inputs.

![Route info](/guide-images/Route_info_example_1.png)

Each route in the route information panel has 4 buttons to manage the data and simulation. 
- The left most vehicle button starts the simulation
- A pause button appears after clicking the start simulation button to pause simulation and allow for marker dragging
- The stop button removes the marker from simulation and allows for editing and removing
- The pencil button re-enters the data back into the input bars and removes it from the Routes information panel and the map.
- The bin button completely removes the route from the Routes information panel and the map.

![Info Window](/guide-images/Example_1_Info_Window.png)

Clicking on a marker will reveal an Information Window containing a simplified view of the destinations and destination times.

![Dragging Marker](/guide-images/Dragging_Marker.png)

When the simulation is paused, the marker can be dragged. This is generally intended for more accurate positions if the simulation is incorrect. The dragged marker will snap to the closest point on the route when simulation is started again. Note: Generally if the route has a return path, keep left (Australia) will often result in the correct continuation of the path.

## Timers

![Midnight](/guide-images/Example_2_past_midnight.png)

If any destinations are reached beyond the local day's following midnight, it will be highlighted. This is used to alert for over-night jobs.

![Wait at Waypoint](/guide-images/Wait_at_waypoint.png)

By default, the simulating marker will stop at every waypoint for 15 minutes. It will also stop in the middle of travel after 5 hours from departure for 30 minutes.

All wall clock destination times include these delays.

# FAQ

**I can't drag the marker backwards.**

> When paused, the marker can be dragged to any future point in the path. In order to drag the marker backwards, follow these steps: Stop -> Start -> Pause -> Drag -> Start.

**The marker is not snapping to the road.**

> Google Directions API returns a discrete set of instructions to navigate the roads. These include instructions to turn at various intersections, and lack the interim instructions when travelling forward on a long road. Due to these lack of instructions, fewer anchoring coordinates can be mapped to the simulated path resulting in less accurate pathing. Regardless, all timing is accurate.

**How do I keep tracking the position of a single marker?**

> Clicking on the marker and showing its Info Window will ensure the marker is always on screen. (Note this will *not* centre the marker at all times).

**This page can't load Google Maps correctly.**

> The Google API Key has expired on the developer's end. Provide your own API key or contact the developer.

**I'm pressing Calculate, but nothing is happening.**

> It is likely that the given destinations cannot be reached in a single path via Google recognised roads. To check this is the case, right click and inspect element. "Directions request returned no results." appearing in the console will confirm this.