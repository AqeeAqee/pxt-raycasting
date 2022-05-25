# move

 * Make sprite jump, with specific speed and acceleration
 * Simular with jump block, but jump can only happened when sprite is standing, current height = its offset.

```sig
Render.move()
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
    Render.move(mySprite, 60, -200)
})
```

```package
pxt-raycasting=github:aqeeaqee/pxt-raycasting
```