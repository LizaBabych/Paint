import React, {useEffect, useRef} from 'react';
import {fromEvent, Observable, ObservedValueOf} from 'rxjs'
import {map, pairwise, startWith, switchMap, takeUntil, withLatestFrom} from 'rxjs/operators'
import './app.module.css'

interface IOptions {
    lineWidth: string,
    color: string
}

interface ICanvasPoint {
    x: number,
    y: number,
    options: IOptions
}

const App = () => {
    const canvasRef = useRef(null);
    const colorRef = useRef(null);
    const rangeRef = useRef(null);
    const clearRef = useRef(null);

    useEffect(() => {
        const canvas: any = canvasRef.current;
        const ctx =  canvas.getContext("2d");
        const rect = canvas.getBoundingClientRect();
        const scale = window.devicePixelRatio;
        canvas.width = rect.width * scale;
        canvas.height = rect.height * scale;
        ctx.scale(scale, scale);

        const mouseMove$ = fromEvent(canvas, 'mousemove');
        const mouseDown$ = fromEvent(canvas, 'mousedown');
        const mouseUp$ = fromEvent(canvas, 'mouseup');
        const mouseOut$ = fromEvent(canvas, 'mouseout');

        const color: any = colorRef.current;
        const lineWidth: any = rangeRef.current;
        const clear: any = clearRef.current;

        const lineWidth$ = createInputStream(lineWidth);
        const strokeStyle$ = createInputStream(color);
        const clear$ = fromEvent(clear, 'click');

        clear$.subscribe(() => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        })

        const stream$ = mouseDown$
            .pipe(
                withLatestFrom(lineWidth$, strokeStyle$, (_, lineWidth: ObservedValueOf<Observable<any>>, color: ObservedValueOf<Observable<any>>) => {
                    return {
                        lineWidth,
                        color
                    }
                }),
                switchMap( (options: IOptions) => {
                    return mouseMove$
                        .pipe(
                            map((e: any) => ({
                                x: e.offsetX,
                                y: e.offsetY,
                                options
                            })),
                            pairwise(),
                            takeUntil(mouseUp$),
                            takeUntil(mouseOut$),
                        )
                })
            )

        stream$.subscribe(([from, to]: [ICanvasPoint, ICanvasPoint]) => {
            console.log([from, to])
            const { lineWidth, color } = from.options;
            ctx.lineWidth = lineWidth;
            ctx.strokeStyle = color;
            ctx.beginPath();
            ctx.moveTo(from.x, from.y);
            ctx.lineTo(to.x, to.y);
            ctx.stroke();
        })
    }, []);

    function createInputStream(node: any) {
        return fromEvent(node, 'input')
            .pipe(
                map((e: any) => e.target.value),
                startWith(node.value)
            )
    }

    return (
        <div className="container">
            <canvas id='canvas' ref={canvasRef}/>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <input ref={rangeRef} type="range" min={1} max={4} className="form-control-range" />
                <br />
                <input ref={colorRef} type="color"/>
                <br />
                <button ref={clearRef} className='btn btn-success'>Clear</button>
            </div>
        </div>
    );
}

export default App;
