// Add your code here
let EmptyImage = img`
        .
    `

class RCSprite extends Sprite {
    constructor(x: number, y: number, vx: number, vy: number, kind: number, texture: Image) {
        super(texture)

        const sc = game.currentScene()
        this.setPosition(x , y)
        this.setVelocity(vx, vy)
        this.setScale(0.5)

        //as sprites.create() does:
        this.setKind(kind)
        sc.physicsEngine.addSprite(this);
        // run on created handlers
        sc.createdHandlers
            .filter(h => h.kind == kind)
            .forEach(h => h.handler(this));
    }

    //todo: add toggle
    __drawCore(camera: scene.Camera) { if (controller.B.isPressed()) super.__drawCore(camera) }

}
