# move With Controller

* Control the self sprite using the arrow buttons from the controller. 
* To stop controlling self sprite, pass 0 for v and va.

```sig
Render.moveWithController()
```


## Parameters
 * **v** The velocity used for forward/backword movement when up/down is pressed, in pixel/s
 * **va** The angle velocity used for turn view direction when left/right is pressed, in radian/s.

## Returns

* none

## Example

```blocks
Render.moveWithController(2, 3)
```

For disable moving control inside the extension:
```blocks
Render.moveWithController(0, 0)
controller.moveSprite(Render.getRenderSpriteInstance(), 100, 100)
```

```package
pxt-raycasting=github:aqeeaqee/pxt-raycasting
```