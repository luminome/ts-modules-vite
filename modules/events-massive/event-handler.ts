import { vec2 } from "gl-matrix";


interface event_data {
    type: string;
    state: string | boolean;
    type_meta: string;
    p1: vec2;
    p2: vec2;
    delta: vec2;
    origin: vec2;
    frame: number;
    button: number | undefined;
    interval: number | undefined;
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
    type_meta: 'initial',
    state: false,
    p1: vec2.create(),
    p2: vec2.create(),
    delta: vec2.create(),
    origin: vec2.create(),
    frame: 0,
    button: undefined,
    interval: undefined
}

const KEYS:string[] = [];

// const width = window.visualViewport ? window.visualViewport.width : window.innerWidth;
// const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;

const event_cursor = (cb:Function, evt:Event, opt:event_options) => {

    const tgt = evt.target!;
    const tgt_has_interval = opt.interval;//(tgt as HTMLElement).dataset.hasinterval;
    ET.type = evt.type;
    ET.type_meta = evt.type;
    
    if((tgt as HTMLElement).dataset.event_alarmed){
        tgt_has_interval && clearInterval(ET.interval);
        console.log('event consumed by event_alarmed');
        return cb(ET);
    }

    evt.preventDefault();
    evt.stopPropagation();
  
    const touching = (evt as TouchEvent).touches;
  
    if(touching){
        if(touching.length) vec2.set(ET.p1, touching[0].clientX, touching[0].clientY);
    }else{
        vec2.set(ET.p1, (evt as MouseEvent).clientX, (evt as MouseEvent).clientY);
    }
  
    evt instanceof MouseEvent && (ET.button = evt.buttons);

    const increment = ():void => {
        ET.type = 'increment';
        ET.frame ++;
        cb(ET);
    }
    
    const start_loop = () => {
        ET.state === 'down' && !ET.interval && (ET.interval = setInterval((_: TimerHandler) => {increment()}, 50));
    }

    if(evt.type === 'mouseleave' || evt.type === 'touchcancel' || evt.type === 'touchend'){
        ET.state = evt.type;
        tgt_has_interval && clearInterval(ET.interval as number);
        ET.interval = undefined;
    }
  
    if(evt.type === 'mouseup' || evt.type === 'touchend' || (touching && touching.length === 0)){
        ET.state = 'up';
        tgt_has_interval && clearInterval(ET.interval as number);
        ET.interval = undefined;
        // ET.button = undefined;

        // tgt_has_interval && increment();
        if(ET.frame === 0){
            cb(ET);
        }else{
            ET.frame = 0;
        }
    }

    if(evt.type === 'mousemove' || evt.type === 'touchmove'){
        //vector between events
        if(ET.state === 'down'){
            vec2.subtract(ET.delta, ET.p2, ET.p1);
            ET.type_meta = 'drag';
            // vec2.copy(ET.p2, ET.p1);
            !tgt_has_interval && cb(ET);
        }
        
    }
    
    if(evt.type === 'mousedown' || (touching && touching.length > 0)){
        ET.state = 'down';
        ET.frame === 0 && tgt_has_interval && setTimeout(start_loop, tgt_has_interval*2.0);
        ET.frame = 0;
        vec2.copy(ET.p2, ET.p1);
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
 
    if(evt.type === 'keydown'){
        evt.preventDefault();

        if(!block_toggle[evt.code]){
            if(!KEYS.includes(evt.code)){
                KEYS.push(evt.code);
            }

            if(!key_cb_interval){
                key_pusher(cb, evt, opt);
                key_cb_interval = setInterval((_: TimerHandler) => {key_pusher(cb, evt, opt)}, opt.interval);
            }
        }
       
        
    }   

    if(evt.type === 'keyup'){
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
const event = (target:Element, callback:Function, opt:unknown = opt_default):void => {
    const opts = {...opt_default};
    Object.assign(opts, opt);
    console.log('okay mdsss no.', opts);

    if(opts.type === 'screen'){
        target.addEventListener('mouseup', (evt) => {event_cursor(callback, evt, opts)}, false);
        target.addEventListener('mouseleave', (evt) => {event_cursor(callback, evt, opts)}, false);
        target.addEventListener('mousedown', (evt) => {event_cursor(callback, evt, opts)}, false);
        target.addEventListener('mousemove', (evt) => {event_cursor(callback, evt, opts)}, false);
        target.addEventListener('touchstart', (evt) => {event_cursor(callback, evt, opts)}, false);
        target.addEventListener('touchcancel', (evt) => {event_cursor(callback, evt, opts)}, false);
        target.addEventListener('touchmove', (evt) => {event_cursor(callback, evt, opts)}, false);
        target.addEventListener('touchend', (evt) => {event_cursor(callback, evt, opts)}, false);
        opts.context_disable && target.addEventListener('contextmenu', (evt) => {evt.preventDefault();});
    }
    if(opts.type === 'keyboard'){
        if(opts.interval === 0)opts.interval = 50; //default key-repeat to 50ms
        target.addEventListener('keydown', (evt) => {event_keyboard(callback, evt as KeyboardEvent, opts)});
        target.addEventListener('keyup', (evt) => {event_keyboard(callback, evt as KeyboardEvent, opts)});
    }
}

// export interface event_data;
export {event, type event_data}
