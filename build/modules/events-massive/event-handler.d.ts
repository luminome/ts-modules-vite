import { vec2 } from "gl-matrix";
interface event_data {
    type: string;
    mode: string | undefined;
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
    offset: {
        x: number;
        y: number;
        z: number;
        zd: number;
    } | undefined;
    offset_pos: {
        x: number;
        y: number;
        z: number;
    } | undefined;
    frame: number;
    button: number | undefined;
    interval: number | undefined;
    mess: string;
}
/**
 *
 * @param target
 * @param callback
 * @param opt
 */
declare const event: (target: Element, callback: Function, opt?: unknown) => event_data | undefined;
export { event, type event_data };
