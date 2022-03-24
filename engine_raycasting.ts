//based on mmoskal's "3d map", https://forum.makecode.com/t/3d-raycasting-in-arcade/474
const fpx = 8
const fpx_scale = 2 ** fpx
const defaultFov = screen.width / screen.height / 2  //Wall just fill screen height when standing 1 unit away
const wallSize = 32

function tofpx(n: number) {
    return (n * fpx_scale) | 0
}

// class MyRenderable extends scene.Renderable{
//     constructor(){
//         super((target, camera) => {}, ()=>true, -1)
//     }
// }

class State {
    x: number
    y: number
    map:tiles.TileMapData
    dirX: number
    dirY: number
    planeX: number
    planeY: number
    angle: number
    fov: number
    sprites:sprites.XYZAniSprite[]=[]
    textures: Image[]
    wallHeightInView: number
    wallWidthInView: number
    dist: number[] = []
    //for sprite
    invDet: number //required for correct matrix multiplication
    oldRender:scene.Renderable
    myRender:scene.Renderable

    constructor( x: number, y: number, fov: number, sprites?: sprites.XYZAniSprite[]) {
        this.angle = 0
        this.x = tofpx(x)
        this.y = tofpx(y)

        this.setFov(fov)
        this.map = game.currentScene().tileMap.data
        this.textures = game.currentScene().tileMap.data.getTileset()
        
        if(this.sprites){
            this.sprites=sprites
            for(const spr of sprites){
                spr.onDestroyed(()=>sprites.removeElement(spr))
            }
        }

        if (game.currentScene().tileMap){
        this.oldRender=game.currentScene().tileMap.renderable
        game.currentScene().allSprites.removeElement(this.oldRender)
        // game.currentScene().tileMap.renderable =
        this.myRender=scene.createRenderable(
            scene.TILE_MAP_Z,
            (t, c) => this.trace(t, c)
        )
            // game.currentScene().allSprites.push(this.myRender)
        }
        // game.onPaint(function () {
        //     st.trace()
        // })
        game.onUpdate(function () {
            st.updateControls()
        })

        controller.B.onEvent(ControllerButtonEvent.Pressed, () => {
            game.currentScene().allSprites.removeElement(this.myRender)
            game.currentScene().allSprites.push(this.oldRender)

        })
        controller.B.onEvent(ControllerButtonEvent.Released, () => {
            game.currentScene().allSprites.removeElement(this.oldRender)
            game.currentScene().allSprites.push(this.myRender)

        })
    }

    render(target: Image, camera: scene.Camera) {
        
        //if(controller.B.isPressed())
        // this.__
    }

    setFov(fov: number) {
        this.fov = fov
        this.wallHeightInView = (screen.width << (fpx - 1)) / this.fov
        this.wallWidthInView = wallSize/this.fov *4/3*2
        this.setVectors()
    }

    private setVectors() {
        const sin = Math.sin(this.angle)
        const cos = Math.cos(this.angle)
        this.dirX = tofpx(cos)
        this.dirY = tofpx(sin)
        this.planeX = tofpx(sin * this.fov)
        this.planeY = tofpx(cos * -this.fov)
    }

    public canGo(x: number, y: number) {
        return this.map.getTile(x>>fpx, y>>fpx ) == 0
    }

    public canGoSpriteX(spr: sprites.XYZAniSprite) {
        return st.canGo(spr.x + spr.vx / 33 + (spr.vx > 0 ? spr._radiusRate : -spr._radiusRate), spr.y + spr.vy / 33)
    }

    public canGoSpriteY(spr: sprites.XYZAniSprite) {
        return st.canGo(spr.x + spr.vx / 33 , spr.y + spr.vy / 33 + (spr.vy > 0 ? spr._radiusRate : -spr._radiusRate))
    }

    updateControls() {
        
        const dx = controller.dx(2)
        if (dx) {
            this.angle += dx
            this.setVectors()
        }
        const dy = controller.dy(5)
        if (dy) {
            const nx = this.x - Math.round(this.dirX * dy)
            const ny = this.y - Math.round(this.dirY * dy)
            if (!this.canGo(nx, ny) && this.canGo(this.x, this.y)) {
                if (this.canGo(this.x, ny))
                    this.y = ny
                else if (this.canGo(nx, this.y))
                    this.x = nx
            } else {
                this.x = nx
                this.y = ny
            }
        }
        //if (dx || dy)
        //    console.log(`${this.x},${this.y},${this.angle}`)
    }

    trace(target: Image, camera: scene.Camera) {
        // based on https://lodev.org/cgtutor/raycasting.html
        const w = screen.width
        const h = screen.height
        const one = 1 << fpx
        const one2 = 1 << (fpx + fpx)

        //for sprite
        this.invDet = one2 / (this.planeX * this.dirY - this.dirX * this.planeY); //required for correct matrix multiplication

        for (let x = 0; x < w; x++) {
            const cameraX: number = one - Math.idiv((x << fpx) << 1, w)
            let rayDirX = this.dirX + (this.planeX * cameraX >> fpx)
            let rayDirY = this.dirY + (this.planeY * cameraX >> fpx)

            let mapX = this.x >> fpx
            let mapY = this.y >> fpx

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
                sideDistX = ((this.x - (mapX << fpx)) * deltaDistX) >> fpx;
            } else {
                mapStepX = 1;
                sideDistX = (((mapX << fpx) + one - this.x) * deltaDistX) >> fpx;
            }
            if (rayDirY < 0) {
                mapStepY = -1;
                sideDistY = ((this.y - (mapY << fpx)) * deltaDistY) >> fpx;
            } else {
                mapStepY = 1;
                sideDistY = (((mapY << fpx) + one - this.y) * deltaDistY) >> fpx;
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
                perpWallDist = Math.idiv(((mapX << fpx) - this.x + (1 - mapStepX << fpx - 1)) << fpx, rayDirX)
                wallX = this.y + (perpWallDist * rayDirY >> fpx);
            } else {
                perpWallDist = Math.idiv(((mapY << fpx) - this.y + (1 - mapStepY << fpx - 1)) << fpx, rayDirY)
                wallX = this.x + (perpWallDist * rayDirX >> fpx);
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

        this.sprites.filter((spr,i)=>{ // transformY>0
            return (-this.planeY * (spr.xFx8 - this.x) + this.planeX * (spr.yFx8  - this.y)) > 0
        }).sort((spr1, spr2) => {   // far to near
            return ((spr2.xFx8  - this.x) ** 2 + (spr2.yFx8  - this.y) ** 2) - ((spr1.xFx8 - this.x) ** 2 + (spr1.yFx8 - this.y) ** 2)
        }).forEach((spr,index)=>{
            this.drawSprite(spr, index)
        })
        screen.print([this.x/fpx_scale, this.y/fpx_scale].join(), 0, 0,13)
    }

    drawSprite(spr: sprites.XYZAniSprite, index: number) {
        const spriteX = spr.xFx8 - this.x
        const spriteY = spr.yFx8 - this.y
        const transformX = this.invDet * (this.dirY * spriteX - this.dirX * spriteY) >> fpx;
        const transformY = this.invDet * (-this.planeY * spriteX + this.planeX * spriteY) >> fpx; //this is actually the depth inside the screen, that what Z is in 3D
        const spriteScreenX = Math.ceil((screen.width / 2) * (1 - transformX / transformY));
        const spriteScreenHalfWidth = Math.idiv(spr._radiusRate* this.wallWidthInView, transformY)  //origin: (texSpr.width / 2 << fpx) / transformY / this.fov / 3 * 2 * 4

        //calculate drawing range in X direction
        //assume there is one range only
        let blitX=0, blitWidth=0
        for (let sprX = Math.max(0, spriteScreenX - spriteScreenHalfWidth); sprX < Math.min(screen.width,spriteScreenX + spriteScreenHalfWidth);sprX++){
            if (this.dist[sprX] > transformY){
                if(blitWidth==0)
                    blitX=sprX
                blitWidth++
            }else if(blitWidth>0)
                break
        }
        // screen.print([spr.xFx8, spr.yFx8].join(), 0,index*10+10)
        if(blitWidth==0)
            return
        const lineHeight = Math.idiv(this.wallHeightInView , transformY) | 1
        const drawStart = (screen.height >> 1) + (lineHeight * (spr._offsetY+(fpx_scale >> 1) - spr._heightRate)>>fpx)
        const myAngle = Math.atan2(spriteX, spriteY)
        const texSpr = spr.getTexture(Math.floor(((Math.atan2(spr.vxFx8, spr.vyFx8) - myAngle) / Math.PI / 2 + 2-.25) * spr.textures.length +.5) % spr.textures.length)
        helpers.imageBlit(
            screen, 
            blitX, 
            drawStart, 
            blitWidth, 
            lineHeight * spr._heightRate >> fpx, 
            texSpr, 
            (blitX-(spriteScreenX-spriteScreenHalfWidth))*texSpr.width/spriteScreenHalfWidth/2
            , 
            0, 
            blitWidth*texSpr.width/spriteScreenHalfWidth/2, texSpr.height,true,false)
    }
}
