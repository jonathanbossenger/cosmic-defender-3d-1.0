// Gamepad constants
const GAMEPAD_DEADZONE = 0.15;
const GAMEPAD_LOOK_SENSITIVITY = 2.5; // radians per second at full stick deflection
// Must match MOUSE_SENSITIVITY in Player.js so look speed is consistent
const _MOUSE_SENSITIVITY = 0.002;

function _applyDeadzone(value, deadzone) {
  if (Math.abs(value) < deadzone) return 0;
  return (value - Math.sign(value) * deadzone) / (1 - deadzone);
}

export class Input {
  constructor() {
    this.keys = {};
    this.mouseDown = false;
    this.mouseDX = 0;
    this.mouseDY = 0;
    this.locked = false;

    this._onKeyDown = (e) => {
      this.keys[e.code] = true;
      if (e.code === 'Escape') this._escPressed = true;
      if (e.code === 'KeyR') this._reloadPressed = true;
      if (e.code === 'Space') this._jumpPressed = true;
    };
    this._onKeyUp = (e) => {
      this.keys[e.code] = false;
    };
    this._onMouseDown = (e) => {
      if (e.button === 0) this.mouseDown = true;
    };
    this._onMouseUp = (e) => {
      if (e.button === 0) this.mouseDown = false;
    };
    this._onMouseMove = (e) => {
      if (this.locked) {
        this.mouseDX += e.movementX;
        this.mouseDY += e.movementY;
      }
    };
    this._onPointerLockChange = () => {
      this.locked = document.pointerLockElement != null;
    };

    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('keyup', this._onKeyUp);
    document.addEventListener('mousedown', this._onMouseDown);
    document.addEventListener('mouseup', this._onMouseUp);
    document.addEventListener('mousemove', this._onMouseMove);
    document.addEventListener('pointerlockchange', this._onPointerLockChange);

    this._escPressed = false;
    this._reloadPressed = false;
    this._jumpPressed = false;

    // Gamepad state
    this._gamepadIndex = null;
    this._gamepadPrevButtons = [];
    this._gamepadMoveX = 0;
    this._gamepadMoveY = 0;
    this._gamepadFire = false;
    this._gamepadSprint = false;
    this._gamepadDpadUp = false;
    this._gamepadDpadDown = false;
    this._gamepadDpadLeft = false;
    this._gamepadDpadRight = false;

    window.addEventListener('gamepadconnected', (e) => {
      this._gamepadIndex = e.gamepad.index;
    });
    window.addEventListener('gamepaddisconnected', (e) => {
      if (this._gamepadIndex === e.gamepad.index) {
        this._gamepadIndex = null;
        this._gamepadPrevButtons = [];
        this._gamepadMoveX = 0;
        this._gamepadMoveY = 0;
        this._gamepadFire = false;
        this._gamepadSprint = false;
        this._gamepadDpadUp = false;
        this._gamepadDpadDown = false;
        this._gamepadDpadLeft = false;
        this._gamepadDpadRight = false;
      }
    });
  }

  /**
   * Poll the connected gamepad and update internal state.
   * Must be called once per frame (before input is consumed).
   * @param {number} dt - Delta time in seconds
   */
  pollGamepad(dt) {
    // Auto-detect a gamepad if none is tracked yet (handles controllers
    // that were connected before the page loaded)
    if (this._gamepadIndex === null) {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          this._gamepadIndex = i;
          break;
        }
      }
    }
    if (this._gamepadIndex === null) return;

    const gp = (navigator.getGamepads ? navigator.getGamepads() : [])[this._gamepadIndex];
    if (!gp) return;

    // Left stick → movement axes (with deadzone)
    this._gamepadMoveX = _applyDeadzone(gp.axes[0] ?? 0, GAMEPAD_DEADZONE);
    this._gamepadMoveY = _applyDeadzone(gp.axes[1] ?? 0, GAMEPAD_DEADZONE);

    // Right stick → look (accumulate as mouse-delta equivalent so Player.js
    // can consume it via consumeMouse() without modification)
    const rx = _applyDeadzone(gp.axes[2] ?? 0, GAMEPAD_DEADZONE);
    const ry = _applyDeadzone(gp.axes[3] ?? 0, GAMEPAD_DEADZONE);
    const lookScale = GAMEPAD_LOOK_SENSITIVITY * dt / _MOUSE_SENSITIVITY;
    this.mouseDX += rx * lookScale;
    this.mouseDY += ry * lookScale;

    // Continuous buttons
    this._gamepadFire   = !!(gp.buttons[7] && gp.buttons[7].value > 0.5); // RT  → fire
    this._gamepadSprint = !!(gp.buttons[4] && gp.buttons[4].pressed);     // LB  → sprint

    // D-pad (buttons 12-15)
    this._gamepadDpadUp    = !!(gp.buttons[12] && gp.buttons[12].pressed);
    this._gamepadDpadDown  = !!(gp.buttons[13] && gp.buttons[13].pressed);
    this._gamepadDpadLeft  = !!(gp.buttons[14] && gp.buttons[14].pressed);
    this._gamepadDpadRight = !!(gp.buttons[15] && gp.buttons[15].pressed);

    // One-shot button presses (edge detection: fired only on the first frame
    // the button is held)
    const prev = this._gamepadPrevButtons;
    if (gp.buttons[0]?.pressed && !prev[0]) this._jumpPressed   = true; // A     → jump
    if (gp.buttons[2]?.pressed && !prev[2]) this._reloadPressed = true; // X     → reload
    if (gp.buttons[9]?.pressed && !prev[9]) this._escPressed    = true; // Start → pause

    // Store current button states for edge detection on the next frame
    for (let i = 0; i < gp.buttons.length; i++) {
      prev[i] = gp.buttons[i].pressed;
    }
  }

  consumeEsc() {
    const v = this._escPressed;
    this._escPressed = false;
    return v;
  }

  consumeReload() {
    const v = this._reloadPressed;
    this._reloadPressed = false;
    return v;
  }

  consumeJump() {
    const v = this._jumpPressed;
    this._jumpPressed = false;
    return v;
  }

  consumeMouse() {
    const dx = this.mouseDX;
    const dy = this.mouseDY;
    this.mouseDX = 0;
    this.mouseDY = 0;
    return { dx, dy };
  }

  requestLock(element) {
    element.requestPointerLock();
  }

  exitLock() {
    if (document.pointerLockElement) {
      document.exitPointerLock();
    }
  }

  isDown(code) {
    return !!this.keys[code];
  }

  /** Returns true if a gamepad is currently connected. */
  get gamepadConnected() {
    return this._gamepadIndex !== null;
  }

  /** True when the player intends to fire (mouse button or gamepad RT). */
  get isFiring() {
    return this.mouseDown || this._gamepadFire;
  }

  /**
   * Analog X movement axis in the range [-1, 1].
   * Returns the left-stick value when a gamepad is active, otherwise ±1
   * from keyboard (left/right arrow or A/D) or 0.
   */
  get moveAxisX() {
    // D-pad has digital priority; opposite directions cancel to 0
    const dpadX = (this._gamepadDpadRight ? 1 : 0) - (this._gamepadDpadLeft ? 1 : 0);
    if (dpadX !== 0) return dpadX;
    if (Math.abs(this._gamepadMoveX) > 0) return this._gamepadMoveX;
    let v = 0;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft'))  v -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) v += 1;
    return v;
  }

  /**
   * Analog Z movement axis in the range [-1, 1].
   * Returns the left-stick Y value (inverted so forward = negative Z, matching
   * Three.js convention) when a gamepad is active, otherwise ±1 from keyboard.
   */
  get moveAxisZ() {
    // D-pad has digital priority; opposite directions cancel to 0
    const dpadZ = (this._gamepadDpadDown ? 1 : 0) - (this._gamepadDpadUp ? 1 : 0);
    if (dpadZ !== 0) return dpadZ;
    if (Math.abs(this._gamepadMoveY) > 0) return this._gamepadMoveY; // stick up = negative Y → forward = negative Z ✓
    let v = 0;
    if (this.isDown('KeyW') || this.isDown('ArrowUp'))   v -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) v += 1;
    return v;
  }

  get forward()  { return this.isDown('KeyW') || this.isDown('ArrowUp')    || this._gamepadMoveY < -GAMEPAD_DEADZONE || this._gamepadDpadUp; }
  get backward() { return this.isDown('KeyS') || this.isDown('ArrowDown')  || this._gamepadMoveY >  GAMEPAD_DEADZONE || this._gamepadDpadDown; }
  get left()     { return this.isDown('KeyA') || this.isDown('ArrowLeft')  || this._gamepadMoveX < -GAMEPAD_DEADZONE || this._gamepadDpadLeft; }
  get right()    { return this.isDown('KeyD') || this.isDown('ArrowRight') || this._gamepadMoveX >  GAMEPAD_DEADZONE || this._gamepadDpadRight; }
  get shift()    { return this.isDown('ShiftLeft') || this.isDown('ShiftRight') || this._gamepadSprint; }
}
