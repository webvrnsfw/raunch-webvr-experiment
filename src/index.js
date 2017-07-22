import 'lodash';

import './THREE.js';

import './../node_modules/three/examples/js/controls/OrbitControls.js';
import './../node_modules/three/examples/js/loaders/ColladaLoader.js';
import Stats from './../node_modules/three/examples/js/libs/stats.min.js';

import './../node_modules/three/examples/js/controls/VRControls.js';
import './../node_modules/three/examples/js/effects/VREffect.js';

import './../node_modules/webvr-polyfill/build/webvr-polyfill.js';
import './../node_modules/webvr-ui/build/webvr-ui.js';

import RaunchController from './RaunchController.js';

var X = new THREE.Vector3(1, 0, 0);
var Y = new THREE.Vector3(0, 1, 0);
var Z = new THREE.Vector3(0, 0, 1);

var camera, scene, renderer, stats, controls, enterVR, effect;
var necks = [];

function setupScene() {
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor( 0xaaffee );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.sortObjects = false;

    document.body.appendChild( renderer.domElement );

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        75, window.innerWidth / window.innerHeight, 0.3, 10000 );

    var dolly = new THREE.Object3D();
    dolly.position.set(0, 0.5, 1);
    dolly.add(camera);
    scene.add(dolly);

    effect = new THREE.VREffect(renderer);
    effect.setSize(window.innerWidth, window.innerHeight);

    enterVR = new webvrui.EnterVRButton(renderer.domElement, {color: 'black'});
    document.body.appendChild(enterVR.domElement);

    var light = new THREE.DirectionalLight( 0xffffff, 1.5 );
    light.position.set( 0, -4, -4 ).normalize();
    scene.add( light );

    scene.add(new THREE.AmbientLight(0xaaaaaa));

    var plight = new THREE.PointLight(0xffffff, 1);
    plight.position.set(1, 4, 6);
    scene.add(plight);

    stats = new Stats();
    stats.domElement.style.position = 'absolute';
    stats.domElement.style.top = '0px';
    document.body.appendChild(stats.domElement);

    // Handle window resizes
    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        effect.setSize(window.innerWidth, window.innerHeight);
    }

    window.addEventListener('resize', onWindowResize, false);

    enterVR.getVRDisplay()
        .then(function (display) {
            controls = new THREE.VRControls(camera);
            animationDisplay = display;
            animationDisplay.requestAnimationFrame(animate);
        })
        .catch(function () { 
            controls = new THREE.OrbitControls(camera);
            animationDisplay = window;
            animationDisplay.requestAnimationFrame(animate);
        });
}

function setupModels() {
    var bed = new THREE.Mesh(
        new THREE.BoxGeometry(1.5, 0.25, 2.2),
        new THREE.MeshLambertMaterial({color: 'red'})
    )
    scene.add(bed);

    var woman;
    var loader = new THREE.ColladaLoader();
    loader.load("models/woman/woman.dae", function (collada) {
        woman = collada.scene;
        woman.scale.multiplyScalar(0.1);
        bed.add(woman);
        woman.rotateOnAxis(X, 30 * (Math.PI / 180));
        woman.position.set(0.005, -0.25, -0.880);

        collada.scene.traverse(function (obj) {
            if (obj instanceof THREE.SkinnedMesh) {
                necks.push(_(obj.skeleton.bones).find(['name', 'neck']));
            }
        });
    });

    var man;
    loader.load( "models/man/man.dae", function (collada) {
        man = collada.scene;
        man.scale.multiplyScalar(0.1);
        bed.add( man );
        man.position.set(0, 0.20, -0.8);
        man.rotateOnAxis(Y, Math.PI);
        man.rotateOnAxis(X, -Math.PI / 2);
    });
}

setupScene();

setupModels();

var raunchController = new RaunchController();
var rate = 0.1;
var distance = 0.5;
var isIn = true;
raunchController.onFinishedMove = () => {
    if (Math.random() < 0.05) {
        rate = Math.random() * 0.4 + 0.1;
    }
    if (Math.random() < 0.05) {
        distance = Math.random();
    }
    isIn = !isIn;
    raunchController.move(isIn ? 0 : distance, rate);
};
raunchController.onConnected = () => console.log('connected');

document.getElementById('raunch-connect').addEventListener('click', function () {
    raunchController.connect();
});

var x = 0;
var lastUpdate = 0;
var rate = 0.1;
var animationDisplay;
var clock = new THREE.Clock();
function animate(timestamp) {
    var delta = clock.getDelta();

    raunchController.update(delta);

    document.getElementById('raunch-debug').value = raunchController.currentPosition * 99;

    if (necks.length) { 
        necks.forEach(function (neck) {
            neck.position.y = (-(1 - raunchController.currentPosition) / 4 + 1.0);
        });
    }

    controls.update();

    renderer.render(scene, camera);
    if (enterVR.isPresenting()) {
        effect.render(scene, camera);
    }

    stats.update();

    animationDisplay.requestAnimationFrame(animate);
};

