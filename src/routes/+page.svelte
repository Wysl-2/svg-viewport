<script lang="ts">
    import { Viewport } from "#lib/viewport/viewport.svelte.ts";
    import type { Vector2 } from "#lib/viewport/types.ts";

    const viewport = new Viewport({
        width: 600, 
        height: 600,
        scale: 20,
        gridSpacing: 2,
        axisMarkingSize: 5,
        viewCenter: {x: 0, y: 0},
        enableViewportAxes: false
    })
    
    viewport.scale = 20

    let graphPosition: Vector2 = $state({x: 0, y: 0})
    let gridIndexLocal = $state(viewport.graphToGridLocal({ x: 0, y: 0 }));

    function handlePointerMove(event: PointerEvent) {
        const svg = event.currentTarget as SVGSVGElement;
        
        const point = viewport.clientToSvg(
            { x: event.clientX, y: event.clientY },
            svg
        );
        
        graphPosition = viewport.viewportToGraph(point)
        
        gridIndexLocal = viewport.graphToGridLocal(graphPosition)
    }
</script>


<div>
    Pos: ({(graphPosition.x).toFixed(3)},{(graphPosition.y).toFixed(3)})
    Cell: ({gridIndexLocal.index.x},{gridIndexLocal.index.y})
    Cell Local: ({(gridIndexLocal.local.x).toFixed(2)},{(gridIndexLocal.local.y).toFixed(2)})
</div>
<svg
        role = "img"
        aria-label="Interactive graph viewport"
        width={viewport.width}
        height={viewport.height}
        viewBox={`0 0 ${viewport.width} ${viewport.height}`}
        onpointermove={handlePointerMove}
>
    <!-- Draw Grid Lines-->
    {#if viewport.enableGridLines}
        {#each viewport.xGridLines as line}
            <line
            x1={line.start.x}
            y1={line.start.y}
            x2={line.end.x}
            y2={line.end.y}
            stroke="lightgrey"/>
        {/each}

        {#each viewport.yGridLines as line}
            <line
                    x1={line.start.x}
                    y1={line.start.y}
                    x2={line.end.x}
                    y2={line.end.y}
                    stroke="lightgrey"/>
        {/each}
    {/if}

    {#if viewport.enableGraphAxes}
        <!-- Horizontal Axis -->
        {#each viewport.xAxisMarkings as marking}
            <line
                    x1={marking.start.x}
                    y1={marking.start.y}
                    x2={marking.end.x}
                    y2={marking.end.y}
                    stroke="black"
            />
        {/each}

        <line
                x1={viewport.horizontalAxis.start.x}
                y1={viewport.horizontalAxis.start.y}
                x2={viewport.horizontalAxis.end.x}
                y2={viewport.horizontalAxis.end.y}
                stroke="black"
        />

        <!-- Vertical Axis -->
        {#each viewport.yAxisMarkings as marking}
            <line
                    x1={marking.start.x}
                    y1={marking.start.y}
                    x2={marking.end.x}
                    y2={marking.end.y}
                    stroke="black"
            />
        {/each}

        <line
                x1={viewport.verticalAxis.start.x}
                y1={viewport.verticalAxis.start.y}
                x2={viewport.verticalAxis.end.x}
                y2={viewport.verticalAxis.end.y}
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
    }
</style>