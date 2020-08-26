import { isObject } from "./util";

const RENDER_TO_DOM = Symbol("渲染到dom");
class ElementWrapper {
  constructor(type) {
    this.root = document.createElement(type);
    this._range = null;
  }
  setAttribute(name, value) {
    if (name.match(/^on([\s\S]+)$/)) {
      this.root.addEventListener(
        RegExp.$1.replace(/^[\s\S]/, (c) => c.toLowerCase()),
        value,
      );
    } else {
      if (name === "className") {
        this.root.setAttribute("class", value);
      } else {
        this.root.setAttribute(name, value);
      }
    }
  }
  appendChild(component) {
    let range = document.createRange();
    const parent = this.root;
    range.setStart(parent, parent.childNodes.length);
    range.setEnd(parent, parent.childNodes.length);
    component[RENDER_TO_DOM](range);
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    range.deleteContents();
    range.insertNode(this.root);
  }
  reRender() {
    this._range.deleteContents();
    this[RENDER_TO_DOM](this._range);
  }
}
class TextWrapper {
  constructor(type) {
    this.root = document.createTextNode(type);
  }
  [RENDER_TO_DOM](range) {
    range.deleteContents();
    range.insertNode(this.root);
  }
}
export class Component {
  constructor() {
    this.children = [];
    this._root = null;
    this.props = Object.create(null);
  }
  setAttribute(name, value) {
    this.props[name] = value;
  }
  appendChild(component) {
    this.children.push(component);
  }
  [RENDER_TO_DOM](range) {
    this._range = range;
    range.deleteContents();
    this.render()[RENDER_TO_DOM](range);
  }
  reRender() {
    this._range.deleteContents();
    this[RENDER_TO_DOM](this._range);
  }
  setState(newState) {
    if (!isObject(this.state)) {
      this.state = new State();
    } else {
      let i = 0;
      const merge = (oldState, newState) => {
        // console.log("[merge]", oldState, newState);
        i += 1;
        if (i > 20) {
          throw "递归层级过高";
        }
        for (const k in newState) {
          // console.log("[          k]", newState, k);
          if (!isObject(oldState[k])) {
            //普通值直接覆盖写
            oldState[k] = newState[k];
          } else if (Array.isArray(oldState[k])) {
            oldState[k] = newState[k];
          } else {
            /** 对象则递归复制 */
            merge(oldState, newState);
          }
        }
      };
      merge(this.state, newState);
    }
    console.log("[this.state]", this.state, newState);
    this.reRender();
  }
}

/** 通过jsx生成的数据返回对应的dom元素 */
export const createElement = (type, attrs, ...children /** 这里可能是文本 */) => {
  let e;
  if (typeof type !== "string") {
    e = new type();
  } else {
    e = new ElementWrapper(type);
  }
  // 设置属性
  for (const p in attrs) {
    const v = attrs[p];
    e.setAttribute(p, v);
  }
  // 添加子元素
  let insertChild = (children) => {
    for (let child of children) {
      if (typeof child === "string" || typeof child === "number") {
        child = new TextWrapper(child);
      }
      if (child === null) {
        continue;
      }
      if (Array.isArray(child)) {
        insertChild(child);
      } else {
        e.appendChild(child);
      }
    }
  };
  insertChild(children);

  return e;
};

export const render = (component, parent) => {
  let range = document.createRange();
  range.setStart(parent, 0);
  range.setEnd(parent, parent.childNodes.length);
  range.deleteContents();
  component[RENDER_TO_DOM](range);
};
