enum ViewMode {
    //% block="TileMap Mode"
    tilemapView,
    //% block="Raycasting Mode"
    raycastingView,
}

namespace SpriteKind{
    export const anchorSprite=SpriteKind.create()
}

namespace Render{
    const SH = screen.height, SHHalf = SH / 2
    const SW = screen.width, SWHalf = SW / 2
    const fpx = 8
    const fpx_scale = 2 ** fpx
    function tofpx(n: number) { return (n * fpx_scale) | 0 }

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
        sayRederers: sprites.BaseSpriteSayRenderer[]=[]
        sayEndTimes: number[]=[]
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
        camera: scene.Camera
        tempScreen:Image=image.create(screen.width, screen.height)
        tempSprite:Sprite=sprites.create(img`0`)

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
            // this.sprSelf.setPosition(x, y)
            scene.cameraFollowSprite(this.sprSelf)
            this.updateSelfImage()

            game.onUpdate(function () {
                this.updateControls()
            })

        }

        takeoverSceneSprites() {
            const sc = game.currentScene()
            sc.allSprites.forEach(spr => {
                if (spr instanceof Sprite) {
                    if (this.sprites.indexOf(spr) < 0){
                        // game.splash("takeoverSceneSprites",spr.id)
                        if(spr.id>21){
                            let a=1
                        }
                        this.sprites.push(spr as Sprite)
                        sc.allSprites.removeElement(spr)
                        spr.onDestroyed(() => { 
                            this.sprites.removeElement(spr) 
                            // game.splash("onDestroyed", this.sayAnchorSprites[spr.id])
                            const sayRenderer=this.sayRederers[spr.id]
                            if(sayRenderer){
                                this.sayRederers.removeElement(sayRenderer)
                                sayRenderer.destroy()
                            }
                        })
                    }
                }
                else if (spr instanceof particles.ParticleSource) {
                    sc.allSprites.removeElement(spr)
                }
            })
            this.sprites.forEach((spr)=>{
                if(spr)
                    this.takeoverSayRenderOfSprite(spr)
            })
        }

        takeoverSayRenderOfSprite(sprite:Sprite){
            const sayRenderer = (sprite as any).sayRenderer
            if (sayRenderer){
                this.sayRederers[sprite.id]=sayRenderer
                this.sayEndTimes[sprite.id] = (sprite as any).sayEndTime;
                (sprite as any).sayRenderer=undefined
            }
        }

        takeoverParticleSources() {
            game.currentScene().particleSources.forEach(ps => {
            // if (spr instanceof particles.ParticleSource) {
                game.currentScene().allSprites.removeElement(ps)
            // }
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
                    this.oldRender.__drawCore(sc.camera)
                    this.sprites.forEach(spr => spr.__draw(sc.camera))
                    //draw hud, todo, walk around for being covered by tilemap
                    game.currentScene().allSprites.forEach(spr => spr.__draw(sc.camera))
                } else {
                    this.takeoverSceneSprites() // in case some one new
                    this.render()
                    //draw hud, or other SpriteLike
                    this.sprites.forEach(spr=>{
                        if((spr.flags & sprites.Flag.RelativeToCamera))
                            spr.__draw(sc.camera)
                    })
                    //todo, delete ?
                    game.currentScene().allSprites.forEach(spr => spr.__draw(sc.camera))
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
                // this.camera.drawOffsetX = controller.dx(1111)
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
            const one = 1 << fpx
            const one2 = 1 << (fpx + fpx)

            //for sprite
            this.invDet = one2 / (this.planeX * this.dirYFpx - this.dirXFpx * this.planeY); //required for correct matrix multiplication

            for (let x = 0; x < SW; x++) {
                const cameraX: number = one - Math.idiv((x << fpx) << 1, SW)
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
                let drawStart = (-lineHeight + SH) >> 1;
                let texX = (wallX * tex.width) >> fpx;
                // if ((!sideWallHit && rayDirX > 0) || (sideWallHit && rayDirY < 0))
                //     texX = tex.width - texX - 1;

                screen.blitRow(x, drawStart, tex, texX, lineHeight)

                this.dist[x] = perpWallDist

            }

            this.printcount = 2
            /////////////////// sprites ///////////////////
            // // if(spr.id>)
            //     console.log(spr.id.toString()+" "+spr.flags.toString())

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

        printcount=2 //for debug
        drawSprite(spr: Sprite, index: number) {
            // screen.print([spr.image.width].join(), 0, index*10)
            const spriteX = this.sprXFx8(spr) - this.xFpx
            const spriteY = this.sprYFx8(spr) - this.yFpx
            const transformX = this.invDet * (this.dirYFpx * spriteX - this.dirXFpx * spriteY) >> fpx;
            const transformY = this.invDet * (-this.planeY * spriteX + this.planeX * spriteY) >> fpx; //this is actually the depth inside the screen, Z on screen
            const spriteScreenX = Math.ceil((screen.width / 2) * (1 - transformX / transformY));
            const spriteScreenHalfWidth = Math.idiv((spr._width as any as number) / this.tilemapScaleSize / 2 * this.wallWidthInView, transformY)  //origin: (texSpr.width / 2 << fpx) / transformY / this.fov / 3 * 2 * 4

            //calculate drawing range in X direction
            //assume there is one range only
            let blitX = 0, blitWidth = 0
            for (let sprX = 0; sprX < screen.width; sprX++) {
                if (this.dist[sprX] > transformY) {
                    if (blitWidth == 0)
                        blitX = sprX
                    blitWidth++
                } else if (blitWidth > 0){
                    if (blitX <= spriteScreenX + spriteScreenHalfWidth && blitX + blitWidth >= spriteScreenX - spriteScreenHalfWidth)
                        break
                    else
                        blitX = 0, blitWidth = 0;
                }
            }
            // screen.print([this.getxFx8(spr), this.getyFx8(spr)].join(), 0,index*10+10)
            const blitXSpr= Math.max(blitX, spriteScreenX - spriteScreenHalfWidth)
            const blitWidthSpr = Math.min(blitX + blitWidth, spriteScreenX + spriteScreenHalfWidth) - blitXSpr
            if (blitWidthSpr<= 0)
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
                blitXSpr,
                drawStart,
                blitWidthSpr,
                lineHeight * spr.height / this.tilemapScaleSize,
                texSpr,
                (blitXSpr - (spriteScreenX - spriteScreenHalfWidth)) * texSpr.width / spriteScreenHalfWidth / 2
                ,
                0,
                blitWidthSpr * texSpr.width / spriteScreenHalfWidth / 2, texSpr.height, true, false)

            //sayText
            let anchor=this.sayRederers[spr.id]
            if(anchor){
                if(control.millis()< this.sayEndTimes[spr.id]){
                    this.tempSprite.x = SWHalf
                    this.tempSprite.y =SH
                    this.camera.drawOffsetX = 0
                    this.camera.drawOffsetY = 0
                    this.tempScreen.fill(0)
                    anchor.draw(this.tempScreen, this.camera, this.tempSprite)

                    const height = SH * fpx_scale / transformY
                    const blitXSaySrc = (blitX - spriteScreenX) * transformY/fpx_scale + SWHalf
                    const blitWidthSaySrc= blitWidth *transformY/fpx_scale
                    if (blitXSaySrc < 0) { //imageBlit considers negative value as 0
                        helpers.imageBlit(
                            screen,
                            spriteScreenX - SWHalf * fpx_scale / transformY, drawStart - height, (blitWidthSaySrc + blitXSaySrc)*fpx_scale/transformY, height,
                            this.tempScreen,
                            0, 0, blitWidthSaySrc + blitXSaySrc, SH, true, false)
                    }else
                        helpers.imageBlit(
                            screen,
                            blitX, drawStart - height, blitWidth, height,
                            this.tempScreen, 
                            blitXSaySrc, 0, blitWidthSaySrc, SH, true, false)
                }else{
                    this.sayRederers[spr.id]=undefined
                }
            }
        }
    }

    //%fixedinstance
    export const raycastingRender = new Render.RayCastingRender()
}
