/**
 * A 2.5D Screen Render, using Raycasting algorithm
 **/
//% color=#03AA74 weight=1 icon="\uf1b2" //cube f1b2 , fold f279
//% groups='["Instance","Basic", "Dimension Z", "Animate", "Advanced"]'
//% block="3D Render"
namespace Render {
    export enum attribute {
        dirX,
        dirY,
        fov,
        wallZScale,
    }

    export class Animations {
        constructor(public frameInterval: number, public animations: Image[][]) {
        }

        msLast = 0
        index = 0
        iAnimation = 0
        getFrameByDir(dir: number): Image {
            if (control.millis() - this.msLast > this.frameInterval) {
                this.msLast = control.millis()
                this.index++
                this.iAnimation = Math.round((dir * this.animations.length)) % this.animations.length
                if (this.index >= this.animations[this.iAnimation].length)
                    this.index = 0
            }
            return this.animations[this.iAnimation][this.index]
        }
    }

    /**
 * Apply a directional image animations on a sprite
 * @param sprite the sprite to animate on
 * @param animations the directional animates
 */
    //% blockId=set_animation
    //% block="set $sprite=variables_get(mySprite) $animations"
    //% animations.shadow=create_animation
    //% group="Animate"
    //% weight=100
    //% help=animation/run-image-animation
    export function setSpriteAnimations(sprite: Sprite, animations: Animations) {
        raycastingRender.spriteAnimations[sprite.id] = animations
    }

    /**
 * Create a directional image animations, multi animations will applied to one round dirctions averagely, start from the left. 
 * The reason that directions start from left, is almost all Arcade out-of-box 1 or 2-dirction images are facing left, so that would be convient for using.
 * @param frameInterval the time between changes, eg: 150
 * @param frames1 animation, if this is the first of multi animation it will be used as left, others will 
 * @param frames2 optional, used for 2 or more dirctional
 * @param frames3 optional, used for 3 or more dirctional
 * @param frames4 optional, used for 4 or more dirctional
 */
    //% blockId=create_animation
    //% block="interval$frameInterval=timePicker animates:$frames1=animation_editor|| $frames2=animation_editor $frames3=animation_editor $frames4=animation_editor"
    //% inlineInputMode=inline
    //% group="Animate"
    //% weight=100
    //% help=animation/run-image-animation
    export function createAnimations(frameInterval: number, frames1: Image[], frames2?: Image[], frames3?: Image[], frames4?: Image[]): Animations {
        const animationList = [frames1]
        if (frames2) animationList.push(frames2)
        if (frames3) animationList.push(frames3)
        if (frames4) animationList.push(frames4)
        return new Animations(frameInterval, animationList)
    }

    /**
     * Get the Render
     * @param img the image
     */
    //% group="Instance"
    //% blockId=rcRender_getRCRenderInstance block="raycasting render"
    //% expandableArgumentMode=toggle
    //% weight=100 
    //% blockHidden=true
    //% hidden=1
    export function getRCRenderInstance(): RayCastingRender {
        return raycastingRender
    }

    /**
     * Get the render Sprite, which create automatically, for physical collisions, and holding the view point.(but get/set view direction with dirX/dirY, which not in the Sprite class) 
     * You can consider it as "myself", and operate it like a usual sprite.
     * eg: position, speed, scale, collision, ...
     */
    //% group="Instance"
    //% blockId=rcRender_getRenderSpriteInstance block="myself sprite"
    //% expandableArgumentMode=toggle
    //% weight=99
    export function getRenderSpriteInstance(): Sprite {
        return raycastingRender.sprSelf
    }

    /**
     * Toggle current view mode
     */
    //% blockId=rcRender_toggleViewMode block="toggle current view mode"
    //% group="Basic"
    //% weight=89
    export function toggleViewMode() {
        raycastingRender.viewMode = raycastingRender.viewMode == ViewMode.tilemapView ? ViewMode.raycastingView : ViewMode.tilemapView
    }

    /**
     * Current view mode is the specific one?
     * @param viewMode
     */
    //% blockId=rcRender_isViewMode block="current is $viewMode"
    //% group="Basic"
    //% weight=88
    export function isViewMode(viewMode: ViewMode): boolean {
        return viewMode == raycastingRender.viewMode
    }

    /**
     * Set view mode
     * @param viewMode
     */
    //% blockId=rcRender_setViewMode block="set view mode $viewMode"
    //% group="Basic"
    //% weight=87
    export function setViewMode(viewMode: ViewMode) {
        raycastingRender.viewMode = viewMode
    }

    /**
     * Get render arribute
     * @param viewMode
     */
    //% group="Basic"
    //% block="get %attribute" 
    //% blockId=rcRender_getAttribute
    //% weight=83
    export function getAttribute(attr: attribute): number {
        switch (attr) {
            case attribute.dirX:
                return raycastingRender.dirX
            case attribute.dirY:
                return raycastingRender.dirY
            case attribute.fov:
                return raycastingRender.fov
            case attribute.wallZScale:
                return raycastingRender.wallZScale
            default:
                return 0
        }
    }

    /**
     * Set render arribute
     * @param viewMode
     */
    //% group="Basic"
    //% block="Set %attribute = %value" 
    //% blockId=rcRender_SetAttribute
    //% weight=82
    export function SetAttribute(attr: attribute, value: number) {
        switch (attr) {
            case attribute.dirX:
                raycastingRender.dirX = value
            case attribute.dirY:
                raycastingRender.dirY = value
            case attribute.fov:
                if (value < 0) value = 0
                raycastingRender.fov = value
            case attribute.wallZScale:
                if(value<0)value=0
                raycastingRender.wallZScale = value
            default:
        }
    }

    /**
     * Get default FOV (field of view) value
     * @param viewMode
     */
    //% group="Basic"
    //% block="defaultFov"
    //% blockId=rcRender_getDefaultFov
    //% weight=81
    export function getDefaultFov(): number {
        return defaultFov
    }

    /**
     * Set view angle
     * @param angle, unit: degree 0~360
     */
    //% blockId=rcRender_setViewAngleInDegree block="set view angle$angle"
    //% angle.min=0 angle.max=360 angle.defl=90
    //% group="Basic"
    //% weight=80
    export function setViewAngleInDegree(angle: number) {
        raycastingRender.viewAngle = angle * Math.PI / 180
    }

    /**
     * Set view angle by dirX and dirY
     * @param dirX
     * @param dirY
     */
    //% blockId=rcRender_setViewAngle block="set view angle by dirX%dirX and dirY%dirY"
    //% group="Basic"
    //% weight=79
    export function setViewAngle(dirX: number, dirY: number) {
        raycastingRender.viewAngle = Math.atan2(dirY, dirX)
    }

    /**
     * Set floating offset height for a sprite at Z direction
     * @param sprite
     * @param Zoffset Negative floats down, affirmative goes up
     * @param duration moving time, 0 for immediately, unit: ms
     */
    //% blockId=rcRender_setZOffset block="set Sprite %spr=variables_get(mySprite) floating %offset pixels|| duration $duration=timePicker|ms "
    //% offset.min=-100 offset.max=100 offset.defl=8
    //% duration.min=0 duration.max=5000 duration.defl=0
    //% group="Dimension Z"
    //% weight=80
    export function setZOffset(sprite: Sprite, offset: number, duration?: number) {
        raycastingRender.setZOffset(sprite, offset, duration)
    }

    /**
     * Check if 2 sprites overlaps each another in Z dimension
     * Best work together with sprites.onOverlap(kind1, kind2)
     * @param sprite1
     * @param sprite2
     */
    //% blockId=rcRender_isSpritesOverlapZ
    //% block="is sprites $sprite1=variables_get(mySprite) and $sprite2=variables_get(mySprite2) overlaps in Z dimension"
    //% group="Dimension Z"
    //% weight=78
    export function isSpritesOverlapZ(sprite1: Sprite, sprite2: Sprite):boolean {
        return raycastingRender.isOverlapZ(sprite1, sprite2)
    }

    /**
     * Make sprite jump, with specific height and duration
     * Jump can only happened when sprite is standing, current height = its offset .
     * @param sprite
     * @param height jump height in pixel
     * @param duration hover time span, unit: ms
     */
    //% blockId=rcRender_jumpWithHeightAndDuration block="Sprite %spr=variables_get(mySprite) jump, with height $height duration $duration=timePicker|ms "
    //% height.min=0 height.max=100 height.defl=16
    //% duration.min=50 duration.max=5000 duration.defl=500
    //% group="Dimension Z"
    //% weight=70
    export function jumpWithHeightAndDuration(sprite: Sprite, height: number, duration: number) {
        raycastingRender.jumpWithHeightAndDuration(sprite, height, duration)
    }

    /**
     * Make sprite jump, with specific speed and acceleration
     * Simular with Move block, but jump can only happened when sprite is standing, current height = its offset.
     * @param sprite
     * @param v vetical speed, unit: pixel/s
     * @param a vetical acceleration, unit: pixel/s²
     */
    //% blockId=rcRender_jump block="Sprite %spr=variables_get(mySprite) jump||, with speed $v=spriteSpeedPicker acceleration $a"
    //% v.min=-100 v.max=100 v.defl=60
    //% a.min=-1000 a.max=1000 a.defl=-250
    //% group="Dimension Z"
    //% weight=68
    export function jump(sprite: Sprite, v?: number, a?: number) {
        raycastingRender.jump(sprite, v, a)
    }

    /**
     * Make sprite jump, with specific speed and acceleration
     * @param sprite
     * @param v vetical speed, unit: pixel/s
     * @param a vetical acceleration, unit: pixel/s²
     */
    //% blockId=rcRender_move block="Sprite %spr=variables_get(mySprite) move, with speed $v=spriteSpeedPicker|| acceleration $a"
    //% v.min=-200 v.max=200 v.defl=60
    //% a.min=-1000 a.max=1000 a.defl=-250
    //% group="Dimension Z"
    //% weight=66
    export function move(sprite: Sprite, v?: number, a?: number) {
        raycastingRender.move(sprite, v, a)
    }

    /**
     * Control the self sprite using the direction buttons from the controller. 
     * To stop controlling self sprite, pass 0 for v and va.
     *
     * @param v The velocity used for forward/backword movement when up/down is pressed, in pixel/s
     * @param va The angle velocity used for turn view direction when left/right is pressed, in radian/s.
     */
    //% blockId="rcRender_moveWithController" block="move with buttons velocity $v|| turn speed $va"
    //% weight=60
    //% expandableArgumentMode="toggle"
    //% v.defl=2 va.defl=3
    //% group="Advanced"
    //% v.shadow="spriteSpeedPicker"
    //% va.shadow="spriteSpeedPicker"
    export function moveWithController(v: number = 2, va: number = 3) {
        raycastingRender.velocity=v
        raycastingRender.velocityAngle=va
    }

    /**
     * Render takeover all sprites in current scene
     * Render will call this automatically, but maybe not in time enough.
     * If you saw sprite draw at its tilemap position on screen, call this just after created the sprite.
     */
    //% blockId=rcRender_takeoverSceneSprites 
    //% block="takeover sprites in scene"
    //% group="Advanced"
    //% weight=49
    export function takeoverSceneSprites() {
        raycastingRender.takeoverSceneSprites()
    }

    /**
     * Run on sprite dirction updated, present view point to Sprite facing dirction, or which angle you see of the sprite.
     * Just using with other animation extensions, to set proper Image for sprite.
     * Not required, if you have used the set animations block provided.
     * @param dir It is a float number, 0~1 corresponds to 0~360°, suggest use Math.round(dir*dirAniTotalCount)%dirAniTotalCount to get index of direction
     */
    //% blockId=rcRender_registerOnSpriteDirectionUpdateHandler
    //% block="run code when sprite $spr dirction updated to $dir"
    //% draggableParameters
    //% group="Advanced"
    //% weight=48
    export function registerOnSpriteDirectionUpdateHandler(handler: (spr: Sprite, dir: number) => void) {
        raycastingRender.registerOnSpriteDirectionUpdate(handler)
    }
}