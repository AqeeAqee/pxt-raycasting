const fpx = 10
const fpx_scale = 2 ** fpx
const defaultFov = screen.width / screen.height / 2  //Wall just fill screen height when standing 1 unit away
const wallSize = 32

function tofpx(n: number) {
    return (n * fpx_scale) | 0
}

class CompactSprite{
    x:number
    y:number
    vx:number
    vy:number
    radiusRate: number
    heightRate: number
    textures: Image[][]
    textureBlitData:number[][][][]=[]
    aniInterval:number
    constructor(x: number, y: number, vx: number, vy: number, textures: Image[][], aniInterval:number=150){
        this.x = tofpx(x)
        this.y = tofpx(y)
        this.vx = tofpx(vx)
        this.vy = tofpx(vy)
        this.radiusRate = tofpx(textures[0][0].width) / wallSize >> 1
        this.heightRate = tofpx(textures[0][0].height) / wallSize
        this.textures=textures
        this.aniInterval=aniInterval
    }

    private indexAnimation=0
    private msLastAni=0
    getTexture(indexDir:number){
        if (control.millis() > this.msLastAni + this.aniInterval){
            this.indexAnimation++
            this.msLastAni=control.millis()
        }
        if(this.indexAnimation>=this.textures[indexDir].length)
            this.indexAnimation=0
        return this.textures[indexDir][this.indexAnimation]
    }
}

class State {
    x: number
    y: number
    map: Image
    dirX: number
    dirY: number
    planeX: number
    planeY: number
    angle: number
    fov: number
    sprites:CompactSprite[]=[]
    textures: Image[]
    wallHeightInView: number
    wallWidthInView: number
    dist: number[] = []
    //for sprite
    invDet: number //required for correct matrix multiplication

    constructor( map: Image, textures: Image[], x: number, y: number, fov: number, sprites?:CompactSprite[]) {
        this.angle = 0
        this.x = tofpx(x)
        this.y = tofpx(y)

        this.setFov(fov)
        this.map = map//.clone()
        this.textures = textures
        
        if(this.sprites){
            this.sprites=sprites
        }
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
        return this.map.getPixel(x >> fpx, y >> fpx) == 0
    }

    public canGoSpriteX(spr: CompactSprite) {
        return st.canGo(spr.x + spr.vx / 33 + (spr.vx > 0 ? spr.radiusRate : -spr.radiusRate), spr.y + spr.vy / 33)
    }

    public canGoSpriteY(spr: CompactSprite) {
        return st.canGo(spr.x + spr.vx / 33 , spr.y + spr.vy / 33 + (spr.vy > 0 ? spr.radiusRate : -spr.radiusRate))
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

    trace() {
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

                color = this.map.getPixel(mapX, mapY)
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

            color = (color - 1) * 2
            if (sideWallHit) color++

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
            return (-this.planeY * (spr.x - this.x) + this.planeX * (spr.y - this.y)) > 0 
        }).sort((spr1, spr2) => {   // far to near
            return ((spr2.x - this.x) ** 2 + (spr2.y - this.y) ** 2) - ((spr1.x - this.x) ** 2 + (spr1.y - this.y) ** 2)
        }).forEach((v,i)=>{
            this.drawSprite(v, i)
        })
    }

    drawSprite(spr: CompactSprite, index: number) {
        const spriteX = (spr.x) - this.x
        const spriteY = (spr.y) - this.y
        const transformX = this.invDet * (this.dirY * spriteX - this.dirX * spriteY) >> fpx;
        const transformY = this.invDet * (-this.planeY * spriteX + this.planeX * spriteY) >> fpx; //this is actually the depth inside the screen, that what Z is in 3D
        const spriteScreenX = Math.ceil((screen.width / 2) * (1 - transformX / transformY));

        if (this.dist[spriteScreenX]>transformY){
            const spriteScreenHalfWidth = Math.idiv(spr.radiusRate* this.wallWidthInView, transformY)  //origin: (texSpr.width / 2 << fpx) / transformY / this.fov / 3 * 2 * 4
            const lineHeight = Math.idiv(this.wallHeightInView * spr.heightRate >> fpx, transformY) | 1
            const drawStart = (screen.height >> 1) + (lineHeight * ((fpx_scale >> 1) - spr.heightRate)>>fpx)
            const myAngle = Math.atan2(spriteX, spriteY)
            // const texSpr = spr.getTexture(Math.floor(((Math.atan2(spr.vx, spr.vy) - myAngle) / Math.PI / 2 + .5 + 1) * spr.textures.length + .5 - .5) % spr.textures.length)
            const texSpr = spr.getTexture(Math.floor(((Math.atan2(spr.vx, spr.vy) - myAngle) / Math.PI / 2 + 2-.25) * spr.textures.length +.5) % spr.textures.length)
            helpers.imageBlit(screen, spriteScreenX - spriteScreenHalfWidth, drawStart, spriteScreenHalfWidth * 2, lineHeight, texSpr, 0, 0, texSpr.width, texSpr.height,true,false)
        }
    }
}
