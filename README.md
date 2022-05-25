(Discuss on Makecode Arcade forum at: 
[Raycasting 3D render with directional animation sprites](https://forum.makecode.com/t/raycasting-3d-render-blocks-edition/12921/) )

## Brief:
An extension for Makecode Arcade, render a tilemap into 2.5D view, a kind of less calculation consuming 3D perspective view, with directional animations of sprites, 
based on mmoskal's [3d map](https://forum.makecode.com/t/3d-raycasting-in-arcade/474)

## Quick Start
* Basically, this render just draw a traditional tilemap game into "3D view"
* setTilemap(), walk around with arrow keys
* Do your game as usual
    * sprites, suggest sprite.setScale(0.5) for each, set directional animations with provided animation block.
    * work together with most of Arcade blocks and extensions, sprite, projectile, overlap,...
    * except these drawing screen directly, sprite effects ...
* Operate view pos and collision size with provided "myself sprite", and view direction with "setViewAngle" block
* Switch view mode with block "setViewMode to tilemap(2D)/raycasting(3D)"
* Zoom in/out by set fov

## Features:
* Switch Tilemap(original 2D)/Raycasting(3D by default) view mode with provided "set mode" block
    * The Tilemap mode, basically rendered all stuff via original Arcade functions, so should works as usual
* Work together with most exsiting Arcade blocks:
    * Tilemap: Tilemap designer, all blocks: Place sprite on a specific/random tile, ...
    * Sprite: Manipulate sprite the same way in other tilemap prj before, with almost all blocks:
        * set image,position,speed, acceleration, scale, kind, follow, detroy, ... 
        * note, one-tile size sprite and wall are disproportionate in 3D view, so suggest shrink to 0.5 or less by setScale(), or set small images for sprites.
        * except z (diff from 3D world)
        * except funtions drawing screen directly(effects, say)
    * Projectile: all, except creating from side(side in 3D is diff from 2D)
    * Arcade physical engine: wall, bounce, overlap events, ... (see known issues)
* Predefined "myself" Sprite, for physical events in your code, kind=player, camera followed by default. Operate it as of an ordinary sprits, except can't see it in 3D view.
* Porvide a block for set directional animations of sprite, with the Arcade out-of-box animation editor. Max 4 directions by now, but can be any count, let me know if you need more.
* Porvide a event handler block running codes when direction between myself and sprite changed, can work together with out-of-box Animation blocks and richard Character Animation extension.
* FOV(field of view), zoom in/out, by change "fov" property value
* Mimimap, removed, cause we have real-size and real-time tilemap already. Let me know if you need.
* The offsetZ for sprite, for floating effect, only worked when rendering in 3D view, so collisions could happen even they are far away at Z axis in 3D view
* Porvide jump/move with height&duration parameters for sprites, calculate velocity and acceleration value auto.
* Support original Spirte.sayText(), scaled with sprites together
* Other incompatible: splash/showLongText, they can work, but transparent part is empty, which should be rendered 3D view.

## Known issues:
* Performing: To compactible with existing blocks, many codes are added in, the perf goes down significantly, need tuning later.
* The Arcade phyical engine worked fine if sprite image is square. But if not, say a tall tree, collision will occured before hit the wall at y axis. 
    * Reason: The physical engine working in 2D mode, that consider sprite image as its size(x&y direction). But 3D render consider the image width as size for both x & y axises, height as sprite Z-axis size. This could be fix by override the physical engine, in future, if needed.

## Todo:
* Particles Effects
* Override physic engine. Any one need?
* Pose depended animations, stand, walk, attack. Any one need?
* Perf tuning, Fx8
* Tutorial


----
> Open this page at [https://aqeeaqee.github.io/pxt-raycasting/](https://aqeeaqee.github.io/pxt-raycasting/)

## Use as Extension

This repository can be added as an **extension** in MakeCode.

* open [https://arcade.makecode.com/](https://arcade.makecode.com/)
* click on **New Project**
* click on **Extensions** under the gearwheel menu
* search for **https://github.com/aqeeaqee/pxt-raycasting** and import

## Edit this project ![Build status badge](https://github.com/aqeeaqee/pxt-raycasting/workflows/MakeCode/badge.svg)

To edit this repository in MakeCode.

* open [https://arcade.makecode.com/](https://arcade.makecode.com/)
* click on **Import** then click on **Import URL**
* paste **https://github.com/aqeeaqee/pxt-raycasting** and click import

## Blocks preview

This image shows the blocks code from the last commit in master.
This image may take a few minutes to refresh.

\![A rendered view of the blocks](https://github.com/aqeeaqee/pxt-raycasting/raw/master/.github/makecode/blocks.png)

#### Metadata (used for search, rendering)

* for PXT/arcade
<script src="https://makecode.com/gh-pages-embed.js"></script><script>makeCodeRender("{{ site.makecode.home_url }}", "{{ site.github.owner_name }}/{{ site.github.repository_name }}");</script>
