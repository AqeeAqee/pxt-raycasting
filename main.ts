
game.stats = true
const rcRender = Render.raycastingRender
// Render.moveWithController(1.5,2,1)

// let trans16 = image.create(16, 16)

Render.setSpriteAnimations(rcRender.sprSelf, Render.createAnimations(150, assets.animation`heroWalk`))

const tm = tiles.createTilemap(hex`1000100003040506070102010201020102010201010201020102010201020102010201020201020102010201020102010201020101020102010201020102010201020102020102010201020102010201020102010102010201020102010201020102010202010201020102010201020102010201010201020102010201020102010201020201020102010201020102010201020101020102010201020102010201020102020102010201020102010201020102010102010201020102010201020102010202010201020102010201020102010201010201020102010201020102010201020201020102010201020102010201020101020102010201020102010201020102`, img`
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . 2 2 2 2 . . 2 2 2 2 . . .
    . . . 2 . . . . . . . . 2 . . .
    . . . 2 . . . . . . . . 2 . . .
    . . . 2 . . . . . . . . 2 . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . 2 . . . . . . . . 2 . . .
    . . . 2 . . . . . . . . 2 . . .
    . . . 2 . . . . . . . . 2 . . .
    . . . 2 2 2 2 . . 2 2 2 2 . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
    . . . . . . . . . . . . . . . .
`, [myTiles.transparency16,myTiles.tile3,myTiles.tile4,sprites.castle.tileGrass2,sprites.castle.tilePath5,sprites.vehicle.roadVertical,sprites.vehicle.roadHorizontal,sprites.dungeon.chestClosed], TileScale.Sixteen);
// tiles.setCurrentTilemap(tm)
// const spawnTile = myTiles.tile4

tiles.setCurrentTilemap(tilemap`level1`)
const spawnTile = sprites.castle.tileDarkGrass3

const tilemapScale = 1 << game.currentScene().tileMap.scale
rcRender.sprSelf.setPosition(8 * tilemapScale, 8 * tilemapScale)

// effects.blizzard.startScreenEffect(99999999, 99)

let count = 0
function createSprite(x: number, y: number, vx: number, vy: number, textures: Image[][], kind: number) {
    const spr = sprites.create(textures[0][0], kind)
    // rcRender.takeoverSceneSprites()
    const tilemapScale = 1 << game.currentScene().tileMap.scale
    spr.setPosition(x * tilemapScale, y * tilemapScale)
    spr.setVelocity(vx, vy)
    spr.setBounceOnWall(true)
    spr.setScale(0.5)
    // setCharacterAnimationForSprite(spr, textures)
    Render.setSpriteAnimations(spr, Render.createAnimations(150, textures[0], textures[1], textures[2], textures[3]))
    // if (kind == SpriteKind.Enemy)
    //     tiles.placeOnRandomTile(spr, trans16)
    spr.sayText(spr.id + " test\n test", 9999)
    // spr.startEffect(effects.fountain,9999)

    return spr
}

// 0<= dir <1, then may be added by 2 for avoid negative
// rcRender.registerOnSpriteDirectionUpdate((spr, dir) => {
//     // character.setCharacterState(spr, character.rule(characterAniDirs[Math.floor(dir * 4 + .5) % 4]))
// })

// createSprite(8, 7, 6, 10, texturesDuck, SpriteKind.Enemy)
// createSprite(6, 7, 6, 10, texturesDonut, SpriteKind.Enemy)
// createSprite(5, 8, 6, 10, texturesDog, SpriteKind.Enemy)
let sprPriness2 = createSprite(11, 8, 6, 10, texturesPrincess2, SpriteKind.Enemy)
// let sprHero = createSprite(10, 8, 6, 10, texturesHero, SpriteKind.Enemy)
let sprSkelly = createSprite(9, 9, 6, 10, texturesSkelly, SpriteKind.Enemy)
let sprPriness = createSprite(10, 7, 6, 10, texturesPrincess, SpriteKind.Enemy)
let sprPlane = createSprite(9, 7, 6, 10, texturesPlane, SpriteKind.Enemy)
// let cake = createSprite(2, 2, 4, 2, texturesBigCake, SpriteKind.Enemy)
let fish = createSprite(7, 9, 0, 0, texturesFish, SpriteKind.Enemy)

sprSkelly.startEffect(effects.fire, 9999999)

Render.setSpriteAttribute(sprSkelly, RCSpriteAttribute.ZOffset, 4)
Render.setSpriteAttribute(sprPlane, RCSpriteAttribute.ZOffset, 16)
// Render.setSpriteAttribute(cake, RCSpriteAttribute.ZOffset, 4)
Render.setSpriteAttribute(fish, RCSpriteAttribute.ZOffset, 8)

function createCoin(){
    let spr=createSprite(4, 7, Math.randomRange(5,10), Math.randomRange(3,10), texturesCoin, SpriteKind.Food)
    tiles.placeOnRandomTile(spr, spawnTile)
    rcRender.setZOffset(spr,.25)
}

//test for RelativeToCamera
// game.onUpdateInterval(3000, ()=>{
//     cake.setFlag(SpriteFlag.RelativeToCamera, !(cake.flags&SpriteFlag.RelativeToCamera))
// })

controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
    music.pewPew.play()
    let s = sprites.createProjectileFromSprite(sprites.projectile.bubble1, rcRender.sprSelf, rcRender.dirX * 55, rcRender.dirY * 55)
    s.setScale(0.25)
    rcRender.setZOffset(s, rcRender.getMotionZPosition(rcRender.sprSelf) + 2)  //todo, use VP height
})

sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Projectile, function (sprite, otherSprite) {
    if (!rcRender.isOverlapZ(sprite, otherSprite)) return

    sprite.setVelocity(0, 0)
    sprite.sayText("No!", 2000)
    rcRender.move(sprite, 60, -160)
    // rcRender.setZOffset(sprite, 0)
    music.baDing.play()
    // sprite.setKind(SpriteKind.Food)
    otherSprite.destroy()
    // Render.setSpriteAnimations(sprite, new Render.Animations(120, texturesCoin))
    // sprite.setImage(sprites.builtin.coin0)
    sprite.setScale(.5)
    sprite.startEffect(effects.fire, 3000)
    // tiles.placeOnRandomTile(sprite, spawnTile)
    // sprite.setVelocity(Math.randomRange(4,10), Math.randomRange(4,10))
    createCoin()
    // game.showLongText(sprite.id+" "+otherSprite.id, DialogLayout.Bottom)
})

sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Food, function (sprite, otherSprite) {
    // music.pewPew.play()
    // otherSprite.destroy()
})
sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Enemy, function (sprite, otherSprite) {
    if (!rcRender.isOverlapZ(sprite, otherSprite)) return

    otherSprite.setVelocity(otherSprite.x - sprite.x, otherSprite.y - sprite.y)
    sprite.setVelocity(-(otherSprite.x - sprite.x), -(otherSprite.y - sprite.y))
})

sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    if (!rcRender.isOverlapZ(sprite, otherSprite)) return

})

sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
    if (!rcRender.isOverlapZ(sprite, otherSprite)) return

    music.baDing.play()
    info.changeScoreBy(1)

    // tiles.placeOnRandomTile(otherSprite, sprites.skillmap.islandTile4)
    // otherSprite.setVelocity(Math.randomRange(4, 10), Math.randomRange(4, 10))
    otherSprite.destroy()
})

controller.menu.onEvent(ControllerButtonEvent.Pressed, () => {
    Render.toggleViewMode()
})



controller.B.repeatDelay = 0

let isAdjusting = false
controller.anyButton.onEvent(ControllerButtonEvent.Pressed, () => {
    if (controller.B.isPressed()) {
        if (controller.A.isPressed()) {
            Render.moveWithController(0, 0)
            isAdjusting = true
        } else {
            rcRender.jumpWithHeightAndDuration(rcRender.sprSelf, tilemapScale*2, 1000)
        }
    }
})
controller.B.onEvent(ControllerButtonEvent.Released, () => {
    isAdjusting = false
    Render.moveWithController(1.5, 2)
})
controller.A.onEvent(ControllerButtonEvent.Released, () => {
    isAdjusting = false
    Render.moveWithController(1.5, 2)
})

controller.up.onEvent(ControllerButtonEvent.Pressed, () => {
    if (isAdjusting)
    Render.changeScaleY(1)
})
controller.down.onEvent(ControllerButtonEvent.Pressed, () => {
    if (isAdjusting)
    Render.changeScaleY(-1)
})
controller.left.onEvent(ControllerButtonEvent.Pressed, () => {
    if (isAdjusting)
    Render.changeScale(-1)
})
controller.right.onEvent(ControllerButtonEvent.Pressed, () => {
    if (isAdjusting)
    Render.changeScale(1)
})


rcRender.wallZScale = 2

let zOffset = 3// tilemapScale / 2
// rcRender.setZOffset(rcRender.sprSelf, zOffset, 0)
let fov = Render.defaultFov
game.onUpdate(() => {
    if (false&&isAdjusting) {
        // zOffset -= controller.dy(10)
        // rcRender.setZOffset(rcRender.sprSelf, zOffset, 0)
        fov -= controller.dy(1)
        Render.setAttribute(Render.attribute.fov, fov)
        info.setScore(zOffset * 100)
    }
})


// controller.B.onEvent(ControllerButtonEvent.Pressed, () => {
//     for (let fov = Render.defaultFov; fov > Render.defaultFov - .6; fov -= .06) {
//         rcRender.fov=fov
//         pause(20)
//     }
// })
// controller.B.onEvent(ControllerButtonEvent.Released, () => {
//     for (let fov = Render.defaultFov - .6; fov <= Render.defaultFov; fov += .06) {
//         rcRender.fov=fov
//         pause(20)
//     }
// })


// const characterAniDirs = [Predicate.MovingLeft, Predicate.MovingDown, Predicate.MovingRight, Predicate.MovingUp]
// function setCharacterAnimationForSprite(spr: Sprite, textures: Image[][]) {
//     characterAniDirs.forEach((dir, i) => {
//         character.loopFrames(spr, textures[Math.floor(i * textures.length / characterAniDirs.length)], 150, character.rule(dir))
//     })
// }
// info.setScore(0)
info.setLife(3)
// let mySprite = sprites.create(sprites.builtin.computer1, SpriteKind.Player)
// mySprite.setPosition(80,10)
// mySprite.setFlag(SpriteFlag.RelativeToCamera, true)


