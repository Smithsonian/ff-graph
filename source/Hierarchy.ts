/**
 * FF Typescript Foundation Library
 * Copyright 2018 Ralph Wiedemeier, Frame Factory GmbH
 *
 * License: MIT
 */

import { ITypedEvent } from "@ff/core/Publisher";

import Component, { ComponentOrType } from "./Component";
import Node from "./Node";

////////////////////////////////////////////////////////////////////////////////

export { Node };

const _getChildComponent = <T extends Component>(
    hierarchy: Hierarchy, componentOrType: ComponentOrType<T>, recursive: boolean): T | null => {

    let component;

    const children = hierarchy.children;
    for (let i = 0, n = children.length; i < n; ++i) {
        component = children[i].components.get(componentOrType);

        if (component) {
            return component;
        }
    }

    if (recursive) {
        for (let i = 0, n = children.length; i < n; ++i) {
            component = _getChildComponent(children[i], componentOrType, true);
            if (component) {
                return component;
            }
        }
    }

    return null;
};

const _getChildComponents = <T extends Component>(
    hierarchy: Hierarchy, componentOrType: ComponentOrType<T>, recursive: boolean): T[] => {

    let components = [];

    const children = hierarchy.children;
    for (let i = 0, n = children.length; i < n; ++i) {
        components = components.concat(children[i].components.getArray(componentOrType));
    }

    if (recursive) {
        for (let i = 0, n = children.length; i < n; ++i) {
            components = components.concat(_getChildComponents(children[i], componentOrType, true));
        }
    }

    return components;
};

////////////////////////////////////////////////////////////////////////////////

/**
 * Emitted by [[Hierarchy]] component after it's parent has changed.
 * @event
 */
export interface IHierarchyEvent extends ITypedEvent<"hierarchy">
{
    parent: Hierarchy;
    child: Hierarchy;
    add: boolean;
    remove: boolean;
}

/**
 * Allows arranging components in a hierarchical structure.
 *
 * ### Events
 * - *"change"* - emits [[IHierarchyChangeEvent]] after the instance's state has changed.
 */
export default class Hierarchy extends Component
{
    static readonly type: string = "Hierarchy";

    protected _parent: Hierarchy = null;
    protected _children: Hierarchy[] = [];

    /**
     * Returns the parent component of this.
     * @returns {Hierarchy}
     */
    get parent(): Hierarchy
    {
        return this._parent;
    }

    /**
     * Returns an array of child components of this.
     * @returns {Readonly<Hierarchy[]>}
     */
    get children(): Readonly<Hierarchy[]>
    {
        return this._children || [];
    }

    dispose()
    {
        // detach this from its parent
        if (this._parent) {
            this._parent.removeChild(this);
        }

        // dispose of children
        this._children.slice().forEach(child => child.node.dispose());

        super.dispose();
    }

    /**
     * Returns a component at the root of the hierarchy.
     * @returns A component of the given type that is a sibling of the root hierarchy component.
     */
    getRoot<T extends Component>(componentOrType: ComponentOrType<T>): T | null
    {
        let root: Hierarchy = this;
        while(root._parent) {
            root = root._parent;
        }

        return root ? root.node.components.get(componentOrType) : null;
    }

    /**
     * Returns a component from the parent node of the node of this component.
     * @param componentOrType
     * @param recursive If true, extends search to entire chain of ancestors.
     */
    getParent<T extends Component>(componentOrType: ComponentOrType<T>, recursive: boolean): T | null
    {
        let parent = this._parent;

        if (!parent) {
            return null;
        }

        let component = parent.node.components.get(componentOrType);
        if (component) {
            return component;
        }

        if (recursive) {
            parent = parent._parent;
            while(parent) {
                component = parent.node.components.get(componentOrType);
                if (component) {
                    return component;
                }
            }
        }

        return null;
    }

    /**
     * Returns the child component of the given type.
     * @param componentOrType
     * @param recursive If true, extends search to entire subtree (breadth-first).
     */
    getChild<T extends Component>(componentOrType: ComponentOrType<T>, recursive: boolean): T | null
    {
        return _getChildComponent(this, componentOrType, recursive);
    }

    /**
     * Returns all child components of the given type.
     * @param componentOrType
     * @param recursive If true, extends search to entire subtree (breadth-first).
     */
    getChildren<T extends Component>(componentOrType: ComponentOrType<T>, recursive: boolean): Readonly<T[]>
    {
        return _getChildComponents(this, componentOrType, recursive);
    }

    /**
     * Returns true if there is a child component of the given type.
     * @param componentOrType
     * @param recursive If true, extends search to entire subtree (breadth-first).
     */
    hasChildren<T extends Component>(componentOrType: ComponentOrType<T>, recursive: boolean): boolean
    {
        return !!_getChildComponent(this, componentOrType, recursive);
    }

    /**
     * Adds another hierarchy component as a child to this component.
     * Emits a hierarchy event at this component, its node and all their parents.
     * @param {Hierarchy} component
     */
    addChild(component: Hierarchy)
    {
        if (component._parent) {
            throw new Error("component should not have a parent");
        }

        component._parent = this;
        this._children.push(component);

        const event: IHierarchyEvent = {
            type: "hierarchy", add: true, remove: false, parent: this, child: component
        };

        while (component) {
            component.emit<IHierarchyEvent>(event);
            component.node.emit<IHierarchyEvent>(event);
            component = component._parent;
        }
    }

    /**
     * Removes a child component from this hierarchy component.
     * Emits a hierarchy event at this component, its node and all their parents.
     * @param {Hierarchy} component
     */
    removeChild(component: Hierarchy)
    {
        if (component._parent !== this) {
            throw new Error("component not a child of this");
        }

        const index = this._children.indexOf(component);
        this._children.splice(index, 1);
        component._parent = null;

        const event: IHierarchyEvent = {
            type: "hierarchy", add: false, remove: true, parent: this, child: component
        };

        while (component) {
            component.emit<IHierarchyEvent>(event);
            component.node.emit<IHierarchyEvent>(event);
            component = component._parent;
        }
    }

    /**
     * Returns a text representation of this object.
     * @returns {string}
     */
    toString()
    {
        return super.toString() + ` - children: ${this.children.length}`;
    }
}
