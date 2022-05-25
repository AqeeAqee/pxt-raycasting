# get Render Sprite Instance

Get the render Sprite, which create automatically, for physical collisions, and holding the view point.

```sig
Render.getRenderSpriteInstance()
```

## ~hint
* You can consider it as "myself", and operate it like a usual sprite, eg.: position, speed, scale, collision, ... 
* But properties relative 3D, eg. ZOffset, ZPosition, viewAngle, and etc. are not in the Sprite class.
## ~

## Parameters

* none

## Returns

* a game [sprite](/types/sprite) which raycasting render using for view point.

## Example

```blocks
Render.getRenderSpriteInstance().setPosition(100,100)
```

```package
pxt-raycasting=github:aqeeaqee/pxt-raycasting
```