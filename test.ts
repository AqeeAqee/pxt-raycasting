//////////////////////// animation.ts contents of previous version, just for test.ts here for convenience /////////////////////
    // file contents:
	// directional animations defines for enging_raycasting.ts
	// for convenience, constructed animations as below, which images are builtin in Arcade, 
	// in order from easy to complex
	
	// each are 2D Image array, Image[][]: 
	// 1st dimension is direction: 
	//    length=1 to any, e.g. 1,2,3,4,...,8,..., engine can automatically arange them to 0~360° 
	//    order: start from left, then folling with others in CW order
	//    e.g: 
	//         2 directions should be [leftAni,RightAni], 
	//         4-direction should be [leftAni, frontAni, rightAni, backAni], 
	//         8-direction=[l,lf,f,fr,r,rb,b,lb], ...
	//    the reason that directions start from left, is almost all Arcade builtin one side images are facing left, so that would be convient for using.
	// 2nd dimension is animation Images
	//    length=1 to any, e.g. 1,2,3,4,..., engine will automatically loop them by aniInterval(set when create CompactSprite, or use default)
	
	
	//simplest, just one static image, looks the same in all angle of view
	const texturesDonut = [[sprites.food.smallDonut]]
	const texturesBigCake = [[sprites.food.bigCake]]
	
	//1-direction, with ani, looks the same Ani in all angle of view
	const texturesCoin = [[sprites.builtin.coin0, sprites.builtin.coin1, sprites.builtin.coin2, sprites.builtin.coin3, sprites.builtin.coin4, sprites.builtin.coin5]]
	
	const texturesDog = [[sprites.builtin.dog0, sprites.builtin.dog1, sprites.builtin.dog2]]
	const texturesDuck = [[sprites.duck.duck1, sprites.duck.duck2, sprites.duck.duck3, sprites.duck.duck4, sprites.duck.duck5, sprites.duck.duck6]]
	
	//2-direction, with ani, looks difference from left or right side
	const texturesPlane = [[sprites.vehicle.plane0, sprites.vehicle.plane1, sprites.vehicle.plane2, sprites.vehicle.plane3, sprites.vehicle.plane4, sprites.vehicle.plane5],
	[sprites.vehicle.plane0, sprites.vehicle.plane1, sprites.vehicle.plane2, sprites.vehicle.plane3, sprites.vehicle.plane4, sprites.vehicle.plane5]]
	//no right side ani images builtin, so make them from lefts, and then flipX
	imagesFlipX(texturesPlane[1])
	
	const texturesFish = [[sprites.builtin.angelFish0, sprites.builtin.angelFish1, sprites.builtin.angelFish2, sprites.builtin.angelFish3],
	[sprites.builtin.angelFish0, sprites.builtin.angelFish1, sprites.builtin.angelFish2, sprites.builtin.angelFish3]]
	imagesFlipX(texturesFish[1])
	
	//4-direction
	const texturesHero = [
	    [sprites.castle.heroWalkSideLeft1, sprites.castle.heroWalkSideLeft2, sprites.castle.heroWalkSideLeft3, sprites.castle.heroWalkSideLeft4],
	    [sprites.castle.heroWalkFront1, sprites.castle.heroWalkFront2, sprites.castle.heroWalkFront3, sprites.castle.heroWalkFront4],
	    [sprites.castle.heroWalkSideRight1, sprites.castle.heroWalkSideRight2, sprites.castle.heroWalkSideRight3, sprites.castle.heroWalkSideRight4],
	    [sprites.castle.heroWalkBack1, sprites.castle.heroWalkBack2, sprites.castle.heroWalkBack3, sprites.castle.heroWalkBack4],
	]
	
	const texturesPrincess2 = [
	    [sprites.castle.princess2Left1, sprites.castle.princess2Left2],
	    [sprites.castle.princess2WalkFront1, sprites.castle.princess2WalkFront2, sprites.castle.princess2WalkFront3, sprites.castle.princess2WalkFront2],
	    [sprites.castle.princess2Right1, sprites.castle.princess2Right2],
	    [sprites.castle.princess2WalkBack1, sprites.castle.princess2WalkBack2, sprites.castle.princess2WalkBack3, sprites.castle.princess2WalkBack2],
	]
	
	//4-direction, but back side has only 1 image, so no ani when looking from back
	const texturesSkelly = [
	    [sprites.castle.skellyWalkLeft1, sprites.castle.skellyWalkLeft2],
	    [sprites.castle.skellyWalkFront1, sprites.castle.skellyWalkFront2, sprites.castle.skellyWalkFront3],
	    [sprites.castle.skellyWalkRight1, sprites.castle.skellyWalkRight2],
	    [img`
	        ........................
	        ........................
	        ........................
	        ........................
	        ..........ffff..........
	        ........ff1111ff........
	        .......fb111111bf.......
	        .......f11111111f.......
	        ......fd11111111df......
	        ......fd11111111df......
	        ......fd11111111df......
	        ......fb11111111bf......
	        ......fcd111111dcf......
	        .......fb111111bf.......
	        .....ffffdb1bdcfff......
	        ....fc111cfbfbc111cf....
	        ....f11111ffff11111f....
	        ....fbfbfbffffffbfbf....
	        .........ffffff.........
	        ..........fff...........
	        ........................
	        ........................
	        ........................
	        ........................
	    `],
	]
	
	const texturesPrincess = [
	    [sprites.castle.princessLeft0, sprites.castle.princessLeft1, sprites.castle.princessLeft0, sprites.castle.princessLeft2],
	    [sprites.castle.princessFront0, sprites.castle.princessFront1, sprites.castle.princessFront0, sprites.castle.princessFront2],
	    [],
	    [sprites.castle.princessBack0, sprites.castle.princessBack1, sprites.castle.princessBack0, sprites.castle.princessBack2],
	]
	texturesPrincess[0].forEach((v, i) => {
	    texturesPrincess[2].push(v.clone())
	    texturesPrincess[2][i].flipX()
	}
	)
	
	function imagesFlipX(ani: Image[]) {
	    ani.forEach((img, i) => {
	        ani[i] = img.clone() //don't worry memery leak or waste, cause old images are still using by left
	        ani[i].flipX()
	    })
	}

//////////////////////// end of animation.ts contents of previous version //////////////



game.stats = true
const rcRender = Render.raycastingRender
let trans16 = image.create(16, 16)
let map = tiles.createTilemap(hex`1000100002020202020202020202020202020202020000000000000000000000000000020200000000000000000000000000000202000000000000000000000000000002020000000000000000000000000000020200000002020200000101010100000202000000020000000000000001000002020000000200000000000000010000020200000000000000000000000000000202000000000000000200000000000002020000000200000000000000010000020200000002000000000000000100000202000000020202020000010101000002020000000000000000000000000000020200000000000000000000000000000202020202020202020202020202020202`, img`
2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 
2 . . . . . . . . . . . . . . 2 
2 . . . . . . . . . . . . . . 2 
2 . . . . . . . . . . . . . . 2 
2 . . . . . . . . . . . . . . 2 
2 . . . 2 2 2 . . 2 2 2 2 . . 2 
2 . . . 2 . . . . . . . 2 . . 2 
2 . . . 2 . . . . . . . 2 . . 2 
2 . . . . . . . . . . . . . . 2 
2 . . . . . . . 2 . . . . . . 2 
2 . . . 2 . . . . . . . 2 . . 2 
2 . . . 2 . . . . . . . 2 . . 2 
2 . . . 2 2 2 2 . . 2 2 2 . . 2 
2 . . . . . . . . . . . . . . 2 
2 . . . . . . . . . . . . . . 2 
2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 2 
`, [trans16, sprites.castle.tileGrass2, sprites.builtin.forestTiles0], TileScale.Sixteen);
tiles.setCurrentTilemap(map)

scene.setBackgroundImage(img`
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    ................................................................................................................................................................
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
    bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb
`)

const tilemapScale = 1 << game.currentScene().tileMap.scale
rcRender.sprSelf.setPosition(8 * tilemapScale, 8 * tilemapScale)
// tiles.setCurrentTilemap(tiles.tilemap`level1`)

// const characterAniDirs = [Predicate.MovingLeft, Predicate.MovingDown, Predicate.MovingRight, Predicate.MovingUp]
// function setCharacterAnimationForSprite(spr: Sprite, textures: Image[][]) {
//     characterAniDirs.forEach((dir, i) => {
//         character.loopFrames(spr, textures[Math.floor(i * textures.length / characterAniDirs.length)], 150, character.rule(dir))
//     })
// }

let count = 0
function createSprite(x: number, y: number, vx: number, vy: number, textures: Image[][], kind: number) {
    const spr = sprites.create(textures[0][0], kind)
    rcRender.takeoverSceneSprites()
    const tilemapScale = 1 << game.currentScene().tileMap.scale
    spr.setPosition(x * tilemapScale, y * tilemapScale)
    spr.setVelocity(vx, vy)
    spr.setBounceOnWall(true)
    spr.setScale(0.5)
    // setCharacterAnimationForSprite(spr, textures)
    Render.setSpriteAnimations(spr, Render.createAnimations(150, textures[0],textures[1],textures[2],textures[3]))

    return spr
}

// 0<= dir <1, then may be added by 2 for avoid negative
rcRender.registerOnSpriteDirectionUpdate((spr, dir)=>{
    // character.setCharacterState(spr, character.rule(characterAniDirs[Math.floor(dir * 4 + .5) % 4]))
})

let sprPriness2 = createSprite(11, 8, 0, 11, texturesPrincess2, SpriteKind.Enemy)
let sprSkelly = createSprite(11, 7, 0, 11, texturesSkelly, SpriteKind.Enemy)
let sprHero = createSprite(10, 8, 0, 11, texturesHero, SpriteKind.Enemy)
let sprPriness = createSprite(10, 7, 0, 11, texturesPrincess, SpriteKind.Enemy)
createSprite(5, 7, 0, 11, texturesDog, SpriteKind.Enemy)
createSprite(9, 7, 0, 11, texturesPlane, SpriteKind.Enemy)
createSprite(8, 7, 0, 11, texturesDuck, SpriteKind.Enemy)
createSprite(6, 7, 0, 11, texturesDonut, SpriteKind.Enemy)
let cake=createSprite(1, 1, 0, 0, texturesBigCake, SpriteKind.Enemy)
cake.setFlag(SpriteFlag.RelativeToCamera, true)
let fish = createSprite(7, 7, 0, 11, texturesFish, SpriteKind.Enemy)
rcRender.setOffsetZ(fish,-.25)

for(let i=0;i<10;i++){
    let spr=createSprite(4, 7, Math.randomRange(5,10), Math.randomRange(3,10), texturesCoin, SpriteKind.Food)
    tiles.placeOnRandomTile(spr, trans16)
    rcRender.setOffsetZ(spr,-.25)
}

controller.A.onEvent(ControllerButtonEvent.Pressed, () => {
    // game.splash(game.currentScene().allSprites.filter(spr => { return !(spr instanceof Sprite) }).map(spr => spr.z).join())
    music.baDing.play()
    let s = sprites.createProjectileFromSprite(sprites.projectile.bubble1, rcRender.sprSelf, rcRender.dirX * 55, rcRender.dirY * 55)
    s.setScale(0.25)
    rcRender.setOffsetZ(s, -.25)
})

sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Projectile, function (sprite, otherSprite) {
    music.knock.play()
    info.changeScoreBy(1)
    sprite.destroy()
    otherSprite.destroy()
    rcRender.sprSelf.setPosition(sprite.x,sprite.y)
})
sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Food, function (sprite, otherSprite) {
    music.pewPew.play()
    otherSprite.destroy()
})
sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Enemy, function (sprite, otherSprite) {
    otherSprite.setVelocity(otherSprite.x - sprite.x, otherSprite.y - sprite.y)
    sprite.setVelocity(-(otherSprite.x - sprite.x), -(otherSprite.y - sprite.y))
})

sprites.onOverlap(SpriteKind.Player, SpriteKind.Enemy, function (sprite, otherSprite) {
    otherSprite.setVelocity(otherSprite.x-sprite.x, otherSprite.y-sprite.y)
    // otherSprite.setPosition(otherSprite.x + otherSprite.vx / Math.abs(otherSprite.vx) / 2, otherSprite.y + otherSprite.vy / Math.abs(otherSprite.vy) / 2)
})

sprites.onOverlap(SpriteKind.Player, SpriteKind.Food, function (sprite, otherSprite) {
    music.baDing.play()
    info.changeLifeBy(1)
    otherSprite.destroy()
})

controller.menu.onEvent(ControllerButtonEvent.Pressed, () => {
    rcRender.viewMode = rcRender.viewMode==ViewMode.tilemapView? ViewMode.raycastingView: ViewMode.tilemapView
})

controller.B.onEvent(ControllerButtonEvent.Pressed, () => {
    for (let fov = Render.defaultFov; fov > Render.defaultFov - .6; fov -= .06) {
        rcRender.fov=fov
        pause(20)
    }
})
controller.B.onEvent(ControllerButtonEvent.Released, () => {
    for (let fov = Render.defaultFov - .6; fov <= Render.defaultFov; fov += .06) {
        rcRender.fov=fov
        pause(20)
    }
})
