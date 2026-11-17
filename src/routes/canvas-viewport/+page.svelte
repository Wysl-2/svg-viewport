<script lang="ts">
    import { onMount } from "svelte";

    import { Viewport } from "#lib/viewport/viewport.svelte.ts";
    import { Grid } from "#lib/viewport/grid.svelte.ts"
    import { GridGeometry } from "#lib/viewport/geometry/gridGeometry.svelte.ts";
    import { AxesGeometry } from "#lib/viewport/geometry/axesGeometry.svelte.ts";
    import type { Vector2 } from "#lib/viewport/types.ts"
    import { clientToCanvas } from "#lib/viewport/renderers/coordinates.ts";
    
    const viewport = new Viewport();
    const grid = new Grid();
    
    const gridGeometry = new GridGeometry(viewport, grid);
    const axes = new AxesGeometry(viewport);
    
    console.log(gridGeometry.xGridLines)

    onMount(() => {
        const canvas = document.querySelector("canvas");
        const ctx = canvas?.getContext("2d");

        if (!ctx) return;

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
    });
    
</script>

<div>
    <canvas width={viewport.width} height={viewport.height}></canvas>
</div>