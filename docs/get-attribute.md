# get Attribute

 * Get render arribute

```sig
Render.getAttribute()
```


## Parameters
* **attribute**  dirX,dirY,fov,wallZScale
## ~hint
 * **dirX**: view direction x
 * **dirY**: view direction y
 * **fov**:  field of view, for zoom in/out, default value can be get by [defaultFov](docs/default-fov.md)
 * **wallZScale**: scale up/down height of walls in z dimension, this is a radio value, default is 1.
## ~

## Returns

* value according to specific 

## Example

```blocks
let v=Render.getAttribute(Render.attribute.fov)/2
Render.SetAttribute(Render.attribute.fov, v)
)
```

```package
pxt-raycasting=github:aqeeaqee/pxt-raycasting
```