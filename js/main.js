import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// Mobiel detectie
const isMobile = window.matchMedia("(pointer: coarse)").matches;

let joystick = null;
const joystickEl = document.getElementById('joystick');

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// Camera
const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

camera.position.set(0, 1.6, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);

// Licht
const light = new THREE.DirectionalLight(0xffffff, 1);

light.position.set(10, 20, 10);
light.castShadow = true;

scene.add(light);

scene.add(new THREE.AmbientLight(0xffffff, 0.3));

// Texture loader
const textureLoader = new THREE.TextureLoader();

// Gras texture
const groundTexture = textureLoader.load('Gras.webp');

groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(15, 15);

// Audio
const listener = new THREE.AudioListener();
camera.add(listener);

const sound = new THREE.Audio(listener);

const audioLoader = new THREE.AudioLoader();


audioLoader.load(

    './js/muziek.wav',

    function(buffer) {

        console.log("Audio geladen!");

        sound.setBuffer(buffer);
        sound.setLoop(false);
        sound.setVolume(0.5);
    },

    undefined,

    function(error) {

        console.error("Audio fout:", error);
    }
);

// Grond
const groundGeo = new THREE.PlaneGeometry(100, 100);

const groundMat = new THREE.MeshStandardMaterial({
    map: groundTexture
});

const ground = new THREE.Mesh(groundGeo, groundMat);

ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;

scene.add(ground);

// Groene cube
const cube = new THREE.Mesh(

    new THREE.BoxGeometry(),

    new THREE.MeshStandardMaterial({
        color: 0x00ff00
    })
);

cube.position.set(0, 0.5, 0);

cube.castShadow = true;

scene.add(cube);

// Rode muziek cube
const musicCube = new THREE.Mesh(

    new THREE.BoxGeometry(),

    new THREE.MeshStandardMaterial({
        color: 0xff0000
    })
);

musicCube.position.set(3, 0.5, 0);

musicCube.castShadow = true;

scene.add(musicCube);

// Keyboard input
const keys = {
    w:false,
    a:false,
    s:false,
    d:false
};

// Joystick movement
let move = {
    x: 0,
    y: 0
};

// Mobiele joystick
if (isMobile && window.nipplejs && joystickEl) {

    joystick = nipplejs.create({

        zone: joystickEl,
        mode: 'static',

        position: {
            left: '50px',
            bottom: '50px'
        },

        color: 'white',

        size: Math.min(
            window.innerWidth,
            window.innerHeight
        ) * 0.15
    });

    joystick.on('move', (evt, data) => {

        if (!data) return;

        move.x = data.vector.x;
        move.y = -data.vector.y;
    });

    joystick.on('end', () => {

        move.x = 0;
        move.y = 0;
    });

} else {

    if (joystickEl) {
        joystickEl.style.display = "none";
    }
}

// WASD
window.addEventListener('keydown', e => {

    if(e.key === 'w') keys.w = true;
    if(e.key === 's') keys.s = true;
    if(e.key === 'a') keys.a = true;
    if(e.key === 'd') keys.d = true;
});

window.addEventListener('keyup', e => {

    if(e.key === 'w') keys.w = false;
    if(e.key === 's') keys.s = false;
    if(e.key === 'a') keys.a = false;
    if(e.key === 'd') keys.d = false;
});

// Camera rotatie
let pitch = 0;
let yaw = 0;

let isDragging = false;

let prevX;
let prevY;

function onPointerDown(e) {

    const target = e.target || e.touches?.[0].target;

    if (joystickEl && joystickEl.contains(target)) return;

    isDragging = true;

    prevX = e.clientX || e.touches[0].clientX;
    prevY = e.clientY || e.touches[0].clientY;
}

function onPointerMove(e) {

    if(!isDragging) return;

    const x = e.clientX || e.touches[0].clientX;
    const y = e.clientY || e.touches[0].clientY;

    const dx = x - prevX;
    const dy = y - prevY;

    prevX = x;
    prevY = y;

    const sensitivity = 0.002;

    yaw -= dx * sensitivity;
    pitch -= dy * sensitivity;

    pitch = Math.max(
        -Math.PI / 2,
        Math.min(Math.PI / 2, pitch)
    );
}

function onPointerUp() {

    isDragging = false;
}

window.addEventListener('mousedown', onPointerDown);
window.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);

window.addEventListener('touchstart', onPointerDown);
window.addEventListener('touchmove', onPointerMove);
window.addEventListener('touchend', onPointerUp);

// Raycaster
const raycaster = new THREE.Raycaster();

const mouse = new THREE.Vector2();

// Klik op cube
function playCubeSound(event) {

    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;

    mouse.y = -(
        event.clientY / window.innerHeight
    ) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects([
        musicCube
    ]);

    if (intersects.length > 0) {

        console.log("Rode cube geklikt!");

        if (sound.buffer) {

            if (sound.isPlaying) {
                sound.stop();
            }

            sound.play();

        } else {

            console.log("Audio nog niet geladen");
        }
    }
}

window.addEventListener('click', playCubeSound);

// Animatie
function animate() {

    requestAnimationFrame(animate);

    const speed = 0.05;

    let moveX = 0;
    let moveZ = 0;

    // Keyboard
    if(keys.w) moveZ -= 1;
    if(keys.s) moveZ += 1;
    if(keys.a) moveX -= 1;
    if(keys.d) moveX += 1;

    // Joystick
    moveX += move.x;
    moveZ += move.y;

    // Normaliseren
    const len = Math.sqrt(
        moveX * moveX +
        moveZ * moveZ
    );

    if(len > 0){

        moveX /= len;
        moveZ /= len;
    }

    // Richtingen
    const forward = new THREE.Vector3(
        Math.sin(yaw),
        0,
        Math.cos(yaw)
    );

    const right = new THREE.Vector3(
        Math.cos(yaw),
        0,
        -Math.sin(yaw)
    );

    // Movement
    const moveVector = forward
        .multiplyScalar(moveZ)
        .add(right.multiplyScalar(moveX))
        .multiplyScalar(speed);

    camera.position.add(moveVector);

    camera.position.y = 1.6;

    // Camera rotatie
    camera.rotation.set(
        pitch,
        yaw,
        0,
        'YXZ'
    );

    // Rotaties
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    musicCube.rotation.x += 0.01;
    musicCube.rotation.y += 0.01;

    renderer.render(scene, camera);
}

animate();

// Resize
window.addEventListener('resize', () => {

    camera.aspect =
        window.innerWidth / window.innerHeight;

    camera.updateProjectionMatrix();

    renderer.setSize(
        window.innerWidth,
        window.innerHeight
    );

    if (joystick) {

        joystick.options.size = Math.min(
            window.innerWidth,
            window.innerHeight
        ) * 0.15;
    }
});