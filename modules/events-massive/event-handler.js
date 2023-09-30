import { vec2 } from "gl-matrix";
const ET = {
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
};
const KEYS = [];
// const width = window.visualViewport ? window.visualViewport.width : window.innerWidth;
// const height = window.visualViewport ? window.visualViewport.height : window.innerHeight;
const event_cursor = (cb, evt) => {
    const tgt = evt.target;
    const tgt_has_interval = tgt.dataset.hasinterval;
    ET.type = evt.type;
    ET.type_meta = evt.type;
    if (tgt.dataset.event_alarmed) {
        tgt_has_interval && clearInterval(ET.interval);
        console.log('event consumed by event_alarmed');
        return cb(ET);
    }
    evt.preventDefault();
    evt.stopPropagation();
    const touching = evt.touches;
    if (touching) {
        if (touching.length)
            vec2.set(ET.p1, touching[0].clientX, touching[0].clientY);
    }
    else {
        vec2.set(ET.p1, evt.clientX, evt.clientY);
    }
    evt instanceof MouseEvent && (ET.button = evt.buttons);
    const increment = () => {
        ET.type = 'increment';
        ET.frame++;
        cb(ET);
    };
    const start_loop = () => {
        ET.state === 'down' && !ET.interval && (ET.interval = setInterval((_) => { increment(); }, 50));
    };
    if (evt.type === 'mouseleave' || evt.type === 'touchcancel' || evt.type === 'touchend') {
        ET.state = evt.type;
        tgt_has_interval && clearInterval(ET.interval);
        ET.interval = undefined;
    }
    if (evt.type === 'mouseup' || evt.type === 'touchend' || (touching && touching.length === 0)) {
        ET.state = 'up';
        tgt_has_interval && clearInterval(ET.interval);
        ET.interval = undefined;
        // ET.button = undefined;
        // tgt_has_interval && increment();
        if (ET.frame === 0) {
            cb(ET);
        }
        else {
            ET.frame = 0;
        }
    }
    if (evt.type === 'mousemove' || evt.type === 'touchmove') {
        //vector between events
        if (ET.state === 'down') {
            vec2.subtract(ET.delta, ET.p2, ET.p1);
            ET.type_meta = 'drag';
            // vec2.copy(ET.p2, ET.p1);
            !tgt_has_interval && cb(ET);
        }
    }
    if (evt.type === 'mousedown' || (touching && touching.length > 0)) {
        ET.state = 'down';
        ET.frame === 0 && tgt_has_interval && setTimeout(start_loop, 200);
        ET.frame = 0;
        vec2.copy(ET.p2, ET.p1);
    }
};
const event_keyboard = (cb, evt) => {
    if (evt.type === 'keydown') {
        evt.preventDefault();
        if (!KEYS.includes(evt.code))
            KEYS.push(evt.code);
        cb(KEYS);
    }
    if (evt.type === 'keyup') {
        evt.preventDefault();
        if (KEYS.includes(evt.code))
            KEYS.splice(KEYS.indexOf(evt.code), 1);
        cb(KEYS);
    }
};
const event_screen = (type, target, callback, has_interval = false) => {
    if (type === 'cursor') {
        target.addEventListener('mouseup', (evt) => { event_cursor(callback, evt); }, false);
        target.addEventListener('mouseleave', (evt) => { event_cursor(callback, evt); }, false);
        target.addEventListener('mousedown', (evt) => { event_cursor(callback, evt); }, false);
        target.addEventListener('mousemove', (evt) => { event_cursor(callback, evt); }, false);
        target.addEventListener('touchstart', (evt) => { event_cursor(callback, evt); }, false);
        target.addEventListener('touchcancel', (evt) => { event_cursor(callback, evt); }, false);
        target.addEventListener('touchmove', (evt) => { event_cursor(callback, evt); }, false);
        target.addEventListener('touchend', (evt) => { event_cursor(callback, evt); }, false);
        has_interval && target.setAttribute('data-hasinterval', 'true');
        // target.setAttribute('oncontextmenu','return false;');
        target.addEventListener('contextmenu', (evt) => { evt.preventDefault(); });
    }
    if (type === 'keyboard') {
        target.addEventListener('keydown', (evt) => { event_keyboard(callback, evt); });
        target.addEventListener('keyup', (evt) => { event_keyboard(callback, evt); });
    }
};
// export interface event_data;
export { event_screen, event_keyboard };
