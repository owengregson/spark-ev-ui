// Initialize Three.js scene
let scene,
	camera,
	renderer,
	composer,
	bloomComposer,
	finalComposer,
	renderScene,
	controls;
let useOrbitControls = true;

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;
let rotateYawLeft = false;
let rotateYawRight = false;
let rotatePitchUp = false;
let rotatePitchDown = false;
let rotateRollLeft = false;
let rotateRollRight = false;

const moveSpeed = 3;
const rotateSpeed = 0.005;
const wFactor = 1;
const hFactor = 1.945;
let w = window.innerWidth / wFactor;
let h = w / hFactor;

const ENTIRE_SCENE = 0,
	BLOOM_SCENE = 1;
const bloomLayer = new THREE.Layers();
bloomLayer.set(BLOOM_SCENE);

const materials = {};
const darkMaterial = new THREE.MeshBasicMaterial({ color: "black" });

const models = {
	ROADSTER: {
		FLOOR: 0,
		LIGHTS: {
			THESUN: {
				POSITION: {
					X: -1,
					Y: 8,
					Z: -1,
				},
				INTENSITY: 5,
			},
			GLOBALILLUMINATION: {
				POSITION: {
					X: 1,
					Y: 3,
					Z: 1,
				},
				INTENSITY: 5,
			},
			TOPLIGHT: {
				POSITION: {
					X: 0,
					Y: 5,
					Z: 0,
				},
				INTENSITY: 3,
			},
		},
		POSITION: {
			X: 4.196808,
			Y: 0.685,
			Z: 4.424499,
		},
		ORBIT: {
			X: 0,
			Y: 0.685,
			Z: 0,
		},
		ROTATION: {
			YAW: 0,
			PITCH: 0.8,
			ROLL: 0,
		},
	},
	MODEL3: {
		FLOOR: -75,
		LIGHTS: {
			THESUN: {
				POSITION: {
					X: -400,
					Y: 300,
					Z: -400,
				},
				INTENSITY: 2,
			},
			GLOBALILLUMINATION: {
				POSITION: {
					X: 400,
					Y: 300,
					Z: 400,
				},
				INTENSITY: 2,
			},
			TOPLIGHT: {
				POSITION: {
					X: 0,
					Y: 500,
					Z: 0,
				},
				INTENSITY: 2,
			},
		},
		POSITION: {
			X: -443.8641,
			Y: 5.685,
			Z: -527.6811,
		},
		ORBIT: {
			X: 0,
			Y: 5.685,
			Z: -40,
		},
		ROTATION: {
			YAW: -3.1416,
			PITCH: -0.735,
			ROLL: 3.1416,
		},
	},
	SPARK: {
		FLOOR: 0,
		LIGHTS: {
			THESUN: {
				POSITION: {
					X: 0,
					Y: 0,
					Z: 0,
				},
				INTENSITY: 1,
			},
			GLOBALILLUMINATION: {
				POSITION: {
					X: 0,
					Y: 0,
					Z: 0,
				},
				INTENSITY: 1,
			},
			TOPLIGHT: {
				POSITION: {
					X: 0,
					Y: 0,
					Z: 0,
				},
				INTENSITY: 1,
			},
		},
		POSITION: {
			X: 0,
			Y: 0,
			Z: 0,
		},
		ORBIT: {
			X: 0,
			Y: 0,
			Z: 0,
		},
		ROTATION: {
			YAW: 0,
			PITCH: 0,
			ROLL: 0,
		},
	},
};

let currentModel = models.ROADSTER;
let lockedPolarAngle = Math.PI / 2;
let polarAngleFreedom = /* 30 degrees above lockedPolarAngle */ (lockedPolarAngle * 41) / 180;
let desiredResetAngle = normalizeAngle(currentModel.ROTATION.PITCH);
const inactivityDelay = 2500; // 5 seconds
let inactivityTimeout;

function init() {
	// Scene
	scene = new THREE.Scene();

	// Camera
	const leftSide = document.querySelector(".leftSide");
	w = leftSide.clientWidth;
	h = leftSide.clientHeight;
	camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 1000);
	// determine the camera position and rotation based on the currentModel
	camera.position.set(
		currentModel.POSITION.X,
		currentModel.POSITION.Y,
		currentModel.POSITION.Z
	);
	camera.rotation.set(
		currentModel.ROTATION.YAW,
		currentModel.ROTATION.PITCH,
		currentModel.ROTATION.ROLL
	);
	window.loadProgress += 5;

	// Renderer
	renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
	renderer.setSize(w, h);
	renderer.setPixelRatio(window.devicePixelRatio);
	renderer.shadowMap.enabled = true;
	renderer.shadowMap.type = THREE.PCFSoftShadowMap;

	// Append renderer to the main-ui div
	leftSide.appendChild(renderer.domElement);

	// Lights
	const theSun = new THREE.DirectionalLight(
		0xffffff,
		currentModel.LIGHTS.THESUN.INTENSITY
	);
	theSun.position.set(
		currentModel.LIGHTS.THESUN.POSITION.X,
		currentModel.LIGHTS.THESUN.POSITION.Y,
		currentModel.LIGHTS.THESUN.POSITION.Z
	);
	theSun.castShadow = true;
	theSun.shadow.mapSize.width = 2048;
	theSun.shadow.mapSize.height = 2048;
	theSun.shadow.camera.near = 0.5;
	theSun.shadow.camera.far = 500;
	scene.add(theSun);

	const globalIllumination = new THREE.DirectionalLight(
		0xffffff,
		currentModel.LIGHTS.GLOBALILLUMINATION.INTENSITY
	);
	globalIllumination.position.set(
		currentModel.LIGHTS.GLOBALILLUMINATION.POSITION.X,
		currentModel.LIGHTS.GLOBALILLUMINATION.POSITION.Y,
		currentModel.LIGHTS.GLOBALILLUMINATION.POSITION.Z
	);
	globalIllumination.castShadow = true;
	globalIllumination.shadow.mapSize.width = 4096;
	globalIllumination.shadow.mapSize.height = 4096;
	globalIllumination.shadow.camera.near = 0.5;
	globalIllumination.shadow.camera.far = 500;
	scene.add(globalIllumination);

	const topLight = new THREE.DirectionalLight(
		0xffffff,
		currentModel.LIGHTS.TOPLIGHT.INTENSITY
	);
	topLight.position.set(
		currentModel.LIGHTS.TOPLIGHT.POSITION.X,
		currentModel.LIGHTS.TOPLIGHT.POSITION.Y,
		currentModel.LIGHTS.TOPLIGHT.POSITION.Z
	);
	topLight.castShadow = true;
	topLight.shadow.mapSize.width = 4096;
	topLight.shadow.mapSize.height = 4096;
	topLight.shadow.camera.near = 0.5;
	topLight.shadow.camera.far = 500;
	scene.add(topLight);

	window.loadProgress += 5;

	// Floor
	const floorGeometry = new THREE.PlaneGeometry(9000, 9000);
	const floorMaterial = new THREE.MeshStandardMaterial({
		color: 0x808080,
		roughness: 0,
		metalness: 0.5,
		envMapIntensity: 0.4,
	});
	const floor = new THREE.Mesh(floorGeometry, floorMaterial);
	floor.rotation.x = -Math.PI / 2;
	floor.position.y = currentModel.FLOOR;
	floor.receiveShadow = true;
	scene.add(floor);

	window.loadProgress += 5;

	// GLTF Loader
	const loader = new GLTFLoader();
	loader.load(
		"../assets/models/" +
			Object.keys(models)[
				Object.values(models).indexOf(currentModel)
			].toLowerCase() +
			"/scene.gltf",
		function (gltf) {
			gltf.scene.traverse(function (node) {
				if (node.isMesh) {
					node.castShadow = true;
					node.receiveShadow = true;
					node.layers.enable(BLOOM_SCENE); // Enable bloom for the car model
				}
			});
			scene.add(gltf.scene);
			initPostProcessing();
			initControls();
			animate();
		},
		undefined,
		function (error) {
			console.error(error);
		}
	);

	window.loadProgress += 15;

	// Resize event listener
	window.addEventListener("resize", onWindowResize, false);
	document.addEventListener("keydown", onDocumentKeyDown, false);
	document.addEventListener("keyup", onDocumentKeyUp, false);
	document.addEventListener("keydown", onExportKeyPress, false); // Add keydown event listener for exporting camera position and rotation
}

window.onWindowResize = function () {
	onWindowResize();
};

function onWindowResize() {
	const leftSide = document.querySelector(".leftSide");
	w = leftSide.clientWidth;
	h = leftSide.clientHeight;
	camera.aspect = w / h;
	camera.updateProjectionMatrix();
	renderer.setSize(w, h);
	composer.setSize(w, h);
	bloomComposer.setSize(w, h);
	finalComposer.setSize(w, h);
	/* Scale Changes */
	const newSizeX = (1 - (1 - 0.3) * (1 - w / window.innerWidth));
	const newSizeY = (1 - (1 - 0.3) * (1 - w / window.innerWidth));
	const newSizeZ = (1 - (1 - 0.3) * (1 - w / window.innerWidth));
	scene.scale.set(newSizeX, newSizeY, newSizeZ);
	/* Angle Changes */
	const newPolarAngle = 1.0;
	lockedPolarAngle = Math.PI / 2 - (Math.PI / 2 - newPolarAngle) * (1 - w / window.innerWidth);
	// if the lockedPolarAngle is Math.PI/2, then give it the 41 degrees of freedom above the lockedAngle. Otherwise, the freedom is zero.
	polarAngleFreedom = lockedPolarAngle === Math.PI / 2 ? (lockedPolarAngle * 41) / 180 : 0;
	controls.minPolarAngle = lockedPolarAngle - polarAngleFreedom; // Allow freedom upward
	controls.maxPolarAngle = lockedPolarAngle; // Lock angle at the top position

	
	controls.update();
}

let smoothReset = false;

function initControls() {
	controls = new OrbitControls(camera, renderer.domElement);
	controls.enableDamping = true;
	controls.dampingFactor = 0.07;
	controls.rotateSpeed = 0.48;
	controls.enablePan = false;
	controls.enableRotate = true;
	controls.enableZoom = false;
	controls.target.set(
		currentModel.ORBIT.X,
		currentModel.ORBIT.Y,
		currentModel.ORBIT.Z
	);
	controls.minPolarAngle = lockedPolarAngle - polarAngleFreedom; // Allow freedom upward
	controls.maxPolarAngle = lockedPolarAngle; // Lock angle at the top position

	controls.addEventListener("start", onStart);
	controls.addEventListener("end", onEnd);
}

function onStart(event) {
	controls.minAzimuthAngle = -Infinity;
	controls.maxAzimuthAngle = Infinity;
	controls.minPolarAngle = lockedPolarAngle - polarAngleFreedom; // Allow freedom upward
	controls.maxPolarAngle = lockedPolarAngle; // Lock angle at the top position
	smoothReset = false;

	// Clear the inactivity timeout if the user is active
	clearTimeout(inactivityTimeout);
}

function onEnd(event) {
	// Set the inactivity timeout to trigger the reset after 5 seconds of inactivity
	inactivityTimeout = setTimeout(() => {
		smoothReset = true;
	}, inactivityDelay);
}

function normalizeAngle(angle) {
	while (angle > Math.PI) angle -= 2 * Math.PI;
	while (angle < -Math.PI) angle += 2 * Math.PI;
	return angle;
}

function doSmoothReset(desiredAngle) {
	const targetAzimuthAngle = desiredAngle;
	const targetPolarAngle = lockedPolarAngle;

	let currentAzimuthAngle = normalizeAngle(controls.getAzimuthalAngle());
	let currentPolarAngle = controls.getPolarAngle();

	if (Math.abs(currentAzimuthAngle - targetAzimuthAngle) < 0.001) {
		currentAzimuthAngle = targetAzimuthAngle;
	}

	if (Math.abs(currentPolarAngle - targetPolarAngle) < 0.001) {
		currentPolarAngle = targetPolarAngle;
	}

	const smoothFactor = 0.05;
	const newAzimuthAngle =
		currentAzimuthAngle +
		smoothFactor * (targetAzimuthAngle - currentAzimuthAngle);
	const newPolarAngle =
		currentPolarAngle +
		smoothFactor * (targetPolarAngle - currentPolarAngle);

	controls.minAzimuthAngle = newAzimuthAngle;
	controls.maxAzimuthAngle = newAzimuthAngle;
	controls.minPolarAngle = newPolarAngle;
	controls.maxPolarAngle = newPolarAngle;

	controls.update(); // Update the controls to apply the changes

	if (
		Math.abs(currentAzimuthAngle - targetAzimuthAngle) < 0.001 &&
		Math.abs(currentPolarAngle - targetPolarAngle) < 0.001
	) {
		onStart();
		smoothReset = false;
	}
}

function animationLoop(t) {
	if (smoothReset) {
		doSmoothReset(desiredResetAngle);
	}

	if (useOrbitControls) {
		controls.update(); // Update controls in the animation loop
	} else {
		updateCamera(); // Update camera for WASD controls
	}
	renderer.render(scene, camera);
}

function darkenNonBloomed(obj) {
	if (obj.isMesh && bloomLayer.test(obj.layers) === false) {
		materials[obj.uuid] = obj.material;
		obj.material = darkMaterial;
	}
}

function restoreMaterial(obj) {
	if (materials[obj.uuid]) {
		obj.material = materials[obj.uuid];
		delete materials[obj.uuid];
	}
}

function initPostProcessing() {
	composer = new EffectComposer(renderer);
	renderScene = new RenderPass(scene, camera);
	composer.addPass(renderScene);

	let bloomPass = new UnrealBloomPass(
		new THREE.Vector2(window.innerWidth, window.innerHeight),
		1.5,
		0.4,
		0.85
	);
	bloomPass.threshold = 0.01;
	bloomPass.strength = 0.2;
	bloomPass.radius = 0.55;
	//composer.addPass(bloomPass);

	bloomComposer = new EffectComposer(renderer);
	bloomComposer.addPass(renderScene);
	//bloomComposer.addPass(bloomPass);

	finalComposer = new EffectComposer(renderer);
	finalComposer.addPass(renderScene);

	const finalPass = new ShaderPass(
		new THREE.ShaderMaterial({
			uniforms: {
				baseTexture: { value: null },
				bloomTexture: { value: bloomComposer.renderTarget2.texture },
			},
			vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
			fragmentShader: `
                uniform sampler2D baseTexture;
                uniform sampler2D bloomTexture;
                varying vec2 vUv;
                void main() {
                    gl_FragColor = (texture2D(baseTexture, vUv) + vec4(1.0) * texture2D(bloomTexture, vUv));
                }
            `,
			blending: THREE.AdditiveBlending,
			transparent: true,
		}),
		"baseTexture"
	);
	finalPass.needsSwap = true;
	//finalComposer.addPass(finalPass);
}

function render() {
	scene.traverse(darkenNonBloomed);
	bloomComposer.render();
	scene.traverse(restoreMaterial);
	finalComposer.render();
}

function animate() {
	requestAnimationFrame(animate);
	animationLoop();
}

function updateCamera() {
	const direction = new THREE.Vector3();
	camera.getWorldDirection(direction);

	if (moveForward) {
		camera.position.addScaledVector(direction, moveSpeed);
	}
	if (moveBackward) {
		camera.position.addScaledVector(direction, -moveSpeed);
	}

	const right = new THREE.Vector3();
	right.crossVectors(camera.up, direction).normalize();

	if (moveLeft) {
		camera.position.addScaledVector(right, moveSpeed);
	}
	if (moveRight) {
		camera.position.addScaledVector(right, -moveSpeed);
	}
	if (moveUp) {
		camera.position.y += moveSpeed;
	}
	if (moveDown) {
		camera.position.y -= moveSpeed;
	}

	if (rotateYawLeft) camera.rotation.y -= rotateSpeed;
	if (rotateYawRight) camera.rotation.y += rotateSpeed;
	if (rotatePitchUp) camera.rotation.x -= rotateSpeed;
	if (rotatePitchDown) camera.rotation.x += rotateSpeed;
	if (rotateRollLeft) camera.rotation.z -= rotateSpeed;
	if (rotateRollRight) camera.rotation.z += rotateSpeed;
}

// Event handlers for keydown and keyup events
function onDocumentKeyDown(event) {
	switch (event.code) {
		case "Digit1":
			useOrbitControls = true;
			initControls();
			break;
		case "Digit2":
			useOrbitControls = false;
			controls.dispose();
			break;
		case "KeyW":
			moveForward = true;
			break;
		case "KeyS":
			moveBackward = true;
			break;
		case "KeyA":
			moveLeft = true;
			break;
		case "KeyD":
			moveRight = true;
			break;
		case "Space":
			moveUp = true;
			break;
		case "ShiftLeft":
		case "ShiftRight":
			moveDown = true;
			break;
		case "KeyJ":
			rotateYawLeft = true;
			break;
		case "KeyL":
			rotateYawRight = true;
			break;
		case "KeyI":
			rotatePitchUp = true;
			break;
		case "KeyK":
			rotatePitchDown = true;
			break;
		case "KeyM":
			rotateRollLeft = true;
			break;
		case "KeyN":
			rotateRollRight = true;
			break;
	}
}

function onDocumentKeyUp(event) {
	switch (event.code) {
		case "KeyW":
			moveForward = false;
			break;
		case "KeyS":
			moveBackward = false;
			break;
		case "KeyA":
			moveLeft = false;
			break;
		case "KeyD":
			moveRight = false;
			break;
		case "Space":
			moveUp = false;
			break;
		case "ShiftLeft":
		case "ShiftRight":
			moveDown = false;
			break;
		case "KeyJ":
			rotateYawLeft = false;
			break;
		case "KeyL":
			rotateYawRight = false;
			break;
		case "KeyI":
			rotatePitchUp = false;
			break;
		case "KeyK":
			rotatePitchDown = false;
			break;
		case "KeyM":
			rotateRollLeft = false;
			break;
		case "KeyN":
			rotateRollRight = false;
			break;
	}
}

// Function to export camera position and rotation
function onExportKeyPress(event) {
	if (event.code === "KeyE") {
		// Press 'E' to export
		console.log("Camera Position:", camera.position);
		console.log("Camera Rotation:", camera.rotation);
	}
}

// Initialize the scene
init();
document.addEventListener("keydown", onDocumentKeyDown, false);
document.addEventListener("keyup", onDocumentKeyUp, false);
let mapChecker = setInterval(() => {
	if (window.isMapLoaded && window.map.isStyleLoaded()) {
		clearInterval(mapChecker);
		window.loadProgress = 99;
		setTimeout(() => {
			window.loadProgress += 1;
		}, 500);
	}
}, 5);
