# set Attribute

 * Set render arribute

```sig
Render.SetAttribute()
```


## Parameters
* **attribute**  dirX,dirY,fov,wallZScale
* **value**
## ~hint
 * **dirX**: view direction x
 * **dirY**: view direction y
 * **fov**:  field of view, for zoom in/out, default value can be get by [defaultFov](docs/default-fov.md)
 * **wallZScale**: scale up/down height of walls in z dimension, this is a radio value, default is 1.
## ~

## Returns

* none

## Example

```blocks
Render.SetAttribute(Render.attribute.fov, Render.getAttribute(Render.attribute.fov)/2)
)
```

```package
pxt-raycasting=github:aqeeaqee/pxt-raycasting
```