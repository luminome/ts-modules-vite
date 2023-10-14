import { vec2 } from "gl-matrix";


interface event_data {
    type: string;
    mode: string | undefined; //set-offset' : 'set-offset-pos';
    state: string | boolean;
    type_meta: string | undefined;
    p1: vec2;
    p2: vec2;
    p3: vec2;
    d2: vec2;
    delta: vec2;
    delta_v: vec2;
    origin: vec2;
    touch_pos: vec2[];
    offset: {x:number, y:number, z:number, zd:number} | undefined;
    offset_pos: {x:number, y:number, z:number} | undefined;
    frame: number;
    button: number | undefined;
    interval: number | undefined;
    mess: string;
}

interface event_options {
    type:string | undefined;
    toggle_keys: string[] | undefined;
    interval: number;
    callback: Function | undefined;
    context_disable: boolean;
}

const opt_default:event_options = {
    type: undefined,
    toggle_keys: undefined,
    interval: 0,
    callback: undefined,
    context_disable: false
}

const ET:event_data = {
    type: 'initial',
    mode: undefined, //set-offset' : 'set-offset-pos';
    type_meta: 'initial',
    state: false,
    p1: vec2.create(),
    p2: vec2.create(),
    p3: vec2.create(),
    d2: vec2.create(),
    delta: vec2.create(),
    delta_v: vec2.create(),
    origin: vec2.create(),
    touch_pos: [vec2.create(), vec2.create()],
    offset: {x:0,y:0,z:0,zd:1.0},
    offset_pos: {x:0,y:0,z:0},
    frame: 0,
    button: undefined,
    interval: undefined,
    mess: ''
}

interface touch_item {
    identifier: number, 
    clientX: number,
    clientY: number 
}

const KEYS:string[] = [];
let ongoingTouches:touch_item[] = [];
// let first_touch_id:number = 0; 
// const d1 = vec2.create();
const du = vec2.create();
let d_delta:number = 0;
let z_delta:number = 0;
let a_delta:number = 0;
let b_delta:number = 0;

// const width = window.visualViewport ? window.visualViewport.width : window.innerWidth;
// const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
const copyTouch = (T:Touch):touch_item => {
    return { identifier: T.identifier, clientX:T.clientX, clientY:T.clientY };
}

const ongoingTouchIndexById = (idToFind:number):number => {
    for (let i = 0; i < ongoingTouches.length; i++) {
        const id = (ongoingTouches[i]).identifier;
        if (id === idToFind) return i;
    }
    return -1; // not found
}
  
const event_cursor = (cb:Function, evt:Event, opt:event_options) => {

    const tgt_has_interval = opt.interval > 0 ? opt.interval : undefined;
    ET.type = evt.type;
    
    evt.preventDefault();
    // evt.stopPropagation();
    evt.stopImmediatePropagation();
    const touching = (evt as TouchEvent).changedTouches;
  
    if(!touching){
        // vec2.set(ET.p2, (evt as MouseEvent).clientX, (evt as MouseEvent).clientY);
        // vec2.copy(ET.origin, ET.p2);
    }
  
    evt instanceof MouseEvent && (ET.button = evt.buttons);
    if(ET.mode === 'set-offset-pos'){
        if(ET.button && ET.button === 2) ET.mode = 'set-offset';/// : 'set-offset-pos';
    }

    const clear_interval = () => {
        tgt_has_interval && clearInterval(ET.interval as number);
        ET.interval = undefined;
        ET.frame = 0;
    }

    const increment = ():void => {
        ET.frame ++;

        if(ET.offset!.z === z_delta) {
            ET.offset!.zd = 1.0;
            ET.type = 'wheel-stop';
            ET.type_meta !== 'drag' && clear_interval();
        }
        z_delta = ET.offset!.z;

        cb(evt, ET);
    }
    
    const start_loop = () => {
        //ET.state === 'down' && !ET.interval && 
        (ET.interval = setInterval((_: TimerHandler) => {increment()}, tgt_has_interval));
    }



    if(evt.type === 'mouseout' || evt.type === 'touchcancel'){
        ET.type_meta = undefined;
        ET.state = evt.type;
        ET.mode = 'set-offset-pos';
        clear_interval();
        cb(evt, ET);
    }

    if(evt.type === 'touchend'){
        for (let i = 0; i < touching.length; i++) {
            const idx = ongoingTouchIndexById(touching[i].identifier);
            if(idx >= 0) ongoingTouches.splice(idx, 1); // remove it; we're done
        }
        if(ongoingTouches.length === 1){
            const t = ongoingTouches[0];
            vec2.set(ET.p1, t.clientX, t.clientY);
            vec2.set(ET.p2, t.clientX, t.clientY);
            vec2.set(ET.p3, 0, 0);
            vec2.set(ET.d2, t.clientX, t.clientY);
        }
    }
    
  
    if(evt.type === 'mouseup' || (touching && ongoingTouches.length === 0)){
        ET.state = 'up';
        ET.type_meta = 'up';
        ET.mode = 'set-offset-pos';
        clear_interval();
        cb(evt, ET);

        // if(ET.frame === 0){
        //     cb(evt, ET);
        // }else{
        //     ET.frame = 0;
        // }
    }

    if(evt.type === 'mousemove' || evt.type === 'touchmove'){
        //vector between events
        if(ET.state === 'down'){
            if(touching){
                for (let i = 0; i < touching.length; i++) {
                    const idx = ongoingTouchIndexById(touching[i].identifier);
                    const t = ongoingTouches[idx];
                    vec2.set(ET.touch_pos[idx], t.clientX, t.clientY);
                    ongoingTouches.splice(idx, 1, copyTouch(touching[i]));
                }

                if(ongoingTouches.length === 1){ //one-touch-tracking
                    ET.mode = 'set-offset-pos';
                    ET.type_meta = 'drag';
                    vec2.copy(ET.p2, ET.touch_pos[0]);
                    
                }else if(ongoingTouches.length === 2){ //two-touch-tracking
                    ET.mode = 'set-offset';
                    vec2.copy(ET.p2, ET.touch_pos[0]);
                    vec2.copy(ET.p3, ET.touch_pos[1]);
                    vec2.sub(du, ET.p2, ET.p3);
                    const d = vec2.length(du);
                    ET.offset!.z += d-d_delta;
                    d_delta = d;
                    
                    const ax = Math.atan2(du[1],du[0]);
                    ET.offset!.x += ax-a_delta;
                    a_delta = ax;

                    vec2.scale(du, du, -0.5);
                    vec2.add(du, du, ET.p2);
                    vec2.sub(du, du, ET.origin);
                    const bx = du[1]*(Math.PI/180);
                    ET.offset!.y += bx-b_delta;
                    b_delta = bx;

                    ET.type_meta = 'drag-special';
                }
            }else{
                vec2.set(ET.p2, (evt as MouseEvent).clientX, (evt as MouseEvent).clientY);
                vec2.copy(ET.origin, ET.p2);
            }

            if(ET.type_meta !== 'drag-special'){
                vec2.subtract(ET.delta, ET.p2, ET.p1);
                vec2.subtract(ET.delta_v, ET.d2, ET.p2);
                
                if(ET.mode === 'set-offset-pos'){
                    ET.offset_pos!.x += ET.delta_v[0];
                    ET.offset_pos!.y += ET.delta_v[1];
                }

                if(ET.mode === 'set-offset'){
                    ET.offset!.x += (ET.delta_v[0]) * (Math.PI/180);
                    ET.offset!.y += (ET.delta_v[1]) * (Math.PI/180);
                }

                vec2.copy(ET.d2, ET.p2);
                vec2.copy(ET.origin, ET.p2);
                ET.type_meta = 'drag';
            }

            !tgt_has_interval && cb(evt, ET);
            
        }
        
    }
    
    if(evt.type === 'mousedown' || evt.type === 'touchstart'){
        if(touching){
            for (let i = 0; i < touching.length; i++) {
                ongoingTouches.push(copyTouch(touching[i]));
                const idx = ongoingTouchIndexById(touching[i].identifier);
                if(idx >= 0){
                    const t = ongoingTouches[idx];
                    vec2.set(ET.touch_pos[idx], t.clientX, t.clientY);
                }
            }
            
            if(ongoingTouches.length === 1){
                vec2.copy(ET.p2, ET.touch_pos[0]);
                vec2.copy(ET.origin, ET.p2);
            }else if(ongoingTouches.length === 2){
                vec2.copy(ET.p2, ET.touch_pos[0]);
                vec2.copy(ET.p3, ET.touch_pos[1]);
                vec2.sub(du, ET.p2, ET.p3);
                d_delta = vec2.length(du);
                a_delta = Math.atan2(du[1],du[0]);
                b_delta = 0;
                vec2.sub(du, ET.p2, ET.p3);
                vec2.scale(du, du, -0.5);
                vec2.add(ET.origin, du, ET.p2);
            }
        }else{
            vec2.set(ET.p2, (evt as MouseEvent).clientX, (evt as MouseEvent).clientY);
            vec2.copy(ET.origin, ET.p2);
        }

        ET.state = 'down';
        ET.type_meta = 'down';
        !ET.interval && tgt_has_interval && setTimeout(start_loop, tgt_has_interval*4.0);
        ET.frame = 0;

        vec2.copy(ET.p1, ET.p2);
        vec2.copy(ET.d2, ET.p2);
        cb(evt, ET);
    }

    if(evt.type === 'wheel'){
        vec2.set(ET.p2, (evt as MouseEvent).clientX, (evt as MouseEvent).clientY);
        vec2.copy(ET.origin, ET.p2);
        const z = (evt as WheelEvent).deltaY;
        ET.offset!.zd = 1+(z/100);
        ET.offset!.z += z;

        cb(evt, ET);
        // !ET.interval && tgt_has_interval && start_loop();
        // ET.frame = 0;
    }

}


// const init_toggle_keys = (toggles:string[]) => toggles.forEach((k:string) => KEYS_TOGGLE[k] = false);
let key_cb_interval:number | undefined = undefined;
const block_toggle:{[k:string]:boolean} = {};


const key_pusher = (cb:Function, evt:KeyboardEvent, opt:event_options) => {
    KEYS.map((v:string) => {
        if(opt.toggle_keys?.includes(v)){
            if(!block_toggle[v]){
                block_toggle[v] = true;
            }else{
                if (KEYS.includes(v)) KEYS.splice(KEYS.indexOf(v), 1);
            }
        }
    });

    if (KEYS.length === 0){
        clearInterval(key_cb_interval);
        key_cb_interval = undefined;
    }else{
        cb(evt, KEYS);
    }
    
}

const event_keyboard = (cb:Function, evt:KeyboardEvent, opt:event_options) => {
    if (evt.type === 'keydown'){
        evt.preventDefault();
        if (!block_toggle[evt.code]){
            if (!KEYS.includes(evt.code)) KEYS.push(evt.code);
            if (!key_cb_interval){
                key_pusher(cb, evt, opt);
                key_cb_interval = setInterval((_: TimerHandler) => {key_pusher(cb, evt, opt)}, opt.interval);
            }
        }
    }   
    if (evt.type === 'keyup'){
        evt.preventDefault();
        if (KEYS.includes(evt.code)) KEYS.splice(KEYS.indexOf(evt.code), 1);
        block_toggle[evt.code] = false;
        if (KEYS.length === 0){
            clearInterval(key_cb_interval);
            key_cb_interval = undefined;
            cb(evt, KEYS);
        } 
    }
}

/**
 * 
 * @param target 
 * @param callback 
 * @param opt 
 */
const event = (target:Element, callback:Function, opt:unknown = opt_default):event_data | undefined => {
    const opts = {...opt_default};
    Object.assign(opts, opt);
    console.log('okay mdsss no.', opts);

    if(opts.type === 'screen'){
        target.addEventListener('wheel', (evt) => {event_cursor(callback, evt, opts)}, false);
        target.addEventListener('mouseup', (evt) => {event_cursor(callback, evt, opts)}, false);
        target.addEventListener('mouseover', (evt) => { event_cursor(callback, evt, opts); }, false);
        target.addEventListener('mouseout', (evt) => {event_cursor(callback, evt, opts)}, false);
        target.addEventListener('mousedown', (evt) => {event_cursor(callback, evt, opts)}, false);
        target.addEventListener('mousemove', (evt) => {event_cursor(callback, evt, opts)}, false);
        target.addEventListener('touchstart', (evt) => {event_cursor(callback, evt, opts)}, false);
        target.addEventListener('touchcancel', (evt) => {event_cursor(callback, evt, opts)}, false);
        target.addEventListener('touchmove', (evt) => {event_cursor(callback, evt, opts)}, false);
        target.addEventListener('touchend', (evt) => {event_cursor(callback, evt, opts)}, false);
        opts.context_disable && target.addEventListener('contextmenu', (evt) => {evt.preventDefault();});
        return ET;
    }
    if(opts.type === 'keyboard'){
        if(opts.interval === 0)opts.interval = 50; //default key-repeat to 50ms
        target.addEventListener('keydown', (evt) => {event_keyboard(callback, evt as KeyboardEvent, opts)});
        target.addEventListener('keyup', (evt) => {event_keyboard(callback, evt as KeyboardEvent, opts)});
        return undefined;
    }
}

// export interface event_data;
export {event, type event_data}
