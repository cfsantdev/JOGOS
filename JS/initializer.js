import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.118.1/build/three.module.js';
import {
    entity_manager
} from './entity-manager.js';
import {
    entity
} from './entity.js';
import {
    ui_controller
} from './ui-controller.js';
import {
    level_up_component
} from './level-up-component.js';
import {
    inventory_controller
} from './inventory-controller.js';
import {
    quest_component
} from './quest-component.js';
import {
    gltf_component
} from './gltf-component.js';
import {
    spatial_grid_controller
} from './spatial-grid-controller.js';
import {
    spatial_hash_grid
} from './spatial-hash-grid.js'
import {
    player_input
} from './player-input.js';
import {
    player_entity
} from './player-entity.js'
import {
    equip_weapon_component
} from './equip-weapon-component.js';
import {
    health_component
} from './health-component.js';
import {
    attack_controller
} from './attacker-controller.js';
import {
    monsters
} from './monsters.js';
import {
    health_bar
} from './health-bar.js';
import {
    npc_entity
} from './npc-entity.js';
import {
    math
} from './math.js';

const _VS = `
varying vec3 vWorldPosition;

void main() {
  vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
  vWorldPosition = worldPosition.xyz;

  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}`;


const _FS = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;

varying vec3 vWorldPosition;

void main() {
  float h = normalize( vWorldPosition + offset ).y;
  gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
}`;


export const initializer = (() => {
  class Initializer {
    constructor(nMobs, nClouds, nFoliage) {
        this._threejs = null;
        this._camera = null;
        this._scene = null;
        this._sun = null;
        this._entityManager = null;
        this._grid = null;
        this._uientity = null;
        this._uicontroller = null;
        this._previousRAF = null;

        this._InitializeThree();
        this._InitializeCamera();
        this._InitializeScene();
        this._InitializeEntityManager();
        this._InitializeGrid();
        this._InitializeControllers();
        this._InitializeLevelUpSpawner();
        this._InitializeNPC();
        this._InitializePlayer();
        this._InitializeMobs(nMobs);
        this._InitializeClouds(nClouds);
        this._InitializeSky();
        this._InitializeFoliage(nFoliage);
        
        this._RAF();
    }

    _InitializeThree(){
        console.log("Initialize Three...(1/17)");
        this._threejs = new THREE.WebGLRenderer({
            antialias: true,
        });

        this._threejs.outputEncoding = THREE.sRGBEncoding;
        this._threejs.gammaFactor = 2.2;
        this._threejs.shadowMap.enabled = true;
        this._threejs.shadowMap.type = THREE.PCFSoftShadowMap;
        this._threejs.setPixelRatio(window.devicePixelRatio);
        this._threejs.setSize(window.innerWidth, window.innerHeight);
        this._threejs.domElement.id = 'threejs';

        document.getElementById('container').appendChild(this._threejs.domElement);
        window.addEventListener('resize', () => {
            this._OnWindowResize();
        }, false);
    }

    _InitializeCamera(){
        console.log("Initialize Camera...(2/17)");
        const fov = 60;
        const aspect = 1920 / 1080;
        const near = 1.0;
        const far = 10000.0;

        this._camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this._camera.position.set(25, 10, 25);
    }

    _InitializeScene(){
        console.log("Initialize Scene...(3/17)");
        this._scene = new THREE.Scene();
        this._scene.background = new THREE.Color(0xFFFFFF);
        this._scene.fog = new THREE.FogExp2(0x89b2eb, 0.002);

        let light = this._InitializeLights();
        this._scene.add(light);
        this._sun = light;

        let plane = this._InitializePlane();
        this._scene.add(plane);
    }

    _InitializeLights(){
        console.log("Initialize Lights...(4/17)");
        let light = new THREE.DirectionalLight(0xFFFFFF, 1.0);
        light.position.set(-10, 500, 10);
        light.target.position.set(0, 0, 0);
        light.castShadow = true;
        light.shadow.bias = -0.001;
        light.shadow.mapSize.width = 4096;
        light.shadow.mapSize.height = 4096;
        light.shadow.camera.near = 0.1;
        light.shadow.camera.far = 1000.0;
        light.shadow.camera.left = 100;
        light.shadow.camera.right = -100;
        light.shadow.camera.top = 100;
        light.shadow.camera.bottom = -100;

        return light;
    }

    _InitializePlane(){
        console.log("Initialize Plane...(5/17)");
        let plane = new THREE.Mesh(
            new THREE.PlaneGeometry(5000, 5000, 10, 10),
            new THREE.MeshStandardMaterial({
                color: 0x1e601c,
        }));

        plane.castShadow = false;
        plane.receiveShadow = true;
        plane.rotation.x = -Math.PI / 2;

        return plane;
    }

    _InitializeEntityManager(){
        console.log("Initialize Entity Manager...(6/17)");
        this._entityManager = new entity_manager.EntityManager();
    }

    _InitializeGrid(){
        console.log("Initialize Grid...(7/17)");
        this._grid = new spatial_hash_grid.SpatialHashGrid([[-1000, -1000], [1000, 1000]], [100, 100]);
    }

    _InitializeControllers(){
        console.log("Initialize Controllers...(8/17)");
        this._uientity = new entity.Entity();
        this._uicontroller = new ui_controller.UIController();
        this._uientity.AddComponent(this._uicontroller);
        this._entityManager.Add(this._uientity, 'ui');
    }

    _InitializeLevelUpSpawner(){
        console.log("Initialize Level Up Spawner..(9/17)");
        let levelUpEntity = new entity.Entity();
        levelUpEntity.AddComponent(new level_up_component.LevelUpComponentSpawner({
            camera: this._camera,
            scene: this._scene,
        }));

        this._entityManager.Add(levelUpEntity, 'level-up-spawner');
    }

    _InitializeInventory(player){
        console.log("Initialize Inventory...(10/17)");
        let axe = new entity.Entity();
        axe.AddComponent(new inventory_controller.InventoryItem({
            type: 'weapon',
            damage: 3,
            renderParams: {
              name: 'Axe',
              scale: 0.25,
              icon: 'war-axe-64.png',
            },
        }));

        let sword = new entity.Entity();
        sword.AddComponent(new inventory_controller.InventoryItem({
            type: 'weapon',
            damage: 3,
            renderParams: {
              name: 'Sword',
              scale: 0.25,
              icon: 'pointy-sword-64.png',
            },
        }));

        this._entityManager.Add(axe);
        this._entityManager.Add(sword);

        player.Broadcast({
            topic: 'inventory.add',
            value: axe.Name,
            added: false,
        });
    
        player.Broadcast({
            topic: 'inventory.add',
            value: sword.Name,
            added: false,
        });
    
        player.Broadcast({
            topic: 'inventory.equip',
            value: sword.Name,
            added: false,
        });
    }

    _InitializeNPC(){
        console.log("Initialize NPC...(11/17)");
        let npcEntity = new entity.Entity();
        npcEntity.AddComponent(new gltf_component.AnimatedModelComponent({
            scene: this._scene,
            resourcePath: './FBX/GIRL/',
            resourceName: 'peasant_girl.fbx',
            resourceAnimation: 'Standing Idle.fbx',
            scale: 0.035,
            receiveShadow: true,
            castShadow: true,
        }));

        npcEntity.AddComponent(new spatial_grid_controller.SpatialGridController({ grid: this._grid }));
        npcEntity.AddComponent(new player_input.PickableComponent());

        let quest = new quest_component.QuestComponent();
        npcEntity.AddComponent(quest);
        npcEntity.SetPosition(new THREE.Vector3(30, 0, 0));

        this._entityManager.Add(npcEntity);
    }

    _InitializeThirdPersonCamera(){
        console.log("Initialize Third Person Camera...(12/17)");
        let camera = new entity.Entity();
        camera.AddComponent(
            new third_person_camera.ThirdPersonCamera({
                camera: this._camera,
                target: this._entityManager.Get('player')
            })
        );

        this._entityManager.Add(camera, 'player-camera');
    }

    _InitializePlayer() {
        console.log("Initialize Player...(13/17)");
        const params = {
          camera: this._camera,
          scene: this._scene,
        };
        
        let player = new entity.Entity();
        player.AddComponent(new player_input.BasicCharacterControllerInput(params));
        player.AddComponent(new player_entity.BasicCharacterController(params));
        player.AddComponent(new equip_weapon_component.EquipWeapon({anchor: 'RightHandIndex1'}));
        player.AddComponent(new inventory_controller.InventoryController(params));

        this._InitializeInventory(player);
        
        player.AddComponent(new health_component.HealthComponent({
            updateUI: true,
            health: 100,
            maxHealth: 100,
            strength: 50,
            wisdomness: 5,
            benchpress: 20,
            curl: 100,
            experience: 0,
            level: 1,
        }));

        player.AddComponent(new spatial_grid_controller.SpatialGridController({grid: this._grid}));
        player.AddComponent(new attack_controller.AttackController({timing: 0.7}));
        
        this._entityManager.Add(player, 'player');
    
        this._InitializeThirdPersonCamera();
    }

    _InitializeMobs(num){
        console.log("Initialize Mobs...(14/17)");
        for (let i = 0; i < num; ++i) {
            const mobInfo = monsters[math.rand_int(0, monsters.length - 1)];
      
            const mob = new entity.Entity();
            mob.AddComponent(new npc_entity.NPCController({
                camera: this._camera,
                scene: this._scene,
                resourceName: mobInfo.resourceName,
                resourceTexture: mobInfo.resourceTexture,
            }));

            mob.AddComponent(
                new health_component.HealthComponent({
                    health: 50,
                    maxHealth: 50,
                    strength: 2,
                    wisdomness: 2,
                    benchpress: 3,
                    curl: 1,
                    experience: 0,
                    level: 1,
                    camera: this._camera,
                    scene: this._scene,
                })
            );

            mob.AddComponent(new spatial_grid_controller.SpatialGridController({grid: this._grid}));
            mob.AddComponent(new health_bar.HealthBar({ parent: this._scene, camera: this._camera }));
            mob.AddComponent(new attack_controller.AttackController({timing: 0.35}));
            mob.SetPosition(new THREE.Vector3((math.random() * 2 - 1) * 500, 0, (math.random() * 2 - 1) * 500));

            this._entityManager.Add(mob);
        }
    }

    _InitializeSky(){
        console.log("Initialize Sky...(15/17)");
        let hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFFF, 0.6);
        hemiLight.color.setHSL(0.6, 1, 0.6);
        hemiLight.groundColor.setHSL(0.095, 1, 0.75);

        this._scene.add(hemiLight);
    
        let uniforms = {
          "topColor": { value: new THREE.Color(0x0077ff) },
          "bottomColor": { value: new THREE.Color(0xffffff) },
          "offset": { value: 33 },
          "exponent": { value: 0.6 }
        };

        uniforms["topColor"].value.copy(hemiLight.color);
    
        this._scene.fog.color.copy(uniforms["bottomColor"].value);
    
        let skyGeo = new THREE.SphereBufferGeometry(1000, 32, 15);
        let skyMat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: _VS,
            fragmentShader: _FS,
            side: THREE.BackSide
        });
    
        let sky = new THREE.Mesh(skyGeo, skyMat);
        this._scene.add(sky);
    }

    _InitializeClouds(num){
        console.log("Initialize Clouds...(16/17)");
        for (let i = 0; i < num; ++i) {
            const index = math.rand_int(1, 3);
            const pos = new THREE.Vector3((math.random() * 2.0 - 1.0) * 500, 100, (math.random() * 2.0 - 1.0) * 500);
            const e = new entity.Entity();
            e.AddComponent(new gltf_component.StaticModelComponent({
                scene: this._scene,
                resourcePath: './GLTF/NATURE/',
                resourceName: 'Cloud' + index + '.glb',
                position: pos,
                scale: Math.random() * 5 + 10,
                emissive: new THREE.Color(0x808080),
            }));
              
            e.SetPosition(pos);
            
            this._entityManager.Add(e);

            e.SetActive(false);
        }
    }

    _InitializeFoliage(num) {
        console.log("Initialize Foliage...(17/17)");
        const names = [
            'CommonTree_Dead', 'CommonTree',
            'BirchTree', 'BirchTree_Dead',
            'Willow', 'Willow_Dead',
            'PineTree',
        ];

        let e, name, index, pos = null;

        for (let i = 0; i < num; ++i) {
          name = names[math.rand_int(0, names.length - 1)];
          index = math.rand_int(1, 5);
          pos = new THREE.Vector3((Math.random() * 2.0 - 1.0) * 500, 0, (Math.random() * 2.0 - 1.0) * 500);
    
          e = new entity.Entity();
          e.AddComponent(new gltf_component.StaticModelComponent({
            scene: this._scene,
            resourcePath: './FBX/NATURE/',
            resourceName: name + '_' + index + '.fbx',
            scale: 0.25,
            emissive: new THREE.Color(0x000000),
            specular: new THREE.Color(0x000000),
            receiveShadow: true,
            castShadow: true,
          }));

          e.AddComponent(new spatial_grid_controller.SpatialGridController({grid: this._grid}));

          e.SetPosition(pos);

          this._entityManager.Add(e);

          e.SetActive(false);
        }
    }

    _OnWindowResize() {
        this._camera.aspect = window.innerWidth / window.innerHeight;
        this._camera.updateProjectionMatrix();
        this._threejs.setSize(window.innerWidth, window.innerHeight);
    }

    _UpdateSun() {
        let player = this._entityManager.Get('player');
        let pos = player._position;
    
        this._sun.position.copy(pos);
        this._sun.position.add(new THREE.Vector3(-10, 500, -10));
        this._sun.target.position.copy(pos);
        this._sun.updateMatrixWorld();
        this._sun.target.updateMatrixWorld();
    }
    
    _RAF() {
        requestAnimationFrame((t) => {
            if (this._previousRAF === null) {
                this._previousRAF = t;
            }
    
            this._RAF();
    
            this._threejs.render(this._scene, this._camera);
            this._Step(t - this._previousRAF);
            this._previousRAF = t;
        });
    }
    
    _Step(timeElapsed) {
        const timeElapsedS = Math.min(1.0 / 30.0, timeElapsed * 0.001);
    
        this._UpdateSun();
    
        this._entityManager.Update(timeElapsedS);
    }
  }
  return {
    Initializer: Initializer
  };
})();
