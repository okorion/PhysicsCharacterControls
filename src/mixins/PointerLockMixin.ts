import { type FirstPersonControls, type Action } from '../controls/core/FirstPersonControls';

export interface HasPointerLockMethod {
	pointerLockXActions: Action[],
	pointerLockYActions: Action[],
	pointerLockDampingFactor: number,
	enablePointerLockDamping: boolean,
}

function PointerLockMixin<T extends Constructor<FirstPersonControls>>( Base: T ): Constructor<HasPointerLockMethod> & T {

	return class PointerLockMixin extends Base {

		/**
		 * The actions to be performed when pointer is locked and moved along the x-axis.
		 * @default [ 'ROTATE_RIGHT' ]
		 */
		pointerLockXActions: Action[] = [ 'ROTATE_RIGHT' ];

		/**
		 * The actions to be performed when pointer is locked and moved along the y-axis.
		 * @default [ 'ROTATE_DOWN' ]
		 */
		pointerLockYActions: Action[] = [ 'ROTATE_DOWN' ];

		/**
		 * The damping factor for pointer lock actions.
		 * @default 1
		 */
		pointerLockDampingFactor: number = 1;

		/**
		 * Whether to enable pointer lock damping.
		 * @default true
		 */
		enablePointerLockDamping: boolean = true;

		// Internals
		private _bindOnMouseDown: ( ) => void;
		private _bindOnMouseMove: ( event: MouseEvent ) => void;


		constructor( ...args: any[] ) {

			super( ...args );

			this._bindOnMouseDown = this._onMouseDown.bind( this );
			this._bindOnMouseMove = this._onMouseMove.bind( this );

			this.connect();

		}

		/**
		 * Connects the controls.
		 */
		connect(): void {

			super.connect();

			this.domElement?.addEventListener( 'mousedown', this._bindOnMouseDown );
			this.domElement?.addEventListener( 'mousemove', this._bindOnMouseMove );

		}

		/**
		 * Disconnects the controls.
		 */
		disconnect(): void {

			super.disconnect();

			this.domElement?.removeEventListener( 'mousedown', this._bindOnMouseDown );
			this.domElement?.removeEventListener( 'mousemove', this._bindOnMouseMove );

		}

		/**
		 * Disposes of the controls.
		 */
		dispose(): void {

			super.dispose();

			this.disconnect();

		}

		update( delta: number ): void {

			super.update( delta );

			if ( this.enablePointerLockDamping ) {

				this.pointerLockXActions.forEach( ( action ) => {

					this.actionStates[ action ] *= 1 - this.pointerLockDampingFactor;

				} );

				this.pointerLockYActions.forEach( ( action ) => {

					this.actionStates[ action ] *= 1 - this.pointerLockDampingFactor;

				} );

			}

		}

		// Handles the mousedown event to lock pointer.
		protected _onMouseDown( ) {

			this.domElement?.requestPointerLock();

		}


		// Handles the mousemove event and update action states.
		protected _onMouseMove( event: MouseEvent ) {

			if ( document.pointerLockElement !== this.domElement ) return;

			this.pointerLockXActions.forEach( ( action ) => {

				this.actionStates[ action ] = event.movementX;

			} );

			this.pointerLockYActions.forEach( ( action ) => {

				this.actionStates[ action ] = event.movementY;

			} );

		}

	};

}

export { PointerLockMixin };
