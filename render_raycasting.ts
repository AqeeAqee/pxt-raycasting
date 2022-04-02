enum ViewMode {
    //% block="TileMap Mode"
    tilemapView,
    //% block="Raycasting Mode"
    raycastingView,
}

/**
 * A 2.5D Screen Render, using Raycasting algorithm
 **/
//% color=#03AA74 weight=1 icon="\uf1b2" //cube f1b2 , fold f279
//% groups='["Instance","Basic", "Animate", "Advanced"]'
//% block="3D Render"
namespace Render {
    const fpx = 8
    const fpx_scale = 2 ** fpx
    function tofpx(n: number) { return (n * fpx_scale) | 0 }

    export enum attribute {
        dirX,
        dirY,
        fov,
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
                raycastingRender.fov = value
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
     * Set view angle by dirX and dirY
     * @param sprite
     * @param offsetZ Negative floats up, affirmative goes down
     */
    //% blockId=rcRender_setViewAngle block="set view angle by dirX%dirX and dirY%dirY"
    //% offsetZ.min=-100 offsetZ.max=100 offsetZ.defl=-50
    //% group="Basic"
    //% weight=80
    export function setViewAngle(dirX: number, dirY: number) {
        raycastingRender.viewAngle = Math.atan2(dirY, dirX)
    }

    /**
     * Set floating rate for a sprite, offset at Z
     * @param sprite
     * @param offsetZ Negative floats up, affirmative goes down
     */
    //% blockId=rcRender_setOffsetZ block="set Sprite %spr=variables_get(mySprite) floating percentage %offsetZ"
    //% offsetZ.min=-100 offsetZ.max=100 offsetZ.defl=-50
    //% group="Basic"
    //% weight=80
    export function setOffsetZ(sprite: Sprite, offsetZ: number) {
        raycastingRender.spriteOffsetZ[sprite.id] = tofpx(offsetZ) / 100
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

    export const defaultFov = screen.width / screen.height / 2  //Wall just fill screen height when standing 1 unit away

    export class RayCastingRender {
        _viewMode: ViewMode
        dirXFpx: number
        dirYFpx: number
        planeX: number
        planeY: number
        _angle: number
        _fov: number
        spriteOffsetZ: number[] = []
        spriteAnimations: Animations[] = []

        //reference
        tilemapScaleSize = 1 << TileScale.Sixteen
        map: tiles.TileMapData
        bg: Image
        textures: Image[]
        sprSelf: Sprite
        sprites: Sprite[] = []
        oldRender: scene.Renderable
        myRender: scene.Renderable

        //render
        wallHeightInView: number
        wallWidthInView: number
        dist: number[] = []
        //for drawing sprites
        invDet: number //required for correct matrix multiplication

        onSpriteDirectionUpdateHandler: (spr: Sprite, dir: number) => void

        get xFpx(): number {
            return Fx.add(this.sprSelf._x, Fx.div(this.sprSelf._width, Fx.twoFx8)) as any as number / this.tilemapScaleSize
        }

        set xFpx(v: number) {
            this.sprSelf._x = v * this.tilemapScaleSize as any as Fx8
        }

        get yFpx(): number {
            return Fx.add(this.sprSelf._y, Fx.div(this.sprSelf._height, Fx.twoFx8)) as any as number / this.tilemapScaleSize
        }

        set yFpx(v: number) {
            this.sprSelf._y = v * this.tilemapScaleSize as any as Fx8
        }

        get dirX(): number {
            return this.dirXFpx / fpx_scale
        }

        get dirY(): number {
            return this.dirYFpx / fpx_scale
        }

        set dirX(v: number) {
            this.dirXFpx = v * fpx_scale
        }

        set dirY(v: number) {
            this.dirYFpx = v * fpx_scale
        }

        sprXFx8(spr: Sprite) {
            return Fx.add(spr._x, Fx.div(spr._width, Fx.twoFx8)) as any as number / this.tilemapScaleSize
        }

        sprYFx8(spr: Sprite) {
            return Fx.add(spr._y, Fx.div(spr._height, Fx.twoFx8)) as any as number / this.tilemapScaleSize
        }

        get fov(): number {
            return this._fov
        }

        set fov(fov: number) {
            this._fov = fov
            this.wallHeightInView = (screen.width << (fpx - 1)) / this._fov
            this.wallWidthInView = this.wallHeightInView >> fpx // not fpx  // wallSize / this.fov * 4 / 3 * 2

            this.setVectors()
        }

        get viewAngle(): number {
            return this._angle
        }
        set viewAngle(angle: number) {
            this._angle = angle
            this.setVectors()
            this.updateSelfImage()
        }

        getOffsetZ(spr: Sprite) {
            return this.spriteOffsetZ[spr.id] || 0
        }

        setOffsetZ(spr: Sprite, offsetZ: number) {
            this.spriteOffsetZ[spr.id] = tofpx(offsetZ)
        }

        get viewMode(): ViewMode {
            return this._viewMode
        }

        set viewMode(v: ViewMode) {
            this._viewMode = v
            // const sc = game.currentScene()
            if (v == ViewMode.tilemapView) {
                // game.currentScene().allSprites.removeElement(this.myRender)
                // sc.allSprites.push(this.oldRender)
                // this.bg = game.currentScene().background.image
                // scene.setBackgroundImage(img`15`) //todo, add bgTilemap property for tilemap mode
                // this.sprites.forEach(spr => {
                //     sc.allSprites.push(spr)
                // })
            }
            else {
                // game.currentScene().allSprites.removeElement(this.oldRender)
                // game.currentScene().allSprites.push(this.myRender)
                // game.currentScene().background.image = this.bg
                // this.takeoverSceneSprites()
            }

        }

        takeoverSceneSprites() {
            const sc = game.currentScene()
            sc.allSprites.forEach(spr => {
                if (spr instanceof Sprite) {
                    if (this.sprites.indexOf(spr) < 0)
                        this.sprites.push(spr as Sprite)
                    sc.allSprites.removeElement(spr)
                    spr.onDestroyed(() => { this.sprites.removeElement(spr) })
                }
            })
        }

        tilemapLoaded() {
            const sc = game.currentScene()
            this.map = sc.tileMap.data
            this.textures = sc.tileMap.data.getTileset()
            this.tilemapScaleSize = 1 << sc.tileMap.scale
            this.oldRender = sc.tileMap.renderable
            sc.allSprites.removeElement(this.oldRender)
            this.takeoverSceneSprites()

            let frameCallback_update = sc.eventContext.registerFrameHandler(scene.PRE_RENDER_UPDATE_PRIORITY + 1, () => {
                const dt = sc.eventContext.deltaTime;
                // sc.camera.update();  // already did in scene
                for (const s of this.sprites)
                    s.__update(sc.camera, dt);
            })

            let frameCallback_draw = sc.eventContext.registerFrameHandler(scene.RENDER_SPRITES_PRIORITY + 1, () => {
                screen.drawImage(game.currentScene().background.image, 0, 0)
                if (this._viewMode == ViewMode.tilemapView) {
                    this.oldRender.__drawCore(game.currentScene().camera)
                    this.sprites.forEach(spr => spr.__draw(game.currentScene().camera))
                    //draw hud, todo, walk around for being covered by tilemap
                    game.currentScene().allSprites.forEach(spr => spr.__draw(game.currentScene().camera))
                } else {
                    this.takeoverSceneSprites() // in case some one new
                    this.render()
                    //draw hud, or other SpriteLike
                    game.currentScene().allSprites.forEach(spr => spr.__draw(game.currentScene().camera))
                }
            })

            game.currentScene().tileMap.addEventListener(tiles.TileMapEvent.Unloaded, data => {
                sc.eventContext.unregisterFrameHandler(frameCallback_update)
                sc.eventContext.unregisterFrameHandler(frameCallback_draw)
            })

            // this.myRender = scene.createRenderable(
            //     scene.TILE_MAP_Z,
            //     (t, c) => this.trace(t, c)
            // )

        }

        constructor() {
            this._angle = 0
            this.fov = defaultFov

            const sc = game.currentScene()
            if (!sc.tileMap) {
                sc.tileMap = new tiles.TileMap();
            } else {
                this.tilemapLoaded()
            }
            game.currentScene().tileMap.addEventListener(tiles.TileMapEvent.Loaded, data => this.tilemapLoaded())

            //self sprite
            this.sprSelf = sprites.create(image.create(this.tilemapScaleSize >> 1, this.tilemapScaleSize >> 1), SpriteKind.Player)
            // this.sprSelf.setPosition(x, y)
            scene.cameraFollowSprite(this.sprSelf)
            this.updateSelfImage()

            game.onUpdate(function () {
                this.updateControls()
            })

        }

        private setVectors() {
            const sin = Math.sin(this._angle)
            const cos = Math.cos(this._angle)
            this.dirXFpx = tofpx(cos)
            this.dirYFpx = tofpx(sin)
            this.planeX = tofpx(sin * this._fov)
            this.planeY = tofpx(cos * -this._fov)
        }

        public canGo(x: number, y: number) {
            const radius = this.sprSelf.width as any as number / 2
            return this.map.getTile((x + radius) >> fpx, (y + radius) >> fpx) == 0 &&
                this.map.getTile((x + radius) >> fpx, (y - radius) >> fpx) == 0 &&
                this.map.getTile((x - radius) >> fpx, (y + radius) >> fpx) == 0 &&
                this.map.getTile((x - radius) >> fpx, (y - radius) >> fpx) == 0
        }

        //todo, pre-drawn dirctional image
        public updateSelfImage() {
            const img = this.sprSelf.image
            img.fill(6)
            const arrowLength = img.width / 2
            img.drawLine(arrowLength, arrowLength, arrowLength + this.dirX * arrowLength, arrowLength + this.dirY * arrowLength, 2)
            img.fillRect(arrowLength - 1, arrowLength - 1, 2, 2, 2)
        }

        updateControls() {
            const dx = controller.dx(2)
            if (dx) {
                this.viewAngle += dx
            }
            const dy = controller.dy(3)
            if (dy) {
                const nx = this.xFpx - Math.round(this.dirXFpx * dy)
                const ny = this.yFpx - Math.round(this.dirYFpx * dy)
                //use physical engine instead
                // if (!this.canGo(nx, ny) && this.canGo(this.xFpx, this.yFpx)) {
                //     if (this.canGo(this.xFpx, ny)) {
                //         this.yFpx = ny
                //     } else if (this.canGo(nx, this.yFpx)) {
                //         this.xFpx = nx
                //     }
                // } else {
                //     this.xFpx = nx
                //     this.yFpx = ny
                // }
                this.sprSelf.setPosition((nx * this.tilemapScaleSize / fpx_scale), (ny * this.tilemapScaleSize / fpx_scale))
            }
            //if (dx || dy)
            //    console.log(`${this.xFpx},${this.yFpx},${this.angle}`)
        }

        render() {
            // based on https://lodev.org/cgtutor/raycasting.html
            const w = screen.width
            const h = screen.height
            const one = 1 << fpx
            const one2 = 1 << (fpx + fpx)

            //for sprite
            this.invDet = one2 / (this.planeX * this.dirYFpx - this.dirXFpx * this.planeY); //required for correct matrix multiplication

            for (let x = 0; x < w; x++) {
                const cameraX: number = one - Math.idiv((x << fpx) << 1, w)
                let rayDirX = this.dirXFpx + (this.planeX * cameraX >> fpx)
                let rayDirY = this.dirYFpx + (this.planeY * cameraX >> fpx)

                let mapX = this.xFpx >> fpx
                let mapY = this.yFpx >> fpx

                // length of ray from current position to next x or y-side
                let sideDistX = 0, sideDistY = 0

                // avoid division by zero
                if (rayDirX == 0) rayDirX = 1
                if (rayDirY == 0) rayDirY = 1

                // length of ray from one x or y-side to next x or y-side
                const deltaDistX = Math.abs(Math.idiv(one2, rayDirX));
                const deltaDistY = Math.abs(Math.idiv(one2, rayDirY));

                let mapStepX = 0, mapStepY = 0

                let sideWallHit = false;

                //calculate step and initial sideDist
                if (rayDirX < 0) {
                    mapStepX = -1;
                    sideDistX = ((this.xFpx - (mapX << fpx)) * deltaDistX) >> fpx;
                } else {
                    mapStepX = 1;
                    sideDistX = (((mapX << fpx) + one - this.xFpx) * deltaDistX) >> fpx;
                }
                if (rayDirY < 0) {
                    mapStepY = -1;
                    sideDistY = ((this.yFpx - (mapY << fpx)) * deltaDistY) >> fpx;
                } else {
                    mapStepY = 1;
                    sideDistY = (((mapY << fpx) + one - this.yFpx) * deltaDistY) >> fpx;
                }

                let color = 0

                while (true) {
                    //jump to next map square, OR in x-direction, OR in y-direction
                    if (sideDistX < sideDistY) {
                        sideDistX += deltaDistX;
                        mapX += mapStepX;
                        sideWallHit = false;
                    } else {
                        sideDistY += deltaDistY;
                        mapY += mapStepY;
                        sideWallHit = true;
                    }

                    if (this.map.isOutsideMap(mapX, mapY))
                        break
                    color = this.map.getTile(mapX, mapY)
                    if (color)
                        break; // hit!
                }

                if (this.map.isOutsideMap(mapX, mapY))
                    continue

                let perpWallDist = 0
                let wallX = 0
                if (!sideWallHit) {
                    perpWallDist = Math.idiv(((mapX << fpx) - this.xFpx + (1 - mapStepX << fpx - 1)) << fpx, rayDirX)
                    wallX = this.yFpx + (perpWallDist * rayDirY >> fpx);
                } else {
                    perpWallDist = Math.idiv(((mapY << fpx) - this.yFpx + (1 - mapStepY << fpx - 1)) << fpx, rayDirY)
                    wallX = this.xFpx + (perpWallDist * rayDirX >> fpx);
                }
                wallX &= (1 << fpx) - 1

                // color = (color - 1) * 2
                // if (sideWallHit) color++

                const tex = this.textures[color]
                if (!tex)
                    continue

                // textures look much better when lineHeight is odd
                let lineHeight = Math.idiv(this.wallHeightInView, perpWallDist) | 1
                let drawStart = (-lineHeight + h) >> 1;
                let texX = (wallX * tex.width) >> fpx;
                // if ((!sideWallHit && rayDirX > 0) || (sideWallHit && rayDirY < 0))
                //     texX = tex.width - texX - 1;

                screen.blitRow(x, drawStart, tex, texX, lineHeight)

                this.dist[x] = perpWallDist

            }

            /////////////////// sprites ///////////////////

            this.sprites
                .filter((spr, i) => { // transformY>0
                    return (spr instanceof Sprite) && spr != this.sprSelf && (-this.planeY * (this.sprXFx8(spr) - this.xFpx) + this.planeX * (this.sprYFx8(spr) - this.yFpx)) > 0
                }).sort((spr1, spr2) => {   // far to near
                    return ((this.sprXFx8(spr2) - this.xFpx) ** 2 + (this.sprYFx8(spr2) - this.yFpx) ** 2) - ((this.sprXFx8(spr1) - this.xFpx) ** 2 + (this.sprYFx8(spr1) - this.yFpx) ** 2)
                }).forEach((spr, index) => {
                    this.test_drawSprite(spr, index)
                    //this.drawSprite(spr, index)
                })
        }

        registerOnSpriteDirectionUpdate(handler: (spr: Sprite, dir: number) => void) {
            this.onSpriteDirectionUpdateHandler = handler
        }

        camera=new scene.Camera()
        test_drawSprite(spr: Sprite, index: number) {
            // screen.print([spr.image.width].join(), 0, index*10)
            const spriteX = this.sprXFx8(spr) - this.xFpx
            const spriteY = this.sprYFx8(spr) - this.yFpx
            const transformX = this.invDet * (this.dirYFpx * spriteX - this.dirXFpx * spriteY) >> fpx;
            const transformY = this.invDet * (-this.planeY * spriteX + this.planeX * spriteY) >> fpx; //this is actually the depth inside the screen, that what Z is in 3D
            const spriteScreenX = Math.ceil((screen.width / 2) * (1 - transformX / transformY));
            const spriteScreenHalfWidth = Math.idiv((spr._width as any as number) / this.tilemapScaleSize / 2 * this.wallWidthInView, transformY)  //origin: (texSpr.width / 2 << fpx) / transformY / this.fov / 3 * 2 * 4

            // //calculate drawing range in X direction
            // //assume there is one range only
            // let blitX = 0, blitWidth = 0
            // for (let sprX = Math.max(0, spriteScreenX - spriteScreenHalfWidth); sprX < Math.min(screen.width, spriteScreenX + spriteScreenHalfWidth); sprX++) {
            //     if (this.dist[sprX] > transformY) {
            //         if (blitWidth == 0)
            //             blitX = sprX
            //         blitWidth++
            //     } else if (blitWidth > 0)
            //         break
            // }
            // // screen.print([this.getxFx8(spr), this.getyFx8(spr)].join(), 0,index*10+10)
            // if (blitWidth == 0)
            //     return
            if(this.dist[spriteScreenX] <= (transformY))
                return
            const lineHeight = Math.idiv(this.wallHeightInView, transformY) | 1
            const drawStart = (screen.height >> 1) + (lineHeight * (this.getOffsetZ(spr) + (fpx_scale >> 1) - (spr._height as any as number) / this.tilemapScaleSize) >> fpx)
            
            const myAngle = Math.atan2(spriteX, spriteY)
            //for textures=image[][], abandoned
            //    const texSpr = spr.getTexture(Math.floor(((Math.atan2(spr.vxFx8, spr.vyFx8) - myAngle) / Math.PI / 2 + 2-.25) * spr.textures.length +.5) % spr.textures.length)
            //for deal in user code
            if (this.onSpriteDirectionUpdateHandler)
                this.onSpriteDirectionUpdateHandler(spr, ((Math.atan2(spr._vx as any as number, spr._vy as any as number) - myAngle) / Math.PI / 2 + 2 - .25))
            //for CharacterAnimation ext.
            //     const iTexture = Math.floor(((Math.atan2(spr._vx as any as number, spr._vy as any as number) - myAngle) / Math.PI / 2 + 2 - .25) * 4 + .5) % 4
            //     const characterAniDirs = [Predicate.MovingLeft,Predicate.MovingDown, Predicate.MovingRight, Predicate.MovingUp]
            //     character.setCharacterState(spr, character.rule(characterAniDirs[iTexture]))
            //for this.spriteAnimations
            const texSpr = !this.spriteAnimations[spr.id] ? spr.image : this.spriteAnimations[spr.id].getFrameByDir(((Math.atan2(spr._vx as any as number, spr._vy as any as number) - myAngle) / Math.PI / 2 + 2 - .25))
            
            const oldy=spr.y
            const oldx=spr.x
            const oldScale=spr.scale
            
            spr.setImage(texSpr)
            spr.setFlag(SpriteFlag.StayInScreen, false)
            spr.setFlag(SpriteFlag.Ghost, true)
            spr.x = spriteScreenX
            spr.top = drawStart
            spr.scale = spriteScreenHalfWidth * 2 / spr.image.width
            spr.__update(this.camera, 111)
            spr.__draw(this.camera)

            spr.setFlag(SpriteFlag.Ghost,false)
            spr.scale=oldScale
            spr.y= oldy
            spr.x= oldx


            // helpers.imageBlit(
            //     screen,
            //     blitX,
            //     drawStart,
            //     blitWidth,
            //     lineHeight * spr.height / this.tilemapScaleSize,
            //     texSpr,
            //     (blitX - (spriteScreenX - spriteScreenHalfWidth)) * texSpr.width / spriteScreenHalfWidth / 2
            //     ,
            //     0,
            //     blitWidth * texSpr.width / spriteScreenHalfWidth / 2, texSpr.height, true, false)
        }

        drawSprite(spr: Sprite, index: number) {
            // screen.print([spr.image.width].join(), 0, index*10)
            const spriteX = this.sprXFx8(spr) - this.xFpx
            const spriteY = this.sprYFx8(spr) - this.yFpx
            const transformX = this.invDet * (this.dirYFpx * spriteX - this.dirXFpx * spriteY) >> fpx;
            const transformY = this.invDet * (-this.planeY * spriteX + this.planeX * spriteY) >> fpx; //this is actually the depth inside the screen, that what Z is in 3D
            const spriteScreenX = Math.ceil((screen.width / 2) * (1 - transformX / transformY));
            const spriteScreenHalfWidth = Math.idiv((spr._width as any as number) / this.tilemapScaleSize / 2 * this.wallWidthInView, transformY)  //origin: (texSpr.width / 2 << fpx) / transformY / this.fov / 3 * 2 * 4

            //calculate drawing range in X direction
            //assume there is one range only
            let blitX = 0, blitWidth = 0
            for (let sprX = Math.max(0, spriteScreenX - spriteScreenHalfWidth); sprX < Math.min(screen.width, spriteScreenX + spriteScreenHalfWidth); sprX++) {
                if (this.dist[sprX] > transformY) {
                    if (blitWidth == 0)
                        blitX = sprX
                    blitWidth++
                } else if (blitWidth > 0)
                    break
            }
            // screen.print([this.getxFx8(spr), this.getyFx8(spr)].join(), 0,index*10+10)
            if (blitWidth == 0)
                return
            const lineHeight = Math.idiv(this.wallHeightInView, transformY) | 1
            const drawStart = (screen.height >> 1) + (lineHeight * (this.getOffsetZ(spr) + (fpx_scale >> 1) - (spr._height as any as number) / this.tilemapScaleSize) >> fpx)
            const myAngle = Math.atan2(spriteX, spriteY)

            //for textures=image[][], abandoned
            //    const texSpr = spr.getTexture(Math.floor(((Math.atan2(spr.vxFx8, spr.vyFx8) - myAngle) / Math.PI / 2 + 2-.25) * spr.textures.length +.5) % spr.textures.length)
            //for deal in user code
            if (this.onSpriteDirectionUpdateHandler)
                this.onSpriteDirectionUpdateHandler(spr, ((Math.atan2(spr._vx as any as number, spr._vy as any as number) - myAngle) / Math.PI / 2 + 2 - .25))
            //for CharacterAnimation ext.
            //     const iTexture = Math.floor(((Math.atan2(spr._vx as any as number, spr._vy as any as number) - myAngle) / Math.PI / 2 + 2 - .25) * 4 + .5) % 4
            //     const characterAniDirs = [Predicate.MovingLeft,Predicate.MovingDown, Predicate.MovingRight, Predicate.MovingUp]
            //     character.setCharacterState(spr, character.rule(characterAniDirs[iTexture]))
            //for this.spriteAnimations
            const texSpr = !this.spriteAnimations[spr.id] ? spr.image : this.spriteAnimations[spr.id].getFrameByDir(((Math.atan2(spr._vx as any as number, spr._vy as any as number) - myAngle) / Math.PI / 2 + 2 - .25))
            helpers.imageBlit(
                screen,
                blitX,
                drawStart,
                blitWidth,
                lineHeight * spr.height / this.tilemapScaleSize,
                texSpr,
                (blitX - (spriteScreenX - spriteScreenHalfWidth)) * texSpr.width / spriteScreenHalfWidth / 2
                ,
                0,
                blitWidth * texSpr.width / spriteScreenHalfWidth / 2, texSpr.height, true, false)
        }
    }

    //%fixedinstance
    export const raycastingRender = new Render.RayCastingRender()
}
