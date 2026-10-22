# Liquid Bridge Rate - Mindustry V8 JS Mod

Configure the total number of `moveLiquid()` calls for Bridge Conduits and Phase Conduits.
The default is 2 calls per simulation update.

## Install or update

In Mindustry, open **Mods > Import Mod > Import from GitHub**, enter the following repository, and restart the game:

```text
cenoda/liquid-bridge-rate
```

Version **1.0.2** replaces the implementation that caused an iOS map-loading crash in versions 1.0.0 and 1.0.1.
Fully restart the game after updating so the old building factories and callbacks are discarded.

Once indexed, the mod is searchable in the mod browser as **Liquid Bridge Rate** or **liquid-bridge-rate**.
A new repository can take a few hours to appear after the browser list refreshes.
You can also install the ZIP through **Mods > Import Mod > Import from File**.

## Settings

Open **Settings > Liquid Bridges**. Changes apply on the next simulation update.

| Setting | Total calls |
| --- | --- |
| 0.5 | Skip transport to the linked bridge on alternating simulation updates |
| 1 | One vanilla call per eligible update |
| 2 (default) | One vanilla call plus one additional call |
| 3 | One vanilla call plus two additional calls |
| 4 | One vanilla call plus three additional calls |

Link validation, enabled-state checks, warmup requirements, and output dumping follow vanilla behavior.
Each call recalculates pressure and available liquid. Call counts do not guarantee a proportional increase in actual flow.
Additional calls run after the game's building updates, so their order differs from executing multiple transfers inside one building's update.

The mod applies to `bridge-conduit` and `phase-conduit`, for all teams.
In multiplayer, the host/server controls the rate; the additional simulation is disabled on joining clients.
Dedicated servers default to 2 calls per update.

## Implementation and compatibility

The shipped script uses ordinary JavaScript functions and existing game interfaces.
It keeps vanilla building factories, building classes, and save formats.
It does not use `JavaAdapter`, `extend`, reflection, replacement building factories, or additional JVM class files.
It contains no campaign-reset, sector-deletion, or save-file-writing code.

At 0.5, the script temporarily closes the existing liquid transport warmup guard before alternating simulation updates.
After the building update, it restores the warmup progression that vanilla would have produced.
It also restores pending markers before save writes, world changes, resets, and the next frame.
Other building updates, including consumption, link checks, animation, and dumping, continue.
An unexpected callback error disables the mod's changes until restart and restores pending markers.
Other mods that alter bridge transport or warmup can still interact with this behavior.

## Validation

Tested against Mindustry V8 build 160.7:

- 84 dedicated-server assertions: total call counts for both bridges at every setting; disabled, unlinked, and reverse-linked bridges; warmup progression; live setting changes; pause guards; save cleanup; save reloads; and native building factory identity.
- 34 JavaScript assertions: startup and settings UI registration with adapter/helper APIs blocked, read-only building factories, lifecycle cleanup, simulation guards, and failure cleanup.
- Script registration in Rhino interpreter mode (`optimizationLevel = -1`, as used on iOS), with the dynamic class-adapter entry point blocked.
- Fresh Infested Canyons generation, loading an existing Infested Canyons save, and a save/load round trip with class adapters blocked. Native liquid bridge classes and player cores remained present.

Run the portable checks with:

```sh
node tests/check-script.js
```

An iOS device and its graphical settings screen were not available for direct execution testing.
The interpreter checks do not constitute an iOS device test.
