# set Z Offset

 * Set floating offset height for a sprite at Z direction

```sig
Render.setZOffset()
```


## Parameters
* **sprite** the [sprite](/types/sprite) to be set
* **Zoffset** in pixels, negative floats down, affirmative goes up
* **duration** moving time, if new value diff from current position at Z dimension. 0 for immediately, unit: ms
## ~hint
    * the myself sprite can also be set Z Offset value.
## ~

## Returns

* none

## Example

```blocks
Render.setZOffset(mySprite, 8)
Render.setZOffset(Render.getRenderSpriteInstance(), 8)
```

```package
pxt-raycasting=github:aqeeaqee/pxt-raycasting
```