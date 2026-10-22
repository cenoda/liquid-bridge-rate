// Mindustry v8: bridge-conduit + phase-conduit.
// The setting is the TOTAL moveLiquid call count, including vanilla's call.
const rateKey = "liquid-bridge-rate-index";
const rates = [0.5, 1, 2, 3, 4];
const BridgeBuild = Packages.mindustry.world.blocks.liquid.LiquidBridge.LiquidBridgeBuild;

Core.settings.defaults(rateKey, 2); // index 2 = 2 calls per eligible update.

function readRate(){
    const index = Core.settings.getInt(rateKey, 2);
    return rates[index] === undefined ? 2 : rates[index];
}

function installBridge(block){
    block.buildType = prov(function(){
        // Separate accumulator for every building; no shared/global tick counter.
        let credit = 0;
        let previousRate = -1;

        return new JavaAdapter(BridgeBuild, {
            updateTransport: function(other){
                // Same warmup requirement as vanilla LiquidBridgeBuild.
                if(this.warmup < 0.25){
                    credit = 0;
                    return;
                }

                const rate = readRate();
                if(rate !== previousRate){
                    credit = 0;
                    previousRate = rate;
                }

                credit += rate;
                const calls = Math.floor(credit);
                credit -= calls;
                if(calls === 0) return;

                // Keep vanilla's first moveLiquid() call.
                this.super$updateTransport(other);

                // At the default 2 setting, this loop adds exactly ONE call.
                for(let i = 1; i < calls; i++){
                    if(this.moveLiquid(other, this.liquids.current()) > 0.05){
                        this.moved = true;
                    }
                }
            }
        }, block);
    });
}

// Replace the factories before any map/building is loaded.
Events.on(ContentInitEvent, cons(function(){
    installBridge(Blocks.bridgeConduit);
    installBridge(Blocks.phaseConduit);
}));

Events.on(ClientLoadEvent, cons(function(){
    Vars.ui.settings.addCategory("액체 다리", cons(function(table){
        table.sliderPref(rateKey, 2, 0, rates.length - 1, function(index){
            return rates[index] + "회 / update";
        });
    }));
}));
