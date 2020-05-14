import React from "react";

interface Interface {
    id: string
    p1: number
    p2: number
}

type k = keyof Interface;

interface IEntityState{
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
const entityStateInit = Array(20).fill(0).map((_, i) => '' + (i + 1)).map(id=>({id, name: 'ent'+id, selected: true} as IEntityState));

export function Consumer() {

    const [data, setData] = React.useState([] as Interface[]);
    const [totalState, setTotalState] = React.useState(totalAsSum as TToyal);
    const [entityState, setEntityState] = React.useState(entityStateInit);

    const entityEnabled = new Set(entityState.filter(row=>row.selected).map(row=>row.id)) as Set<string>;
    const dataSelected = data.filter(row=>entityEnabled.has(row.id));

    React.useEffect(() => {
        const list = entityState.filter(row=>row.selected).map(row=>row.id).join('-');
        const eventSource = new EventSource("/api/stream/"+list);
        eventSource.onmessage = e => updateProductList(JSON.parse(e.data));

        return () => {
            eventSource.close();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [entityState]);

    const updateProductList = (items: Interface[]) => {
        setData([...mixData(data, items)]);
    }

    const updateEntityState = (line:IEntityState)=>{
        line.selected=!line.selected;
        setEntityState([...entityState]);
    };

    return (
        <div>
            <h1>Consumer</h1>
            <p className="entity-select">
                {entityState.map(line=>
                    <>
                        <input type="checkbox" id={line.name} checked={line.selected} onClick={() => updateEntityState(line)}/>
                        <label htmlFor={line.name}>{line.id}</label>
                    </>
                )}
            </p>
            <table>
                <tbody>
                {dataSelected.map(item =>
                    <tr key={item.id}>
                        <th>{item.id}</th>
                        {params.map(key => <td key={key} style={backgroundColor(item[key] as any)}>{item[key]}</td>)}
                    </tr>
                )}
                </tbody>
                <tbody>
                <tr>
                    <th>ИТОГО:</th>
                    {totalView(dataSelected, totalState).map(val => <td>{val}</td>)}
                </tr>
                </tbody>
            </table>
            <p className="total-select">
                {[totalAsSum, totalAsMin, totalAsMax, totalAsAvg].map(val =>
                    <>
                        <input type="radio" id={val} name="var" checked={totalState === val} onClick={() => setTotalState(val)}/>
                        <label htmlFor={val}>{val}</label>
                    </>
                )}
            </p>
        </div>);
}

function totalView(items: Interface[], valTotal: TToyal) {
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

function backgroundColor(val: number): React.CSSProperties {
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

