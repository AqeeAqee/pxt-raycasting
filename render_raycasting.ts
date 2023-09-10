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
            this.sprSelf = sprites.create(image.create(this.tilemapScaleSize >> 0, this.tilemapScaleSize >> 0), SpriteKind.Player)
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

        rotate(inImg:Image, degree:number, i=0){
            //Derivation 1
            // const xOut = A * (xIn + H - X0) + B * (yIn + V - Y0) + X0
            // const yOut = C * (xIn + H - X0) + D * (yIn + V - Y0) + Y0
            //Derivation 4
            // let xIn = (-x * D + y * B + D * X0 - B * Y0) / AD_BC - (H - X0)
            // let yIn = (-x * C + y * A + C * X0 - A * Y0) / AD_BC - (V - Y0)

            const scaleX = 2
            const scaleY = 1
            const size=Math.max(inImg.width,inImg.height)
            const outImg = image.create(size * 2* scaleX , size *2 * scaleY)
            // const H = size >> 1, V = size >> 1
            const H =0, V =0
            // const X0 = size, Y0 = size
            const X0 = size/2, Y0 = size/2
            const A = (Math.SQRT2 * Math.cos( degree ) * fpx_scale) | 0
            const B = (Math.SQRT2 * Math.sin( degree ) * fpx_scale) | 0
            // const A = fpx_scale
            // const B =( (A * Math.tan(Math.PI * (degree) / 180) )|0)+1
            const C = -B
            const D = A 

            // outImg.fill(i+1)
            // outImg.drawRect(0,0,size*2,size*2,1)

            const AD_BC = (A * D - B * C)   //1<<fpx2 //
            let xIn0_FX = (((D * X0 - B * Y0) / AD_BC) - (H - X0) * fpx_scale) | 0
            let yIn0_FX = (((C * X0 - A * Y0) / AD_BC) - (V - Y0) * fpx_scale) | 0
            const B_ADBC = (B<<fpx2) / AD_BC
            const A_ADBC = (A<<fpx2) / AD_BC
            const D_ADBC = (D<<fpx2) / AD_BC
            const C_ADBC = (C<<fpx2) / AD_BC

            let x = (X0 - size*scaleX);
            xIn0_FX -= x * D_ADBC
            yIn0_FX -= x * C_ADBC
            
        const xIn_FXs=[]
            for (; x <= X0 + size * scaleX; x++) {
                let xIn_FX = xIn0_FX
                let yIn_FX = yIn0_FX
                let y = (Y0 - size * scaleY*2 )
                xIn_FX += y * B_ADBC
                yIn_FX += y * A_ADBC
                for (; y <= Y0 + size * scaleY; y++) { //
                    let xIn = xIn_FX >> fpx
                    let yIn = yIn_FX >> fpx
                    if (0 <= xIn && xIn < size && 0 <= yIn && yIn < size) 
                    {
                        // if (0 <= xOut && xOut < outImg.width && 0 <= yOut && yOut < outImg.height) {
                        const c = inImg.getPixel(inImg.width - xIn-1, yIn)
                        outImg.setPixel((x + size-1) * scaleX,   (y+size-1) * scaleY, c)
                        outImg.setPixel((x + size-1) * scaleX+1, (y+size-1) * scaleY, c)
                        // outImg.setPixel(x, y, i+1)
                    }
                    xIn_FX += B_ADBC
                    yIn_FX += A_ADBC
                }
                // xIn_FXs.push(Math.roundWithPrecision(xIn_FX/fpx_scale,2))

                xIn0_FX -= D_ADBC
                yIn0_FX -= C_ADBC
            }
            // console.log(xIn_FXs.join())
            // console.log(" -")
            // console.log(" -")

            return outImg
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

        rotatedTiles:Image[]

        render() {
            // based on https://lodev.org/cgtutor/raycasting.html

            this.viewXFpx = this.xFpx
            this.viewYFpx = this.yFpx
            this.viewZPos = this.spriteMotionZ[this.sprSelf.id].p + (this.sprSelf._height as any as number) - (2<<fpx) + this.cameraOffsetZ_fpx

        // if(!this.rotatedTiles)
        {

            this.tempScreen.drawImage(
//shear doubled, manually, for reference
img`
    ..............................7777..............................
    ............................77777777............................
    ..........................777777777777..........................
    ........................7777111111117777........................
    ......................77777777777766667777......................
    ....................777777771111111177777777....................
    ..................7777777777776666777777777777..................
    ................77777777777777777777777777777777................
    ..............777777777777777777777777777777777777..............
    ............7777777777775555777777777777777777777777............
    ..........77777777777777775555777755556666777777777777..........
    ........777777777777777777776666777755557777111133331111........
    ......777777777777777777777777777755556666111111111111dddd......
    ....55557777111133331111777777777777555577771111666611116666....
    ..77777777111111111111dddd777777777777777733336666777733337777..
    5555777777771111666611116666777777777777777711117777111166667777
    ..7777777733336666777733337777111111117777111111111111dddd7777..
    ....7777777711117777111166667777777766667777dddd3333dddd7777....
    ......7777111111111111dddd77771111111177777777666666667777......
    ........7777dddd3333dddd77777777666677777777777777777777........
    ..........77776666666677777777777777777777777777777777..........
    ............7777777777777777777777777777777777777777............
    ..............777777777777777777777777777777777777..............
    ................77777777111111117777777777777777................
    ..................7777777777776666777777777777..................
    ....................777711111111777777777777....................
    ......................77776666777777777777......................
    ........................7777777777777777........................
    ..........................777777775555..........................
    ............................77777777............................
    ..............................7777..............................
    ................................................................
`, 50, 0)

            let ms:number

            ms = control.benchmark(() => {
                this.rotatedTiles = this.map.getTileset().map((v, i) => this.rotate(v, this._angle, i))
            }); this.tempScreen.print(ms.toString(), 0, 110)

                // this.rotatedTiles.forEach((v, i) =>{
                // if (i <4)
                //     this.tempScreen.drawImage(v, (i % 3) * 64, 32+32*((i/3)|0))})

//            ms = control.benchmark(() => {
//                this.rotatedTiles = this.map.getTileset().map((v, i) => this.shearDoubleX(v, this._angle, i))
//            }); this.tempScreen.print(ms.toString(), 0, 100)
//            
//            this.rotatedTiles.forEach((v, i) =>{
//                if(i<4)
//                this.tempScreen.drawImage(v, (i % 3) * 64, 32 * ((i / 3) | 0))})
//
//                this.tempScreen.drawImage(this.map.getTileImage(3), 0, 12)

        }
// return
            
            info.setScore(this._angle*180/Math.PI)

            const size=16

            //rotate
            const A = (((2*size -1) * Math.SQRT2 * Math.cos(-Math.PI/2-this._angle)) * fpx_scale* fpx_scale)
            const B = (((2*size -1) * Math.SQRT2 * Math.sin(-Math.PI/2-this._angle)) * fpx_scale* fpx_scale)
            const C = -B
            const D = A

            //shearDoubleX
            // const A = 32 * fpx_scale* fpx_scale
            // const B = 16 * fpx_scale* fpx_scale
            // const C = -A
            // const D =  B


            let ms = control.benchmark(() => {

            let offsetX = 0, offsetY = 0
            for (let i = 0; i < this.map.width; i++) {
                offsetX =  (i+.5 -this.sprSelf.y/tilemapScale-0) * C + A * (0-this.sprSelf.x/tilemapScale+.5)+ (50) * fpx_scale*fpx_scale
                offsetY =  (i+.5 -this.sprSelf.y/tilemapScale-0) * D + B * (0-this.sprSelf.x/tilemapScale+.5)+ (100) * fpx_scale*fpx_scale
                for (let j = 0; j < this.map.height; j++) {
                    const t=this.map.getTile(j,i)
                    if ((offsetX >> fpx2)>-size*4 && ( offsetY >> (fpx2+1))>-size*2)
                    this.tempScreen.blit(offsetX >> fpx2, (offsetY >> (fpx2+1)) , size*4, size*2,
                            this.rotatedTiles[t], 0, 0, size*4, size*2, true,false)
                    offsetX+=A
                    offsetY+=B
                }
            }
            }); this.tempScreen.print(ms.toString(), 0, 20)

            this.tempScreen.blit(80-16,50-16, 32,32,
                sprites.castle.heroWalkFront1, 0,0,16,16,true,false)

            const loc = this.sprSelf.tilemapLocation()
            this.tempScreen.print(loc.row + "," + loc.col, 0, 100)
            this.tempScreen.print(this.sprSelf.x + "," + this.sprSelf.y, 0, 90)



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
