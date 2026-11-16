import type { Vector2, Line2D, Range, Axis } from '#lib/viewport/types.ts';
import { decompose } from "#lib/viewport/math.ts";

export interface ViewportConfig {
    width?: number;
    height?: number;
    viewCenter?: Vector2;
    scale?: number;

    enableGraphAxes?: boolean;
    enableGridLines?: boolean;
    enableViewportAxes?: boolean;

    gridSpacing?: number;
    gridOffset?: number;

    axisMarkingSize?: number;
}

export class Viewport {
    private _width: number = $state(600);
    private _height: number = $state(600);

    private _viewCenter: Vector2 = $state({ x: 0, y: 0 });
    private _scale: number = $state(40);

    private _gridSpacing: number = $state(2);
    private _gridOffset: number = $state(0);

    private _axisMarkingSize: number = $state(10);

    enableGraphAxes = $state(true);
    enableGridLines = $state(true);
    enableViewportAxes = $state(false);

    get width(): number {
        return this._width;
    }

    get height(): number {
        return this._height;
    }

    get viewCenter(): Readonly<Vector2> {
        return { ...this._viewCenter };
    }

    get scale(): number {
        return this._scale;
    }

    get gridSpacing(): number {
        return this._gridSpacing;
    }

    get gridOffset(): number {
        return this._gridOffset;
    }

    get axisMarkingSize(): number {
        return this._axisMarkingSize;
    }

    constructor(config: ViewportConfig = {}) {
        this.width = config.width ?? this.width;
        this.height = config.height ?? this.height;

        this.scale = config.scale ?? this.scale;
        this.viewCenter = config.viewCenter ?? this.viewCenter;

        this.gridSpacing = config.gridSpacing ?? this.gridSpacing;
        this.gridOffset = config.gridOffset ?? this.gridOffset;

        this.axisMarkingSize = config.axisMarkingSize ?? this.axisMarkingSize;

        this.enableGraphAxes = config.enableGraphAxes ?? this.enableGraphAxes;
        this.enableGridLines = config.enableGridLines ?? this.enableGridLines;
        this.enableViewportAxes = config.enableViewportAxes ?? this.enableViewportAxes;
    }

    readonly center: Vector2 = $derived({
        x: this.width / 2,
        y: this.height / 2
    });

    readonly svgOrigin: Vector2 = $derived({
        x: this.center.x - this.viewCenter.x * this.scale,
        y: this.center.y + this.viewCenter.y * this.scale
    })

    readonly xRange: Range = $derived({
        min: this.viewCenter.x - this.width/(2 * this.scale),
        max: this.viewCenter.x + this.width/(2 * this.scale)
    })

    readonly yRange: Range = $derived({
        min: this.viewCenter.y - this.height / (2 * this.scale),
        max: this.viewCenter.y + this.height / (2 * this.scale)
    })

    readonly xGridIndexRange: Range = $derived(this.calculateGridIndexRange(this.xRange));
    readonly yGridIndexRange: Range = $derived(this.calculateGridIndexRange(this.yRange));

    readonly xAxisMarkings: Line2D[] = $derived(this.createAxisMarkings("x"));
    readonly yAxisMarkings: Line2D[] = $derived(this.createAxisMarkings("y"));

    readonly xGridLines: Line2D[] = $derived(this.calculateGridLines("x"));
    readonly yGridLines: Line2D[] = $derived(this.calculateGridLines("y"));

    readonly pixelSpacing: number = $derived(this.gridSpacing * this.scale)

    readonly horizontalAxis: Line2D = $derived({
        start: { x: 0, y: this.svgOrigin.y },
        end:   { x: this.width, y: this.svgOrigin.y }
    });

    readonly verticalAxis: Line2D = $derived({
        start: { x: this.svgOrigin.x, y: 0 },
        end:   { x: this.svgOrigin.x, y: this.height }
    });

    set scale(scale: number) {
        if (!Number.isFinite(scale) || scale <= 0) {
            throw new RangeError("Scale must be finite and greater than zero.");
        }

        this._scale = scale;
    }

    set width(width: number) {
        if (!Number.isFinite(width) || width <= 0) {
            throw new RangeError("Width must be finite and greater than zero.");
        }

        this._width = width;
    }

    set height(height: number) {
        if (!Number.isFinite(height) || height <= 0) {
            throw new RangeError("Height must be finite and greater than zero.");
        }

        this._height = height;
    }

    set gridSpacing(spacing: number) {
        if (!Number.isFinite(spacing) || spacing <= 0) {
            throw new RangeError("Grid spacing must be finite and greater than zero.");
        }

        this._gridSpacing = spacing;
    }

    set gridOffset(offset: number) {
        if (!Number.isFinite(offset)) {
            throw new RangeError("Grid offset must be finite.");
        }

        this._gridOffset = offset;
    }

    set viewCenter(center: Vector2) {
        if (
            !Number.isFinite(center.x) ||
            !Number.isFinite(center.y)
        ) {
            throw new RangeError("View center coordinates must be finite.");
        }

        this._viewCenter = { ...center };
    }

    set axisMarkingSize(size: number) {
        if (!Number.isFinite(size) || size < 0) {
            throw new RangeError("Axis marking size must be finite and nonnegative.");
        }

        this._axisMarkingSize = size;
    }


    private calculateGridIndexRange(range: Range): Range {
        return {
            min: Math.ceil((range.min - this.gridOffset) / this.gridSpacing),
            max: Math.floor((range.max - this.gridOffset) / this.gridSpacing)
        };
    }

    private calculateGridLines(axis: Axis) : Line2D[] {
        const minPixelSpacing = 5;

        if (this.pixelSpacing < minPixelSpacing) {
            return [];
        }

        const lines: Line2D[] = []
        
        const range = axis === "x"
            ? this.xGridIndexRange
            : this.yGridIndexRange;
        
        for(let index = range.min; index <= range.max; index++){
            const position = this.gridOffset + index * this.gridSpacing;

            const line: Line2D = axis === "x"
                ? {
                    start: this.graphToViewport({ x: position, y: this.yRange.max }),
                    end:   this.graphToViewport({ x: position, y: this.yRange.min }),
                }
                : {
                    start: this.graphToViewport({ x: this.xRange.max, y: position }),
                    end:   this.graphToViewport({ x: this.xRange.min, y: position })
                }
            lines.push(line)    
        }
        return lines;
    }


    private createAxisMarkings(axis: Axis): Line2D[] {
        const minPixelSpacing = 5;

        if (this.scale < minPixelSpacing) {
            return [];
        }

        if (axis === "x" && (this.yRange.min > 0 || this.yRange.max < 0)) {
            return [];
        }

        if (axis === "y" && (this.xRange.min > 0 || this.xRange.max < 0)) {
            return [];
        }
        
        const range: Range = axis === "x" ? this.xRange : this.yRange;
        const markings: Line2D[] = [];

        const halfSize = this.axisMarkingSize / 2;

        for (let i = Math.ceil(range.min); i <= range.max; i++) {
            if (i === 0)
                continue;

            const point: Vector2 = axis === "x"
                ? { x: i, y: 0 }
                : { x: 0, y: i };

            const position = this.graphToViewport(point);

            const line: Line2D = axis === "x"
                ? {
                    start: { x: position.x, y: position.y - halfSize },
                    end:   { x: position.x, y: position.y + halfSize }
                }
                : {
                    start: { x: position.x - halfSize, y: position.y },
                    end:   { x: position.x + halfSize, y: position.y }
                };

            markings.push(line);
        }

        return markings;
    }

    clientToSvg(
        position: Vector2,
        svg: SVGSVGElement
    ): Vector2 {
        const matrix = svg.getScreenCTM();

        if (!matrix) {
            throw new Error("Unable to calculate SVG transformation.");
        }

        const point = new DOMPoint(position.x, position.y);
        const result = point.matrixTransform(matrix.inverse());

        return {
            x: result.x,
            y: result.y
        };
    }
    
    graphToViewport(point: Vector2): Vector2 {
        const x = this.center.x + (point.x - this.viewCenter.x) * this.scale;
        const y = this.center.y - (point.y - this.viewCenter.y) * this.scale;
        return { x, y };
    }

    viewportToGraph(svgPoint: Vector2): Vector2 {
        const x = ((svgPoint.x - this.center.x) / this.scale) + this.viewCenter.x;
        const y = ((this.center.y - svgPoint.y) / this.scale) + this.viewCenter.y;
        return { x, y };
    }

    graphToGrid(position: Vector2): Vector2 {
        return {
            x: this.coordinateToIndex(
                position.x,
                this.gridSpacing,
                this.gridOffset
            ),
            y: this.coordinateToIndex(
                position.y,
                this.gridSpacing,
                this.gridOffset
            )
        };
    }

    graphToGridLocal(position: Vector2): {
        index: Vector2;
        local: Vector2;
    } {
        const x = decompose(
            (position.x - this.gridOffset) / this.gridSpacing
        );

        const y = decompose(
            (position.y - this.gridOffset) / this.gridSpacing
        );

        return {
            index: {
                x: x.integer,
                y: y.integer
            },
            local: {
                x: x.fraction,
                y: y.fraction
            }
        };
    }

    gridIndexToCellCenter(index: Vector2): Vector2 {
        return this.gridIndexToGraph(index, {
            x: 0.5,
            y: 0.5
        });
    }

    gridIndexToGraph(
        index: Vector2,
        t: Vector2
    ): Vector2 {
        return {
            x: this.dequantise(
                index.x,
                t.x,
                this.gridSpacing,
                this.gridOffset
            ),
            y: this.dequantise(
                index.y,
                t.y,
                this.gridSpacing,
                this.gridOffset
            )
        };
    }

    private coordinateToIndex(
        position: number,
        cellSize: number,
        offset: number
    ): number {
        return Math.floor((position - offset) / cellSize);
    }
    
    private dequantise(
        index: number,
        t: number,
        cellSize: number,
        offset: number
    ): number {
        return offset + (index + t) * cellSize;
    }
}