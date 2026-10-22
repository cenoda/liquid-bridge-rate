// Mindustry V8. Keep every building and its factory supplied by the game.
const rateKey = "liquid-bridge-rate-index";
const rates = [0.5, 1, 2, 3, 4];
const maskedWarmup = -1024;
let masks = [];
let frameRate = 1;
let previousRate = -1;
let skipHalfFrame = false;
let failed = false;

Core.settings.defaults(rateKey, 2);

function readRate(){
    const index = Core.settings.getInt(rateKey, 2);
    return rates[index] === undefined ? 2 : rates[index];
}

function active(){
    return !failed && Vars.state.isGame() && !Vars.state.isPaused() &&
        !Vars.state.isEditor() && !Vars.state.gameOver &&
        !Vars.world.isGenerating() && !Vars.net.client();
}

function isBridge(build){
    return build.block === Blocks.bridgeConduit || build.block === Blocks.phaseConduit;
}

function restoreMasks(){
    // Clear the list first so cleanup is safe when events are nested.
    const pending = masks;
    masks = [];
    for(let i = 0; i < pending.length; i++){
        const entry = pending[i];
        const build = entry.build;
        if(build.warmup < 0){
            // An unchanged marker means updateTile did not run (e.g. disabled).
            // A changed negative marker means vanilla advanced warmup normally.
            build.warmup = build.warmup === maskedWarmup ? entry.warmup :
                Mathf.approachDelta(entry.warmup, build.efficiency, 1 / 30);
        }
        // A nonnegative value was set by vanilla, e.g. an invalid link resets
        // warmup to zero. Preserve that value.
    }
}

function stopOnError(error){
    failed = true;
    restoreMasks();
    Log.err("[liquid-bridge-rate] Disabled until restart: " + String(error));
}

function beforeUpdate(){
    try{
        restoreMasks();
        frameRate = 1;
        if(!active()) return;
        frameRate = readRate();
        if(frameRate !== previousRate){
            skipHalfFrame = false;
            previousRate = frameRate;
        }
        if(frameRate !== 0.5) return;

        skipHalfFrame = !skipHalfFrame;
        if(!skipHalfFrame) return;
        // Only the 0.5 setting needs to suppress a vanilla transfer. Temporarily
        // keep its existing warmup guard closed on alternating simulation ticks.
        // Consumption, link checks, animation, and dumping still update normally.
        Groups.build.each(function(build){
            if(isBridge(build) && build.warmup >= 0){
                masks.push({build: build, warmup: build.warmup});
                build.warmup = maskedWarmup;
            }
        });
    }catch(error){
        stopOnError(error);
    }
}

function afterUpdate(){
    try{
        restoreMasks();
        if(!active() || frameRate <= 1) return;
        Groups.build.each(function(build){
            if(!isBridge(build) || !build.isValid() || !build.enabled ||
                !build.hadValidLink || build.warmup < 0.25) return;
            const other = Vars.world.tile(build.link);
            if(!build.block.linkValid(build.tile, other)) return;
            // Vanilla already performed the first call during this tick.
            for(let call = 1; call < frameRate; call++){
                if(!build.isValid() || other.build == null) break;
                if(build.moveLiquid(other.build, build.liquids.current()) > 0.05){
                    build.moved = true;
                }
            }
        });
    }catch(error){
        stopOnError(error);
    }
}

function reset(){
    restoreMasks();
    frameRate = 1;
    previousRate = -1;
    skipHalfFrame = false;
}

// Functions convert to existing Java interfaces; no new building classes exist.
Events.run(Trigger.beforeGameUpdate, beforeUpdate);
Events.run(Trigger.afterGameUpdate, afterUpdate);
Events.run(Trigger.update, restoreMasks);
Events.on(WorldLoadBeginEvent, reset);
Events.on(ResetEvent, reset);
// Never serialize the temporary 0.5-mode warmup marker.
Events.on(SaveWriteEvent, restoreMasks);

Events.on(ClientLoadEvent, function(){
    Vars.ui.settings.addCategory("Liquid Bridges", function(table){
        table.sliderPref(rateKey, 2, 0, rates.length - 1, function(index){
            return rates[index] + " calls / update";
        });
    });
});
