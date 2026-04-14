import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// Mobiel detectie
const isMobile = window.matchMedia("(pointer: coarse)").matches;

let joystick = null;
const joystickEl = document.getElementById('joystick');

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// camera
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

// Textures (images) 
const textureLoader = new THREE.TextureLoader();

const barkTexture = textureLoader.load('bark.jpg');
barkTexture.wrapS = THREE.RepeatWrapping;
barkTexture.wrapT = THREE.RepeatWrapping;
barkTexture.repeat.set(1, 2);

const leavesTexture = textureLoader.load('Bladeren.png');
leavesTexture.wrapS = THREE.RepeatWrapping;
leavesTexture.wrapT = THREE.RepeatWrapping;
leavesTexture.repeat.set(2, 2);

const groundTexture = textureLoader.load('Gras.webp');
groundTexture.wrapS = THREE.RepeatWrapping;
groundTexture.wrapT = THREE.RepeatWrapping;
groundTexture.repeat.set(15, 15);

// Prachtige grond
const groundGeo = new THREE.PlaneGeometry(100, 100);
const groundMat = new THREE.MeshStandardMaterial({ map: groundTexture });
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Objecten
const cube = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshStandardMaterial({ color: 0x00ff00 })
);
cube.position.set(0, 0, 0);
scene.add(cube);

// texture (images voor de bomen)
function createTree(x, z) {
    const trunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.5, 10, 32),
        new THREE.MeshStandardMaterial({ map: barkTexture })
    );
    trunk.position.set(x, 4, z);
    scene.add(trunk);

    const leaves = new THREE.Mesh(
        new THREE.ConeGeometry(5, 10, 32),
        new THREE.MeshStandardMaterial({ map: leavesTexture })
    );
    leaves.position.set(x, 9, z);
    scene.add(leaves);
}

createTree(-7, -2);
createTree(-19, -2);
createTree(20, -2);
createTree(10, 30)

// input functie
const keys = { w:false, a:false, s:false, d:false };

// joystick movement
let move = { x: 0, y: 0 };

// Joystick voor mobiel
if (isMobile && window.nipplejs && joystickEl) {

    joystick = nipplejs.create({
        zone: joystickEl,
        mode: 'static',
        position: { left: '50px', bottom: '50px' },
        color: 'white',
        size: Math.min(window.innerWidth, window.innerHeight) * 0.15
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
    // desktop = joystick verbergen
    if (joystickEl) joystickEl.style.display = "none";
}

// Toestenbord functie WASD
window.addEventListener('keydown', e=>{
    if(e.key==='w') keys.w=true;
    if(e.key==='s') keys.s=true;
    if(e.key==='a') keys.a=true;
    if(e.key==='d') keys.d=true;
});

window.addEventListener('keyup', e=>{
    if(e.key==='w') keys.w=false;
    if(e.key==='s') keys.s=false;
    if(e.key==='a') keys.a=false;
    if(e.key==='d') keys.d=false;
});

// Camera
let pitch = 0;
let yaw = 0;
let isDragging = false;
let prevX, prevY;

function onPointerDown(e){

    const target = e.target || e.touches?.[0].target;

    if (joystickEl && joystickEl.contains(target)) return;

    isDragging = true;
    prevX = e.clientX || e.touches[0].clientX;
    prevY = e.clientY || e.touches[0].clientY;
}

function onPointerMove(e){
    if(!isDragging) return;

    const x = e.clientX || e.touches[0].clientX;
    const y = e.clientY || e.touches[0].clientY;

    const dx = x - prevX;
    const dy = y - prevY;

    prevX = x;
    prevY = y;

    const sensitivity = 0.002;
    yaw   -= dx * sensitivity;
    pitch -= dy * sensitivity;

    pitch = Math.max(-Math.PI/2, Math.min(Math.PI/2, pitch));
}

function onPointerUp(){
    isDragging = false;
}

window.addEventListener('mousedown', onPointerDown);
window.addEventListener('mousemove', onPointerMove);
window.addEventListener('mouseup', onPointerUp);

window.addEventListener('touchstart', onPointerDown);
window.addEventListener('touchmove', onPointerMove);
window.addEventListener('touchend', onPointerUp);

// animatie
function animate() {
    requestAnimationFrame(animate);

    const speed = 0.05;

    let moveX = 0;
    let moveZ = 0;

    // keyboard
    if(keys.w) moveZ -= 1;
    if(keys.s) moveZ += 1;
    if(keys.a) moveX -= 1;
    if(keys.d) moveX += 1;

    // joystick
    moveX += move.x;
    moveZ += move.y;

    // normale beweging
    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if(len > 0){
        moveX /= len;
        moveZ /= len;
    }

    // camera-relative movement
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));
    const right   = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

    const moveVector = forward.multiplyScalar(moveZ)
        .add(right.multiplyScalar(moveX))
        .multiplyScalar(speed);

    camera.position.add(moveVector);
    camera.position.y = 1.6;

    camera.rotation.set(pitch, yaw, 0, 'YXZ');

    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
}

animate();

// schaling voor telefoon
window.addEventListener('resize', ()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);

    if (joystick) {
        joystick.options.size =
            Math.min(window.innerWidth, window.innerHeight) * 0.15;
    }
});