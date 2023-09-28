// Auto-generated code. Do not edit.
namespace myTiles {
    //% fixedInstance jres blockIdentity=images._tile
    export const transparency16 = image.ofBuffer(hex``);
    //% fixedInstance jres blockIdentity=images._tile
    export const tile5 = image.ofBuffer(hex``);
    //% fixedInstance jres blockIdentity=images._tile
    export const tile1 = image.ofBuffer(hex``);

    helpers._registerFactory("tilemap", function(name: string) {
        switch(helpers.stringTrim(name)) {
            case "level0":
            case "level2":return tiles.createTilemap(hex`200010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000300000000000000000000000000000000000000000000000000000000000000000000000000000004000000020202020000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000101010100000000000202000000000000000000000000000000000000000000000000000000000000000000000002020202020200000002020200000002020000000000000007070000000000000000000000000000000000000000000000000005000000000000000000000000000000000000000000000000000105000000000000000000000000000005000000000000000000000000000000010101010101010101010101010101010101010101010101010101010101010101`, img`
................................
................................
................................
................................
................................
................................
................................
................................
................2222............
................................
....2222.....22.................
..................222222...222..
.22.......22....................
...............................2
...............................2
22222222222222222222222222222222
`, [myTiles.transparency16,sprites.builtin.brick,sprites.castle.tileGrass2,sprites.builtin.coral5,sprites.builtin.coral0,sprites.builtin.coral2,myTiles.tile5,myTiles.tile1], TileScale.Sixteen);
        }
        return null;
    })

    helpers._registerFactory("tile", function(name: string) {
        switch(helpers.stringTrim(name)) {
            case "transparency16":return transparency16;
            case "myTile3":
            case "tile5":return tile5;
            case "myTile":
            case "tile1":return tile1;
        }
        return null;
    })

}
// Auto-generated code. Do not edit.
