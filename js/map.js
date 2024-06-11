const defaultHeading = 0;
class Location {
	constructor(lat, lng, heading = defaultHeading) {
		this.lat = lat;
		this.lng = lng;
		this.heading = heading;
	}
	getLngLat() {
		return [this.lng, this.lat];
	}
	getLatLng() {
		return [this.lat, this.lng];
	}
	getLat() {
		return this.lat;
	}
	getLng() {
		return this.lng;
	}
	getHeading() {
		return this.heading;
	}
	setLocation(lat, lng, heading = defaultHeading) {
		this.lat = lat;
		this.lng = lng;
		this.heading = heading || defaultHeading;
	}
}
let map;
const googleMapsAPIKey = "AIzaSyAoEXbxW1Grn9p6zg9TveWE0EYr9j6-aCE";
let currentPosition = new Location(0, 0);
let currentPositionMarker;
let routeCoordinates = [];
let pathAheadSource = null;
let pathBehindSource = null;

function updatePaths(currentPosition) {
	const splitIndex = findClosestPointIndex(routeCoordinates, currentPosition);

	const pathBehind = {
		type: "Feature",
		geometry: {
			type: "LineString",
			coordinates: routeCoordinates.slice(0, splitIndex + 1),
		},
	};

	const pathAhead = {
		type: "Feature",
		geometry: {
			type: "LineString",
			coordinates: routeCoordinates.slice(splitIndex),
		},
	};

	if (pathBehindSource) {
		map.getSource("pathBehind").setData(pathBehind);
	} else {
		pathBehindSource = {
			type: "geojson",
			data: pathBehind,
		};
		map.addSource("pathBehind", pathBehindSource);
		map.addLayer({
			id: "pathBehind",
			type: "line",
			source: "pathBehind",
			layout: {
				"line-join": "round",
				"line-cap": "round",
			},
			paint: {
				"line-color": "rgba(50,86,181,0.5)",
				"line-width": 5,
			},
		});
	}

	if (pathAheadSource) {
		map.getSource("pathAhead").setData(pathAhead);
	} else {
		pathAheadSource = {
			type: "geojson",
			data: pathAhead,
		};
		map.addSource("pathAhead", pathAheadSource);
		map.addLayer({
			id: "pathAhead",
			type: "line",
			source: "pathAhead",
			layout: {
				"line-join": "round",
				"line-cap": "round",
			},
			paint: {
				"line-color": "rgba(63,107,226,0.8)",
				"line-width": 5,
			},
		});
	}
}

function findClosestPointIndex(coordinates, position) {
	let closestIndex = 0;
	let minDistance = Infinity;

	coordinates.forEach((coord, index) => {
		const distance = getDistance(coord, [position.lng, position.lat]);
		if (distance < minDistance) {
			minDistance = distance;
			closestIndex = index;
		}
	});

	return closestIndex;
}

async function navigateTo(destinationString) {
	const destination = await locateDestination(destinationString);
	console.log("Destination: " + destination.getLatLng());
	const route = await getRoute(destination);
	console.log("Route: " + route);

	routeCoordinates = route.route.coordinates;

	updatePaths(currentPosition);

	// Remove any existing route layers and sources
	if (map.getSource("route")) {
		map.removeLayer("route");
		map.removeSource("route");
	}
}

async function locateDestination(destinationString) {
	return new Promise((resolve, reject) => {
		let placeLocation;
		const service = new google.maps.places.PlacesService(
			document.createElement("div")
		);
		const request = {
			query: destinationString,
			locationBias: {
				radius: 5000,
				center: {
					lat: currentPosition.getLat(),
					lng: currentPosition.getLng(),
				},
			},
			fields: ["displayName", "formattedAddress", "location", "geometry"],
		};

		service.textSearch(request, (results, status) => {
			if (status === google.maps.places.PlacesServiceStatus.OK) {
				placeLocation = new Location(
					results[0].geometry.location.lat(),
					results[0].geometry.location.lng()
				);
				resolve(placeLocation);
			} else {
				console.error("Error fetching place: ", status);
			}
		});
	});
}

async function getRoute(destination) {
	return new Promise((resolve, reject) => {
		const url = `https://api.mapbox.com/directions/v5/mapbox/driving-traffic/
					${currentPosition.getLng()},${currentPosition.getLat()};
					${destination.getLng()},${destination.getLat()}
					?geometries=geojson
					&alternatives=false
					&exclude=motorway,toll,ferry,unpaved,cash_only_tolls
					&overview=full
					&steps=true
					&access_token=${mapboxgl.accessToken}`;
		fetch(url)
			.then((response) => response.json())
			.then((data) => {
				const route = data.routes[0].geometry;
				const steps = data.routes[0].legs[0].steps;
				resolve({
					route: route,
					steps: steps, // turn by turn directions
				});
			});
	});
}

function waitForElm(selector) {
	return new Promise((resolve) => {
		if (document.querySelector(selector)) {
			return resolve(document.querySelector(selector));
		}

		const observer = new MutationObserver((mutations) => {
			if (document.querySelector(selector)) {
				observer.disconnect();
				resolve(document.querySelector(selector));
			}
		});

		// If you get "parameter 1 is not of type 'Node'" error, see https://stackoverflow.com/a/77855838/492336
		observer.observe(document.body, {
			childList: true,
			subtree: true,
		});
	});
}

function createArrowMarker() {
	const markerElement = document.createElement("div");
	markerElement.className = "arrow-marker";
	markerElement.style.backgroundImage =
		'url("../assets/images/arrow-light.png")';
	markerElement.style.backgroundSize = "cover";
	markerElement.style.width = "33px";
	markerElement.style.height = "33px";
	return markerElement;
}

function updateArrowMarker(marker, position) {
	marker.setLngLat([position.getLng(), position.getLat()]);
}

function addCurrentPositionMarker(map, position) {
	const markerElement = createArrowMarker();
	const marker = new mapboxgl.Marker({ element: markerElement })
		.setLngLat([position.getLng(), position.getLat()])
		.addTo(map);
	return marker;
}

async function initMap() {
	let positionLocked = false;
	let activityTimeout;

	function setActive() {
		// Reset the timeout whenever the user is active
		clearTimeout(activityTimeout);
		positionLocked = false;

		// Set a timeout to lock the position after 5 seconds of inactivity
		activityTimeout = setTimeout(() => {
			positionLocked = true;
		}, 2500);
	}

	function setupActivityChecker() {


		map.on("move", setActive);
		map.on("zoomstart", setActive);
		map.on("zoomend", setActive);
		map.on("pitchstart", setActive);
		map.on("pitchend", setActive);

		// Initially set the activity timeout
		setActive();
	}

	let initializing = true;
	mapboxgl.accessToken = env.MAPBOX.KEY;

	map = new mapboxgl.Map({
		container: "map",
		style: env.MAPBOX.STYLE_URL,
		center: [currentPosition.getLng(), currentPosition.getLat()],
		bearing: currentPosition.getHeading(),
		zoom: 17,
		keyboard: false,
	});
	window.map = map;

	// Initialize the activity checker
	setupActivityChecker();

	const currentPositionMarker = addCurrentPositionMarker(
		map,
		currentPosition
	);

	function updatePosition() {
		navigator.geolocation.getCurrentPosition((position) => {
			currentPosition.setLocation(
				/*position.coords.latitude,
				position.coords.longitude,*/
				37.7749,
				-122.4194,
				position.coords.heading
			);

			if (positionLocked || initializing) {
				// calculate the duration based on the distance between the current camera position and the new position
				let distance = getDistance(
					[map.getCenter().lng, map.getCenter().lat],
					[currentPosition.getLng(), currentPosition.getLat()]
				);
				// on a curve, where 300ms is the minimum duration and 1000ms is the maximum duration
				const calculatedDuration = Math.min(
					Math.max(distance / 1000, 300),
					1000
				);
				if (initializing) {
					initializing = false;
					window.isMapLoaded = true;
				}
				map.easeTo({
					center: [
						currentPosition.getLng(),
						currentPosition.getLat(),
					],
					bearing: currentPosition.getHeading(),
					zoom: 17,
					pitch: 0,
					speed: 0.2,
					curve: 1,
					duration: calculatedDuration,
					easing(t) {
						return t;
					},
				});
				updateArrowMarker(currentPositionMarker, currentPosition);
			}
			if (map.isStyleLoaded()) updatePaths(currentPosition);
		});

		requestAnimationFrame(updatePosition);
	}

	updatePosition();

	waitForElm(".mapboxgl-ctrl-bottom-left").then((e) => {
		e.style.display = "none";
		e.style.pointerEvents = "none";
	});
	waitForElm(".mapboxgl-ctrl-bottom-right").then((e) => {
		e.style.display = "none";
		e.style.pointerEvents = "none";
	});

	document.addEventListener("keydown", (e) => {
		if (e.key === /* B key */ "b") {
			let dS = prompt("Enter destination");
			if (dS != "" && dS != null) {
				navigateTo(dS);
			} else alert("Please enter a valid destination");
		}
	});
}

function getDistance(latlng1, latlng2) {
	const R = 6371e3; // metres
	const φ1 = (latlng1[1] * Math.PI) / 180;
	const φ2 = (latlng2[1] * Math.PI) / 180;
	const Δφ = ((latlng2[1] - latlng1[1]) * Math.PI) / 180;
	const Δλ = ((latlng2[0] - latlng1[0]) * Math.PI) / 180;

	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return R * c; // in metres
}

initMap();
