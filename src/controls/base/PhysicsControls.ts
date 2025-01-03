import { Box3, Object3D, Ray, Vector3, Controls } from 'three';
import { Octree } from 'three/examples/jsm/math/Octree.js';
import { Capsule } from 'three/examples/jsm/math/Capsule.js';

/**
 * Event map for PhysicsControls, defining the types of events that can be dispatched.
 */
export interface PhysicsControlsEventMap {
  /**
   * Fires when the collider has collided with the world.
   */
  collide: { normal: Vector3 };
}

/**
 * Predefined event objects for reuse when dispatching events.
 */
const _collideEvent = { type: 'collide' as keyof PhysicsControlsEventMap };

/**
 * Defines the minimum and maximum boundaries along an axis.
 */
type BoundaryAxis = {
  min: number;
  max: number;
};

/**
 * Defines the boundary of the world and the reset point when the player goes out of bounds.
 */
type Boundary = {
  resetPoint: Vector3; // Reset point of the player if out of bounds
  x: BoundaryAxis; // x-axis boundary
  y: BoundaryAxis; // y-axis boundary
  z: BoundaryAxis; // z-axis boundary
};

/**
 * Options to configure the physics properties of the PhysicsControls.
 */
export type PhysicsOptions = {
  step?: number; // Time step for the delicate physics calculations (default: )
  gravity?: number; // Gravity of the world (default: 30)
  maxFallSpeed?: number; // Maximum fall speed of the player (default: 20)
  movementResistance?: number; // Resistance of the player movement (default: 4)
  colliderHeight?: number; // Custom height of the capsule collider of the player (default: object's height)
  colliderRadius?: number; // Custom radius of the capsule collider of the player (default: height / 4)
  boundary?: Boundary; // Boundary of the world
  landTimeThreshold?: number; // Threshold for determining the landing time. (default: 250)
};

/**
 * PhysicsControls class that adds physics-based controls to a 3D object.
 */
class PhysicsControls extends Controls<PhysicsControlsEventMap> {

	private _worldOctree: Octree;
	private _capsuleCollider: Capsule;
	private _ray: Ray = new Ray( new Vector3(), new Vector3( 0, - 1, 0 ) );

	// Physics properties
	step: number;
	gravity: number;
	maxFallSpeed: number;
	movementResistance: number;
	velocity: Vector3 = new Vector3();
	landTimeThreshold: number;

	boundary?: Boundary;

	private _isGrounded: boolean = false;
	private _isLanding: boolean = false;

	// Temporary vectors for calculations
	private _deltaVelocity: Vector3 = new Vector3();

	/**
   * Constructs a new PhysicsControls instance.
   * @param object - The 3D object to apply physics controls to.
   * @param domElement - The HTML element for event listeners (optional).
   * @param world - The world object used to build the collision octree.
   * @param physicsOptions - Optional physics configuration.
   */
	constructor( object: Object3D, domElement: HTMLElement | null, world: Object3D, physicsOptions?: PhysicsOptions ) {

		super( object, domElement );

		// Create an octree from the world for collision detection.
		this._worldOctree = new Octree();
		this._worldOctree.fromGraphNode( world );

		// Create a capsule collider for the player.
		const objectSize = new Vector3();
		new Box3().setFromObject( this.object ).getSize( objectSize );

		const radius = physicsOptions?.colliderRadius || objectSize.y / 4;
		const height = physicsOptions?.colliderHeight || objectSize.y;

		this._capsuleCollider = new Capsule( new Vector3( 0, radius, 0 ), new Vector3( 0, height - radius, 0 ), radius );
		this._capsuleCollider.translate( object.position );

		// Set physics properties
		this.step = physicsOptions?.step ?? 5;
		this.gravity = physicsOptions?.gravity ?? 30;
		this.maxFallSpeed = physicsOptions?.maxFallSpeed ?? 20;
		this.movementResistance = physicsOptions?.movementResistance ?? 6;
		this.landTimeThreshold = physicsOptions?.landTimeThreshold ?? 250;

		// Set boundary properties if provided.
		this.boundary = physicsOptions?.boundary;

	}

	get isGrounded() {

		return this._isGrounded;

	}

	get isLanding() {

		return this._isLanding;

	}

	get collider() {

		return this._capsuleCollider;

	}

	/**
   * Checks for collisions between the player's collider and the world octree.
   * Updates the player's grounded state and adjusts velocity and position accordingly.
   */
	private _checkCollisions() {

		this._isGrounded = false;

		const collisionResult = this._worldOctree.capsuleIntersect( this.collider );

		if ( ! collisionResult ) return;

		if ( collisionResult.normal.y > 0 ) {

			// Player is grounded.
			this._isGrounded = true;

		}

		// Adjust the collider position to resolve penetration.
		if ( collisionResult.depth >= 1e-10 ) {

			this.collider.translate( collisionResult.normal.multiplyScalar( collisionResult.depth ) );
			this.dispatchEvent( { ..._collideEvent, normal: collisionResult.normal.normalize() } );

		}

	}

	private _checkLanding() {

		this._isLanding = false;

		if ( this._isGrounded || this.velocity.y >= 0 ) return;

		this._ray.origin.copy( this._capsuleCollider.start ).y -= this._capsuleCollider.radius;
		const rayResult = this._worldOctree.rayIntersect( this._ray );

		if ( rayResult.distance / - this._deltaVelocity.y < this.landTimeThreshold ) {

			this._isLanding = true;

		}

	}

	/**
   * Resets the player's position if they are out of the defined world boundaries.
   */
	private _teleportPlayerIfOutOfBounds() {

		if ( ! this.boundary ) return;

		const { resetPoint, x, y, z } = this.boundary;
		const { x: px, y: py, z: pz } = this.object.position;

		// Check if the player is out of bounds.
		if ( px < x.min || px > x.max || py < y.min || py > y.max || pz < z.min || pz > z.max ) {

			this.collider.end.set(
				resetPoint.x,
				resetPoint.y + this.collider.start.distanceTo( this.collider.end ) + this.collider.radius,
				resetPoint.z,
			);
			this.collider.start.set( resetPoint.x, resetPoint.y + this.collider.radius, resetPoint.z );
			this.velocity.set( 0, 0, 0 );

		}

	}

	/**
   * Updates the player's physics state.
   * @param delta - The time step for the update (in seconds).
   */
	update( delta: number ) {

		if ( ! this.enabled ) return;

		super.update( delta );

		const stepDelta = delta / this.step;

		for ( let i = 0; i < this.step; i ++ ) {

			// Apply movement resistance (damping).
			let damping = Math.exp( - this.movementResistance * stepDelta ) - 1; // Always negative

			if ( ! this._isGrounded ) {

				this.velocity.y -= this.gravity * stepDelta;
				this.velocity.y = Math.max( this.velocity.y, - this.maxFallSpeed ); // Limit fall speed
				damping *= 0.1; // Small air resistance

			}

			this.velocity.addScaledVector( this.velocity, damping );

			this._deltaVelocity.copy( this.velocity ).multiplyScalar( stepDelta );
			this.collider.translate( this._deltaVelocity );

			this._checkCollisions();
			this._checkLanding();

			this._teleportPlayerIfOutOfBounds();

		}

		// Update the object's position to match the collider.
		this.object.position.copy( this.collider.start );
		this.object.position.y -= this.collider.radius;

	}

	connect() {

		super.connect();

	}

	disconnect() {

		super.disconnect();

	}

	dispose() {

		super.dispose();

	}

}

export { PhysicsControls };
