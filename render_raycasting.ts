//% shim=pxt::updateScreen
function updateScreen(img: Image) { }

enum ViewMode {
    //% block="TileMap Mode"
    tilemapView,
    //% block="Isometric Mode"
    isometricView,
}

namespace Render {
    const SH = screen.height, SHHalf = SH / 2
    const SW = screen.width, SWHalf = SW / 2
    export const fpx = 8
    const fpx2=fpx*2
    const fpx2_4 = fpx2 - 4
    const fpx_scale = 2 ** fpx
    export function tofpx(n: number) { return (n * fpx_scale) | 0 }
    const one = 1 << fpx
    const one2 = 1 << (fpx + fpx)
    const FPX_MAX = (1 << fpx) - 1

    //for Isometric
    const TileSize = 16 // Math.max(inImgs[0].width, inImgs[0].height)
    const Scale = 2, ScaleX = 2, ScaleY = 1 //16x16 Rotate&Scale to 32x32, then stretch to 64x32
    const X0 = TileSize >> 1, Y0 = TileSize >> 1
    // const X0 = TileSize/2+1/Scale/ScaleX, Y0 = X0
    const H = X0 - TileSize, V = Y0-TileSize
    let A_Fpx = 0
    let B_Fpx = 0
    const AD_BC_Fpx2 = (1/2) *fpx_scale <<fpx //= Math.SQRT1_2**2 == (A * D - B * C)   
    const WallHeight = TileSize * 2
    function rotatePoint(xIn: number, yIn: number, A_Fpx:number, B_Fpx:number) {
        const D_Fpx = A_Fpx, C_Fpx = -B_Fpx
        let xOut = ((D_Fpx * (xIn - X0) - B_Fpx * (yIn - Y0)) << fpx) / AD_BC_Fpx2 - (H - X0)
        let yOut = -((C_Fpx * (xIn - X0) - A_Fpx * (yIn - Y0)) << fpx) / AD_BC_Fpx2 - (V - Y0)
        return { x: xOut * Scale, y: yOut }
    }

    class MotionSet1D {
        p: number
        v: number = 0
        a: number = 0
        constructor(public offset: number) {
            this.p = offset
        }
    }

    export const defaultFov = SW / SH / 2  //Wall just fill screen height when standing 1 tile away

    export class RayCastingRender{

        private tempScreen: Image = image.create(SW, SH)
        private tempBackground: scene.BackgroundLayer //for "see through" when scene popped out

        velocityAngle: number = 2
        velocity: number = 3
        protected _viewMode=ViewMode.isometricView
        protected dirXFpx: number
        protected dirYFpx: number
        protected planeX: number
        protected planeY: number
        protected _angle: number
        protected _fov: number
        protected _wallZScale: number = 1
        cameraSway = 0
        protected isWalking=false
        protected cameraOffsetX = 0
        protected cameraOffsetZ_fpx = 0

        //sprites & accessories
        sprSelf: Sprite
        sprites: Sprite[] = []
        sprites2D: Sprite[] = []
        spriteParticles: particles.ParticleSource[] = []
        spriteLikes: SpriteLike[] = []
        spriteAnimations: Animations[] = []
        protected spriteMotionZ: MotionSet1D[] = []
        protected sayRederers: sprites.BaseSpriteSayRenderer[] = []
        protected sayEndTimes: number[] = []

        //reference
        protected tilemapScaleSize = 1 << TileScale.Sixteen
        map: tiles.TileMapData
        mapData:Array<number>
        bg: Image
        textures: Image[]
        protected oldRender: scene.Renderable
        protected myRender: scene.Renderable

        //render

        //render perf const
        viewZPos:number
        viewXFpx:number
        viewYFpx:number

        //for drawing sprites
        protected invDet: number //required for correct matrix multiplication
        camera: scene.Camera
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
            this.viewZPos = this.spriteMotionZ[this.sprSelf.id].p + (this.sprSelf._height as any as number) - (2 << fpx)
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
                } else if(spr instanceof particles.ParticleSource){
                    const particle = (spr as particles.ParticleSource)
                    if (this.spriteParticles.indexOf(particle) < 0 && particle.anchor instanceof Sprite) {
                        const spr = (particle.anchor as Sprite)
                        if(this.sprites.indexOf(spr)>=0){
                            this.spriteParticles[spr.id]=particle
                            particle.anchor=this.tempSprite
                        }
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
            this.mapData = ((this.map as any).data as Buffer).toArray(NumberFormat.Int8LE)
            this.tilemapScaleSize = 1 << sc.tileMap.data.scale
            this.textures = sc.tileMap.data.getTileset()
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
                if (this._viewMode == ViewMode.isometricView) {
                    if (!this.tempBackground) {
                        this.tempScreen.drawImage(game.currentScene().background.image, 0, 0)
                        this.render()
                        screen.fill(0)
                        this.sprites2D.forEach(spr => spr.__draw(sc.camera))
                        this.spriteLikes.forEach(spr => spr.__draw(sc.camera))
                        this.tempScreen.drawTransparentImage(screen, 0, 0)
                    }
                } else {
                    screen.drawImage(game.currentScene().background.image, 0, 0)
                    this.oldRender.__drawCore(sc.camera)
                    this.sprites.forEach(spr => spr.__draw(sc.camera))
                    this.sprSelf.__draw(sc.camera)
                    this.sprites2D.forEach(spr => spr.__draw(sc.camera))
                    this.spriteLikes.forEach(spr => spr.__draw(sc.camera))
                }
            })

            sc.tileMap.addEventListener(tiles.TileMapEvent.Unloaded, data => {
                sc.eventContext.unregisterFrameHandler(frameCallback_update)
                sc.eventContext.unregisterFrameHandler(frameCallback_draw)
            })
        }

        constructor() {
            this._angle = Math.PI/4
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


            game.onUpdateInterval(25, () => {
                if(this.cameraSway&&this.isWalking){
                    this.cameraOffsetX = (Math.sin(control.millis() / 150) * this.cameraSway * 3)|0
                    this.cameraOffsetZ_fpx = tofpx(Math.cos(control.millis() / 75) * this.cameraSway)|0
                }
            });
            control.__screen.setupUpdate(() => {
                if(this.viewMode==ViewMode.isometricView)
                    updateScreen(this.tempScreen)
                else
                    updateScreen(screen)
            })

            game.addScenePushHandler((oldScene) => {
                this.tempBackground = oldScene.background.addLayer(this.tempScreen, 0, BackgroundAlignment.Center)
                control.__screen.setupUpdate(() => { updateScreen(screen) })
            })
            game.addScenePopHandler((oldScene) => {
                ((oldScene.background as any)._layers as scene.BackgroundLayer[]).removeElement(this.tempBackground)
                this.tempBackground=undefined
                control.__screen.setupUpdate(() => {
                    if (this.viewMode == ViewMode.isometricView)
                        updateScreen(this.tempScreen)
                    else
                        updateScreen(screen)
                })
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
                this.isWalking=true
                const dy = controller.dy(this.velocity)
                if (dy) {
                    const nx = this.xFpx - Math.round(this.dirXFpx * dy)
                    const ny = this.yFpx - Math.round(this.dirYFpx * dy)
                    this.sprSelf.setPosition((nx * this.tilemapScaleSize / fpx_scale), (ny * this.tilemapScaleSize / fpx_scale))
                }else{
                    this.isWalking =false
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

        rotateAll(inImgs: Image[], A_Fpx: number, B_Fpx: number, AD_BC_Fpx2: number) {
            // let ms=0

            // this.corners[0].x = 999
            // this.corners[2].x = -999
            // this.corners[1].y = -999

            const D_Fpx = A_Fpx
            const C_Fpx = -B_Fpx
            const TileSize_Fpx = TileSize << fpx
            let xIn0_FX = (A_Fpx * (H - X0)) + (B_Fpx * (V - Y0)) + (X0 << fpx)
            let yIn0_FX = (C_Fpx * (H - X0)) + (D_Fpx * (V - Y0)) + (Y0 << fpx)
            for (let xOut = 0; xOut < 32 * Scale; xOut+=Scale) {
                let xIn_FX = xIn0_FX
                let yIn_FX = yIn0_FX
                for (let yOut = 0; yOut < 32; yOut++) {
                    if (0 <= xIn_FX && xIn_FX < TileSize_Fpx && 0 <= yIn_FX && yIn_FX < TileSize_Fpx) {
                        const xIn = xIn_FX >> fpx
                        const yIn = yIn_FX >> fpx
                        for (let i = 1; i < inImgs.length; i++) {
                            const c = inImgs[i].getPixel(xIn, yIn)
                            //stretch to 64x32
                            this.rotatedTiles[i].setPixel(xOut, yOut, c)
                            this.rotatedTiles[i].setPixel(xOut + 1, yOut, c)
                            // this.rotatedTiles[i].drawLine(xOut, yOut, xOut + 1, yOut , c)
                        }

                        // ms+=control.benchmark(()=>{ //<3ms totally on Meowbit
                        if (false && (0 === xIn || xIn === TileSize - 1) && (0 === yIn || yIn === TileSize - 1)){
                            // console.log([xIn, yIn, xOut, yOut].join())
                            if (xOut < this.corners[0].x) { this.corners[0].x = xOut; this.corners[0].y = yOut; }
                            else if (xOut === this.corners[0].x && yOut > this.corners[0].y) { this.corners[0].y = yOut; }
                            else if (xOut+1 > this.corners[2].x) {this.corners[2].x = xOut +1; this.corners[2].y = yOut; }
                            else if (xOut+1 === this.corners[2].x && yOut > this.corners[2].y) { this.corners[2].y = yOut; }
                            if (yOut > this.corners[1].y) { this.corners[1].x = xOut; this.corners[1].y = yOut; }
                        }
                        // }); 
                    }
                    xIn_FX += B_Fpx
                    yIn_FX += D_Fpx
                }
                xIn0_FX += A_Fpx
                yIn0_FX += C_Fpx
            }
            // info.player2.setScore(ms)
        }

        shearDoubleX(inImg: Image, degree: number, i = 0){
            //fix 45°
            const size = Math.max(inImg.width, inImg.height)
            const outImg = image.create(size << 2, size << 1)
            
            // outImg.fill(i+1)
            for (let x = 0; x < inImg.width; x++) {
                for (let y = 0; y < inImg.height; y++) {
                    const xo =  (x+y)*2, yo=15 - x + y
                    outImg.drawLine(xo,yo, xo+3,yo, inImg.getPixel(x,y))
                }
            }
            return outImg
        }

        drawWall(offsetX: number, offsetY:number){
                    const p0x = offsetX + this.corners[0].x, p0y = offsetY + this.corners[0].y
                    const p1x = offsetX + this.corners[1].x, p1y = offsetY + this.corners[1].y
                    const p3x = offsetX + this.corners[2].x, p3y = offsetY + this.corners[2].y

                    this.tempScreen.fillPolygon4(
                        p0x, p0y,
                        p0x, p0y - WallHeight,
                        p1x, p1y - WallHeight,
                        p1x, p1y,
                        12)

                    this.tempScreen.fillPolygon4(
                        p3x, p3y,
                        p3x, p3y - WallHeight,
                        p1x, p1y - WallHeight,
                        p1x, p1y,
                        12)
        }

        rotatedTiles:Image[]
        lastRenderAngle=-1
        selfSprAniId=0
        corners: { x: number, y: number }[] = [] //[{ x: 0, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 0 }]
        render() {
            // isometricView, ref: https://forum.makecode.com/t/snes-mode-7-transformations/8530

            this.viewXFpx = this.xFpx
            this.viewYFpx = this.yFpx
            this.viewZPos = this.spriteMotionZ[this.sprSelf.id].p + (this.sprSelf._height as any as number) - (2<<fpx) + this.cameraOffsetZ_fpx

            const angle = -this._angle - Math.PI / 2
            // info.setScore(this._angle*180/Math.PI)

            //update tiles and parameters
            if(this.lastRenderAngle!=this._angle || !this.rotatedTiles)
            {

                A_Fpx = (Math.SQRT1_2 * Math.cos(angle) * fpx_scale) | 0
                B_Fpx = (Math.SQRT1_2 * Math.sin(angle) * fpx_scale) | 0
                // A_Fpx = Math.sqrt(AD_BC_Fpx2 - B_Fpx * B_Fpx)
                // B_Fpx = Math.sqrt(AD_BC_Fpx2 - A_Fpx * A_Fpx)

                if(this.rotatedTiles){
                    for (let i = 0; i < this.rotatedTiles.length; i++)
                        this.rotatedTiles[i].fill(0)
                }else{
                    this.rotatedTiles = []
                    for (let i = 0; i < this.map.getTileset().length; i++)
                        this.rotatedTiles.push(image.create(TileSize * 2 * Scale, TileSize * 2 * ScaleY))
                }

                let ms: number

                ms = control.benchmark(() => {
                    this.rotateAll(this.map.getTileset(),A_Fpx, B_Fpx, AD_BC_Fpx2)
                }); info.setScore(ms) // this.tempScreen.print(ms.toString(), 0, 110)

                // this.rotatedTiles.forEach((v, i) =>{
                //     this.tempScreen.drawImage(v, (i % 3) * 64, 32+32*((i/3)|0))})

                //tile corners, for drawing wall
                ms=control.benchmark(()=> {
                    this.corners.splice(0, this.corners.length)
                    this.corners = [
                        rotatePoint(0, 0, A_Fpx, B_Fpx),
                        rotatePoint(15.75, 0, A_Fpx, B_Fpx),
                        rotatePoint(15.75, 15.5, A_Fpx, B_Fpx),
                        rotatePoint(0, 15.5, A_Fpx, B_Fpx),
                    ]

                    const topCornerId = this.corners.reduce((tId, p, i) => { return p.y < this.corners[tId].y ? i : tId }, 0)
                    this.corners.removeAt(topCornerId)
                    if (topCornerId) //not necessary if removed [0]
                        for (let i = 0; i < 3 - topCornerId; i++) //rolling reorder, keep original loop order, start from the next corner of toppest one to the last, then start from beginning
                            this.corners.insertAt(0, this.corners.pop())
                    this.corners[2].x += 1
                }); info.player2.setScore(ms)

                //shear doubled, manually, for reference
                // this.tempScreen.drawImage(assets.image`shearDoubleX_reference`, 50, 0)

                // ms = control.benchmark(() => {
                // this.rotatedTiles = this.map.getTileset().map((v, i) => this.shearDoubleX(v, this._angle, i))
                // }); this.tempScreen.print(ms.toString(), 0, 100)
                // this.rotatedTiles.forEach((v, i) =>{
                // this.tempScreen.drawImage(v, (i % 3) * 64, 32 * ((i / 3) | 0))})
                // 
                // this.tempScreen.drawImage(this.map.getTileImage(3), 0, 12)

                this.lastRenderAngle=this._angle
            }

            const A_px_Fpx = (TileSize * Scale * ScaleX -2) * A_Fpx  // -2 is a workaround avoiding gaps between tiles 
            const B_px_Fpx = (TileSize * Scale * ScaleX -2) * B_Fpx  // -2 is a workaround avoiding gaps between tiles 
            const C_px_Fpx = -B_px_Fpx
            const D_px_Fpx = A_px_Fpx

            //shearDoubleX
            // const A = 32 * fpx_scale
            // const B = 16 * fpx_scale
            // const C = -A
            // const D =  B

            if(0){//debug tiles align with A B
                this.tempScreen.fill(8)
                const A = A_px_Fpx / fpx_scale
                const B = B_px_Fpx / fpx_scale
                const C = -B
                const D = A

                this.drawWall(0 + A, 32 + 32+B/2)
                this.drawWall(0, 32 + 32)
                this.tempScreen.drawTransparentImage(this.rotatedTiles[3], 0 + A, 32 + B/2)
                this.tempScreen.drawTransparentImage(this.rotatedTiles[1], 0, 32)
                this.tempScreen.drawLine(32, 32+16, 32 + A, 32+16 + B/2, 2)
                this.tempScreen.drawLine(32, 32+16, 32 + C, 32+16 + D/2, 2)
                //debug
                this.corners.forEach((p, i) => this.tempScreen.print(p.x + "," + p.y, 80, i * 10 + 30))
                // info.player2.setScore(100 * this._angle * 180 / Math.PI)

                this.corners.forEach((p, i) => { this.tempScreen.setPixel(p.x, 32 + p.y, i + 2) })

                //debug
                // this.corners.forEach((p, i) => this.tempScreen.print(p.x + "," + p.y, 0, i * 10 + 30))
                // info.player2.setScore(this._angle*180/Math.PI)
                // return

                return
            }

            const left_CenterTile = 80 - (TileSize * Scale)
            const top_CenterTile = 80 - (TileSize * ScaleY)

            let ms = control.benchmark(() => {
                const bottomWalls=[]
        
        for (let iLayer = 0; iLayer < 4; iLayer++) { //4 layer: floor, wall(up), sprite&wall(bottom), roof
            if(iLayer==2){
                //draw self Sprite
                if (this.spriteAnimations[this.sprSelf.id].animations[0]) {
                    const widthSelf = this.sprSelf.width * Scale
                    const heightSelf = this.sprSelf.height * Scale
                    this.tempScreen.blit(80 - (widthSelf >> 1), 80 - heightSelf, widthSelf, heightSelf,
                        this.spriteAnimations[this.sprSelf.id].animations[0][(this.selfSprAniId++ / 10) | 0], 0, 0, 16, 16, true, false)
                    this.selfSprAniId %= (this.spriteAnimations[this.sprSelf.id].animations[0].length * 10)
                }
                bottomWalls.forEach(v=>this.drawWall(v[0],v[1]))
                continue
            }
            let offsetX_Fpx = 0, offsetY_Fpx = 0
            for (let i = 0; i < this.map.width; i++) {
                offsetX_Fpx = (i + .5 - this.sprSelf.y / tilemapScale - 0) * C_px_Fpx + A_px_Fpx * (0 - this.sprSelf.x / tilemapScale + .5) + left_CenterTile  * fpx_scale
                offsetY_Fpx = (i + .5 - this.sprSelf.y / tilemapScale - 0) * D_px_Fpx + B_px_Fpx * (0 - this.sprSelf.x / tilemapScale + .5) + top_CenterTile*2 * fpx_scale
                for (let j = 0; j < this.map.height; j++) {
                    const offsetX = offsetX_Fpx >> fpx
                    const offsetY = offsetY_Fpx >> (fpx + 1)
                    if (offsetX > -TileSize * 4 && offsetX < screen.width + TileSize * 4 && offsetY > -TileSize * 2 && offsetY < screen.height + TileSize * 2) {
                        const t = this.map.getTile(j, i)
                        if (this.map.isWall(j, i)) {
                            if (iLayer == 1){//wall
                                if (offsetY+TileSize < 80)
                                    this.drawWall(offsetX, offsetY)
                                else
                                    bottomWalls.push([offsetX, offsetY])
                            }else if (iLayer == 3) { //roof
                                this.tempScreen.drawTransparentImage(this.rotatedTiles[t], offsetX, offsetY - WallHeight)
                            }
                        }
                        else if (iLayer == 0){ //floor
                            this.tempScreen.drawTransparentImage(this.rotatedTiles[t], offsetX, offsetY)
                        }
                    }
                    offsetX_Fpx+=A_px_Fpx
                    offsetY_Fpx+=B_px_Fpx
                }
            }
        }
        }); this.tempScreen.print(ms.toString(), 0, 20)

            //debug info
            // const loc = this.sprSelf.tilemapLocation()
            // this.tempScreen.print(loc.row + "," + loc.col, 0, 100)
            // this.tempScreen.print(this.sprSelf.x + "," + this.sprSelf.y, 0, 90)



            //debug
            // info.setScore(control.millis()-ms)
            // this.tempScreen.print(lastPerpWallDist.toString(), 0,0,7 )

            this.drawSprites()
        }
        
        drawSprites(){
            //debug
            // let msSprs=control.millis()
            /////////////////// sprites ///////////////////

            //for sprite
            const invDet = one2 / (this.planeX * this.dirYFpx - this.dirXFpx * this.planeY); //required for correct matrix multiplication

            this.sprites
               .sort((spr1, spr2) => {   // far to near
                   return (spr2.x -spr1.x)
               })
                .forEach((spr, index) => {
                    //debug
                    // this.tempScreen.print([spr.id,Math.roundWithPrecision(angle[spr.id],3)].join(), 0, index * 10 + 10,9)
                    // this.drawSprite(spr, index)
                })

            //debug
            // info.setLife(control.millis() - msSprs+1)
            // this.tempScreen.print([Math.roundWithPrecision(angle0,3)].join(), 20,  0)

        }

        registerOnSpriteDirectionUpdate(handler: (spr: Sprite, dir: number) => void) {
            this.onSpriteDirectionUpdateHandler = handler
        }

/*
        drawSprite(spr: Sprite, index: number) {
            const myAngle=0 //temp, should be view angle

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
                this.tempScreen,
                blitXSpr,
                drawStart,
                blitWidthSpr,
                lineHeight * spr.height / this.tilemapScaleSize,
                texSpr,
                (blitXSpr - (spriteScreenX - spriteScreenHalfWidth)) * sprTexRatio
                ,
                0,
                blitWidthSpr * sprTexRatio, texSpr.height, true, false)

            const sayRender = this.sayRederers[spr.id]
            const particle = this.spriteParticles[spr.id]
            const sayOrParticle = !!sayRender || !!particle
            if (sayOrParticle) {
                screen.fill(0)
                //sayText
                if (sayRender) {
                    if (this.sayEndTimes[spr.id] && control.millis() > this.sayEndTimes[spr.id]) {
                        this.sayRederers[spr.id] = undefined
                    } else {
                        this.tempSprite.x = SWHalf
                        this.tempSprite.y = SHHalf + 2
                        this.camera.drawOffsetX = 0
                        this.camera.drawOffsetY = 0
                        sayRender.draw(screen, this.camera, this.tempSprite)
                    }
                }
                //particle
                if (particle) {
                    if (particle.lifespan) {
                        //debug
                        // this.tempScreen.print([spr.id].join(), 0,index*10+10)
                        this.tempSprite.x = SWHalf
                        this.tempSprite.y = SHHalf + spr.height
                        this.camera.drawOffsetX = 0//spr.x-SWHalf
                        this.camera.drawOffsetY = 0//spr.y-SH
                        particle.__draw(this.camera)
                    } else {
                        this.spriteParticles[spr.id] = undefined
                    }
                }
                //update screen for this spr
                const fpx_div_transformy = Math.roundWithPrecision(transformY / 4 / fpx_scale, 2)
                const height = (SH / fpx_div_transformy)
                const blitXSaySrc = ((blitX - spriteScreenX) * fpx_div_transformy) + SWHalf
                const blitWidthSaySrc = (blitWidth * fpx_div_transformy)
                if (blitXSaySrc <= 0) { //imageBlit considers negative value as 0
                    helpers.imageBlit(
                        this.tempScreen,
                        spriteScreenX - SWHalf / fpx_div_transformy, drawStart - height / 2, (blitWidthSaySrc + blitXSaySrc) / fpx_div_transformy, height,
                        screen,
                        0, 0, blitWidthSaySrc + blitXSaySrc, SH, true, false)
                } else {
                    helpers.imageBlit(
                        this.tempScreen,
                        blitX, drawStart - height / 2, blitWidth, height,
                        screen,
                        blitXSaySrc, 0, blitWidthSaySrc, SH,
                        true, false)
                }
            }
            // const ms = control.benchmark(() => {
            // }); this.tempScreen.print(ms.toString(), 0, 30 + index * 10, 15)
        }
*/

    }

    //%fixedinstance
    export const raycastingRender = new Render.RayCastingRender()
}
