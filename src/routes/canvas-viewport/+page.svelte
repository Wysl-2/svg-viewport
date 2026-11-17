<script lang="ts">
    import { onMount } from "svelte";

    import { Viewport } from "#lib/viewport/viewport.svelte.ts";
    import { Grid } from "#lib/viewport/grid.svelte.ts"
    import { GridGeometry } from "#lib/viewport/geometry/gridGeometry.svelte.ts";
    import { AxesGeometry } from "#lib/viewport/geometry/axesGeometry.svelte.ts";
    import type { Vector2 } from "#lib/viewport/types.ts"
    import {clientToCanvas } from "#lib/viewport/renderers/coordinates.ts";
    
    const viewport = new Viewport();
    const grid = new Grid();
    
    const gridGeometry = new GridGeometry(viewport, grid);
    const axes = new AxesGeometry(viewport);

    let canvas: HTMLCanvasElement | null = null;
    let ctx: CanvasRenderingContext2D | null = null;

    let lastPointerPosition: Vector2 | null = $state(null);
    let isDragging = $state(false);

    let graphPosition: Vector2 = $state({x: 0, y: 0})
    let gridIndexLocal = $state(grid.worldToGridLocal({ x: 0, y: 0 }));
    
    onMount(() => {
        ctx = canvas?.getContext("2d") ?? null;

        if (!ctx) return;
        
        render(ctx);
            
    });
    
    function render(ctx: CanvasRenderingContext2D) {
            ctx.clearRect(0, 0, viewport.width, viewport.height);

            ctx.strokeStyle = "lightgrey";
            ctx.beginPath();
        
            for (const line of gridGeometry.xGridLines) {
                    ctx.moveTo(line.start.x, line.start.y);
                    ctx.lineTo(line.end.x, line.end.y);
            }
        
            for (const line of gridGeometry.yGridLines) {
                    ctx.moveTo(line.start.x, line.start.y);
                    ctx.lineTo(line.end.x, line.end.y);
            }
            ctx.stroke();
        
            ctx.strokeStyle = "black";
        
            ctx.beginPath();
        
            ctx.moveTo(axes.horizontalAxis.start.x, axes.horizontalAxis.start.y);
            ctx.lineTo(axes.horizontalAxis.end.x, axes.horizontalAxis.end.y);
        
            ctx.moveTo(axes.verticalAxis.start.x, axes.verticalAxis.start.y);
            ctx.lineTo(axes.verticalAxis.end.x, axes.verticalAxis.end.y);
            ctx.stroke();
    }

    function handlePointerMove(event: PointerEvent) {
            if (!canvas) return;

            const point = clientToCanvas(
                    { x: event.clientX, y: event.clientY },
                    canvas
            );

            if (isDragging && lastPointerPosition) {
                    const delta: Vector2 = {
                            x: point.x - lastPointerPosition.x,
                            y: point.y - lastPointerPosition.y
                    };

                    viewport.panByPixels(delta);

                    if (ctx) {
                            render(ctx);
                    }
            }

            lastPointerPosition = point;

            graphPosition = viewport.viewportToWorld(point);
            gridIndexLocal = grid.worldToGridLocal(graphPosition);
    }

    function handlePointerDown(event: PointerEvent) {
            if (!canvas || event.button !== 0) return;

            isDragging = true;

            lastPointerPosition = clientToCanvas(
                    { x: event.clientX, y: event.clientY },
                    canvas
            );

            canvas.setPointerCapture(event.pointerId);
    }

    function handlePointerUp(event: PointerEvent) {
            isDragging = false;
            lastPointerPosition = null;
            
            if (!canvas) return;
            
            if (canvas.hasPointerCapture(event.pointerId)) {
                    canvas.releasePointerCapture(event.pointerId);
            }
    }

    function handleWheel(event: WheelEvent) {
            if(!canvas) return;
            event.preventDefault();
            
            const canvasPoint = clientToCanvas(
                    { x: event.clientX, y: event.clientY },
                    canvas
            );

            const graphPoint = viewport.viewportToWorld(canvasPoint);

            const zoomFactor = event.deltaY < 0 ? 1.1 : 1 / 1.1;

            viewport.zoomAt(zoomFactor, graphPoint);

            graphPosition = viewport.viewportToWorld(canvasPoint);
            gridIndexLocal = grid.worldToGridLocal(graphPosition);
            
            if(!ctx) return;
            render(ctx)
    }
    
</script>

<div>
        Pos: ({(graphPosition.x).toFixed(3)},{(graphPosition.y).toFixed(3)})
        Cell: ({gridIndexLocal.index.x},{gridIndexLocal.index.y})
        Cell Local: ({(gridIndexLocal.local.x).toFixed(2)},{(gridIndexLocal.local.y).toFixed(2)})
</div>
<div>
    <canvas 
        bind:this={canvas}    
        width={viewport.width}
        height={viewport.height}
        onpointerdown={handlePointerDown}
        onpointermove={handlePointerMove}
        onpointerup={handlePointerUp}
        onpointercancel={handlePointerUp}
        onwheel={handleWheel}
    ></canvas>
</div>

<style>
        canvas {
                margin: 5px;
                border: 1px solid black;
        }
</style>