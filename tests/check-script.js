// Run with: node tests/check-script.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, '../scripts/main.js'), 'utf8');
let assertions = 0;
function check(actual, expected){ assert.equal(actual, expected); assertions++; }
function harness(){
    const callbacks = new Map();
    const Trigger = {beforeGameUpdate: 'before', afterGameUpdate: 'after', update: 'update'};
    const events = {WorldLoadBeginEvent: 'load', ResetEvent: 'reset', SaveWriteEvent: 'save', ClientLoadEvent: 'client'};
    const bridge = {}, phase = {};
    for(const block of [bridge, phase]) Object.defineProperty(block, 'buildType', {
        get(){ throw Error('Building factory must not be accessed'); },
        set(){ throw Error('Building factory must not be replaced'); }
    });
    const state = {isGame: () => true, isPaused: () => false, isEditor: () => false, gameOver: false};
    const world = {isGenerating: () => false, tile: () => null};
    const net = {client: () => false};
    let setting = 2;
    const buildings = [];
    const group = {each: fn => buildings.forEach(fn)};
    const ui = {settings: {addCategory(title, builder){
        check(title, 'Liquid Bridges');
        builder({sliderPref(key, def, min, max, formatter){
            check(key, 'liquid-bridge-rate-index'); check(def, 2);
            check(min, 0); check(max, 4); check(formatter(0), '0.5 calls / update');
        }});
    }}};
    const context = {
        Core: {settings: {defaults(){}, getInt: () => setting}},
        Blocks: {bridgeConduit: bridge, phaseConduit: phase},
        Vars: {state, world, net, ui}, Groups: {build: group},
        Mathf: {approachDelta(value, target, speed){ return value < target ? Math.min(value + speed, target) : Math.max(value - speed, target); }},
        Log: {err(){}}, Trigger, ...events,
        Events: {run(key, fn){ callbacks.set(key, fn); }, on(key, fn){ callbacks.set(key, fn); }}
    };
    for(const name of ['JavaAdapter', 'extend', 'run', 'cons', 'prov']) Object.defineProperty(context, name, {
        get(){ throw Error('Unsupported adapter/helper accessed: ' + name); }
    });
    vm.runInNewContext(source, context, {filename: 'main.js'});
    check(callbacks.size, 7);
    return {fire: event => callbacks.get(event)(), buildings, bridge, phase, state, world, net, group,
        setting(value){ setting = value; }};
}
function build(block){ return {block, warmup: 0.8, efficiency: 1}; }
{
    const h = harness(), b = build(h.bridge);
    h.buildings.push(b); h.setting(0);
    h.fire('before'); check(b.warmup < 0, true);
    h.fire('save'); check(b.warmup, 0.8);
    h.fire('after'); check(b.warmup, 0.8);
    h.fire('client');
}
for(const cleanup of ['update', 'load', 'reset']){
    const h = harness(), b = build(h.phase);
    h.buildings.push(b); h.setting(0); h.fire('before');
    check(b.warmup < 0, true); h.fire(cleanup); check(b.warmup, 0.8);
}
for(const guard of ['paused', 'editor', 'gameOver', 'generating', 'client', 'menu']){
    const h = harness(), b = build(h.bridge);
    h.buildings.push(b); h.setting(0);
    if(guard === 'paused') h.state.isPaused = () => true;
    if(guard === 'editor') h.state.isEditor = () => true;
    if(guard === 'gameOver') h.state.gameOver = true;
    if(guard === 'generating') h.world.isGenerating = () => true;
    if(guard === 'client') h.net.client = () => true;
    if(guard === 'menu') h.state.isGame = () => false;
    h.fire('before'); h.fire('after'); check(b.warmup, 0.8);
}
{
    const h = harness(), b = build(h.bridge);
    h.buildings.push(b); h.setting(0);
    h.group.each = fn => { fn(b); throw Error('Injected callback failure'); };
    h.fire('before'); check(b.warmup, 0.8);
    h.group.each = fn => h.buildings.forEach(fn);
    h.fire('before'); check(b.warmup, 0.8); // Failure leaves the mod disabled.
}
console.log('PASS: ' + assertions + ' adapter-free registration, UI, guard, and cleanup assertions.');
