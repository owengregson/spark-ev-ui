let batteryLevel = 100;
window.loadProgress = 0;
window.loadText = "Loading...";

document.addEventListener('keydown', function (event) {
	if (event.keyCode == 54) {
		if (document.getElementById("overlayTesla").style.display == "block") {
			document.getElementById("overlayTesla").style.display = "none";
		} else {
			document.getElementById("overlayTesla").style.display = "block";
		}
	}
});

function generateUUID() {
	const _lut = [
		"00",
		"01",
		"02",
		"03",
		"04",
		"05",
		"06",
		"07",
		"08",
		"09",
		"0a",
		"0b",
		"0c",
		"0d",
		"0e",
		"0f",
		"10",
		"11",
		"12",
		"13",
		"14",
		"15",
		"16",
		"17",
		"18",
		"19",
		"1a",
		"1b",
		"1c",
		"1d",
		"1e",
		"1f",
		"20",
		"21",
		"22",
		"23",
		"24",
		"25",
		"26",
		"27",
		"28",
		"29",
		"2a",
		"2b",
		"2c",
		"2d",
		"2e",
		"2f",
		"30",
		"31",
		"32",
		"33",
		"34",
		"35",
		"36",
		"37",
		"38",
		"39",
		"3a",
		"3b",
		"3c",
		"3d",
		"3e",
		"3f",
		"40",
		"41",
		"42",
		"43",
		"44",
		"45",
		"46",
		"47",
		"48",
		"49",
		"4a",
		"4b",
		"4c",
		"4d",
		"4e",
		"4f",
		"50",
		"51",
		"52",
		"53",
		"54",
		"55",
		"56",
		"57",
		"58",
		"59",
		"5a",
		"5b",
		"5c",
		"5d",
		"5e",
		"5f",
		"60",
		"61",
		"62",
		"63",
		"64",
		"65",
		"66",
		"67",
		"68",
		"69",
		"6a",
		"6b",
		"6c",
		"6d",
		"6e",
		"6f",
		"70",
		"71",
		"72",
		"73",
		"74",
		"75",
		"76",
		"77",
		"78",
		"79",
		"7a",
		"7b",
		"7c",
		"7d",
		"7e",
		"7f",
		"80",
		"81",
		"82",
		"83",
		"84",
		"85",
		"86",
		"87",
		"88",
		"89",
		"8a",
		"8b",
		"8c",
		"8d",
		"8e",
		"8f",
		"90",
		"91",
		"92",
		"93",
		"94",
		"95",
		"96",
		"97",
		"98",
		"99",
		"9a",
		"9b",
		"9c",
		"9d",
		"9e",
		"9f",
		"a0",
		"a1",
		"a2",
		"a3",
		"a4",
		"a5",
		"a6",
		"a7",
		"a8",
		"a9",
		"aa",
		"ab",
		"ac",
		"ad",
		"ae",
		"af",
		"b0",
		"b1",
		"b2",
		"b3",
		"b4",
		"b5",
		"b6",
		"b7",
		"b8",
		"b9",
		"ba",
		"bb",
		"bc",
		"bd",
		"be",
		"bf",
		"c0",
		"c1",
		"c2",
		"c3",
		"c4",
		"c5",
		"c6",
		"c7",
		"c8",
		"c9",
		"ca",
		"cb",
		"cc",
		"cd",
		"ce",
		"cf",
		"d0",
		"d1",
		"d2",
		"d3",
		"d4",
		"d5",
		"d6",
		"d7",
		"d8",
		"d9",
		"da",
		"db",
		"dc",
		"dd",
		"de",
		"df",
		"e0",
		"e1",
		"e2",
		"e3",
		"e4",
		"e5",
		"e6",
		"e7",
		"e8",
		"e9",
		"ea",
		"eb",
		"ec",
		"ed",
		"ee",
		"ef",
		"f0",
		"f1",
		"f2",
		"f3",
		"f4",
		"f5",
		"f6",
		"f7",
		"f8",
		"f9",
		"fa",
		"fb",
		"fc",
		"fd",
		"fe",
		"ff",
	];
	const d0 = Math.random() * 0xffffffff | 0;
	const d1 = Math.random() * 0xffffffff | 0;
	const d2 = Math.random() * 0xffffffff | 0;
	const d3 = Math.random() * 0xffffffff | 0;
	const uuid = _lut[d0 & 0xff] + _lut[d0 >> 8 & 0xff] + _lut[d0 >> 16 & 0xff] + _lut[d0 >> 24 & 0xff] + '-' +
		_lut[d1 & 0xff] + _lut[d1 >> 8 & 0xff] + '-' + _lut[d1 >> 16 & 0x0f | 0x40] + _lut[d1 >> 24 & 0xff] + '-' +
		_lut[d2 & 0x3f | 0x80] + _lut[d2 >> 8 & 0xff] + '-' + _lut[d2 >> 16 & 0xff] + _lut[d2 >> 24 & 0xff] +
		_lut[d3 & 0xff] + _lut[d3 >> 8 & 0xff] + _lut[d3 >> 16 & 0xff] + _lut[d3 >> 24 & 0xff];
	return uuid.toLowerCase();
}

console.log(generateUUID());

function updateStatusBar() {
	if(batteryLevel <= 0) batteryLevel = 0;
	/* Battery Level */
	let newBP = batteryLevel + "%";
	document.getElementById("battery-percentage").textContent = newBP;
	document.getElementById("battery-level").style.width = newBP;
	/* Time (12h format) */
	let currentTime = new Date();
	let hours = currentTime.getHours();
	let minutes = currentTime.getMinutes();
	if (minutes < 10) {
		minutes = "0" + minutes;
	}
	if(hours > 12) {
		hours = hours - 12;
	}
	let AMPM = (currentTime.getHours() >= 12) ? "PM" : "AM";
	let newTime = hours + ":" + minutes + " " + AMPM;
	document.getElementById("time").textContent = newTime;
}

document.addEventListener('DOMContentLoaded', function () {
	setTimeout(() => {
		document.querySelector(".loader").style.opacity = 0;
		document
			.querySelector(".loader")
			.addEventListener("transitionend", function () {
				document.querySelector(".loader").style.display = "none";
				document.querySelector(".loadStageTwo").style.display =
					"inline-block";
				setTimeout(() => {
					document.querySelector(".loadStageTwo").style.display = "flex";
					document.querySelector(".loadStageTwo").style.opacity = 1;
				}, 50);
			});
		window.loaderChange = setInterval(() => {
			document.querySelector(".loadText").innerText = window.loadText;
			// set .loaderBar:after width to window.loadProgress%
			if (window.loadProgress > 100) window.loadProgress = 100;
			document.querySelector(".loaderBarFill").style.width =
				window.loadProgress + "%";
			if (window.loadProgress == 100) {
				window.loadText = "Starting...";
				document
					.querySelector(".loaderBarFill")
					.addEventListener("transitionend", function () {
						setTimeout(() => {
							hideLoader();
						}, 5);
					});
			}
		}, 10);
	}, 50);
	updateStatusBar();
	setInterval(updateStatusBar, 1000);
	setInterval(function () {
		updateStatusBar();
	}, 500);
});

function hideLoader() {
	document.querySelector(".loadStageTwo").style.opacity = 0;
	document.getElementById("loading").style.opacity = 0;
	document.getElementById("loading").style.pointerEvents = "none";
	// wait until transition finishes dynamically
	document
		.getElementById("loading")
		.addEventListener("transitionend", function () {
			clearInterval(window.loaderChange);
			document.getElementById("loading").style.display = "none";
		});
}