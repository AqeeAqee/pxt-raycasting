enum ViewMode {
    //% block="TileMap Mode"
    tilemapView,
    //% block="Raycasting Mode"
    raycastingView,
}

namespace Render{
    const fpx = 8
    const fpx_scale = 2 ** fpx
    function tofpx(n: number) { return (n * fpx_scale) | 0 }

    class MotionSet1D{
        p: number
        v: number=0
        a: number=0
        constructor (public offset:number){
            this.p=offset
        }
    }

    export const defaultFov = screen.width / screen.height / 2  //Wall just fill screen height when standing 1 tile away

    export class RayCastingRender {
        velocityAngle:number=2
        velocity:number=3
        protected _viewMode: ViewMode
        protected dirXFpx: number
        protected dirYFpx: number
        protected planeX: number
        protected planeY: number
        protected _angle: number
        protected _fov: number
        protected _wallZScale:number=1
        protected spriteMotionZ: MotionSet1D[] = []
        spriteAnimations: Animations[] = []

        //reference
        protected tilemapScaleSize = 1 << TileScale.Sixteen
        map: tiles.TileMapData
        bg: Image
        textures: Image[]
        sprSelf: Sprite
        sprites: Sprite[] = []
        protected oldRender: scene.Renderable
        protected myRender: scene.Renderable

        //render
        protected wallHeightInView: number
        protected wallWidthInView: number
        protected dist: number[] = []
        //for drawing sprites
        protected invDet: number //required for correct matrix multiplication

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

        get wallZScale():number{
            return this._wallZScale
        }
        set wallZScale(v:number){
            this._wallZScale=v
        }

        getOffsetZ(spr: Sprite) {
            return this.spriteMotionZ[spr.id].offset/fpx_scale || 0
        }

        setOffsetZ(spr: Sprite, offsetZ: number) {
            let motionZ = this.spriteMotionZ[spr.id]
            if (motionZ)
                motionZ.offset = tofpx(offsetZ)
            else{
                this.spriteMotionZ[spr.id] = new MotionSet1D(tofpx(offsetZ))
                motionZ = this.spriteMotionZ[spr.id]
            }

            if (motionZ.p != motionZ.offset){
                this.moveByDistAndDuration(spr, (motionZ.offset-motionZ.p)>>fpx, 1000)
            }
        }

        getMotionZPos(spr: Sprite) {
            return this.spriteMotionZ[spr.id].p / fpx_scale
        }

        move(spr: Sprite, v: number, a: number) {
            this.spriteMotionZ[spr.id].v = tofpx(v)
            this.spriteMotionZ[spr.id].a = tofpx(a)
        }

        moveByDistAndDuration(spr: Sprite, dist: number, duration: number) {
            // dist= -v*v/a/2
            // duration = -v/a*2 *1000
            const v = dist * 4000 / duration
            const a = -v * 2000 / duration
            this.move(spr, v, a)
        }

        jump(spr: Sprite, v: number, a: number) {
            if (this.spriteMotionZ[spr.id].p == this.spriteMotionZ[spr.id].offset)
                this.move(spr,v,a)
        }

        jumpWithHeightAndDuration(spr: Sprite, height: number, duration: number) {
            if (this.spriteMotionZ[spr.id].p == this.spriteMotionZ[spr.id].offset) 
                this.moveByDistAndDuration(spr, height, duration)
        }

        get viewMode(): ViewMode {
            return this._viewMode
        }

        set viewMode(v: ViewMode) {
            this._viewMode = v
            // const sc = game.currentScene()
            // if (v == ViewMode.tilemapView) {
                // game.currentScene().allSprites.removeElement(this.myRender)
                // sc.allSprites.push(this.oldRender)
                // this.bg = game.currentScene().background.image
                // scene.setBackgroundImage(img`15`) //todo, add bgTilemap property for tilemap mode
                // this.sprites.forEach(spr => {
                //     sc.allSprites.push(spr)
                // })
            // } else {
                // game.currentScene().allSprites.removeElement(this.oldRender)
                // game.currentScene().allSprites.push(this.myRender)
                // game.currentScene().background.image = this.bg
                // this.takeoverSceneSprites()
            // }

        }

        takeoverSceneSprites() {
            const sc = game.currentScene()
            sc.allSprites.forEach(spr => {
                if (spr instanceof Sprite) {
                    if (this.sprites.indexOf(spr) < 0){
                        this.sprites.push(spr as Sprite)
                        if(!this.spriteMotionZ[spr.id])
                            this.setOffsetZ(spr,0)
                        sc.allSprites.removeElement(spr)
                        spr.onDestroyed(() => { this.sprites.removeElement(spr) })
                    }
                }
            })
        }

        tilemapLoaded() {
            const sc = game.currentScene()
            this.map = sc.tileMap.data
            this.textures = sc.tileMap.data.getTileset()
            this.tilemapScaleSize = 1 << sc.tileMap.data.scale
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
                    this.sprites.forEach(spr=>{
                        if((spr.flags & sprites.Flag.RelativeToCamera))
                            spr.__draw(game.currentScene().camera)
                    })
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
            scene.cameraFollowSprite(this.sprSelf)
            this.setOffsetZ(this.sprSelf, this.tilemapScaleSize/2)
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

        //todo, pre-drawn dirctional image
        public updateSelfImage() {
            const img = this.sprSelf.image
            img.fill(6)
            const arrowLength = img.width / 2
            img.drawLine(arrowLength, arrowLength, arrowLength + this.dirX * arrowLength, arrowLength + this.dirY * arrowLength, 2)
            img.fillRect(arrowLength - 1, arrowLength - 1, 2, 2, 2)
        }

        updateControls() {
            if (this.velocityAngle!==0){
                const dx = controller.dx(this.velocityAngle)
                if (dx) {
                    this.viewAngle += dx
                }
            }
            if(this.velocity!==0){
                const dy = controller.dy(this.velocity)
                if (dy) {
                    const nx = this.xFpx - Math.round(this.dirXFpx * dy)
                    const ny = this.yFpx - Math.round(this.dirYFpx * dy)
                    this.sprSelf.setPosition((nx * this.tilemapScaleSize / fpx_scale), (ny * this.tilemapScaleSize / fpx_scale))
                }
            }

            const dt = game.eventContext().deltaTime
            for(const spr of this.sprites){
                const motionZ=this.spriteMotionZ[spr.id]
                if(!motionZ) continue

                if (motionZ.v != 0 || motionZ.p != motionZ.offset) {
                    motionZ.v += motionZ.a * dt, motionZ.p += motionZ.v * dt
                    //landing
                    if ((motionZ.a > 0 && motionZ.v > 0 && motionZ.p > motionZ.offset) ||
                        (motionZ.a < 0 && motionZ.v < 0 && motionZ.p < motionZ.offset))
                        { motionZ.p = motionZ.offset, motionZ.v = 0 }
                }
            }
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

                let lineHeight = Math.idiv(this.wallHeightInView, perpWallDist) 
                let drawStart = ((h) >> 1) + (lineHeight) * (this.spriteMotionZ[this.sprSelf.id].p/this.tilemapScaleSize -( this._wallZScale*fpx_scale)) / fpx_scale;
                let texX = (wallX * tex.width) >> fpx;
                // if ((!sideWallHit && rayDirX > 0) || (sideWallHit && rayDirY < 0))
                //     texX = tex.width - texX - 1;

                screen.blitRow(x, drawStart, tex, texX, (lineHeight * this._wallZScale) | 1)// textures look much better when lineHeight is odd

                this.dist[x] = perpWallDist
            }
            // screen.print(this.getMotionZPos(this.sprSelf).toString(), 0,0 )

            /////////////////// sprites ///////////////////
            this.sprites
                .filter((spr, i) => { // transformY>0
                    return (spr instanceof Sprite) && spr != this.sprSelf && !(spr.flags & sprites.Flag.RelativeToCamera) &&(-this.planeY * (this.sprXFx8(spr) - this.xFpx) + this.planeX * (this.sprYFx8(spr) - this.yFpx)) > 0
                }).sort((spr1, spr2) => {   // far to near
                    return ((this.sprXFx8(spr2) - this.xFpx) ** 2 + (this.sprYFx8(spr2) - this.yFpx) ** 2) - ((this.sprXFx8(spr1) - this.xFpx) ** 2 + (this.sprYFx8(spr1) - this.yFpx) ** 2)
                }).forEach((spr, index) => {
                    this.drawSprite(spr, index)
                })
        }

        registerOnSpriteDirectionUpdate(handler: (spr: Sprite, dir: number) => void) {
            this.onSpriteDirectionUpdateHandler = handler
        }
        drawSprite(spr: Sprite, index: number) {
            //debug
            // screen.print(this.spriteMotionZ[spr.id].p.toString(), 0, index*10+10)

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
            const lineHeight = Math.idiv(this.wallHeightInView, transformY)  | 1
            const drawStart = (screen.height >> 1) + (lineHeight * ((this.spriteMotionZ[this.sprSelf.id].p - this.spriteMotionZ[spr.id].p - (spr._height as any as number)) / this.tilemapScaleSize ) >> fpx)
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
                drawStart ,
                blitWidth,
                lineHeight  * spr.height / this.tilemapScaleSize,
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
