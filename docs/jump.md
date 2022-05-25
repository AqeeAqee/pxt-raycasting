# jump

 * Make sprite jump, with specific speed and acceleration
 * Simular with Move block, but jump can only happened when sprite is standing, current height = its offset.

```sig
Render.jump()
```


## Parameters
* **sprite**
* **v** vetical speed, unit: pixel/s
* **a** vetical acceleration, unit: pixel/s²

## Returns

* none

## Example

```blocks
controller.B.onEvent(ControllerButtonEvent.Pressed, function () {
    Render.jump(mySprite)
    Render.jump(mySprite, 60, -200)
})
```

```package
pxt-raycasting=github:aqeeaqee/pxt-raycasting
```