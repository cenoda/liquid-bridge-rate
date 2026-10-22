# Liquid Bridge Rate - Mindustry V8 JS Mod

In Mindustry, open **Mods > Import Mod > Import from GitHub**, enter the following repository, and restart the game:

```text
cenoda/liquid-bridge-rate
```

Once the mod is indexed, search the mod browser for **Liquid Bridge Rate** or **liquid-bridge-rate**.
New repositories can take a few hours to appear after the browser list refreshes.
You can also install a downloaded ZIP through **Mods > Import Mod > Import from File**.

Open **Settings > Liquid Bridges** to select 0.5, 1, 2, 3, or 4 calls per update.
The default is 2, and changes take effect immediately.

| Setting | `moveLiquid()` calls per eligible update |
| --- | --- |
| 0.5 | One call every two updates |
| 1 | One vanilla call |
| 2 (default) | One vanilla call plus one additional call |
| 3 | One vanilla call plus two additional calls |
| 4 | One vanilla call plus three additional calls |

The mod applies to the Bridge Conduit (`bridge-conduit`) and Phase Conduit (`phase-conduit`).
Link validation, enabled-state checks, warmup requirements, and dumping liquid from the receiving bridge to nearby blocks follow vanilla behavior.
At 0.5 calls per update, only transport to the linked bridge is skipped on alternate eligible updates; other building updates continue.
Each call recalculates liquid pressure and available liquid, so the call count does not guarantee a proportional increase in actual flow.

For multiplayer, install the mod on the host/server and use its settings.
A joining player's settings cannot change another server's behavior. Dedicated servers use the default of 2 calls per update.
Other mods that replace `buildType` for the same two blocks may conflict with this mod.
To integrate this into an existing JS mod, copy `scripts/main.js` and the `bundles` entries, then restart the game.

Based on `LiquidBridge.LiquidBridgeBuild.updateTransport()` in Mindustry V8 build 160.7.
The mod passed 42 assertions on a V8 build 160.7 dedicated server, covering mod loading, call counts for both bridges,
warmup requirements, independent building behavior, and immediate setting changes. The graphical settings screen has not been tested at runtime.
