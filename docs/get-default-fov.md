# get Default Fov

 * Get default FOV (field of view) value

```sig
Render.getDefaultFov()
```


## Parameters
* none

## Returns

* The default fov(field of view) value, is 0.666... (or 2/3)

    ## ~hint
    * field of view, for zoom in/out
    * it is a ratio of view plane vector x & y, or "half view width" and "distance to view plane"
    * if you facing the wall and 1 wall height a way from it, just seeing wall full fill the screen in vertical direction, the distance=screen.height, so for arcade screen that is: 160/2 /120 = 2/3.
    * so, half default will zoom in x2, while double default value means very wide( x2 ) field of view
    ## ~

## Example

```blocks

tiles.setCurrentTilemap(tilemap`level1`)

let v=Render.getDefaultFov()/2
Render.SetAttribute(Render.attribute.fov, v)
)
```

```package
pxt-raycasting=github:aqeeaqee/pxt-raycasting
```