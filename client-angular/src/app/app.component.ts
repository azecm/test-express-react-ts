import {ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit} from '@angular/core';

@Component({
    selector: 'app-root',
    template: `
        <h1>Consumer (Angular)</h1>
        <p class="entity-select">
            <span *ngFor="let line of entityState; trackBy: idEntity">
                <input type="checkbox" [id]="line.name" [checked]="line.selected" (click)="onEntityStateClick(line)">
                <label [htmlFor]="line.name">{{line.id}}</label>
            </span>
        </p>
        <table>
            <tbody>
            <tr *ngFor="let item of dataSelected; trackBy: idData">
                <th>{{item.id}}</th>
                <td *ngFor="let key of params; trackBy: idByPosition" [style]="backgroundColor(item[key])">
                    {{item[key]}}
                </td>
            </tr>
            </tbody>
            <tbody>
            <tr>
                <th>ИТОГО:</th>
                <td *ngFor="let val of totalView(dataSelected, totalState); trackBy: idByPosition">
                    {{val}}
                </td>
            </tr>
            </tbody>
        </table>
        <p class="total-select">
            <span *ngFor="let val of totalList; trackBy: idByPosition">
                <input type="radio" [id]="val" name="var" [checked]="totalState === val" (click)="onTotalChange(val)"/>
                <label [htmlFor]="val">{{val}}</label>
            </span>
        </p>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent implements OnInit, OnDestroy {
    params = params;

    totalList = [totalAsSum, totalAsMin, totalAsMax, totalAsAvg] as TToyal[];
    entityEnabled: Set<string>;

    entityState = entityStateInit;
    totalState = totalAsSum as TToyal;
    data = [] as Interface[];
    dataSelected = [] as Interface[];
    private eventSource: EventSource;

    constructor(private cd: ChangeDetectorRef) {
        this.onData = this.onData.bind(this);
        this.updateEntityEnabled();
    }

    idEntity(_: number, item: IEntityState) {
        return item.id;
    }

    idData(_: number, item: Interface) {
        return item.id;
    }

    idByPosition(_: number) {
        return _;
    }

    onEntityStateClick(item: IEntityState) {
        item.selected = !item.selected;
        this.updateEntityEnabled();
        this.updateDataSelected();
        this.cd.detectChanges();
    }

    updateEntityEnabled(){
        this.entityEnabled = new Set(this.entityState.filter(row=>row.selected).map(row=>row.id));
    }

    updateDataSelected(){
        this.dataSelected = this.data.filter(row=>this.entityEnabled.has(row.id));
    }

    onTotalChange(val: TToyal) {
        this.totalState = val;
        this.cd.detectChanges();
    }

    ngOnInit() {
        this.eventSource = new EventSource("/api/stream/all");
        this.eventSource.addEventListener('message', this.onData);
    }

    onData(e: MessageEvent) {
        this.data = mixData(this.data, JSON.parse(e.data));
        this.updateDataSelected();
        this.cd.detectChanges();
    }

    ngOnDestroy() {
        this.eventSource.close();
    }

    backgroundColor(val: any) {
        let backgroundColor = 'rgb(255, 255, 255)';
        let color = 'rgb(0, 0, 0)';
        if (val > 0) {
            backgroundColor = `rgba(0, 0, 0, ${val})`;
            if (val > 0.5) {
                color = `rgb(240, 240, 240)`;
            }
        } else if (val < 0) {
            backgroundColor = `rgba(255, 140, 0, ${-val})`;
        }
        return {backgroundColor, color};
    }

    totalView(items: Interface[], valTotal: TToyal) {
        const data = [] as number[];
        if (items.length) {
            for (const k of params) {
                const valList = items.map(item => item[k] as number);
                let val = 0;
                switch (valTotal) {
                    case totalAsSum:
                        val = valList.reduce((a, b) => a + b, 0);
                        break;
                    case totalAsAvg:
                        val = valList.reduce((a, b) => a + b, 0) / items.length;
                        break;
                    case totalAsMax:
                        val = Math.max.apply(null, valList);
                        break;
                    case totalAsMin:
                        val = Math.min.apply(null, valList);
                        break;
                }
                data.push(Math.round(val * 10000) / 10000);
            }
        }
        return data;
    }
}


interface IEntityState {
    id: string
    name: string
    selected: boolean
}

type TToyal = 'sum' | 'min' | 'max' | 'avg';
const totalAsSum = "sum" as TToyal;
const totalAsMax = "max" as TToyal;
const totalAsMin = "min" as TToyal;
const totalAsAvg = "avg" as TToyal;

const params = Array(20).fill(0).map((_, i) => 'p' + (i + 1)) as k[];
const entityStateInit = Array(20).fill(0).map((_, i) => '' + (i + 1)).map(id => ({
    id,
    name: 'ent' + id,
    selected: true
} as IEntityState));

interface Interface {
    id: string
    p1: number
    p2: number
}

type k = keyof Interface;

function mixData(prev: Interface[], next: Interface[]) {
    next = JSON.parse(JSON.stringify(next)) as Interface[];

    let reorder = false;
    while (next.length) {
        const itemNext = next.shift();
        if (!itemNext) continue;

        const ind = prev.findIndex(itemPrev => itemPrev.id === itemNext.id);
        if (ind > -1) {
            prev[ind] = itemNext;
        } else {
            prev.push(itemNext);
            reorder = true;
        }
    }

    if (reorder) {
        sortData(prev);
    }

    return prev;
}

function getInt(val: string) {
    return parseInt(val.replace(/\D/g, ''), 10);
}

function sortData(items: Interface[]) {
    items.sort((a, b) => getInt(a.id) - getInt(b.id));
}