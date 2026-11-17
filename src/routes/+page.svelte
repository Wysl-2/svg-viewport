<script lang="ts">
    import { Viewport } from "#lib/viewport/viewport.svelte.ts";
    import { Grid } from "#lib/viewport/grid.svelte.ts"
    import { AxesGeometry } from "#lib/viewport/geometry/axesGeometry.svelte.ts";
    import { GridGeometry } from "#lib/viewport/geometry/gridGeometry.svelte.ts";
    import { clientToSvg } from "#lib/viewport/renderers/coordinates.ts";
    import type { Vector2 } from "#lib/viewport/types.ts";

    const viewport = new Viewport({
        width: 800, 
        height: 800,
        scale: 20,
        viewCenter: {x: 0, y: 0}
    })
    
    const grid = new Grid({
        gridSpacing: 2,
        gridOffset: 0
    })
    
    const axesGeometry = new AxesGeometry(viewport)
    const gridGeometry = new GridGeometry(viewport, grid)
    
    let enableGridLines = $state(true)
    let enableGraphAxes = $state(true)
    
    let graphPosition: Vector2 = $state({x: 0, y: 0})
    let gridIndexLocal = $state(grid.worldToGridLocal({ x: 0, y: 0 }));

    let lastPointerPosition: Vector2 | null = $state(null);
    let isDragging = $state(false);

    function handlePointerMove(event: PointerEvent) {
        const svg = event.currentTarget as SVGSVGElement;

        const point = clientToSvg(
            { x: event.clientX, y: event.clientY },
            svg
        );

        if (isDragging && lastPointerPosition) {
            const delta: Vector2 = {
                x: point.x - lastPointerPosition.x,
                y: point.y - lastPointerPosition.y
            };

            viewport.panByPixels(delta);
        }

        lastPointerPosition = point;

        graphPosition = viewport.viewportToWorld(point);
        gridIndexLocal = grid.worldToGridLocal(graphPosition);
    }

    function handlePointerDown(event: PointerEvent) {
        if (event.button !== 0) return;

        const svg = event.currentTarget as SVGSVGElement;

        isDragging = true;

        lastPointerPosition = clientToSvg(
            { x: event.clientX, y: event.clientY },
            svg
        );

        svg.setPointerCapture(event.pointerId);
    }

    function handlePointerUp(event: PointerEvent) {
        isDragging = false;
        lastPointerPosition = null;

        const svg = event.currentTarget as SVGSVGElement;

        if (svg.hasPointerCapture(event.pointerId)) {
            svg.releasePointerCapture(event.pointerId);
        }
    }

    function handleWheel(event: WheelEvent) {
        event.preventDefault();

        const svg = event.currentTarget as SVGSVGElement;

        const svgPoint = clientToSvg(
            { x: event.clientX, y: event.clientY },
            svg
        );

        const graphPoint = viewport.viewportToWorld(svgPoint);

        const zoomFactor = event.deltaY < 0 ? 1.1 : 1 / 1.1;

        viewport.zoomAt(zoomFactor, graphPoint);

        graphPosition = viewport.viewportToWorld(svgPoint);
        gridIndexLocal = grid.worldToGridLocal(graphPosition);
    }
    
</script>


<div style="flex-direction: row; display: flex;">
    <div>
        Pos: ({(graphPosition.x).toFixed(3)},{(graphPosition.y).toFixed(3)})
        Cell: ({gridIndexLocal.index.x},{gridIndexLocal.index.y})
        Cell Local: ({(gridIndexLocal.local.x).toFixed(2)},{(gridIndexLocal.local.y).toFixed(2)})
    </div>
    <button style="margin: 0px 10px;" onclick={() =>  viewport.resetView()}>Reset View</button>
</div>


<svg
        role = "img"
        aria-label="Interactive graph viewport"
        width={viewport.width}
        height={viewport.height}
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        onpointerdown={handlePointerDown}
        onpointermove={handlePointerMove}
        onpointerup={handlePointerUp}
        onpointercancel={handlePointerUp}
        onwheel={handleWheel}
>
    <!-- Draw Grid Lines-->
    {#if enableGridLines}
        {#each gridGeometry.xGridLines as line}
            <line
            x1={line.start.x}
            y1={line.start.y}
            x2={line.end.x}
            y2={line.end.y}
            stroke="lightgrey"/>
        {/each}

        {#each gridGeometry.yGridLines as line}
            <line
                    x1={line.start.x}
                    y1={line.start.y}
                    x2={line.end.x}
                    y2={line.end.y}
                    stroke="lightgrey"/>
        {/each}
    {/if}

    {#if enableGraphAxes}
        <!-- Horizontal Axis -->
        {#each axesGeometry.xAxisMarkings as marking}
            <line
                    x1={marking.start.x}
                    y1={marking.start.y}
                    x2={marking.end.x}
                    y2={marking.end.y}
                    stroke="black"
            />
        {/each}

        <line
                x1={axesGeometry.horizontalAxis.start.x}
                y1={axesGeometry.horizontalAxis.start.y}
                x2={axesGeometry.horizontalAxis.end.x}
                y2={axesGeometry.horizontalAxis.end.y}
                stroke="black"
        />

        <!-- Vertical Axis -->
        {#each axesGeometry.yAxisMarkings as marking}
            <line
                    x1={marking.start.x}
                    y1={marking.start.y}
                    x2={marking.end.x}
                    y2={marking.end.y}
                    stroke="black"
            />
        {/each}

        <line
                x1={axesGeometry.verticalAxis.start.x}
                y1={axesGeometry.verticalAxis.start.y}
                x2={axesGeometry.verticalAxis.end.x}
                y2={axesGeometry.verticalAxis.end.y}
                stroke="black"
        />
    {/if}

    {#if viewport.enableViewportAxes}
        <!-- Draw viewport x axis -->
        <line
                x1="0"
                y1={viewport.center.y}
                x2={viewport.width}
                y2={viewport.center.y}
                stroke="blue"
                stroke-width="2"
                stroke-dasharray="5,5"
        />
        <!-- Draw viewport y axis -->
        <line
                x1={viewport.center.x}
                y1="0"
                x2={viewport.center.x}
                y2={viewport.height}
                stroke="blue"
                stroke-width="2"
                stroke-dasharray="5,5"
        />
    {/if}

</svg>


<style>
    svg {
        border: 1px solid black;
        margin: 5px;
        
        /*cursor: crosshair;*/
        /*cursor: grab;*/
        touch-action: none;
    }

    svg:active {
        /*cursor: grabbing;*/
        cursor: crosshair;
    }
</style>