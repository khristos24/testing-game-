declare module "three/examples/jsm/controls/PointerLockControls" {
  import { Camera, EventDispatcher } from "three";

  export class PointerLockControls extends EventDispatcher {
    constructor(camera: Camera, domElement: HTMLElement);
    domElement: HTMLElement;
    isLocked: boolean;
    getObject(): any;
    getDirection(targetVec: any): any;
    addEventListener(
      type: "lock" | "unlock" | string,
      listener: (event: any) => void
    ): void;
    removeEventListener(
      type: "lock" | "unlock" | string,
      listener: (event: any) => void
    ): void;
    lock(): void;
    unlock(): void;
    dispose(): void;
  }
}
