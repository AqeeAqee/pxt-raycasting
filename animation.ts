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

