
game.stats = true

tiles.setCurrentTilemap(tilemap`level0`)
const spawnTile = sprites.castle.tileGrass1
// effects.blizzard.startScreenEffect(99999999, 99)

const rcRender = Render.raycastingRender
let angle = 45
Render.setViewAngleInDegree(angle)
Render.moveWithController(0, 0, 0)
controller.moveSprite(rcRender.sprSelf, 55, 0)

rcRender.sprSelf.setScale(1)
rcRender.sprSelf.ay=500
tiles.placeOnTile(rcRender.sprSelf, tiles.getTileLocation(2, 8))
Render.setSpriteAnimations(rcRender.sprSelf, Render.createAnimations(150, texturesHero[0], texturesHero[1], texturesHero[2], texturesHero[3]))

let count = 0
function createSprite(x: number, y: number, vx: number, vy: number, textures: Image[][], kind: number) {
    const spr = sprites.create(textures[0][0], kind)
    // rcRender.takeoverSceneSprites()
    tiles.placeOnTile(spr, tiles.getTileLocation(x, y))
    spr.setVelocity(vx, vy)
    // setCharacterAnimationForSprite(spr, textures)
    Render.setSpriteAnimations(spr, Render.createAnimations(150, textures[0], textures[1], textures[2], textures[3]))
    tiles.placeOnRandomTile(spr, spawnTile)
    spr.ay = 500

    // spr.sayText(spr.id + " test\n test", 9999)
    // spr.startEffect(effects.fountain,9999)

    return spr
}

function createCoin() {
    let spr = createSprite(4, 7, Math.randomRange(5, 10), Math.randomRange(3, 10), texturesCoin, SpriteKind.Food)
    tiles.placeOnRandomTile(spr, spawnTile)
    rcRender.setZOffset(spr, .5)
}

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

sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Projectile, function (sprite, otherSprite) {
    otherSprite.destroy()
    music.baDing.play()
    tiles.placeOnRandomTile(sprite, spawnTile)
    sprite.sayText("No!", 2000)
    sprite.startEffect(effects.fire, 3000)
    createCoin()
    // game.showLongText(sprite.id+" "+otherSprite.id, DialogLayout.Bottom)
})

sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Enemy, function (sprite, otherSprite) {
    otherSprite.setVelocity(otherSprite.x - sprite.x, otherSprite.y - sprite.y)
    sprite.setVelocity(-(otherSprite.x - sprite.x), -(otherSprite.y - sprite.y))
})

sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
    music.baDing.play()
    info.changeScoreBy(1)
    otherSprite.destroy()
})

controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
    music.pewPew.play()
    let s = sprites.createProjectileFromSprite(sprites.projectile.bubble1, rcRender.sprSelf, 66, 0)
    s.setScale(0.5)
})

controller.B.onEvent(ControllerButtonEvent.Pressed, () => {
    if(tiles.tileAtLocationIsWall(rcRender.sprSelf.tilemapLocation().getNeighboringLocation(CollisionDirection.Bottom)))
        rcRender.sprSelf.vy= -250
    // rcRender.jumpWithHeightAndDuration(rcRender.sprSelf, tilemapScale * 2.5, 1000)
})

let isAdjusting = false
let adjusted=false
controller.menu.onEvent(ControllerButtonEvent.Pressed, () => {
    isAdjusting = true
    adjusted=false
})
controller.menu.onEvent(ControllerButtonEvent.Released, () => {
    isAdjusting = false
    if (!adjusted)
        Render.toggleViewMode()
})

controller.up.onEvent(ControllerButtonEvent.Pressed, () => {
    if (!isAdjusting)
        Render.changeScale(1)
})
controller.down.onEvent(ControllerButtonEvent.Pressed, () => {
    if (!isAdjusting)
        Render.changeScale(-1)
})

game.onUpdate(() => {
    if (isAdjusting){
        if (controller.up.isPressed()){
            Render.changeScaleY(1)
            adjusted = true
        }
        if (controller.down.isPressed()){
            Render.changeScaleY(-1)
            adjusted = true
        }
        if (controller.left.isPressed()){
            adjusted = true
            angle-=5
            Render.setViewAngleInDegree(angle)
            controller.moveSprite(rcRender.sprSelf, (rcRender.viewAngle < Math.PI ? 55 : -55), 0)
        }
        if (controller.right.isPressed()){
            adjusted = true
            angle += 5
            Render.setViewAngleInDegree(angle)
            controller.moveSprite(rcRender.sprSelf, (rcRender.viewAngle < Math.PI ? 55 : -55), 0)
        }
    }
})

info.setScore(0)
info.setLife(3)




// 0<= dir <1, then may be added by 2 for avoid negative
// rcRender.registerOnSpriteDirectionUpdate((spr, dir) => {
//     // character.setCharacterState(spr, character.rule(characterAniDirs[Math.floor(dir * 4 + .5) % 4]))
// })

// const characterAniDirs = [Predicate.MovingLeft, Predicate.MovingDown, Predicate.MovingRight, Predicate.MovingUp]
// function setCharacterAnimationForSprite(spr: Sprite, textures: Image[][]) {
//     characterAniDirs.forEach((dir, i) => {
//         character.loopFrames(spr, textures[Math.floor(i * textures.length / characterAniDirs.length)], 150, character.rule(dir))
//     })
// }
