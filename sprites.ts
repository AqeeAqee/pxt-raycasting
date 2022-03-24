// Add your code here
namespace sprites{
export class XYZAniSprite extends Sprite {
    _radiusRate: number
    _heightRate: number
    _offsetY: number = 0
    textures: Image[][]
    aniInterval: number
    constructor(x: number, y: number, vx: number, vy: number, textures: Image[][], kind: number, aniInterval: number = 150) {
        super(textures[0][0])

        // game.splash(this.scale)
        this.setPosition(x * 16, y * 16)
        this.vx = vx
        this.vy = vy
        this._radiusRate = tofpx(textures[0][0].height) / wallSize >> 1
        this._heightRate = tofpx(textures[0][0].height) / wallSize
        this.textures = textures
        this.aniInterval = aniInterval
        this.setBounceOnWall(true)

        game.currentScene().physicsEngine.addSprite(this);

        // run on created handlers
        game.currentScene().createdHandlers
            .filter(h => h.kind == kind)
            .forEach(h => h.handler(this));

    }

    __drawCore(camera: scene.Camera) { }

    get xFx8(): number {
        return this._x as any as number/16
    }

    get yFx8(): number {
        return this._y as any as number / 16
    }

    get vxFx8(): number {
        return this._vx as any as number / 16
    }

    get vyFx8(): number {
        return this._vy as any as number / 16
    }

    get radiusRate(): number {
        return this._radiusRate / fpx_scale
    }

    set radiusRate(value: number) {
        this._radiusRate = value * fpx_scale
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

    private indexAnimation = 0
    private msLastAni = 0
    getTexture(indexDir: number) {
        if (control.millis() > this.msLastAni + this.aniInterval) {
            this.indexAnimation++
            this.msLastAni = control.millis()
        }
        if (this.indexAnimation >= this.textures[indexDir].length)
            this.indexAnimation = 0
        return this.textures[indexDir][this.indexAnimation]
    }
}

}