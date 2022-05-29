# set Sprite Attribute

 * Set arribute of a sprite

```sig
Render.setSpriteAttribute()
```


## Parameters
* **spr**: a Sprite
* **RCSpriteAttribute**:
## ~hint
 * **ZOffset**: make sprite float from ground, unit: pixel
 * **ZPosition**: current position in Z dimension, unit: pixel, modified by move() or jump(). Equal to ZOffset when stand still.
 * **ZVelocity**: Velocity for move/jump
 * **ZAcceleration**: Acceleration for move/jump
## ~

## Returns

* value according to specific 

## Example

```blocks
let mySprite=sprites.create(img`0`, SpriteKind.Player)
let v=Render.getSpriteAttribute(mySprite, RCSpriteAttribute.ZOffset)/2
Render.setSpriteAttribute(mySprite, RCSpriteAttribute.ZOffset, v)
)
```

```package
pxt-raycasting=github:aqeeaqee/pxt-raycasting
```