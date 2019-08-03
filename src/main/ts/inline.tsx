import "../scss/style.scss";

import {Component, h, render} from "preact";

console.log("Preact is defined", !!h);

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    const scriptOptions = message.scriptOptions;
    inlinePlayer(scriptOptions.items);
});

type Group<T> = { [s: string]: T[] };

function groupBy<T>(xs: T[], consumer: (x: T) => any): Group<T> {
    let initialValue: Group<T> = {};
    return xs.reduce(function (rv, x) {
        const key = consumer(x);
        const array = rv[key] = rv[key] || [];
        array.push(x);
        return rv;
    }, initialValue);
}

function randomId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function distinctBy<T>(x: T[], consumer: (i: T) => string): T[] {
    const cache = {};
    return x.filter(i => {
        const key = consumer(i);
        const found = !!cache[key];
        cache[key] = i;
        return !found
    });
}

const wrapper = document.querySelector(".watch-online-placeholer");
const appId = randomId();
const modalId = randomId();
const buttonId = randomId();

type Option = { label: any, value: any };

interface Item {
    id?: number,
    url?: string,
    episode?: number,
    kind?: string,
    language?: string,
    quality?: string,
    author?: string
}

function toggleModal() {
    document.getElementById(modalId).classList.toggle("is-active");
}

interface Properties {
    items: Item[];
}

interface State {
    itemIndex: number,
    filters: Filter<any>[]
}

interface Filter<T> {
    name: string;
    label: (item: Item) => string;
    value: (item: Item) => string;
    items: Item[];
    selected?: string;
}

function decode(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
}

function decodeUrl(value: string): string {
    const url = decode(value);
    return url.replace("http://", "https://");
}

class Hello extends Component<Properties, State> {
    constructor(props) {
        super(props);
        this.state = {
            itemIndex: 0,
            filters: [
                {
                    name: "Эпизод",
                    label: i => i.episode + "",
                    value: i => i.episode + "",
                    items: []
                },
                {
                    name: "Тип видео",
                    label: i => i.kind + "",
                    value: i => i.kind + "",
                    items: []
                },
                {
                    name: "Видео",
                    label: i => decode(i.author),
                    value: i => i.id + "",
                    items: []
                }
            ]
        };
        if (this.props.items.length > 0) {
            this.onChange(0, this.state.filters[0].value(this.props.items[0]));
        }
    }

    public filteredItems(max: number): Item[] {
        const filters = this.selectedFilters();
        return this.props.items.filter(item => {
            for (let i = 0; i < filters.length && i < max; ++i) {
                if (filters[i].value(item) != filters[i].selected) {
                    return false;
                }
            }
            return true;
        })
    }

    public selectedFilters(): Filter<any>[] {
        return this.state.filters.filter(i => !!i.selected)
    }

    public render() {
        let lastFilter = this.state.filters[this.state.filters.length - 1];
        const items = lastFilter.items;
        const item = items.find(item => lastFilter.value(item) == lastFilter.selected);
        return (
            <div id={modalId} class="modal">
                <div class="modal-background"/>
                <div class="modal-card">
                    <div class="modal-card-body">
                        {!!item && (
                            <div>
                                <iframe width="100%" height="480" src={decodeUrl(item.url)} frameBorder={0} scrolling="no"
                                        allowFullScreen={true}/>
                            </div>
                        )}
                        <div class="columns">
                            {this.state.filters.map((filter, index) => {
                                const options = filter.items.map(i => {
                                    return {label: filter.label(i), value: filter.value(i)}
                                });
                                return (
                                    <div class="column">
                                        <div class="field">
                                            <label class="label">{filter.name}</label>
                                            <div class="control">
                                                <div
                                                    class="select">{this.renderSelector(index, options, filter.selected)}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
                <button class="modal-close is-large" aria-label="close" onClick={() => this.onClose()}/>
            </div>
        );
    }

    public onChange(index: number, value: string) {
        this.state.filters[index].selected = value;
        let current = this.props.items;
        for (let i = 0; i < this.state.filters.length; ++i) {
            const filter = this.state.filters[i];
            filter.items = distinctBy(current, item => filter.value(item));
            const values = current.map(item => filter.value(item));
            let index = values.indexOf(filter.selected);
            if (index < 0) {
                index = 0;
            }
            filter.selected = values[index];
            current = current.filter(item => filter.value(item) == filter.selected);
        }
        this.forceUpdate();
    }

    public renderSelector(index: number, options: Option[], value: any) {
        const options2 = options
            .map(item => <option value={item.value} selected={item.value == value}>{item.label}</option>);
        return (
            <select onChange={(e: any) => this.onChange(index, e.target.value)}>{options2}</select>
        );
    }

    public onClose() {
        toggleModal();
    }
}

function inlinePlayer(items) {
    // button
    let button = document.getElementById(buttonId);
    let hasItems = items && items.length > 0;
    let style = hasItems ? "info" : "danger";
    let text = hasItems ? `<span class="play-icon"/><span>Смотреть Онлайн</span>` : "<span>Просмотр недоступен</span>";
    if (button == null) {
        wrapper.innerHTML = `
        <div class="bulma">
            <button id="${buttonId}" class="button is-${style} is-fullwidth launch-button">
                ${text}
            </button>
        </div>`;
        button = document.getElementById(buttonId);
    }
    if (hasItems) {
        button.onclick = e => {
            toggleModal();
        };
        let app = document.getElementById(appId);
        if (app == null) {
            document.body.insertAdjacentHTML("afterbegin", `<div id="${appId}" class="bulma"></div>`);
            app = document.getElementById(appId);
            render(<Hello items={items}/>, app);
        }
    }
}