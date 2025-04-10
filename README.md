# Three Game Controls

**Three Game Controls** is a lightweight and versatile game control library built on top of [three.js](https://threejs.org). It provides essential physics engine capabilities, including gravity and collision detection, and supports interactions through various input devices.

- [Documentation](https://byongho96.github.io/three-game-controls/docs/#manual/Installation)
- [Examples](https://byongho96.github.io/three-game-controls/examples/#first-person_keyboard_controls)
- [Issues](https://github.com/Byongho96/three-game-controls/issues)


## Highlights

- Depends only on three.js.
- Lightweight physics (gravity, collision detection, and friction).
- Simple API built on three.js controls classes.
- Seamlessly manages character animations.
- Supports various input devices.
- Fully customizable for user needs.

## Installation

:bulb: **three.js >= 0.139.0** is a prerequisite.

* NPM
```bash
npm install three three-game-controls
```
or

* CDN
```html
<script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@<version>/build/three.module.js",
      "three-game-controls": "https://cdn.jsdelivr.net/npm/three-game-controls@<version>/dist/bundle.esm.js"
    }
  }
</script>
```

## Usage

### FirstPersonControls

FirstPersonControls offer a first-person view where the camera acts as the controller.  
**A background world mesh** is required, and a sample mesh is available for testing.

```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { FPKeyboardDragControls } from 'three-game-controls';

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild( renderer.domElement );

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x88ccee );

const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );

const light = new THREE.HemisphereLight( 0x8dc1de, 0x00668d, 1.5 );
light.position.set( 2, 1, 1 );
scene.add( light );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.5 );
directionalLight.position.set( - 5, 25, - 1 );
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = - 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = - 30;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = - 0.00006;
scene.add( directionalLight );

let controls;

const gltfLoader = new GLTFLoader();
gltfLoader.setPath( 'https://byongho96.github.io/three-game-controls/assets/' );

gltfLoader.load( 'collision-world.glb', ( gltf ) => {

  gltf.scene.traverse( child => {

    if ( child.isMesh ) {

      child.castShadow = true;
      child.receiveShadow = true;

    }

  } );
  scene.add( gltf.scene );

  controls = new FPKeyboardDragControls( camera, renderer.domElement, gltf.scene );
  controls.minYBoundary = - 10;

  renderer.setAnimationLoop( animate );

} );

const clock = new THREE.Clock();

function animate() {

  const delta = Math.min( 0.05, clock.getDelta() );
  controls.update( delta );
  renderer.render( scene, camera );

}
```

### ThirdPersonControls

ThirdPersonControls offer a third-person view with a character tracked by the camera.  
It requires **a background world mesh, a character mesh with a skeleton, and animation clips.** Assets are available on platforms like [Mixamo](https://www.mixamo.com/#/) or as sample files for testing.

```js
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TPKeyboardDragControls } from 'three-game-controls';

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild( renderer.domElement );

const scene = new THREE.Scene();
scene.background = new THREE.Color( 0x88ccee );

const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 1000 );

const light = new THREE.HemisphereLight( 0x8dc1de, 0x00668d, 1.5 );
light.position.set( 2, 1, 1 );
scene.add( light );

const directionalLight = new THREE.DirectionalLight( 0xffffff, 2.5 );
directionalLight.position.set( - 5, 25, - 1 );
directionalLight.castShadow = true;
directionalLight.shadow.camera.near = 0.01;
directionalLight.shadow.camera.far = 500;
directionalLight.shadow.camera.right = 30;
directionalLight.shadow.camera.left = - 30;
directionalLight.shadow.camera.top = 30;
directionalLight.shadow.camera.bottom = - 30;
directionalLight.shadow.mapSize.width = 1024;
directionalLight.shadow.mapSize.height = 1024;
directionalLight.shadow.radius = 4;
directionalLight.shadow.bias = - 0.00006;
scene.add( directionalLight );

let controls;

const gltfLoader = new GLTFLoader();
gltfLoader.setPath( 'https://byongho96.github.io/three-game-controls/assets/' );

Promise.all( [
  gltfLoader.loadAsync( 'collision-world.glb' ),
  gltfLoader.loadAsync( 'x-bot.glb' ),
  gltfLoader.loadAsync( 'ani-idle.glb' ),
  gltfLoader.loadAsync( 'ani-forward.glb' ),
  gltfLoader.loadAsync( 'ani-forward-fast.glb' ),
  gltfLoader.loadAsync( 'ani-jump-up.glb' ),
  gltfLoader.loadAsync( 'ani-land.glb' ),
  gltfLoader.loadAsync( 'ani-fall.glb' )
] ).then(
  ( [
    worldGltf,
    characterGltf,
    idleGltf,
    forwardGltf,
    forwardFastGltf,
    jumpUpGltf,
    landGltf,
    fallGltf
  ] ) => {

    scene.add( worldGltf.scene );
    worldGltf.scene.traverse( child => {

      if ( child.isMesh ) {

        child.castShadow = true;
        child.receiveShadow = true;

      }

    } );

    scene.add( characterGltf.scene );
    scene.add( characterGltf.scene );
    characterGltf.scene.traverse( child => {

      if ( child.isMesh ) {

        child.castShadow = true;
        child.receiveShadow = true;

      }

    } );

    controls = new TPKeyboardDragControls(
      characterGltf.scene,
      renderer.domElement,
      worldGltf.scene,
      {
        IDLE: idleGltf.animations[ 0 ],
        MOVE_FORWARD: forwardGltf.animations[ 0 ],
        RUN_FORWARD: forwardFastGltf.animations[ 0 ],
        JUMP_UP: jumpUpGltf.animations[ 0 ],
        LAND: landGltf.animations[ 0 ],
        FALL: fallGltf.animations[ 0 ]
      },
      camera
    );
    controls.minYBoundary = - 10;

    renderer.setAnimationLoop( animate );

  }
);

const clock = new THREE.Clock();

function animate() {

  const delta = Math.min( 0.05, clock.getDelta() );
  controls && controls.update( delta );
  renderer.render( scene, camera );

}
```
