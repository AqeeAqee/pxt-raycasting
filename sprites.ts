// Add your code here
let EmptyImage = img`
        .
    `
class XYZAniSprite extends Sprite {
    _radiusRate: number
    _heightRate: number
    _offsetY: number = 0
    texture: Image
    aniInterval: number
    tilemapScale = 16  //todo, update when tilemap changed
    constructor(x: number, y: number, vx: number, vy: number, kind: number, texture: Image) {
        super(EmptyImage)
        const sc = game.currentScene()

        if (texture) {
            this.texture = texture
            this.radiusRate = this.texture.width / wallSize / 2
            this.heightRate = this.texture.height / wallSize
        }
        this.tilemapScale = 1 << game.currentScene().tileMap.scale
        this.setPosition(x * this.tilemapScale, y * this.tilemapScale)
        this.setVelocity(vx, vy)

        //as sprites.create() does:
        this.setKind(kind)
        sc.physicsEngine.addSprite(this);
        // run on created handlers
        sc.createdHandlers
            .filter(h => h.kind == kind)
            .forEach(h => h.handler(this));
    }

    __drawCore(camera: scene.Camera) { if (controller.B.isPressed()) super.__drawCore(camera) }

    get xFx8(): number {
        return this._x as any as number / this.tilemapScale + (1 << fpx >> 2)
    }

    get yFx8(): number {
        return this._y as any as number / this.tilemapScale + (1 << fpx >> 2)
    }

    get vxFx8(): number {
        return this._vx as any as number / this.tilemapScale
    }

    get vyFx8(): number {
        return this._vy as any as number / this.tilemapScale
    }

    get radiusRate(): number {
        return this._radiusRate / fpx_scale
    }

    setImage(img: Image) {
        if (!img || img === this.texture) return;
        this.texture = img;
    }

    set radiusRate(value: number) {
        this._radiusRate = tofpx(value)
        const width = (this._radiusRate << game.currentScene().tileMap.scale << 1 >> fpx)
        let img = image.create(width, width)

        img.drawRect(0, 0, width, width, 1)
        const imgTx = this.texture
        img.blit(0, 0, width, width, imgTx, 0, 0, imgTx.width, imgTx.height, false, false)
        super.setImage(img)
    }

    get heightRate(): number {
        return this._heightRate / fpx_scale
    }

    set heightRate(value: number) {
        this._heightRate = value * fpx_scale
    }

    get offsetY(): number {
        return this._offsetY / fpx_scale
    }

    set offsetY(value: number) {
        this._offsetY = value * fpx_scale
    }

    // todo, delete
    // //choose texture by direction, and loop animation
    // private indexAnimation = 0
    // private msLastAni = 0
    // getTexture(indexDir: number) {
    //     if (control.millis() > this.msLastAni + this.aniInterval) {
    //         this.indexAnimation++
    //         this.msLastAni = control.millis()
    //     }
    //     if (this.indexAnimation >= this.textures[indexDir].length)
    //         this.indexAnimation = 0
    //     return this.textures[indexDir][this.indexAnimation]
    // }
}
