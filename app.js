// Initialize AR.js with webcam source
var arToolkitSource = new THREEx.ArToolkitSource({
    sourceType: 'webcam',
});

arToolkitSource.init(function onReady(){
    onResize();
});

window.addEventListener('resize', function(){
    onResize();
});

function onResize(){
    arToolkitSource.onResize();
    arToolkitSource.copySizeTo(babylonCanvas);
}

// Babylon.js setup
var babylonCanvas = document.getElementById('babylon-canvas');
var engine = new BABYLON.Engine(babylonCanvas, true);

// Create Babylon.js scene
var scene = new BABYLON.Scene(engine);
var camera = new BABYLON.ArcRotateCamera("camera1", -Math.PI / 2, Math.PI / 2, 5, BABYLON.Vector3.Zero(), scene);
camera.attachControl(babylonCanvas, true);

// Add light to scene
var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(1, 1, 0), scene);

// AR.js context for marker detection
var arToolkitContext = new THREEx.ArToolkitContext({
    cameraParametersUrl: 'https://cdn.rawgit.com/jeromeetienne/ar.js/master/three.js/examples/marker-training/examples/data/camera_para.dat',
    detectionMode: 'mono',
});

arToolkitContext.init(function onCompleted(){
    // Copy AR.js's projection matrix to Babylon.js camera
    camera.getProjectionMatrix().copyFrom(arToolkitContext.getProjectionMatrix());
});

// Marker controls (not attached to any Three.js scene)
var markerRoot = new THREE.Group();  // Create a marker root
var arMarkerControls = new THREEx.ArMarkerControls(arToolkitContext, markerRoot, {
    type: 'pattern',
    patternUrl: "../assets/patterns/image-target.patt",  // Marker pattern file
});

// Load the GLB model in Babylon.js
let glbModel;
BABYLON.SceneLoader.ImportMesh("", "../assets/models/", "model.glb", scene, function (meshes) {
    glbModel = meshes[0];  // Get the first mesh from the loaded GLB
    glbModel.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);  // Adjust model scale
    glbModel.position = new BABYLON.Vector3(0, 0, 0);       // Place model at the origin (later update its position based on AR marker)
});

// Rendering loop
engine.runRenderLoop(function(){
    if (arToolkitSource.ready === false) return;

    // Update AR.js context
    arToolkitContext.update(arToolkitSource.domElement);

    // Update Babylon.js object transformation based on AR marker (if markerRoot is visible)
    if (glbModel && markerRoot.visible) {
        glbModel.position.copyFrom(markerRoot.position);  // Copy position from markerRoot to GLB model
        glbModel.rotationQuaternion.copyFrom(markerRoot.quaternion);  // Copy rotation from markerRoot to GLB model
    }

    // Render Babylon.js scene
    engine.resize();
    scene.render();
});
