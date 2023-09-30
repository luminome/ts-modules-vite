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
/**
 *
 * @param target
 * @param callback
 * @param opt
 */
declare const event: (target: Element, callback: Function, opt?: unknown) => void;
export { event, type event_data };
