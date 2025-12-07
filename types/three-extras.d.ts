declare module "three/examples/jsm/controls/PointerLockControls" {
  import { Camera, EventDispatcher } from "three";

  export class PointerLockControls extends EventDispatcher {
    constructor(camera: Camera, domElement: HTMLElement);
    domElement: HTMLElement;
    isLocked: boolean;
    getObject(): any;
    getDirection(targetVec: any): any;
    lock(): void;
    unlock(): void;
    dispose(): void;
  }
}
