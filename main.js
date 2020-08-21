import { createElement, render, Component } from "./toy-react";

class MyComponent extends Component {
  constructor(type) {
    super(type);
  }
  render() {
    return <div>{this.children}</div>;
  }
}
let a = (
  <MyComponent id="a">
    <div></div>
    <div>12222</div>
    <div>2</div>
  </MyComponent>
);

render(a, document.getElementById("root"));
