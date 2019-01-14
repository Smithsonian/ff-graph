/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import Component from "../Component";
import Graph from "../Graph";
import { IUpdateContext, IRenderContext } from "../System";

import CHierarchy from "./CHierarchy";

////////////////////////////////////////////////////////////////////////////////

export default class CGraph extends Component
{
    static readonly type: string = "CGraph";

    readonly graph = new Graph(this.system);

    protected _root: CHierarchy;

    set root(root: CHierarchy) {
        this._root = root;
    }

    get root() {
        return this._root;
    }

    update(context: IUpdateContext): boolean
    {
        return this.graph.update(context);
    }

    tick(context: IUpdateContext): boolean
    {
        // keep changed flag set to ensure graph is always updated
        this.changed = true;

        return this.graph.tick(context);
    }

    preRender(context: IRenderContext)
    {
        this.graph.preRender(context);
    }

    postRender(context: IRenderContext)
    {
        this.graph.postRender(context);
    }

    inflate(json: any)
    {
        super.inflate(json);
        this.graph.inflate(json.graph);
    }

    deflate()
    {
        const json = super.deflate();
        json.graph = this.graph.deflate();
    }
}