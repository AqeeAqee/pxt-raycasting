// Add your code here
let EmptyImage = img`
        .
    `

class XYZAniSprite extends Sprite {
    tilemapScale = 16  //todo, update when tilemap changed
    constructor(x: number, y: number, vx: number, vy: number, kind: number, texture: Image) {
        super(texture)
        const sc = game.currentScene()

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

}
