# How to use the Logistics Estimation Tool

An estimation tool used by dispatch callers to be able to glance at, monitor, input driver positions on a map that covers the general routes.

## User Interface

![UI](/guide-images/UI.png)

There are 3 mandatory inputs to the tool: 2 addresses and a departure time. The route label is a optional input which will default to a numbering system starting at 0.

The departure time specifies the wall clock time that the simulation should initiate. If the departure time has passed the current time of the current local day, the simulation will start without delays. Otherwise, the simulation will hold the path until the specified departure time.

The Calculate button will submit the given addresses to Google and return a by-car route if one is available.

![Autocomplete](/guide-images/Autocomplete.png)

Each address input bar has autocomplete provided by Google. If every address is filled, a new address input bar will appear. It is necessary that only the final input bar is empty.

![Edit Example](/guide-images/Edit Example 2.png)

Addresses can be dragged to rearrange the order of the destinations.

![Example Route 1](/guide-images/Example route 1.png)

After clicking the Calculate button on a valid request, the result will be displayed under the Routes heading and on the map.

![Multiroute Example](/guide-images/Multiroute example.png)

Multiple routes can be independently added to the estimation tool and will operate completely independently according to their specified inputs.

![Route info](/guide-images/Route info example 1.png)

Each route in the route information panel has 4 buttons to manage the data and simulation. 
- The left most vehicle button starts the simulation
- A pause button appears after clicking the start simulation button to pause simulation and allow for marker dragging
- The stop button removes the marker from simulation and allows for editing and removing
- The pencil button re-enters the data back into the input bars and removes it from the Routes information panel and the map.
- The bin button completely removes the route from the Routes information panel and the map.

![Info Window](/guide-images/Example 1 Info Window.png)

Clicking on a marker will reveal an Information Window containing a simplified view of the destinations and destination times.

![Dragging Marker](/guide-images/Dragging Marker.png)

When the simulation is paused, the marker can be dragged. This is generally intended for more accurate positions if the simulation is incorrect. The dragged marker will snap to the closest point on the route when simulation is started again. Note: Generally if the route has a return path, keep left (Australia) will often result in the correct continuation of the path.

## Timers

![Midnight](/guide-images/Example 2 past midnight.png)

If any destinations are reached beyond the local day's following midnight, it will be highlighted. This is used to alert for over-night jobs.

![Wait at Waypoint](/guide-images/Wait at waypoint.png)

By default, the simulating marker will stop at every waypoint for 15 minutes. It will also stop in the middle of travel after 5 hours from departure for 30 minutes.

All wall clock destination times include these delays.