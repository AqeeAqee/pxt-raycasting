# set View Angle

 * Set view angle

```sig
Render.setViewAngle()
```

## Parameters
* **dirX** facing dirction vector x
* **dirY** facing dirction vector Y
## ~hint
 * x=1 y=0 facing east;
 * x=0 y=1 facing south;
 * x=-1 y=0 facing west;
 * x=0 y=-1 facing north
 * dirX/Y values can be any number, not limited in -1,0,1
 * inside, the angle of view = Math.atan2(dirY,dirX)
## ~


## Returns

* none

## Example

```blocks
Render.setViewAngle(0,-1)
```

```package
pxt-raycasting=github:aqeeaqee/pxt-raycasting
```