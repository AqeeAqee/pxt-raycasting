enum ViewMode {
    //% block="TileMap Mode"
    tilemapView,
    //% block="Raycasting Mode"
    raycastingView,
}

namespace Render {
    const SH = screen.height, SHHalf = SH / 2
    const SW = screen.width, SWHalf = SW / 2
    const fpx = 8
    const fpx_scale = 2 ** fpx
    function tofpx(n: number) { return (n * fpx_scale) | 0 }
    const one = 1 << fpx
    const one2 = 1 << (fpx + fpx)
    const FPX_MAX = (1 << fpx) - 1

    class MotionSet1D {
        p: number
        v: number = 0
        a: number = 0
        constructor(public offset: number) {
            this.p = offset
        }
    }

    export const defaultFov = SW / SH / 2  //Wall just fill screen height when standing 1 tile away

    export class RayCastingRender {
        velocityAngle: number = 2
        velocity: number = 3
        protected _viewMode=ViewMode.raycastingView
        protected dirXFpx: number
        protected dirYFpx: number
        protected planeX: number
        protected planeY: number
        protected _angle: number
        protected _fov: number
        protected _wallZScale: number = 1

        //sprites & accessories
        sprSelf: Sprite
        sprites: Sprite[] = []
        sprites2D: Sprite[] = []
        spriteLikes: SpriteLike[] = []
        spriteAnimations: Animations[] = []
        protected spriteMotionZ: MotionSet1D[] = []
        protected sayRederers: sprites.BaseSpriteSayRenderer[] = []
        protected sayEndTimes: number[] = []

        //reference
        protected tilemapScaleSize = 1 << TileScale.Sixteen
        map: tiles.TileMapData
        bg: Image
        textures: Image[]
        protected oldRender: scene.Renderable
        protected myRender: scene.Renderable

        //render
        protected wallHeightInView: number
        protected wallWidthInView: number
        protected dist: number[] = []
        //render perf const
        cameraRangeAngle:number
        ViewZPos:number
        selfXFpx:number
        selfYFpx:number

        //for drawing sprites
        protected invDet: number //required for correct matrix multiplication
        camera: scene.Camera
        tempScreen: Image = image.create(SW, SH)
        tempSprite: Sprite = sprites.create(img`0`)
        protected transformX: number[] = []
        protected transformY: number[] = []
        protected angleSelfToSpr: number[] = []

        onSpriteDirectionUpdateHandler: (spr: Sprite, dir: number) => void

        get xFpx(): number {
            return Fx.add(this.sprSelf._x, Fx.div(this.sprSelf._width, Fx.twoFx8)) as any as number / this.tilemapScaleSize
        }

        // set xFpx(v: number) {
        //     this.sprSelf._x = v * this.tilemapScaleSize as any as Fx8
        // }

        get yFpx(): number {
            return Fx.add(this.sprSelf._y, Fx.div(this.sprSelf._height, Fx.twoFx8)) as any as number / this.tilemapScaleSize
        }

        // set yFpx(v: number) {
        //     this.sprSelf._y = v * this.tilemapScaleSize as any as Fx8
        // }

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
            this.wallHeightInView = (SW << (fpx - 1)) / this._fov
            this.wallWidthInView = this.wallHeightInView >> fpx // not fpx  // wallSize / this.fov * 4 / 3 * 2
            this.cameraRangeAngle = Math.atan(this.fov) + .1 //tolerance for spr center just out of camera

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

        get wallZScale(): number {
            return this._wallZScale
        }
        set wallZScale(v: number) {
            this._wallZScale = v
        }

        getMotionZ(spr: Sprite, offsetZ: number = 0) {
            let motionZ = this.spriteMotionZ[spr.id]
            if (!motionZ) {
                motionZ = new MotionSet1D(tofpx(offsetZ))
                this.spriteMotionZ[spr.id] = motionZ
            }
            return motionZ
        }

        getZOffset(spr: Sprite) {
            return this.getMotionZ(spr).offset / fpx_scale
        }

        setZOffset(spr: Sprite, offsetZ: number, duration: number = 500) {
            const motionZ = this.getMotionZ(spr, offsetZ)

            motionZ.offset = tofpx(offsetZ)
            if (motionZ.p != motionZ.offset) {
                if (duration === 0)
                    motionZ.p = motionZ.offset
                else if(motionZ.v==0)
                    this.move(spr, (motionZ.offset - motionZ.p) / fpx_scale * 1000 / duration, 0)
            }
        }

        getMotionZPosition(spr: Sprite) {
            return this.getMotionZ(spr).p / fpx_scale
        }

        //todo, use ZHeight(set from sprite.Height when takeover, then sprite.Height will be replace with width)
        isOverlapZ(sprite1: Sprite, sprite2: Sprite): boolean {
            const p1 = this.getMotionZPosition(sprite1)
            const p2 = this.getMotionZPosition(sprite2)
            if (p1 < p2) {
                if (p1 + sprite1.height > p2) return true
            } else {
                if (p2 + sprite2.height > p1) return true
            }
            return false
        }

        move(spr: Sprite, v: number, a: number) {
            const motionZ = this.getMotionZ(spr)

            motionZ.v = tofpx(v)
            motionZ.a = tofpx(a)
        }

        jump(spr: Sprite, v: number, a: number) {
            const motionZ = this.getMotionZ(spr)
            if (motionZ.p != motionZ.offset)
                return

            motionZ.v = tofpx(v)
            motionZ.a = tofpx(a)
        }

        jumpWithHeightAndDuration(spr: Sprite, height: number, duration: number) {
            const motionZ = this.getMotionZ(spr)
            if (motionZ.p != motionZ.offset)
                return

            // height= -v*v/a/2
            // duration = -v/a*2 *1000
            const v = height * 4000 / duration
            const a = -v * 2000 / duration
            motionZ.v = tofpx(v)
            motionZ.a = tofpx(a)
        }

        get viewMode(): ViewMode {
            return this._viewMode
        }

        set viewMode(v: ViewMode) {
            this._viewMode = v
        }

        updateViewZPos() {
            this.ViewZPos = this.spriteMotionZ[this.sprSelf.id].p + (this.sprSelf._height as any as number) - (2 << fpx)
        }

        takeoverSceneSprites() {
            const sc_allSprites = game.currentScene().allSprites
            for (let i=0;i<sc_allSprites.length;) {
                const spr=sc_allSprites[i]
                if (spr instanceof Sprite) {
                    const sprList = (spr.flags & sprites.Flag.RelativeToCamera) ? this.sprites2D:this.sprites
                    if (sprList.indexOf(spr) < 0) {
                        sprList.push(spr as Sprite)
                        this.getMotionZ(spr, 0)
                        spr.onDestroyed(() => {
                            this.sprites.removeElement(spr as Sprite)   //can be in one of 2 lists
                            this.sprites2D.removeElement(spr as Sprite) //can be in one of 2 lists
                            const sayRenderer = this.sayRederers[spr.id]
                            if (sayRenderer) {
                                this.sayRederers.removeElement(sayRenderer)
                                sayRenderer.destroy()
                            }
                        })
                    }
                } else {
                    if (this.spriteLikes.indexOf(spr) < 0)
                        this.spriteLikes.push(spr)
                }
                sc_allSprites.removeElement(spr)
            }
            this.sprites.forEach((spr) => {
                if (spr)
                    this.takeoverSayRenderOfSprite(spr)
            })
        }
        takeoverSayRenderOfSprite(sprite: Sprite) {
            const sprite_as_any = (sprite as any)
            if (sprite_as_any.sayRenderer) {
                this.sayRederers[sprite.id] = sprite_as_any.sayRenderer
                this.sayEndTimes[sprite.id] = sprite_as_any.sayEndTime;
                sprite_as_any.sayRenderer = undefined
                sprite_as_any.sayEndTime = undefined
            }
        }

        tilemapLoaded() {
            const sc = game.currentScene()
            this.map = sc.tileMap.data
            this.textures = sc.tileMap.data.getTileset()
            this.tilemapScaleSize = 1 << sc.tileMap.data.scale
            this.oldRender = sc.tileMap.renderable
            this.spriteLikes.removeElement(this.oldRender)
            sc.allSprites.removeElement(this.oldRender)

            let frameCallback_update = sc.eventContext.registerFrameHandler(scene.PRE_RENDER_UPDATE_PRIORITY + 1, () => {
                const dt = sc.eventContext.deltaTime;
                // sc.camera.update();  // already did in scene
                for (const s of this.sprites)
                    s.__update(sc.camera, dt);
                this.sprSelf.__update(sc.camera, dt)
            })

            let frameCallback_draw = sc.eventContext.registerFrameHandler(scene.RENDER_SPRITES_PRIORITY + 1, () => {
                screen.drawImage(sc.background.image, 0, 0)
                if (this._viewMode == ViewMode.tilemapView) {
                    this.oldRender.__drawCore(sc.camera)
                    this.sprites.forEach(spr => spr.__draw(sc.camera))
                    this.sprSelf.__draw(sc.camera)
                } else {
                    //debug
                    // const ms=control.micros()
                    this.render()
                    this.drawSprites()

                    // info.setScore(control.micros()-ms)
                }
                this.sprites2D.forEach(spr => {
                    spr.__draw(sc.camera)
                    })
                this.spriteLikes.forEach(spr => spr.__draw(sc.camera))
            })

            sc.tileMap.addEventListener(tiles.TileMapEvent.Unloaded, data => {
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
            this.camera = new scene.Camera()

            const sc = game.currentScene()
            if (!sc.tileMap) {
                sc.tileMap = new tiles.TileMap();
            } else {
                this.tilemapLoaded()
            }
            game.currentScene().tileMap.addEventListener(tiles.TileMapEvent.Loaded, data => this.tilemapLoaded())

            //self sprite
            this.sprSelf = sprites.create(image.create(this.tilemapScaleSize >> 1, this.tilemapScaleSize >> 1), SpriteKind.Player)
            this.takeoverSceneSprites()
            this.sprites.removeElement(this.sprSelf)
            this.updateViewZPos()
            scene.cameraFollowSprite(this.sprSelf)
            this.updateSelfImage()

            game.onUpdate(function () {
                this.updateControls()
            })

            game.onUpdateInterval(400, ()=>{
                for (let i = 0; i < this.sprites.length;) {
                    const spr = this.sprites[i]
                    if (spr.flags & sprites.Flag.RelativeToCamera) {
                        this.sprites.removeElement(spr)
                        this.sprites2D.push(spr)
                    } else {i++}
                }
                for (let i = 0; i < this.sprites2D.length;) {
                    const spr = this.sprites2D[i]
                    if (!(spr.flags & sprites.Flag.RelativeToCamera)) {
                        this.sprites2D.removeElement(spr)
                        this.sprites.push(spr)
                    } else {i++}
                }
                this.takeoverSceneSprites() // in case some one new
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
            if (this.velocityAngle !== 0) {
                const dx = controller.dx(this.velocityAngle)
                if (dx) {
                    this.viewAngle += dx
                }
            }
            if (this.velocity !== 0) {
                const dy = controller.dy(this.velocity)
                if (dy) {
                    const nx = this.xFpx - Math.round(this.dirXFpx * dy)
                    const ny = this.yFpx - Math.round(this.dirYFpx * dy)
                    this.sprSelf.setPosition((nx * this.tilemapScaleSize / fpx_scale), (ny * this.tilemapScaleSize / fpx_scale))
                }
            }

            for (const spr of this.sprites) {
                this.updateMotionZ(spr)
            }
            this.updateMotionZ(this.sprSelf)
        }

        updateMotionZ(spr:Sprite){
            const dt = game.eventContext().deltaTime
            const motionZ = this.spriteMotionZ[spr.id]
            //if (!motionZ) continue

            if (motionZ.v != 0 || motionZ.p != motionZ.offset) {
                motionZ.v += motionZ.a * dt, motionZ.p += motionZ.v * dt
                //landing
                if ((motionZ.a >= 0 && motionZ.v > 0 && motionZ.p > motionZ.offset) ||
                    (motionZ.a <= 0 && motionZ.v < 0 && motionZ.p < motionZ.offset)) { motionZ.p = motionZ.offset, motionZ.v = 0 }
                if(spr===this.sprSelf)
                    this.updateViewZPos()
            }

        }

        r1:Result
        newAlgorithm=true
        wallXs:number[]=[]
        render() {
            // based on https://lodev.org/cgtutor/raycasting.html

            this.selfXFpx = this.xFpx
            this.selfYFpx = this.yFpx

            let drawStart = 0
            let drawHeight = 0
            let lastDist = -1, lastTexX = -1
            let lastMapXY = -1

        //debug 
        // const ms=control.millis()
        if (this.newAlgorithm){
            this.r1=this.raycast(0)
            this.bisearch(this.r1, this.raycast(SW-1))
            
            let curResult = this.r1
            let startResult = this.r1
            // info.setLife(control.millis() - ms + 1)
            // const ms2 = control.millis()
            // console.log("----------")
            while (curResult) {
                if (!curResult.next || startResult.mapXY!=curResult.next.mapXY){
                    const tex = this.textures[startResult.color]
                    if (!tex) break

                    let texX = (startResult.wallX * tex.width); // /fpx_scale
                    
                    let perpWallDist = startResult.perpWallDist
                    // const lineHeight = Math.idiv(this.wallHeightInView , perpWallDist)
                    // const drawEnd = lineHeight * this.ViewZPos / this.tilemapScaleSize / fpx_scale;
                    drawHeight = Math.idiv(tofpx(this.wallHeightInView * this._wallZScale), perpWallDist) // (Math.ceil(drawEnd) - Math.ceil(drawStart) + 1)
                    let drawStart = tofpx(SHHalf + Math.idiv(this.wallHeightInView * this.ViewZPos / this.tilemapScaleSize / fpx_scale, perpWallDist) + 1) - drawHeight;

                    const deltaX = (curResult.x - startResult.x + 1)
                    const texXDelta = ((curResult.wallX - startResult.wallX) / deltaX * tex.width)|0 // /fpx_scale
                    const wallDistDelta = (curResult.perpWallDist - startResult.perpWallDist) / deltaX |0
                    const oneDivWallDistDelta = (one/curResult.perpWallDist-one/startResult.perpWallDist)/deltaX 
                    const drawHeightDelta = this.wallHeightInView * this._wallZScale* oneDivWallDistDelta |0
                    const drawStartDelta = this.wallHeightInView * (this.ViewZPos / this.tilemapScaleSize / fpx_scale) * oneDivWallDistDelta - drawHeightDelta |0
                    // console.log([texXDelta,wallDistDelta,drawHeightDelta, drawStartDelta, oneDivWallDistDelta])
                    for (let x = startResult.x; x <= curResult.x
                        ; x++,
                        texX += texXDelta,
                        drawStart += drawStartDelta ,
                        drawHeight += drawHeightDelta ,
                        perpWallDist += wallDistDelta
                        ) {
                        screen.blitRow(x, drawStart >> fpx, tex, texX>>fpx, drawHeight>>fpx)
                        this.dist[x] = perpWallDist
                        //debug
                        // screen.drawLine(x,SHHalf,x,SHHalf+(texX>>fpx),15)
                    }
                    if (curResult.next)
                        startResult = curResult.next
                    else
                        break
                } 
                curResult=curResult.next
            }
            // console.log("===========")
        }
        else
        {
            for (let x = 0; x < SW; x++) {
                const result =this.raycast(x)
                //[mapXY, perpWallDist, wallX, color]
                // const mapXY = result[0],  perpWallDist = result[1], wallX = result[2], color = result[3]

                const tex = this.textures[result.color]
                if (!tex)
                    continue

                let texX = (result.wallX * tex.width) >> fpx;
                // if ((!sideWallHit && rayDirX > 0) || (sideWallHit && rayDirY < 0))
                //     texX = tex.width - texX - 1;

                if (result.perpWallDist !== lastDist && (texX !== lastTexX || result.mapXY !== lastMapXY)) {//neighbor line of tex share same parameters
                    const lineHeight = (this.wallHeightInView / result.perpWallDist)
                    const drawEnd = lineHeight * this.ViewZPos / this.tilemapScaleSize / fpx_scale;
                    drawStart = drawEnd - lineHeight * (this._wallZScale) + 1;
                    drawHeight = (Math.ceil(drawEnd) - Math.ceil(drawStart) + 1)
                    drawStart += SHHalf

                    lastDist = result.perpWallDist
                    lastTexX = texX
                    lastMapXY = result.mapXY
                }
                //fix start&end points to avoid regmatic between lines
                screen.blitRow(x, drawStart, tex, texX, drawHeight)

                this.dist[x] = result.perpWallDist
                this.wallXs[x] = result.wallX
                //debug
                screen.drawLine(x, SHHalf, x, SHHalf + texX, result.mapXY > 10000 ? 3:15)
            }

            // screen.print(lastPerpWallDist.toString(), 0,0,7 )

        }
        //debug
        // info.setScore(control.millis() - ms + 1)

        }

        bisearch(r1:Result, r2:Result){
            // console.log("bisearch: " + r1.x+"("+r1.mapXY+") " + "," + r2.x+"("+r2.mapXY+") ")
            if (r2.x - r1.x > 1) {
                const x3=(r2.x+r1.x)>>1
                const r3=this.raycast(x3)
                // console.log("bisearch r3: " + r3.x+"("+r3.mapXY+") ")
                if (r3.mapXY != r1.mapXY)
                    this.bisearch(r1, r3)
                else{
                    // console.log("bisearch r1->r3:" + r1.x+"("+r1.mapXY+") " + "," + r3.x+"("+r3.mapXY+") ")
                    r1.next=r3
                }
                if (r3.mapXY != r2.mapXY)
                    this.bisearch(r3, r2)
                else{
                    // console.log("bisearch r3->r2:" + r3.x+"("+r3.mapXY+") " + "," + r2.x+"("+r2.mapXY+") ")
                    r3.next=r2
                }

            } else if (r2.x - r1.x==1){
                r1.next=r2
                // console.log("bisearch r1->r2:" + r1.x+"("+r1.mapXY+") " + "," + r2.x+"("+r2.mapXY+") ")
            }
        }
        
        raycast(x:number){
                const cameraX: number = one - Math.idiv((x << fpx) << 1, SW)
                let rayDirX = this.dirXFpx + (this.planeX * cameraX >> fpx)
                let rayDirY = this.dirYFpx + (this.planeY * cameraX >> fpx)

                // avoid division by zero
                if (rayDirX == 0) rayDirX = 1
                if (rayDirY == 0) rayDirY = 1

                let mapX = this.selfXFpx >> fpx
                let mapY = this.selfYFpx >> fpx

                // length of ray from current position to next x or y-side
                let sideDistX = 0, sideDistY = 0

                // length of ray from one x or y-side to next x or y-side
                const deltaDistX = Math.abs(Math.idiv(one2, rayDirX));
                const deltaDistY = Math.abs(Math.idiv(one2, rayDirY));

                let mapStepX = 0, mapStepY = 0

                let sideWallHit = false;

                //calculate step and initial sideDist
                if (rayDirX < 0) {
                    mapStepX = -1;
                    sideDistX = ((this.selfXFpx - (mapX << fpx)) * deltaDistX) >> fpx;
                } else {
                    mapStepX = 1;
                    sideDistX = (((mapX << fpx) + one - this.selfXFpx) * deltaDistX) >> fpx;
                }
                if (rayDirY < 0) {
                    mapStepY = -1;
                    sideDistY = ((this.selfYFpx - (mapY << fpx)) * deltaDistY) >> fpx;
                } else {
                    mapStepY = 1;
                    sideDistY = (((mapY << fpx) + one - this.selfYFpx) * deltaDistY) >> fpx;
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
                        return null
                    color = this.map.getTile(mapX, mapY)
                    if (color)
                        break; // hit!
                }

                // if (this.map.isOutsideMap(mapX, mapY))
                //     return null

                let perpWallDist = 0
                let wallX = 0
                if (!sideWallHit) {
                    // perpWallDist = Math.idiv(((mapX << fpx) - this.selfXFpx + (1 - mapStepX << fpx - 1)) << fpx, rayDirX)
                    perpWallDist = (sideDistX - deltaDistX);
                    wallX = this.selfYFpx + (perpWallDist * rayDirY >> fpx);
                    mapY = wallX>>fpx
                } else {
                    // perpWallDist = Math.idiv(((mapY << fpx) - this.selfYFpx + (1 - mapStepY << fpx - 1)) << fpx, rayDirY)
                    perpWallDist = (sideDistY - deltaDistY)
                    wallX = this.selfXFpx + (perpWallDist * rayDirX >> fpx);
                    mapX = wallX >> fpx
                }
                // wallX-=1
                wallX &= FPX_MAX

                // color = (color - 1) * 2
                // if (sideWallHit) color++

                // return [mapX+mapY*this.map.width, perpWallDist, wallX, color]
            return new Result(x, mapX + mapY * this.map.width +( sideWallHit?100000:0), perpWallDist, wallX, color)
        }


        drawSprites(){
            //debug
            // let msSprs=control.millis()
            /////////////////// sprites ///////////////////

            //for sprite
            const invDet = one2 / (this.planeX * this.dirYFpx - this.dirXFpx * this.planeY); //required for correct matrix multiplication

            this.sprites
                .filter((spr, i) => {
                    const spriteX = this.sprXFx8(spr) - this.xFpx // this.selfXFpx
                    const spriteY = this.sprYFx8(spr) - this.yFpx // this.selfYFpx
                    this.angleSelfToSpr[spr.id] = Math.atan2(spriteX, spriteY)
                    this.transformX[spr.id] = invDet * (this.dirYFpx * spriteX - this.dirXFpx * spriteY) >> fpx;
                    this.transformY[spr.id] = invDet * (-this.planeY * spriteX + this.planeX * spriteY) >> fpx; //this is actually the depth inside the screen, that what Z is in 3D
                    const angleInCamera= Math.atan2(this.transformX[spr.id]*this.fov, this.transformY[spr.id])
                    return angleInCamera > -this.cameraRangeAngle && angleInCamera < this.cameraRangeAngle //(this.transformY[spr.id] > 0
                }).sort((spr1, spr2) => {   // far to near
                    return (this.transformY[spr2.id] - this.transformY[spr1.id])
                }).forEach((spr, index) => {
                    //debug
                    // screen.print([spr.id,Math.roundWithPrecision(angle[spr.id],3)].join(), 0, index * 10 + 10,9)
                    this.drawSprite(spr, index, this.transformX[spr.id], this.transformY[spr.id], this.angleSelfToSpr[spr.id])
                })

            //debug
            // info.setLife(control.millis() - msSprs+1)
            // screen.print([Math.roundWithPrecision(angle0,3)].join(), 20,  0)

        }

        registerOnSpriteDirectionUpdate(handler: (spr: Sprite, dir: number) => void) {
            this.onSpriteDirectionUpdateHandler = handler
        }
        drawSprite(spr: Sprite, index: number, transformX: number, transformY: number, myAngle:number) {
            const spriteScreenX = Math.ceil((SWHalf) * (1 - transformX / transformY));
            const spriteScreenHalfWidth = Math.idiv((spr._width as any as number) / this.tilemapScaleSize / 2 * this.wallWidthInView, transformY)  //origin: (texSpr.width / 2 << fpx) / transformY / this.fov / 3 * 2 * 4
            const spriteScreenLeft = spriteScreenX - spriteScreenHalfWidth
            const spriteScreenRight = spriteScreenX + spriteScreenHalfWidth

            //calculate drawing range in X direction
            //assume there is one range only
            let blitX = 0, blitWidth = 0
            for (let sprX = 0; sprX < SW; sprX++) {
                if (this.dist[sprX] > transformY) {
                    if (blitWidth == 0)
                        blitX = sprX
                    blitWidth++
                } else if (blitWidth > 0) {
                    if (blitX <= spriteScreenRight && blitX + blitWidth >= spriteScreenLeft)
                        break
                    else
                        blitX = 0, blitWidth = 0;
                }
            }
            // screen.print([this.getxFx8(spr), this.getyFx8(spr)].join(), 0,index*10+10)
            const blitXSpr = Math.max(blitX, spriteScreenLeft)
            const blitWidthSpr = Math.min(blitX + blitWidth, spriteScreenRight) - blitXSpr
            if (blitWidthSpr <= 0)
                return

            const lineHeight = Math.idiv(this.wallHeightInView, transformY)
            const drawStart = SHHalf + (lineHeight * ((this.ViewZPos - this.spriteMotionZ[spr.id].p - (spr._height as any as number)) / this.tilemapScaleSize) >> fpx)

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
            const sprTexRatio = texSpr.width / spriteScreenHalfWidth / 2
            helpers.imageBlit(
                screen,
                blitXSpr,
                drawStart,
                blitWidthSpr,
                lineHeight * spr.height / this.tilemapScaleSize,
                texSpr,
                (blitXSpr - (spriteScreenX - spriteScreenHalfWidth)) * sprTexRatio
                ,
                0,
                blitWidthSpr * sprTexRatio, texSpr.height, true, false)

            //sayText
            const anchor = this.sayRederers[spr.id]
            if (anchor) {
                if (this.sayEndTimes[spr.id] && control.millis() > this.sayEndTimes[spr.id]) {
                    this.sayRederers[spr.id] = undefined
                } else {
                    this.tempSprite.x = SWHalf
                    this.tempSprite.y = SH+2
                    this.camera.drawOffsetX = 0
                    this.camera.drawOffsetY = 0
                    this.tempScreen.fill(0)
                    anchor.draw(this.tempScreen, this.camera, this.tempSprite)
                    const sayTransformY = transformY/2
                    const height = SH * fpx_scale / sayTransformY
                    const blitXSaySrc = (blitX - spriteScreenX) * sayTransformY / fpx_scale + SWHalf
                    const blitWidthSaySrc = blitWidth * sayTransformY / fpx_scale
                    if (blitXSaySrc < 0) { //imageBlit considers negative value as 0
                        helpers.imageBlit(
                            screen,
                            spriteScreenX - SWHalf * fpx_scale / sayTransformY, drawStart - height, (blitWidthSaySrc + blitXSaySrc) * fpx_scale / sayTransformY, height,
                            this.tempScreen,
                            0, 0, blitWidthSaySrc + blitXSaySrc, SH, true, false)
                    } else
                        helpers.imageBlit(
                            screen,
                            blitX, drawStart - height, blitWidth, height,
                            this.tempScreen,
                            blitXSaySrc, 0, blitWidthSaySrc, SH, true, false)
                }
            }
        }
    }

    class Result {
        public next: Result
        constructor(
            public x:number,
            public mapXY: number,
            public perpWallDist: number,
            public wallX: number,
            public color: number,
            ){}
    }

    //%fixedinstance
    export const raycastingRender = new Render.RayCastingRender()
}
