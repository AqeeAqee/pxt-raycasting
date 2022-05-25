# is Sprite Overlap Z

 * Check if 2 sprites overlaps each another in Z dimension

```sig
Render.isSpritesOverlapZ()
```


## Parameters
* **sprite1** [sprite](/types/sprite) to check with
* **sprite2** [sprite](/types/sprite) to check with
## ~hint
 * Best work together with sprites.onOverlap(kind1, kind2), which check overlaping in X&Y dimension
## ~

## Returns

* a [boolean](types/boolean): true if overlaped at Z dimension, nothing todo with X Y dimension

## Example

```blocks
sprites.onOverlap(SpriteKind.Enemy, SpriteKind.Projectile, function (sprite, otherSprite) {
    if (Render.isSpritesOverlapZ(sprite, otherSprite)) {
        otherSprite.destroy()
        info.changeScoreBy(1)
    }
})
```

```package
pxt-raycasting=github:aqeeaqee/pxt-raycasting
```