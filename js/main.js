import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x222222);

// Camera
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
camera.position.set(0, 1.6, 5);

// Renderer
const renderer = new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Cube
const geometry = new THREE.BoxGeometry();
const material = new THREE.MeshBasicMaterial({color: 0x00ff00});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// Joystick
const joystick = nipplejs.create({
    zone: document.getElementById('joystick'),
    mode: 'static',
    position: { left: '50px', bottom: '50px' },
    color: 'white',
    size: Math.min(window.innerWidth, window.innerHeight)*0.15
});

let move = { forward:0, right:0 };

joystick.on('move', (evt, data) => {
    if (!data) return;

    // raw joystick input (-1 tot 1)
    const jx = data.vector.x; // rechts = 1, links = -1
    const jz = data.vector.y; // omhoog = 1, omlaag = -1

    // Camera-georiënteerde beweging (FPS-stijl)
    const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw)); // negatieve Z!
    const right   = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw));

    const moveVec = forward.clone().multiplyScalar(jz).add(right.clone().multiplyScalar(jx));

    // Normaliseer voor constante snelheid
    if (moveVec.length() > 0) moveVec.normalize();

    // Update globale move variabele
    move.forward = moveVec.z;
    move.right   = moveVec.x;
});

joystick.on('end', () => {
    move.forward = 0;
    move.right   = 0;
});

// WASD input
const keys = { w:false, a:false, s:false, d:false };
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

// Camera rotation (muis / touch)
let pitch = 0;
let yaw = 0;
let isDragging = false;
let prevX, prevY;

function onPointerDown(e){
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
function onPointerUp(){ isDragging=false; }

window.addEventListener('mousedown',onPointerDown);
window.addEventListener('mousemove',onPointerMove);
window.addEventListener('mouseup',onPointerUp);
window.addEventListener('touchstart',onPointerDown);
window.addEventListener('touchmove',onPointerMove);
window.addEventListener('touchend',onPointerUp);

function animate() {
    requestAnimationFrame(animate);

    const speed = 0.05;

    // WASD input
    let moveX = 0;
    let moveZ = 0;
    if(keys.w) moveZ -= 1;
    if(keys.s) moveZ += 1;
    if(keys.a) moveX -= 1;
    if(keys.d) moveX += 1;

    // Joystick input
    moveX += move.right;
    moveZ += move.forward;

    // Normaliseer beweging voor diagonalen
    const len = Math.sqrt(moveX * moveX + moveZ * moveZ);
    if(len > 0) {
        moveX /= len;
        moveZ /= len;
    }

    // FPS-stijl camera-georiënteerde beweging
    const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)); // vooruit
    const right   = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw)); // rechts

    const moveVector = forward.clone().multiplyScalar(moveZ)
        .add(right.clone().multiplyScalar(moveX))
        .multiplyScalar(speed);

    camera.position.add(moveVector);
    camera.position.y = 1.6;

    // Camera rotatie
    camera.rotation.set(pitch, yaw, 0, 'YXZ');

    // Cube animatie
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
}
animate();

// Responsive
window.addEventListener('resize',()=>{
    camera.aspect = window.innerWidth/window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    joystick.options.size = Math.min(window.innerWidth, window.innerHeight)*0.15;
});