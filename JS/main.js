import * as THREE from 'three';

// 1. CENA: Onde tudo acontece
const scene = new THREE.Scene();

// 2. CÂMERA: Perspectiva (Campo de visão, Proporção, Corte perto, Corte longe)
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// 3. RENDERER: Quem desenha os pixels na tela
const renderer = new THREE.WebGLRenderer({
    antialias: true
});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// 4. OBJETO: Um cubo simples
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial({
    color: 0x00ff88
});
const cube = new THREE.Mesh(geometry, material);
scene.add(cube);

// 5. LUZ: Sem luz, tudo fica preto (como na vida real!)
const light = new THREE.DirectionalLight(0xffffffff, 1);
light.position.set(1, 1, 2);
scene.add(light);
scene.add(new THREE.AmbientLight(0x404040)); // Luz suave em todo lugar

// 6. LOOP DE ANIMAÇÃO: Roda a 60 quadros por segundo
function animate() {
    requestAnimationFrame(animate);

    // Rotação suave
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
}

// Ajustar tela se o usuário redimensionar o navegador
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

animate();
