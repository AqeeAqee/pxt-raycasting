//based on mmoskal's "3d map", https://forum.makecode.com/t/3d-raycasting-in-arcade/474
const fpx = 8
const fpx_scale = 2 ** fpx
const defaultFov = screen.width / screen.height / 2  //Wall just fill screen height when standing 1 unit away
const wallSize = 32

function tofpx(n: number) {
    return (n * fpx_scale) | 0
}

function setSpriteDefaultScale(kind: number, defaultSpirteScale: number = 0.5){
    defaultSpirteScale = defaultSpirteScale || 0.5
    game.currentScene().allSprites.forEach(spr => {
        if (spr instanceof Sprite)
            (spr as Sprite).setScale(defaultSpirteScale)
    })
    game.currentScene().createdHandlers.push(new scene.SpriteHandler(SpriteKind.Friend, spr => {
        spr.setScale(defaultSpirteScale)
    }))
}

enum ViewMode{
    tilemapView,
    raycastingView,
}
class State {
    _viewMode:ViewMode
    spriteOffsetZ: number[]=[]

    xFpx: number
    yFpx: number
    map: tiles.TileMapData
    dirXFpx: number
    dirYFpx: number
    planeX: number
    planeY: number
    angle: number
    fov: number
    textures: Image[]
    wallHeightInView: number
    wallWidthInView: number
    dist: number[] = []
    sprSelf: RCSprite
    tilemapScaleSize = 1<<TileScale.Sixteen
    bg: Image
    //for drawing sprites
    invDet: number //required for correct matrix multiplication
    oldRender: scene.Renderable
    myRender: scene.Renderable

    get x(): number {
        return this.xFpx / fpx_scale
    }

    get y(): number {
        return this.yFpx / fpx_scale
    }

    get dirX(): number {
        return this.dirXFpx / fpx_scale
    }

    get dirY(): number {
        return this.dirYFpx / fpx_scale
    }

    get viewMode():ViewMode{
        return this._viewMode
    }

    set viewMode(v:ViewMode){
        this._viewMode=v
        if(v==ViewMode.tilemapView){
            // game.currentScene().allSprites.removeElement(this.myRender)
            game.currentScene().allSprites.push(this.oldRender)
            this.bg = game.currentScene().background.image
            scene.setBackgroundImage(img`15`) //todo, add bgTilemap property for tilemap mode
        }
        else{
            game.currentScene().allSprites.removeElement(this.oldRender)
            // game.currentScene().allSprites.push(this.myRender)
            game.currentScene().background.image = this.bg
        }

    }

    setOffsetZ(v:number, spr:Sprite){
        this.spriteOffsetZ[spr.id]= tofpx(v)
    }

    constructor(x: number, y: number, fov: number) {
        this.angle = 0
        this.xFpx = tofpx(x)/this.tilemapScaleSize
        this.yFpx = tofpx(y)/this.tilemapScaleSize

        this.setFov(fov)
        this.map = game.currentScene().tileMap.data
        this.textures = game.currentScene().tileMap.data.getTileset()

        if (game.currentScene().tileMap) {
            this.tilemapScaleSize = 1 << game.currentScene().tileMap.scale
            this.oldRender = game.currentScene().tileMap.renderable
            game.currentScene().allSprites.removeElement(this.oldRender)

            game.eventContext().registerFrameHandler(scene.RENDER_SPRITES_PRIORITY+1, ()=>{
                screen.drawImage(game.currentScene().background.image,0,0)
                if(this._viewMode!=ViewMode.tilemapView)
                    this.trace()
                })
            // this.myRender = scene.createRenderable(
            //     scene.TILE_MAP_Z,
            //     (t, c) => this.trace(t, c)
            // )
        }

        //self sprite
        this.sprSelf = new RCSprite(x, y, 0, 0, SpriteKind.Player, image.create(wallSize >> 1, wallSize >> 1))
        scene.cameraFollowSprite(this.sprSelf)
        this.updateSelfImage()

        game.onUpdate(function () {
            this.updateControls()
        })

    }

    setFov(fov: number) {
        this.fov = fov
        this.wallHeightInView = (screen.width << (fpx - 1)) / this.fov
        this.wallWidthInView = wallSize / this.fov * 4 / 3 * 2
        this.setVectors()
    }

    private setVectors() {
        const sin = Math.sin(this.angle)
        const cos = Math.cos(this.angle)
        this.dirXFpx = tofpx(cos)
        this.dirYFpx = tofpx(sin)
        this.planeX = tofpx(sin * this.fov)
        this.planeY = tofpx(cos * -this.fov)
    }

    public canGo(x: number, y: number) {
        const radiusRate = this.sprSelf._sx as any as number /2
        return this.map.getTile((x + radiusRate) >> fpx, (y + radiusRate) >> fpx) == 0 &&
            this.map.getTile((x + radiusRate) >> fpx, (y - radiusRate) >> fpx) == 0 &&
            this.map.getTile((x - radiusRate) >> fpx, (y + radiusRate) >> fpx) == 0 &&
            this.map.getTile((x - radiusRate) >> fpx, (y - radiusRate) >> fpx) == 0
    }

    //todo, pre-drawn dirctional image
    public updateSelfImage() {
        const img = this.sprSelf.image
        img.fill(6)
        const arrowLength = img.width / 2
        img.drawLine(arrowLength, arrowLength, arrowLength + this.dirXFpx * arrowLength, arrowLength + this.dirYFpx * arrowLength, 2)
        img.drawLine(arrowLength+1, arrowLength, arrowLength + this.dirXFpx * arrowLength+1, arrowLength + this.dirYFpx * arrowLength, 2)
        img.drawLine(arrowLength, arrowLength+1, arrowLength + this.dirXFpx * arrowLength, arrowLength + this.dirYFpx * arrowLength+1, 2)
        img.fillRect(arrowLength-2,arrowLength-2,4,4,2)
    }

    updateControls() {
        const dx = controller.dx(2)
        if (dx) {
            this.angle += dx
            this.setVectors()
            this.updateSelfImage()
        }
        const dy = controller.dy(4)
        if (dy) {
            const nx = this.xFpx - Math.round(this.dirXFpx * dy)
            const ny = this.yFpx - Math.round(this.dirYFpx * dy)
            if (!this.canGo(nx, ny) && this.canGo(this.xFpx, this.yFpx)) {
                if (this.canGo(this.xFpx, ny)) {
                    this.yFpx = ny
                } else if (this.canGo(nx, this.yFpx)) {
                    this.xFpx = nx
                }
            } else {
                this.xFpx = nx
                this.yFpx = ny
            }
            this.sprSelf.setPosition((nx * this.tilemapScaleSize >> fpx) + this.tilemapScaleSize * 0, (ny * this.tilemapScaleSize >> fpx) + this.tilemapScaleSize * 0)
        }
        //if (dx || dy)
        //    console.log(`${this.xFpx},${this.yFpx},${this.angle}`)
    }

    trace() {
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

                color = this.map.getTile(mapX, mapY)
                if (color)
                    break; // hit!
            }

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

        // game.splash("begin")

        game.currentScene().allSprites.map((spr) => (spr as Sprite))
            //add selfSprite
            .filter((spr, i) => { // transformY>0
                // game.splash(spr instanceof XYZAniSprite)
                return (spr instanceof Sprite) && spr.kind() != SpriteKind.Player && (-this.planeY * (this.getxFx8(spr) - this.xFpx) + this.planeX * (this.getyFx8(spr) - this.yFpx)) > 0
            }).sort((spr1, spr2) => {   // far to near
                return ((this.getxFx8(spr2) - this.xFpx) ** 2 + (this.getyFx8(spr2) - this.yFpx) ** 2) - ((this.getxFx8(spr1) - this.xFpx) ** 2 + (this.getyFx8(spr1) - this.yFpx) ** 2)
            }).forEach((spr, index) => {
                this.drawSprite(spr, index)
            })
    }

    getxFx8(spr: Sprite) {
        return Fx.add(spr._x, Fx.div(spr._width, Fx.twoFx8)) as any as number /this.tilemapScaleSize
    }

    getyFx8(spr: Sprite) {
        return Fx.add(spr._y, Fx.div(spr._height, Fx.twoFx8)) as any as number /this.tilemapScaleSize
    }

    //todo: move to Sprite.Data ?
    getOffsetZ(spr: Sprite){
        return this.spriteOffsetZ[spr.id]||0
    }

    drawSprite(spr: Sprite, index: number) {
        // screen.print([spr.image.width].join(), 0, index*10)
        const spriteX = this.getxFx8(spr) - this.xFpx
        const spriteY = this.getyFx8(spr) - this.yFpx
        const transformX = this.invDet * (this.dirYFpx * spriteX - this.dirXFpx * spriteY) >> fpx;
        const transformY = this.invDet * (-this.planeY * spriteX + this.planeX * spriteY) >> fpx; //this is actually the depth inside the screen, that what Z is in 3D
        const spriteScreenX = Math.ceil((screen.width / 2) * (1 - transformX / transformY));
        const spriteScreenHalfWidth = Math.idiv((spr._sx as any as number)/2 * this.wallWidthInView, transformY)  //origin: (texSpr.width / 2 << fpx) / transformY / this.fov / 3 * 2 * 4

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
        const drawStart = (screen.height >> 1) + (lineHeight * (this.getOffsetZ(spr) + (fpx_scale >> 1) - (spr._sy as any as number)) >> fpx)
        const myAngle = Math.atan2(spriteX, spriteY)

        //for CharacterAnimation ext.
        if (character.setCharacterState){
            const iTexture = Math.floor(((Math.atan2(spr._vx as any as number, spr._vy as any as number) - myAngle) / Math.PI / 2 + 2 - .25) * 4 + .5) % 4
            const characterAniDirs = [Predicate.MovingLeft,Predicate.MovingDown, Predicate.MovingRight, Predicate.MovingUp]
            character.setCharacterState(spr, character.rule(characterAniDirs[iTexture]))
        }
        // const texSpr = spr.getTexture(Math.floor(((Math.atan2(spr.vxFx8, spr.vyFx8) - myAngle) / Math.PI / 2 + 2-.25) * spr.textures.length +.5) % spr.textures.length)
        const texSpr = spr.image
        helpers.imageBlit(
            screen,
            blitX,
            drawStart,
            blitWidth,
            lineHeight * spr.sy,
            texSpr,
            (blitX - (spriteScreenX - spriteScreenHalfWidth)) * texSpr.width / spriteScreenHalfWidth / 2
            ,
            0,
            blitWidth * texSpr.width / spriteScreenHalfWidth / 2, texSpr.height, true, false)
    }
}
